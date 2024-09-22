import logger from "./logger";
import { getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";

export async function mintTokens(connection, mint, quantity, payer, decimals, paymentType) {
    try {
        logger.info('Payer:', payer.publicKey.toBase58());
        logger.info('Mint:', mint.toBase58());
        logger.info('Quantity:', quantity);
        logger.info('Payment Type:', paymentType);

        if (!payer || !payer.publicKey) {
            throw new Error('Payer is not defined or missing publicKey');
        }

        const payerTokenAccount = await getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey, decimals);
        logger.info('Payer Token Account:', payerTokenAccount.address.toBase58());

        await mintTo(
            connection,
            payer,
            mint,
            payerTokenAccount.address,
            payer.publicKey,
            quantity * Math.pow(10, decimals)
        );

        logger.info(`Minted ${quantity} tokens to payer token account ${payerTokenAccount.address.toBase58()} under payment type ${paymentType}`);
        return payerTokenAccount;
    } catch (error) {
        logger.error(`Error in mintTokens: ${error.message}`);
        throw error;
    }
}
