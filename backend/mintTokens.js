import logger from "./logger";
import {getOrCreateAssociatedTokenAccount, mintTo} from "@solana/spl-token";

export async function mintTokens(connection, mint, amount, payer) {
    try {
        logger.info('Payer:', payer.publicKey.toBase58());
        logger.info('Mint:', mint.toBase58());
        logger.info('Amount:', amount);

        if (!payer || !payer.publicKey) {
            throw new Error('Payer is not defined or missing publicKey');
        }

        const payerTokenAccount = await getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey);
        logger.info('Payer Token Account:', payerTokenAccount.address.toBase58());

        await mintTo(
            connection,
            payer,
            mint,
            payerTokenAccount.address,
            payer.publicKey,
            amount * Math.pow(10, MINT_DECIMALS) // Ensure this matches token decimals
        );

        logger.info(`Minted ${amount} tokens to payer token account ${payerTokenAccount.address.toBase58()}`);
        return payerTokenAccount;
    } catch (error) {
        logger.error(`Error in mintTokens: ${error.message}`);
        throw error;
    }
}