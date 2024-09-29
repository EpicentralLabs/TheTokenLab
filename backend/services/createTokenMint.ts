import { createMint, mintTo, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import "dotenv/config";
import { getKeypairFromEnvironment, getExplorerLink } from "@solana-developers/helpers";
import { Connection, clusterApiUrl, PublicKey } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl('devnet'));

const user = getKeypairFromEnvironment("SOLANA_PRIVATE_KEY");

console.log(`🔑 Loaded our keypair securely, Our public key is: ${user.publicKey.toBase58()}`);

async function mintToken(quantity) {
    const tokenMint = await createMint(connection, user, user.publicKey, null, 6);
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
        [],
        quantity
    );

    console.log(`✅ Minted ${quantity} tokens to ${userTokenAccount.address.toBase58()}`);
}

const quantityToMint = 100;
mintToken(quantityToMint).catch(console.error);
