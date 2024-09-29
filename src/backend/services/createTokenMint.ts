import { createMint, mintTo, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import "dotenv/config";
import { getKeypairFromEnvironment, getExplorerLink } from "@solana-developers/helpers";
import { Connection, clusterApiUrl, PublicKey } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl('devnet'));

const user = getKeypairFromEnvironment("SOLANA_PRIVATE_KEY");

console.log(`🔑 Loaded our SOLANA_PRIVATE_KEY keypair securely, Our public key is: ${user.publicKey.toBase58()}`);

export async function mintToken(parsedDecimals: number, quantity: number, publicKey: PublicKey): Promise<PublicKey> {
    let tokenMint: PublicKey;

    try {
        // 1. Create the token mint
        tokenMint = await createMint(connection, user, user.publicKey, null, parsedDecimals);
        const link = getExplorerLink("address", tokenMint.toString(), "devnet");
        console.log(`✅ Finished! Created token mint: ${link}`);
    } catch (error) {
        if (error instanceof Error) {
            console.error(`❌ Error: Failed to create token mint. ${error.message}`);
        } else {
            console.error(`❌ Error: Failed to create token mint. ${error}`);
        }
        throw new Error('Token mint creation failed.');
    }

    let userTokenAccount: any;

    try {
        // 2. Get or create the associated token account for the user
        userTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            user,
            tokenMint,
            user.publicKey
        );
        console.log(`📦 User token account created or retrieved: ${userTokenAccount.address.toBase58()}`);
    } catch (error) {
        if (error instanceof Error) {
            console.error(`❌ Error: Failed to get or create associated token account. ${error.message}`);
        } else {
            console.error(`❌ Error: Failed to get or create associated token account. ${error}`);
        }
        throw new Error('Failed to get or create user token account.');
    }

    try {
        // 3. Mint tokens to the user's token account
        await mintTo(
            connection,
            user,
            tokenMint,
            userTokenAccount.address,
            user.publicKey,
            // @ts-ignore
            [],
            quantity
        );
        console.log(`✅ Minted ${quantity} tokens to ${userTokenAccount.address.toBase58()}`);
    } catch (error) {
        if (error instanceof Error) {
            console.error(`❌ Error: Failed to mint tokens. ${error.message}`);
        } else {
            console.error(`❌ Error: Failed to mint tokens. ${error}`);
        }
        throw new Error('Token minting failed.');
    }

    return tokenMint;
}
