import {
    PublicKey,
    Connection,
    Keypair,
    SystemProgram,
    Transaction,
    VersionedTransaction,
    TransactionMessage
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
): Promise<void> {
    const LABS_TOKEN_MINT_ADDRESS = process.env.LABS_TOKEN_MINT_ADDRESS;
    if (!LABS_TOKEN_MINT_ADDRESS) {
        throw new Error('Missing LABS_TOKEN_MINT_ADDRESS environment variable');
    }

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

    if (paymentType === 'SOL') {
        // Create SOL transfer instruction
        const transferInstruction = SystemProgram.transfer({
            fromPubkey: userPublicKey, // The sender of the fees
            toPubkey: payer.publicKey, // The recipient of the fees
            lamports: feeAmount, // Convert to lamports (1 SOL = 10^9 lamports)
        });

        const message = new TransactionMessage({
            payerKey: payer.publicKey,
            recentBlockhash: blockhash,
            instructions: [transferInstruction],
        }).compileToV0Message();

        const versionedTransaction = new VersionedTransaction(message);

        versionedTransaction.sign([payer]);

        const signature = await connection.sendTransaction(versionedTransaction);

        await connection.confirmTransaction(
            {
                signature,
                blockhash,
                lastValidBlockHeight,
            },
            'confirmed'
        );

        console.log('✅ SOL fees charged successfully.');
    } else if (paymentType === 'LABS') {
        // Charge LABS token fees
        const labsMint = new PublicKey(LABS_TOKEN_MINT_ADDRESS);
        const userLabsAccount = await getOrCreateAssociatedTokenAccount(
            connection, // Connection
            payer, // Payer
            labsMint, // Mint
            userPublicKey // Owner
        );

        const payerLabsAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            payer,
            labsMint,
            payer.publicKey
        );

        const signature = await transfer(
            connection,
            payer,
            userLabsAccount.address,
            payerLabsAccount.address,
            payer.publicKey,
            feeAmount
        );

        await connection.confirmTransaction(
            {
                signature, // Signature
                blockhash, // Blockhash
                lastValidBlockHeight, // Last valid block height
            },
            'confirmed' // Commitment
        );

        console.log('✅ LABS fees charged successfully.');
    } else {
        throw new Error('Invalid payment type.');
    }
}
