import logger from "./logger.mjs";
import { getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import {PublicKey} from "@solana/web3.js";

export async function mintTokens(connection, mint, quantity, payer, decimals, paymentType) {
    // Ensure mint is a PublicKey instance
    if (!(mint instanceof PublicKey)) {
        throw new Error('Mint must be a PublicKey instance.');
    }

    console.log('Payer PublicKey:', payer.publicKey.toBase58());
    console.log('Mint PublicKey:', mint.toBase58());
    console.log('Quantity:', quantity);
    console.log('Payment Type:', paymentType);

    const payerTokenAccount = await getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey, decimals);
    console.log('Payer Token Account:', payerTokenAccount.address.toBase58());

    await mintTo(
        connection,
        payer,
        mint,
        payerTokenAccount.address,
        payer.publicKey,
        quantity * Math.pow(10, decimals)
    );

    console.log(`Minted ${quantity} tokens to payer token account ${payerTokenAccount.address.toBase58()} under payment type ${paymentType}`);
    return payerTokenAccount;
}


