import { createMint, mintTo, getOrCreateAssociatedTokenAccount, Account } from "@solana/spl-token";
import "dotenv/config";
import { getKeypairFromEnvironment, getExplorerLink } from "@solana-developers/helpers";
import { Connection, clusterApiUrl, PublicKey } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl('devnet'));

const user = getKeypairFromEnvironment("SOLANA_PRIVATE_KEY");

console.log(`🔑 Loaded our SOLANA_PRIVATE_KEY keypair securely, Our public key is: ${user.publicKey.toBase58()}`);



// TODO: TURK- FIGURE OUT WHY WE'RE MINTING THE TOKENS TO A NEW WALLET, AND NOT TRANSFERRING TO THE USER'S WALLET
// TODO: TURK - TRANSFER AUTHORITY TO THE USER'S WALLET
export async function mintToken(parsedDecimals: number, quantity: number, publicKey: PublicKey): Promise<{ tokenMint: PublicKey; userTokenAccount: PublicKey }> {
    let tokenMint: PublicKey;
    console.log(`🏦 Creating token mint with ${parsedDecimals} decimals...`);
    console.log(`💰 Minting ${quantity} tokens to ${publicKey.toBase58()}...`);
    console.log(`🔒 Creating associated token account for ${publicKey.toBase58()}...`);

    try {
        tokenMint = await createMint(
            connection,
            user,
            user.publicKey,
            null,
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
        userTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            user,
            tokenMint,
            user.publicKey
        );
        console.log(`📦 User token account created or retrieved: ${userTokenAccount.address.toBase58()}`);
    } catch (error) {
        console.error(`❌ Error: Failed to get or create associated token account. ${error instanceof Error ? error.message : error}`);
        throw new Error('Failed to get or create user token account.');
    }

    try {
        await mintTo(
            connection,
            user, // Payer
            tokenMint, // Mint
            userTokenAccount.address,
            user.publicKey,
            quantity,
            [user],
        );
        console.log(`✅ Minted ${quantity} tokens to ${userTokenAccount.address.toBase58()}`);
    } catch (error) {
        console.error(`❌ Error: Failed to mint tokens. ${error instanceof Error ? error.message : error}`);
        throw new Error('Token minting failed.');
    }

    return { tokenMint, userTokenAccount: userTokenAccount.address };
}
