"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mintToken = mintToken;
const spl_token_1 = require("@solana/spl-token");
require("dotenv/config");
const helpers_1 = require("@solana-developers/helpers");
const web3_js_1 = require("@solana/web3.js");
const rpcEndpoint = process.env.CUSTOM_RPC_ENDPOINT;
const connection = new web3_js_1.Connection(rpcEndpoint || (0, web3_js_1.clusterApiUrl)('devnet'), 'confirmed');
const user = (0, helpers_1.getKeypairFromEnvironment)("SOLANA_PRIVATE_KEY");
console.log(`🔑 Loaded our SOLANA_PRIVATE_KEY keypair securely, Our public key is: ${user.publicKey.toBase58()}`);
// Mint token function
async function mintToken(parsedDecimals, quantity, userPublicKey, freezeChecked) {
    let tokenMint;
    console.log('quantity:', quantity);
    console.log(`🔗 Using Solana RPC cluster at ${rpcEndpoint}`);
    console.log(`🏦 Creating token mint with ${parsedDecimals} decimals...`);
    console.log(`💰 Minting ${quantity} tokens to ${userPublicKey.toBase58()}...`);
    try {
        // Create mint and optionally set freeze authority based on freezeChecked
        tokenMint = await (0, spl_token_1.createMint)(connection, user, user.publicKey, // Mint authority
        !freezeChecked ? null : user.publicKey, // Freeze authority, set if freezeChecked is true
        parsedDecimals);
        const link = (0, helpers_1.getExplorerLink)("address", tokenMint.toString(), "devnet");
        console.log(`✅ Finished! Created token mint: ${link}`);
        if (freezeChecked) {
            console.log(`🔒 Freeze authority has been set for the token mint.`);
        }
        else {
            console.log(`ℹ️ No freeze authority set for the token mint.`);
        }
    }
    catch (error) {
        console.error(`❌ Error: Failed to create token mint. ${error instanceof Error ? error.message : error}`);
        throw new Error('Token mint creation failed.');
    }
    let userTokenAccount;
    try {
        // Create or retrieve the associated token account for the user
        userTokenAccount = await (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, user, tokenMint, userPublicKey);
        console.log(`📦 User token account created or retrieved: ${userTokenAccount.address.toBase58()}`);
    }
    catch (error) {
        console.error(`❌ Error: Failed to get or create associated token account. ${error instanceof Error ? error.message : error}`);
        throw new Error('Failed to get or create user token account.');
    }
    try {
        // Mint tokens to the user's token account
        await (0, spl_token_1.mintTo)(connection, user, // Payer
        tokenMint, // Mint
        userTokenAccount.address, user.publicKey, quantity, [user]);
        console.log(`✅ Minted ${quantity} tokens to ${userTokenAccount.address.toBase58()}`);
    }
    catch (error) {
        console.error(`❌ Error: Failed to mint tokens. ${error instanceof Error ? error.message : error}`);
        throw new Error('Token minting failed.');
    }
    return { tokenMint, userTokenAccount: userTokenAccount.address, freezeChecked };
}
