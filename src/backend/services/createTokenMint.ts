import { createMint, mintTo, getOrCreateAssociatedTokenAccount, Account } from "@solana/spl-token";
import "dotenv/config";
import { getKeypairFromEnvironment, getExplorerLink } from "@solana-developers/helpers";
import { Connection, clusterApiUrl, PublicKey } from "@solana/web3.js";

const rpcEndpoint = process.env.CUSTOM_RPC_ENDPOINT;
const connection = new Connection(rpcEndpoint || clusterApiUrl('devnet'), 'confirmed');

const user = getKeypairFromEnvironment("SOLANA_PRIVATE_KEY");

console.log(`🔑 Loaded our SOLANA_PRIVATE_KEY keypair securely, Our public key is: ${user.publicKey.toBase58()}`);

// Mint token function
export async function mintToken(parsedDecimals: number, quantity: number, userPublicKey: PublicKey, freezeChecked: boolean): Promise<{ tokenMint: PublicKey; userTokenAccount: PublicKey; freezeChecked: boolean }> {
    let tokenMint: PublicKey;
    console.log('quantity:', quantity)
    console.log(`🔗 Using Solana RPC cluster at ${rpcEndpoint}`)

    console.log(`🏦 Creating token mint with ${parsedDecimals} decimals...`);
    console.log(`💰 Minting ${quantity} tokens to ${userPublicKey.toBase58()}...`);

    try {
        // Create mint and optionally set freeze authority based on freezeChecked
        tokenMint = await createMint(
            connection,
            user,
            user.publicKey,  // Mint authority
            !freezeChecked ? null : user.publicKey,  // Freeze authority, set if freezeChecked is true
            parsedDecimals
        );

        const link = getExplorerLink("address", tokenMint.toString(), "devnet");
        console.log(`✅ Finished! Created token mint: ${link}`);
        if (freezeChecked) {
            console.log(`🔒 Freeze authority has been set for the token mint.`);
        } else {
            console.log(`ℹ️ No freeze authority set for the token mint.`);
        }
    } catch (error) {
        console.error(`❌ Error: Failed to create token mint. ${error instanceof Error ? error.message : error}`);
        throw new Error('Token mint creation failed.');
    }

    let userTokenAccount: Account;

    try {
        // Create or retrieve the associated token account for the user
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
        // Mint tokens to the user's token account
        await mintTo(
            connection,
            user, // Payer
            tokenMint, // Mint
            userTokenAccount.address,
            user.publicKey,
            quantity,
            [user], // Signer
        );
        console.log(`✅ Minted ${quantity} tokens to ${userTokenAccount.address.toBase58()}`);
    } catch (error) {
        console.error(`❌ Error: Failed to mint tokens. ${error instanceof Error ? error.message : error}`);
        throw new Error('Token minting failed.');
    }

    return { tokenMint, userTokenAccount: userTokenAccount.address, freezeChecked };
}
