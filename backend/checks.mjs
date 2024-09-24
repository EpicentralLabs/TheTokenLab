// checks.mjs
import { PublicKey } from '@solana/web3.js'; // Ensure you import relevant dependencies

export async function checkAccountExists(publicKey, connection, logger) {
    try {
        if (!(publicKey instanceof PublicKey)) {
            throw new Error('Invalid publicKey parameter. It should be an instance of PublicKey.');
        }
        const accountInfo = await connection.getAccountInfo(publicKey);
        logger.info(`Account info for ${publicKey.toBase58()}: ${JSON.stringify(accountInfo, null, 2)}`);

        return accountInfo !== null;
    } catch (error) {
        logger.error(`Failed to check account existence for ${publicKey.toBase58()}: ${error.message}`);
        return false;
    }
}

export async function preliminaryChecks(userPublicKey, payer, connection, logger, clusterApiUrl, createMint, getOrCreateAssociatedTokenAccount, decimals) {
    try {
        const devnetUrl = clusterApiUrl('devnet');
        logger.info(`Devnet URL: ${devnetUrl}`);

        // Verify payer keypair
        if (!payer || !payer.publicKey) {
            throw new Error('Payer keypair is not properly initialized.');
        }
        logger.info(`Payer Public Key: ${payer.publicKey.toBase58()}`);

        // Check if payer account exists
        const payerExists = await checkAccountExists(payer.publicKey, connection, logger);
        if (!payerExists) {
            throw new Error('Payer account does not exist.');
        }

        // Check if user account exists
        const userExists = await checkAccountExists(userPublicKey, connection, logger);
        if (!userExists) {
            throw new Error('User account does not exist.');
        }

        // Log payer balance
        const payerBalance = await connection.getBalance(payer.publicKey);
        logger.info(`Payer balance: ${payerBalance}`);

        // Log user balance
        const userBalance = await connection.getBalance(userPublicKey);
        logger.info(`User balance: ${userBalance}`);

        // Create mint
        logger.info(`Creating mint with payer: ${payer.publicKey.toBase58()}`);
        const mint = await createMint(connection, payer, payer.publicKey, payer.publicKey, decimals);
        logger.info(`Mint created: ${mint.toBase58()}`);

        // Create or get payer token account
        logger.info(`Creating or getting payer token account for mint: ${mint.toBase58()}`);
        const payerTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            payer,
            mint,
            payer.publicKey
        );
        logger.info(`Payer token account address: ${payerTokenAccount.address.toBase58()}`);

        // Create or get user's token account
        logger.info(`Creating or getting user token account for mint: ${mint.toBase58()}`);
        const userTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            payer,
            mint,
            userPublicKey
        );
        logger.info(`User token account address: ${userTokenAccount.address.toBase58()}`);

    } catch (error) {
        logger.error(`Preliminary checks failed: ${error.message}`);
        throw error;
    }
}
