import { getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import * as logger from 'winston';

export async function logBalances(connection, payer, payerPublicKey, userPublicKey, mint) {
    try {
        const payerTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            payer,
            mint,
            payerPublicKey
        );
        const userTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            payer,
            mint,
            userPublicKey
        );

        const payerBalance = await connection.getTokenAccountBalance(payerTokenAccount.address);
        const userBalance = await connection.getTokenAccountBalance(userTokenAccount.address);

        logger.info(`Payer's token account balance: ${payerBalance.value.uiQuantityString} tokens`);
        logger.info(`User's token account balance: ${userBalance.value.uiQuantityString} tokens`);
    } catch (error) {
        logger.error(`Error logging balances: ${error.message}`);
    }
}

export async function logAccountInfo(accountInfo) {
    if (!accountInfo) {
        logger.error('Account info is null or undefined.');
        return;
    }

    logger.info('Token Account Info:', {
        data: {
            parsed: {
                info: {
                    isNative: accountInfo.data.parsed.info.isNative,
                    mint: accountInfo.data.parsed.info.mint,
                    owner: accountInfo.data.parsed.info.owner,
                    state: accountInfo.data.parsed.info.state,
                    tokenQuantity: {
                        quantity: accountInfo.data.parsed.info.tokenQuantity.quantity,
                        decimals: accountInfo.data.parsed.info.tokenQuantity.decimals,
                        uiQuantity: accountInfo.data.parsed.info.tokenQuantity.uiQuantity,
                        uiQuantityString: accountInfo.data.parsed.info.tokenQuantity.uiQuantityString
                    }
                }
            },
            program: accountInfo.data.program,
            space: accountInfo.space
        },
        executable: accountInfo.executable,
        lamports: accountInfo.lamports,
        owner: accountInfo.owner,
        rentEpoch: accountInfo.rentEpoch
    });
}
