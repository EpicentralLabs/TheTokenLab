// @ts-ignore
import { createRpc, Rpc } from "@lightprotocol/stateless.js";
// @ts-ignore
import { createMint, mintTo, transfer } from "@lightprotocol/compressed-token";
import {Keypair, PublicKey} from "@solana/web3.js";
import dotenv from 'dotenv';
import {Request, Response} from "express";
import router from "../routes/mint";
dotenv.config();

interface compressedMintRequestBody {
    userPublicKey: string;
    quantity: number;
    mintChecked: boolean;
    immutableChecked: boolean;
    decimals: string;
    paymentType: string;
}
const validateRequiredFields = (reqBody: compressedMintRequestBody) => {
    const missingFields: (keyof compressedMintRequestBody)[] = [];
    const requiredFields: (keyof compressedMintRequestBody)[] = [ 'quantity', 'mintChecked', 'immutableChecked', 'decimals', 'paymentType'];

    for (const field of requiredFields) {
        if (reqBody[field] === undefined || reqBody[field] === null) {
            missingFields.push(field);
        }
    }
    return missingFields;
};

const handleErrorResponse = (res: Response, error: Error, defaultMessage: string) => {
    console.error('❌ Error:', error.message);
    return res.status(500).json({ error: defaultMessage });
};


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



async function createCompressedTokenMint({
  decimals,
  desiredTotalSupply,
  userPublicKey,
}: {
  decimals: number;
  desiredTotalSupply: number;
  userPublicKey: string;
}): Promise<any> {
    // @ts-ignore
    router.post('/', async (req: Request<object, object, compressedMintRequestBody>, res: Response) => {
        try {
            const missingFields = validateRequiredFields(req.body);
            if (missingFields.length > 0) {
                console.error('❌ Validation Error: Required fields are missing: ' + missingFields.join(', '));
                return res.status(400).json({
                    success: false,
                    message: 'Required fields are missing: ' + missingFields.join(', '),
                });
            }
            console.log('✅ All required fields validated.');

        }
        catch (error) {
        return handleErrorResponse(res, error as Error, 'Internal Server Error');
        }
            const payer = Keypair.generate();
            let userPublicKeyInstance: PublicKey;
            try {
                userPublicKeyInstance = new PublicKey(userPublicKey);
                console.log('✅ User public key validated:', userPublicKey);
            } catch {
                console.error('❌ Validation Error: Invalid user public key.');
                return res.status(400).json({message: 'Invalid user public key.'});
            }
            const tokenRecipient = userPublicKeyInstance;
            const API_KEY = process.env.HELIUS_API_KEY;

            if (!API_KEY) {
                throw new Error('❌ Missing Helius API key. Please set the HELIUS_API_KEY environment variable.');
            }

            const RPC_ENDPOINT = `https://devnet.helius-rpc.com/?api-key=${API_KEY}`;
            const connection = createRpc(RPC_ENDPOINT, RPC_ENDPOINT);

            console.log(`🔗 Connected to Helius RPC at: ${RPC_ENDPOINT}`);

            const amountToMint = desiredTotalSupply * Math.pow(10, decimals); // Calculate base units

            // Request airdrop for the payer
            console.log("Requesting airdrop for the payer...");
            await connection.requestAirdrop(payer.publicKey, 1e9);

            await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait for 10 seconds

            console.log("Requesting airdrop for the token recipient...");
            await connection.requestAirdrop(tokenRecipient, 1e9);

            await new Promise((resolve) => setTimeout(resolve, 15000)); // Wait for 15 seconds

            console.log("Creating a compressed token mint...");
            const {mint, transactionSignature} = await createMint(
                connection,
                payer, // Fee payer and mint authority
                payer.publicKey, // Mint authority public key
                decimals // Number of decimals
            );

            console.log(`Compressed token mint created! Mint address: ${mint.toBase58()}`);
            console.log(`Transaction signature: ${transactionSignature}`);

            await confirmTransactionWithBackoff(connection, transactionSignature);

            await new Promise((resolve) => setTimeout(resolve, 20000)); // Wait for 20 seconds

            console.log(`Minting ${desiredTotalSupply} tokens to the payer's account...`);
            const mintToTxId = await mintTo(
                connection,
                payer,
                mint,
                payer.publicKey,
                payer,
                amountToMint
            );

            console.log(`Minted ${desiredTotalSupply} tokens to ${payer.publicKey.toBase58()}`);
            console.log(`MintTo transaction signature: ${mintToTxId}`);

            await confirmTransactionWithBackoff(connection, mintToTxId);

            await new Promise((resolve) => setTimeout(resolve, 25000)); // Wait for 25 seconds

            const tokensToTransfer = desiredTotalSupply;
            const amountToTransfer = tokensToTransfer * Math.pow(10, decimals);

            console.log(`Transferring ${tokensToTransfer} tokens to the token recipient...`);
            const transferTxId = await transfer(
                connection,
                payer,
                mint,
                amountToTransfer,
                payer,
                new Keypair().publicKey
            );

            console.log(`Transferred ${tokensToTransfer} tokens to ${tokenRecipient.toBase58()}`);
            console.log(`Transfer transaction signature: ${transferTxId}`);

            await confirmTransactionWithBackoff(connection, transferTxId);

            return {
                mintAddress: mint.toBase58(),
                transactionSignature,
                transferTxId
            };
});
}

export default createCompressedTokenMint;
