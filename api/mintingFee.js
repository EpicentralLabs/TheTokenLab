"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chargeMintingFee = chargeMintingFee;
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function chargeMintingFee(connection, payer, userPublicKey, paymentType, feeAmount) {
    const LABS_TOKEN_MINT_ADDRESS = process.env.LABS_TOKEN_MINT_ADDRESS;
    const TREASURY_WALLET_SOL = process.env.TREASURY_WALLET_SOL;
    const TREASURY_WALLET_LABS = process.env.TREASURY_WALLET_LABS;
    if (!LABS_TOKEN_MINT_ADDRESS || !TREASURY_WALLET_SOL || !TREASURY_WALLET_LABS) {
        throw new Error('❌ Missing environment variable(s)');
    }
    console.log('🔍 Fetching latest blockhash...');
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    console.log('🪙 Latest blockhash retrieved:', blockhash);
    let totalCharged = 0;
    let totalFee = 0;
    let totalLamports;
    if (paymentType === 'SOL') {
        const lamports = feeAmount * 10 ** 9;
        const payerBalance = await connection.getBalance(payer.publicKey);
        console.log(`💰 Payer balance: ${payerBalance / 10 ** 9} SOL`);
        const airdropEnabled = process.env.AIRDROP_IF_INSUFFICIENT_FUNDS === 'True';
        if (payerBalance < lamports) {
            console.log('❌ Insufficient funds in payer account for the transaction.');
            if (airdropEnabled) {
                console.log('🔄 Payer has insufficient funds, requesting airdrop...');
                const airdropSignature = await connection.requestAirdrop(payer.publicKey, 2 * 10 ** 9);
                const latestBlockhash = await connection.getLatestBlockhash();
                await connection.confirmTransaction({
                    signature: airdropSignature,
                    blockhash: latestBlockhash.blockhash,
                    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
                });
                console.log('✅ Airdrop successful!');
                const newPayerBalance = await connection.getBalance(payer.publicKey);
                console.log(`💰 New payer balance: ${newPayerBalance / 10 ** 9} SOL`);
                if (newPayerBalance < lamports) {
                    throw new Error('❌ Insufficient funds in payer account even after airdrop.');
                }
            }
            else {
                throw new Error('❌ Insufficient funds in payer account, and airdrop is disabled.');
            }
        }
        const transferInstruction = web3_js_1.SystemProgram.transfer({
            fromPubkey: payer.publicKey,
            toPubkey: new web3_js_1.PublicKey(TREASURY_WALLET_SOL),
            lamports,
        });
        console.log('✉️ Creating transaction message...');
        const message = new web3_js_1.TransactionMessage({
            payerKey: payer.publicKey,
            recentBlockhash: blockhash,
            instructions: [transferInstruction],
        }).compileToV0Message();
        const versionedTransaction = new web3_js_1.VersionedTransaction(message);
        versionedTransaction.sign([payer]);
        console.log('🔍 Simulating transaction...');
        const simulationResult = await connection.simulateTransaction(versionedTransaction);
        console.log('Simulation Result:', simulationResult);
        if (simulationResult.value.err) {
            console.error('❌ Simulation failed:', simulationResult.value.err);
            throw new Error('Transaction simulation failed.');
        }
        console.log('🚀 Sending transaction...');
        const signature = await connection.sendTransaction(versionedTransaction);
        console.log('🔗 Transaction signature:', signature);
        totalLamports = lamports;
        totalCharged = lamports / 10 ** 9;
        try {
            await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');
            console.log('✅ SOL fees charged successfully to treasury wallet.');
        }
        catch (error) {
            console.error('❌ Confirmation failed:', error);
        }
    }
    else if (paymentType === 'LABS') {
        console.log('💸 Preparing LABS transfer to treasury wallet...');
        const labsMint = new web3_js_1.PublicKey(LABS_TOKEN_MINT_ADDRESS);
        console.log('LABS Token Mint Address:', labsMint.toBase58());
        console.log('🔍 Getting or creating user LABS token account...');
        const userLabsAccount = await (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, payer, labsMint, userPublicKey);
        console.log('User LABS Token Account Address:', userLabsAccount.address.toBase58());
        console.log('🔍 Getting or creating treasury LABS token account...');
        console.log('connection:', connection);
        console.log('payer:', payer);
        console.log('labsMint:', labsMint);
        console.log('TREASURY_WALLET_LABS:', TREASURY_WALLET_LABS);
        const treasuryLabsAccount = await (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, payer, labsMint, new web3_js_1.PublicKey(TREASURY_WALLET_LABS));
        console.log('Treasury LABS Token Account Address:', treasuryLabsAccount.address.toBase58());
        console.log('🚀 Sending LABS tokens to treasury wallet...');
        const signature = await (0, spl_token_1.transfer)(connection, payer, userLabsAccount.address, treasuryLabsAccount.address, payer.publicKey, feeAmount);
        console.log('LABS Transfer Signature:', signature);
        totalCharged = feeAmount;
        try {
            await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');
            console.log('✅ LABS fees charged successfully to treasury wallet.');
        }
        catch (error) {
            console.error('❌ Confirmation failed:', error);
        }
    }
    else {
        throw new Error('❌ Invalid payment type. Expected "SOL" or "LABS".');
    }
    return totalCharged;
}
