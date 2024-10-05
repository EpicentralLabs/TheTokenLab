"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
const stateless_js_1 = require("@lightprotocol/stateless.js");
// @ts-ignore
const compressed_token_1 = require("@lightprotocol/compressed-token");
const web3_js_1 = require("@solana/web3.js");
const dotenv_1 = __importDefault(require("dotenv"));
const mint_1 = __importDefault(require("../routes/mint"));
dotenv_1.default.config();
const validateRequiredFields = (reqBody) => {
    const missingFields = [];
    const requiredFields = ['quantity', 'mintChecked', 'immutableChecked', 'decimals', 'paymentType'];
    for (const field of requiredFields) {
        if (reqBody[field] === undefined || reqBody[field] === null) {
            missingFields.push(field);
        }
    }
    return missingFields;
};
const handleErrorResponse = (res, error, defaultMessage) => {
    console.error('❌ Error:', error.message);
    return res.status(500).json({ error: defaultMessage });
};
/**
 * Confirms a transaction with exponential backoff to handle rate limits.
 */
async function confirmTransactionWithBackoff(connection, signature, maxRetries = 10) {
    let retries = 0;
    let delay = 2000; // Start with 2 seconds
    while (retries < maxRetries) {
        try {
            const result = await connection.confirmTransaction(signature);
            if (result && result.value && result.value.err === null) {
                return;
            }
        }
        catch (error) {
            if (error.code !== -32601 && error.code !== 429) {
                throw error;
            }
            // Handle rate limit error or method not found
            console.log(`Rate limit hit or method not found, retrying in ${delay / 1000} seconds...`);
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
        retries++;
    }
    throw new Error("Transaction confirmation failed after maximum retries.");
}
async function createCompressedTokenMint({ decimals, desiredTotalSupply, userPublicKey, }) {
    // @ts-ignore
    mint_1.default.post('/', async (req, res) => {
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
            return handleErrorResponse(res, error, 'Internal Server Error');
        }
        const payer = web3_js_1.Keypair.generate();
        let userPublicKeyInstance;
        try {
            userPublicKeyInstance = new web3_js_1.PublicKey(userPublicKey);
            console.log('✅ User public key validated:', userPublicKey);
        }
        catch {
            console.error('❌ Validation Error: Invalid user public key.');
            return res.status(400).json({ message: 'Invalid user public key.' });
        }
        const tokenRecipient = userPublicKeyInstance;
        const API_KEY = process.env.HELIUS_API_KEY;
        if (!API_KEY) {
            throw new Error('❌ Missing Helius API key. Please set the HELIUS_API_KEY environment variable.');
        }
        const RPC_ENDPOINT = `https://devnet.helius-rpc.com/?api-key=${API_KEY}`;
        const connection = (0, stateless_js_1.createRpc)(RPC_ENDPOINT, RPC_ENDPOINT);
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
        const { mint, transactionSignature } = await (0, compressed_token_1.createMint)(connection, payer, // Fee payer and mint authority
        payer.publicKey, // Mint authority public key
        decimals // Number of decimals
        );
        console.log(`Compressed token mint created! Mint address: ${mint.toBase58()}`);
        console.log(`Transaction signature: ${transactionSignature}`);
        await confirmTransactionWithBackoff(connection, transactionSignature);
        await new Promise((resolve) => setTimeout(resolve, 20000)); // Wait for 20 seconds
        console.log(`Minting ${desiredTotalSupply} tokens to the payer's account...`);
        const mintToTxId = await (0, compressed_token_1.mintTo)(connection, payer, mint, payer.publicKey, payer, amountToMint);
        console.log(`Minted ${desiredTotalSupply} tokens to ${payer.publicKey.toBase58()}`);
        console.log(`MintTo transaction signature: ${mintToTxId}`);
        await confirmTransactionWithBackoff(connection, mintToTxId);
        await new Promise((resolve) => setTimeout(resolve, 25000)); // Wait for 25 seconds
        const tokensToTransfer = desiredTotalSupply;
        const amountToTransfer = tokensToTransfer * Math.pow(10, decimals);
        console.log(`Transferring ${tokensToTransfer} tokens to the token recipient...`);
        const transferTxId = await (0, compressed_token_1.transfer)(connection, payer, mint, amountToTransfer, payer, new web3_js_1.Keypair().publicKey);
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
exports.default = createCompressedTokenMint;
