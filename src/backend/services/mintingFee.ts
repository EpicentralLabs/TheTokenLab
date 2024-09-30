import {
    PublicKey,
    Connection,
    Keypair,
    SystemProgram,
    VersionedTransaction,
    TransactionMessage,
    TransactionInstruction,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getOrCreateAssociatedTokenAccount, transfer } from '@solana/spl-token';
import dotenv from 'dotenv';
dotenv.config();

export async function chargeMintingFee(
    connection: Connection,
    payer: Keypair,
    userPublicKey: PublicKey,
    paymentType: string,
    feeAmount: number
): Promise<number> {
    const LABS_TOKEN_MINT_ADDRESS = process.env.LABS_TOKEN_MINT_ADDRESS;
    const TREASURY_WALLET_SOL = process.env.TREASURY_WALLET_SOL;
    const TREASURY_WALLET_LABS = process.env.TREASURY_WALLET_LABS;

    if (!LABS_TOKEN_MINT_ADDRESS || !TREASURY_WALLET_SOL || !TREASURY_WALLET_LABS) {
        throw new Error('❌ Missing environment variable(s)');
    }

    console.log('🔍 Fetching latest blockhash...');
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    console.log('🪙 Latest blockhash retrieved:', blockhash);

    let totalCharged: number = 0;
    let totalFee: number = 0;

    if (paymentType === 'SOL') {
        const lamports = feeAmount * 10 ** 9; // Convert to lamports
        const payerBalance = await connection.getBalance(payer.publicKey);
        console.log(`💰 Payer balance: ${payerBalance / 10 ** 9} SOL`);

        if (payerBalance < lamports) {
            throw new Error('❌ Insufficient funds in payer account for the transaction.');
        }

        const transferInstruction: TransactionInstruction = SystemProgram.transfer({
            fromPubkey: payer.publicKey,
            toPubkey: new PublicKey(TREASURY_WALLET_SOL),
            lamports,
        });

        console.log('✉️ Creating transaction message...');
        const message = new TransactionMessage({
            payerKey: payer.publicKey,
            recentBlockhash: blockhash,
            instructions: [transferInstruction],
        }).compileToV0Message();

        const versionedTransaction = new VersionedTransaction(message);
        versionedTransaction.sign([payer]);

        // console.log('Prepared Versioned Transaction:', JSON.stringify(versionedTransaction, null, 2));

        // Simulate the transaction
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
        totalCharged = lamports;
        try {
            await connection.confirmTransaction(
                { signature, blockhash, lastValidBlockHeight },
                'confirmed'
            );
            console.log('✅ SOL fees charged successfully to treasury wallet.');
        } catch (error) {
            console.error('❌ Confirmation failed:', error);
        }
    } else if (paymentType === 'LABS') {
        console.log('💸 Preparing LABS transfer to treasury wallet...');
        const labsMint = new PublicKey(LABS_TOKEN_MINT_ADDRESS);
        console.log('LABS Token Mint Address:', labsMint.toBase58());

        console.log('🔍 Getting or creating user LABS token account...');
        const userLabsAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            payer,
            labsMint,
            userPublicKey
        );

        console.log('User LABS Token Account Address:', userLabsAccount.address.toBase58());

        console.log('🔍 Getting or creating treasury LABS token account...');
        const treasuryLabsAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            payer,
            labsMint,
            new PublicKey(TREASURY_WALLET_LABS)
        );

        console.log('Treasury LABS Token Account Address:', treasuryLabsAccount.address.toBase58());

        console.log('🚀 Sending LABS tokens to treasury wallet...');
        const signature = await transfer(
            connection,
            payer,
            userLabsAccount.address,
            treasuryLabsAccount.address,
            payer.publicKey,
            feeAmount // Amount of LABS tokens
        );

        console.log('LABS Transfer Signature:', signature);
        totalCharged = feeAmount;
        try {
            await connection.confirmTransaction(
                { signature, blockhash, lastValidBlockHeight },
                'confirmed'
            );
            console.log('✅ LABS fees charged successfully to treasury wallet.');
        } catch (error) {
            console.error('❌ Confirmation failed:', error);
        }
    } else {
        throw new Error('❌ Invalid payment type. Expected "SOL" or "LABS".');
    }
    return totalCharged;
}
