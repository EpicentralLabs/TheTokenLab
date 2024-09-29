import pkg from '@metaplex-foundation/mpl-token-metadata';
import { percentAmount, generateSigner, signerIdentity } from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { Keypair } from '@solana/web3.js';

const { TokenStandard, createAndMint } = pkg;
console.log(pkg);
export async function createNewMint(
    updatedMetadataUri,
    tokenSymbol,
    tokenName,
    parsedDecimals,
    quantity,
    immutableChecked
) {
    const umi = createUmi('https://api.devnet.solana.com'); // Connect to Solana Devnet

    // Generate a new keypair for the minting process
    const mintingKeypair = Keypair.generate();
    console.log("Generated new minting wallet:", mintingKeypair.publicKey.toString());

    // Token metadata object
    const metadata = {
        name: tokenName,
        symbol: tokenSymbol,
        uri: updatedMetadataUri,
    };

    // Generate a new mint account
    const mint = generateSigner(umi);

    // Register UMI plugins
    umi.use(signerIdentity(mintingKeypair));

    try {
        await createAndMint(umi, {
            mint,
            authority: umi.identity,
            name: metadata.name,
            symbol: metadata.symbol,
            uri: metadata.uri,
            sellerFeeBasisPoints: percentAmount(0), // No seller fee
            decimals: parsedDecimals,
            amount: quantity,
            tokenOwner: mintingKeypair.publicKey, // Use new minting wallet as token owner
            tokenStandard: TokenStandard.Fungible,
        }).sendAndConfirm(umi);

        console.log("Successfully minted tokens:", mint.publicKey.toString());
    } catch (err) {
        console.error("Error minting tokens:", err);
    }
}
