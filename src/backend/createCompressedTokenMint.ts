
// TODO: MAYBE ADD THESE PACKAGES TO THE PACKAGE.JSON???
import { createRpc, Rpc } from "@lightprotocol/stateless.js";
import { createMint, mintTo } from "@lightprotocol/compressed-token";

import { Keypair, PublicKey } from "@solana/web3.js";
import dotenv from 'dotenv';

dotenv.config();

async function confirmTransactionWithBackoff(
    connection: Rpc,
    signature: string,
    maxRetries: number = 10
): Promise<void> {
  let retries = 0;
  let delay = 2000; // Start with 2 seconds
  while (retries < maxRetries) {
    try {
      const result = await connection.confirmTransaction(signature);
      if (result && result.value && result.value.err === null) {
        return; // Transaction confirmed successfully
      }
    } catch (error: any) {
      if (error.code !== -32601 && error.code !== 429) {
        throw error; // Re-throw unexpected errors
      }
      console.log(`Rate limit hit or method not found, retrying in ${delay / 1000} seconds...`);
    }
    await new Promise(resolve => setTimeout(resolve, delay));
    delay *= 2; // Exponential backoff
    retries++;
  }
  throw new Error("Transaction confirmation failed after maximum retries.");
}

export async function mintCompressedToken(
    parsedDecimals: number,
    quantity: number,
    userPublicKeyInstance: PublicKey
): Promise<{ tokenMint: string; userTokenAccount: string }> {
  const privateKey = process.env.SOLANA_PRIVATE_KEY;

  if (!privateKey) {
    console.error('❌ Missing SOLANA_PRIVATE_KEY environment variable');
    throw new Error('Missing SOLANA_PRIVATE_KEY');
  }

  let secretKeyArray: number[];

  try {
    secretKeyArray = JSON.parse(privateKey);
    const payer = Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));
    console.log('✅ Payer keypair initialized:', payer.publicKey.toBase58());

    const user = userPublicKeyInstance;
    const API_KEY = process.env.HELIUS_API_KEY;

    if (!API_KEY) {
      throw new Error('❌ Missing Helius API key. Please set the HELIUS_API_KEY environment variable.');
    }

    const RPC_ENDPOINT = `https://devnet.helius-rpc.com/?api-key=${API_KEY}`;
    const connection = createRpc(RPC_ENDPOINT, RPC_ENDPOINT);
    console.log(`🔗 Connected to Helius RPC at: ${RPC_ENDPOINT}`);

    const amountToMint = quantity * Math.pow(10, parsedDecimals); // Calculate base units

    // Request airdrop for the payer
    console.log("Requesting airdrop for the payer...");
    const airdropSignature = await connection.requestAirdrop(payer, 1e9);
    console.log(`Airdrop transaction signature: ${airdropSignature}`);

    // Confirm the airdrop transaction
    await confirmTransactionWithBackoff(connection, airdropSignature);

    // Create a compressed token mint
    console.log("Creating a compressed token mint...");
    const { mint, transactionSignature } = await createMint(
        connection,
        payer, // Fee payer and mint authority
        user, // Mint authority public key
        parsedDecimals // Number of decimals
    );

    console.log(`Compressed token mint created! Mint address: ${mint.toBase58()}`);
    console.log(`Transaction signature: ${transactionSignature}`);

    // Confirm the mint transaction
    await confirmTransactionWithBackoff(connection, transactionSignature);

    // Mint the calculated amount to the user's account
    console.log(`Minting ${quantity} tokens to ${user.toBase58()}...`);
    const mintToTxId = await mintTo(
        connection,
        payer, // Fee payer
        mint, // Mint address
        user, // Destination address
        user, // Mint authority
        amountToMint // Amount to mint (in base units)
    );

    console.log(`Minted ${quantity} tokens to ${user.toBase58()}`);
    console.log(`MintTo transaction signature: ${mintToTxId}`);

    // Confirm the mintTo transaction
    await confirmTransactionWithBackoff(connection, mintToTxId);

    return {
      tokenMint: mint.toBase58(),
      userTokenAccount: user.toBase58(),
    };
  } catch (err) {
    console.error('❌ Error: Failed to initialize payer keypair or mint tokens.', (err as Error).message || err);
    throw err; // Rethrow to handle upstream
  }
}

export async function main(parsedDecimals: number, quantity: number, userPublicKeyInstance: PublicKey): Promise<void> {
  try {
    const userPublicKey = new PublicKey(userPublicKeyInstance);
    const result = await mintCompressedToken(parsedDecimals, quantity, userPublicKey);
    console.log('✅ Tokens minted:', quantity, 'Decimals:', parsedDecimals);
    console.log(`Token Mint Account: ${result.tokenMint}`);
    console.log(`User Token Account: ${result.userTokenAccount}`);
  } catch (error) {
    console.error('❌ Error: Failed to mint tokens:', (error as Error).message || error);
  }
}
