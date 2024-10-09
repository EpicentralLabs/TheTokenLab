
// TODO: MAYBE ADD THESE PACKAGES TO THE PACKAGE.JSON???
// @ts-ignore
import { createRpc, Rpc } from "@lightprotocol/stateless.js";
// @ts-ignore
import { createMint, mintTo, transfer } from "@lightprotocol/compressed-token";
import { PublicKey, Keypair, Connection } from '@solana/web3.js';

import dotenv from 'dotenv';

dotenv.config();


/**
 * Confirms a transaction with exponential backoff in case of rate limits or temporary network errors.
 * Retries a set number of times before throwing an error.
 *
 * @param {Rpc} connection - The RPC connection object used for interacting with Solana.
 * @param {string} signature - The transaction signature to confirm.
 * @param {number} [maxRetries=10] - The maximum number of retries.
 * @returns {Promise<void>} - Resolves when the transaction is confirmed or throws if retries are exhausted.
 * @throws {Error} If the transaction cannot be confirmed after maximum retries.
 */
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
/**
 * Mints a compressed token on Solana by creating a new mint and transferring the minted tokens
 * to the user's public key.
 *
 * @param {number} parsedDecimals - The number of decimals for the token.
 * @param {number} quantity - The number of tokens to mint.
 * @param {PublicKey} userPublicKeyInstance - The public key of the user receiving the tokens.
 * @returns {Promise<{ tokenMint: string; userTokenAccount: string }>} - The mint and user's token account addresses.
 * @throws {Error} If any error occurs during the minting process.
 */
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
    // Parse and initialize the payer keypair
    console.log('🔑 Initializing payer keypair...');
    secretKeyArray = JSON.parse(privateKey);
    const payer = Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));
    console.log('✅ Payer keypair initialized:', payer.publicKey.toBase58());

    // Ensure userPublicKeyInstance is valid
    if (!userPublicKeyInstance) {
      throw new Error('❌ Invalid user public key');
    }
    const user = userPublicKeyInstance;
    console.log('✅ User public key:', user.toBase58());

    // Validate API key for Helius
    const API_KEY = process.env.HELIUS_API_KEY;
    if (!API_KEY) {
      throw new Error('❌ Missing Helius API key. Please set the HELIUS_API_KEY environment variable.');
    }

    const RPC_ENDPOINT = `https://devnet.helius-rpc.com/?api-key=${API_KEY}`;
    console.log(`🔗 Connecting to Helius RPC at: ${RPC_ENDPOINT}`);
    const COMPRESSION_RPC_ENDPOINT = RPC_ENDPOINT;
    const connection: Rpc = createRpc(RPC_ENDPOINT, COMPRESSION_RPC_ENDPOINT)

    // Validate minting amount
    const amountToMint = quantity * Math.pow(10, parsedDecimals); // Calculate base units
    if (isNaN(amountToMint) || amountToMint <= 0) {
      throw new Error(`❌ Invalid mint amount: ${amountToMint}`);
    }
    console.log(`✅ Mint amount: ${amountToMint} (base units)`);

    // Airdrop to payer if necessary
    console.log('🚀 Requesting airdrop for the payer...');
    const airdropSignature = await connection.requestAirdrop(payer.publicKey, 1e9); // 1 SOL
    console.log(`✅ Airdrop transaction signature: ${airdropSignature}`);
    await confirmTransactionWithBackoff(connection, airdropSignature);
    console.log('✅ Airdrop confirmed.');

    // Check payer balance after airdrop
    const payerBalance = await connection.getBalance(payer.publicKey);
    console.log(`💰 Payer balance: ${payerBalance} lamports`);

    // Create a compressed token mint
    console.log('🏗️ Creating a compressed token mint...');
    // console.log(connection, payer, user, parsedDecimals);
    const { mint, transactionSignature } = await createMint(
        connection,
        payer, // Fee payer and mint authority
        payer.publicKey, // Mint authority public key
        parsedDecimals // Number of decimals
    );
    console.log(`✅ Compressed token mint created: ${mint.toBase58()}`);
    console.log(`✅ Mint creation transaction signature: ${transactionSignature}`);
    await confirmTransactionWithBackoff(connection, transactionSignature);
    console.log('✅ Mint creation confirmed.');

    // Mint tokens to the user
    console.log(`🎉 Minting ${quantity} tokens to ${user.toBase58()}...`);
    const amount = amountToMint + Math.E + parsedDecimals;
    console.log(amount)
    const mintToTxId = await mintTo(
        connection,
        payer, // Fee payer
        mint, // Mint address
        payer.publicKey, // Destination address
        payer, // Mint authority
        amount // Amount to mint (in base units)
        
    );
    console.log(`✅ Minted ${quantity} tokens to ${user.toBase58()}`);
    console.log(`✅ MintTo transaction signature: ${mintToTxId}`);
    await confirmTransactionWithBackoff(connection, mintToTxId);
    console.log('✅ MintTo transaction confirmed.');

    /// Transfer compressed tokens from payer to tokenRecipient's pubkey
  const transferTxId = await transfer(
    connection,
    payer,
    mint,
    amount, // Amount
    payer, // Owner
    user // To address
  );

  console.log(`Transfer of ${amount} ${mint} to ${user} was a success!`);
  console.log(`txId: ${transferTxId}`);

    // Return the mint address and user's token account
    return {
      tokenMint: mint.toBase58(),
      userTokenAccount: userPublicKeyInstance.toBase58(),
    };

  } catch (err) {
    console.error('❌ Error: Failed to initialize payer keypair or mint tokens.', (err as Error).message || err);
    throw err; // Rethrow to handle upstream
  }
}
/**
 * Main function that orchestrates the minting of tokens and handles logging of the result.
 *
 * @param {number} parsedDecimals - The number of decimals for the token.
 * @param {number} quantity - The number of tokens to mint.
 * @param {PublicKey} userPublicKeyInstance - The public key of the user to receive the minted tokens.
 * @returns {Promise<void>} - Resolves when minting is complete or throws an error if something goes wrong.
 */
export async function main(parsedDecimals: number, quantity: number, userPublicKeyInstance: PublicKey): Promise<void> {
  try {
    const userPublicKey = new PublicKey(userPublicKeyInstance);
    console.log(`🔑 User Public Key: ${userPublicKey.toBase58()}`);
    console.log(`💵 Minting ${quantity} tokens with ${parsedDecimals} decimals...`);
    const result = await mintCompressedToken(parsedDecimals, quantity, userPublicKey);
    console.log('✅ Tokens minted:', quantity, 'Decimals:', parsedDecimals);
    console.log(`🏗️ Token Mint Account: ${result.tokenMint}`);
    console.log(`📦 User Token Account: ${result.userTokenAccount}`);
  } catch (error) {
    console.error('❌ Error: Failed to mint tokens:', (error as Error).message || error);
    if (error instanceof Error) {
      console.error(`📅 Error Stack Trace: ${error.stack}`);
    } else {
      console.error(`⚠️ Unexpected error type: ${JSON.stringify(error)}`);
    }
  }
}
