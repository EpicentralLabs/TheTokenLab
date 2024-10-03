// @ts-ignore
import {createRpc, Rpc,} from "@lightprotocol/stateless.js";
// @ts-ignore
import {createMint, mintTo, transfer,} from "@lightprotocol/compressed-token";
import {Keypair} from "@solana/web3.js";
import dotenv from 'dotenv';
dotenv.config();
/**
 * Confirms a transaction with exponential backoff to handle rate limits.
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
        return;
      }
    } catch (error: any) {
      if (error.code !== -32601 && error.code !== 429) {
        throw error;
      }
      // Handle rate limit error or method not found
      console.log(
        `Rate limit hit or method not found, retrying in ${delay / 1000} seconds...`
      );
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
    delay *= 2; // Exponential backoff
    retries++;
  }
  throw new Error("Transaction confirmation failed after maximum retries.");
}

async function main(): Promise<void> {
  const payer = Keypair.generate();
  const tokenRecipient = Keypair.generate();

  const API_KEY = process.env.HELIUS_API_KEY;

  if (!API_KEY) {
    throw new Error('❌ Missing Helius API key. Please set the HELIUS_API_KEY environment variable.');
  }

  const RPC_ENDPOINT = `https://devnet.helius-rpc.com/?api-key=${API_KEY}`;
  const connection = createRpc(RPC_ENDPOINT, RPC_ENDPOINT);

  console.log(`🔗 Connected to Helius RPC at: ${RPC_ENDPOINT}`);

  // Define the number of decimals and desired total supply
  const decimals = 9; // Number of decimal places for your token
  const desiredTotalSupply = 1000; // Total tokens you want to mint
  const amountToMint = desiredTotalSupply * Math.pow(10, decimals); // Calculate base units

  // Request airdrop for the payer
  console.log("Requesting airdrop for the payer...");
  await connection.requestAirdrop(payer.publicKey, 1e9);

  // Wait before the next request to avoid rate limiting
  await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait for 10 seconds

  // Request airdrop for the token recipient
  console.log("Requesting airdrop for the token recipient...");
  await connection.requestAirdrop(tokenRecipient.publicKey, 1e9);

  // Wait again
  await new Promise((resolve) => setTimeout(resolve, 15000)); // Wait for 15 seconds

  // Create a compressed token mint
  console.log("Creating a compressed token mint...");
  const { mint, transactionSignature } = await createMint(
    connection,
    payer, // Fee payer and mint authority
    payer.publicKey, // Mint authority public key
    decimals // Number of decimals
  );

  console.log(`Compressed token mint created! Mint address: ${mint.toBase58()}`);
  console.log(`Transaction signature: ${transactionSignature}`);

  // Confirm the mint transaction
  await confirmTransactionWithBackoff(connection, transactionSignature);

  // Wait before the next operation
  await new Promise((resolve) => setTimeout(resolve, 20000)); // Wait for 20 seconds

  // Mint the calculated amount to the payer's account
  console.log(`Minting ${desiredTotalSupply} tokens to the payer's account...`);
  const mintToTxId = await mintTo(
    connection,
    payer, // Fee payer
    mint, // Mint address
    payer.publicKey, // Destination address
    payer, // Mint authority
    amountToMint // Amount to mint (in base units)
  );

  console.log(`Minted ${desiredTotalSupply} tokens to ${payer.publicKey.toBase58()}`);
  console.log(`MintTo transaction signature: ${mintToTxId}`);

  // Confirm the mintTo transaction
  await confirmTransactionWithBackoff(connection, mintToTxId);

  // Wait before transferring tokens
  await new Promise((resolve) => setTimeout(resolve, 25000)); // Wait for 25 seconds

  // Optionally, transfer tokens to the token recipient
  const tokensToTransfer = desiredTotalSupply; // Number of tokens to transfer
  const amountToTransfer = tokensToTransfer * Math.pow(10, decimals); // Calculate base units
  console.log(`Transferring ${tokensToTransfer} tokens to the token recipient...`);
  const transferTxId = await transfer(
    connection,
    payer, // Fee payer
    mint, // Mint address
    amountToTransfer, // Amount to transfer (in base units)
    payer, // Owner of the tokens being transferred
    tokenRecipient.publicKey // Recipient address
  );

  console.log(`Transferred ${tokensToTransfer} tokens to ${tokenRecipient.publicKey.toBase58()}`);
  console.log(`Transfer transaction signature: ${transferTxId}`);

  // Confirm the transfer transaction
  await confirmTransactionWithBackoff(connection, transferTxId);
}

main().catch((err) => {
  console.error("An error occurred:", err);
});
