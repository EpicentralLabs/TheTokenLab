import { createMint, mintTo, getOrCreateAssociatedTokenAccount, Account } from "@solana/spl-token";
import "dotenv/config";
import { getKeypairFromEnvironment, getExplorerLink } from "@solana-developers/helpers";
import {PublicKey } from "@solana/web3.js";
import {checkConnection, connection} from "@/app/api/services/libs/tools/checkConnection";

const user = getKeypairFromEnvironment("SOLANA_PRIVATE_KEY");

console.log(`🔑 Loaded our SOLANA_PRIVATE_KEY keypair securely, Our public key is: ${user.publicKey.toBase58()}`);

/**
 * Mints a new token for the specified user account.
 *
 * @param {number} parsedDecimals - The number of decimal places for the token.
 * @param {number} quantity - The quantity of tokens to mint.
 * @param {PublicKey} userPublicKey - The public key of the user account receiving the minted tokens.
 *
 * @returns {Promise<{ tokenMint: PublicKey; userTokenAccount: PublicKey; }>} A promise that resolves to the result of the minting operation.
 *
 * @throws {Error} Throws an error if the minting process fails.
 */
export async function mintToken(parsedDecimals: number, quantity: number, userPublicKey: PublicKey): Promise<{ tokenMint: PublicKey; userTokenAccount: PublicKey; }> {
    let tokenMint: PublicKey;
    const conn = await checkConnection();

    console.log(`🏦 Creating token mint with ${parsedDecimals} decimals...`);
    console.log(`💰 Minting ${quantity} tokens to ${userPublicKey.toBase58()}...`);
    const adjustedQuantity = quantity * Math.pow(10, parsedDecimals);
    console.log(`💰 Adjusted quantity for minting: ${adjustedQuantity}`);
    try {
        // Create mint and optionally set freeze authority based on freezeChecked
        tokenMint = await createMint(
            connection,
            user,
            user.publicKey,
            user.publicKey,
            parsedDecimals
        );

        const link = getExplorerLink("address", tokenMint.toString(), "devnet");
        console.log(`✅ Finished! Created token mint: ${link}`);

    } catch (error) {
        console.error(`❌ Error: Failed to create token mint. ${error instanceof Error ? error.message : error}`);
        throw new Error('Token mint creation failed.');
    }

    let userTokenAccount: Account;

    try {
        /**
         * Retrieves or creates an associated token account for the specified user and token mint.
         *
         * @param {Connection} connection - The connection to the Solana network.
         * @param {Keypair} user - The user account performing the operation.
         * @param {PublicKey} tokenMint - The public key of the token mint for which to get or create the account.
         * @param {PublicKey} userPublicKey - The public key of the user account receiving the associated token account.
         *
         * @returns {Promise<PublicKey>} A promise that resolves to the public key of the associated token account.
         *
         * @throws {Error} Throws an error if the account retrieval or creation process fails.
         */
        userTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            user,
            tokenMint,
            userPublicKey
        );
        console.log(`📦 User token account created or retrieved: ${userTokenAccount.address.toBase58()}`);
    } catch (error) {
        console.error(`❌ Error: Failed to get or create associated token account. ${error instanceof Error ? error.message : error}`);
        throw new Error('Failed to get or create user token account.');
    }

    try {
        /**
         * Mints a specified quantity of tokens to the user's associated token account.
         *
         * @param {Connection} connection - The connection to the Solana network.
         * @param {Keypair} user - The user account acting as the payer for the transaction.
         * @param {PublicKey} tokenMint - The public key of the token mint for the token being minted.
         * @param {PublicKey} userTokenAccountAddress - The address of the user's associated token account where the minted tokens will be sent.
         * @param {PublicKey} userPublicKey - The public key of the user receiving the minted tokens.
         * @param {number} adjustedQuantity - The quantity of tokens to mint, adjusted for the token's decimal places.
         * @param {Keypair[]} signers - An array of signers required for the transaction (in this case, the user).
         *
         * @returns {Promise<TransactionSignature>} A promise that resolves to the transaction signature for the minting operation.
         *
         * @throws {Error} Throws an error if the minting process fails.
         */        await mintTo(
            connection,
            user, // Payer
            tokenMint, // Mint
            userTokenAccount.address,
            user.publicKey,
            adjustedQuantity,
            [user], // Signer
        );
        console.log(`✅ Minted ${adjustedQuantity} tokens to ${userTokenAccount.address.toBase58()}`);
    } catch (error) {
        console.error(`❌ Error: Failed to mint tokens. ${error instanceof Error ? error.message : error}`);
        throw new Error('Token minting failed.');
    }

    return { tokenMint, userTokenAccount: userTokenAccount.address };
}
