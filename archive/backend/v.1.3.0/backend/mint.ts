import { percentAmount, generateSigner, signerIdentity, createSignerFromKeypair } from '@metaplex-foundation/umi';
import { TokenStandard, createAndMint, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import secret from './guideSecret.json'; // Make sure to have the right path to your secret JSON file.

const umi = createUmi('https://example.solana-devnet.quiknode.pro/000000/'); // Replace with your QuickNode RPC Endpoint.

const userWallet = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(secret));
const userWalletSigner = createSignerFromKeypair(umi, userWallet);

const metadata = {
    name: "Best Token Ever",
    symbol: "BTE",
    uri: "IPFS_URL_OF_METADATA",
};

const mint = generateSigner(umi);
umi.use(signerIdentity(userWalletSigner));
umi.use(mplTokenMetadata());

createAndMint(umi, {
    mint,
    authority: umi.identity,
    name: metadata.name,
    symbol: metadata.symbol,
    uri: metadata.uri,
    sellerFeeBasisPoints: percentAmount(0),
    decimals: 8,
    amount: 1000000_00000000, // Represents 1 million tokens with 8 decimals.
    tokenOwner: userWallet.publicKey,
    tokenStandard: TokenStandard.Fungible,
}).sendAndConfirm(umi)
    .then(() => {
        console.log("Successfully minted 1 million tokens (", mint.publicKey.toString(), ")");
    })
    .catch((err) => {
        console.error("Error minting tokens:", err);
    });
