import { createMint, mintTo, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import "dotenv/config";
import { getKeypairFromEnvironment, getExplorerLink } from "@solana-developers/helpers";
import { Connection, clusterApiUrl, PublicKey } from "@solana/web3.js";

const rpcEndpoint = process.env.CUSTOM_RPC_ENDPOINT;
const connection = new Connection(rpcEndpoint || clusterApiUrl('devnet'), 'confirmed');
const user = getKeypairFromEnvironment("SOLANA_PRIVATE_KEY");

console.log(`🔑 Loaded our keypair securely, Our public key is: ${user.publicKey.toBase58()}`);

export async function mintToken(parsedDecimals: number, quantity: number): Promise<PublicKey> {
    const tokenMint = await createMint(connection, user, user.publicKey, null, parsedDecimals);
    const link = getExplorerLink("address", tokenMint.toString(), "devnet");
    console.log(`✅ Finished! Created token mint: ${link}`);

    const userTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        user,
        tokenMint,
        user.publicKey
    );

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

    return tokenMint;
}
