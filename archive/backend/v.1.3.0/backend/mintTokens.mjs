import logger from "./logger.mjs";
import { getOrCreateAssociatedTokenAccount, mintTo, getMint } from "@solana/spl-token";
import 'dotenv/config';
import {PublicKey} from "@solana/web3.js";

export async function mintTokens(connection, mint, quantity, payer, decimals, paymentType) {
    try {
        const systemAuthority = process.env.MINTING_ADDRESS ? new PublicKey(process.env.MINTING_ADDRESS) : null;
        if (!systemAuthority) {
            throw new Error('System authority is not defined or missing publicKey');
        }

        logger.info('Payer:', payer.publicKey.toBase58());
        logger.info('Mint:', mint);
        logger.info('Quantity:', quantity);
        logger.info('Payment Type:', paymentType);

        if (!payer || !payer.publicKey) {
            throw new Error('Payer is not defined or missing publicKey');
        }

        const mintInfo = await getMint(connection, mint);
        if (mintInfo.mintAuthority.toBase58() !== systemAuthority.toBase58()) {
            throw new Error('System does not hold the mint authority');
        }

        const payerTokenAccount = await getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey);
        logger.info('Payer Token Account:', payerTokenAccount.address.toBase58());

        await mintTo(
            connection,
            payer,
            mint,
            payerTokenAccount.address,
            systemAuthority,
            quantity * Math.pow(10, decimals)
        );

        logger.info(`Minted ${quantity} tokens to payer token account ${payerTokenAccount.address.toBase58()} under payment type ${paymentType}`);
        return payerTokenAccount;
    } catch (error) {
        logger.error(`Error in mintTokens: ${error.message}`);
        throw error;
    }
}
