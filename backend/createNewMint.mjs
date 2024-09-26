import { createUmi } from "@metaplex-foundation/umi";
import { Keypair, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction, Connection, clusterApiUrl } from "@solana/web3.js";
import { createInitializeMintInstruction } from "@solana/spl-token";
import * as mplTokenMetadata from '@metaplex-foundation/mpl-token-metadata';
import {findAssociatedTokenPda} from "@metaplex-foundation/mpl-toolbox";

const { createV1, TokenStandard } = mplTokenMetadata


// Initialize connection
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

export async function createNewMint(
    payer,
    updatedMetadataUri,
    tokenSymbol,
    tokenName,
    decimals,
    quantity,
    freezeChecked,
    mintChecked,
    immutableChecked
) {


    const SPL_TOKEN_2022_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
    const umi = createUmi();

    console.info(`Creating new mint with symbol: ${tokenSymbol}, name: ${tokenName}, and metadata URI: ${updatedMetadataUri}`);

    const mintSigner = Keypair.generate();

    // Create transaction for minting the token
    const mintLamports = await connection.getMinimumBalanceForRentExemption(82); // Adjust space as needed
    const mintTransaction = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: mintSigner.publicKey,
            lamports: mintLamports,
            space: 82,
            programId: SPL_TOKEN_2022_PROGRAM_ID,
        }),
        createInitializeMintInstruction(mintSigner.publicKey, decimals, payer.publicKey, freezeChecked)
    );

    // Send and confirm mint transaction
    console.info(`Sending mint transaction...`);
    const mintSignature = await sendAndConfirmTransaction(connection, mintTransaction, [payer, mintSigner], { commitment: 'confirmed' });
    console.info(`Mint transaction confirmed with signature: ${mintSignature}`);

    // Create metadata for the mint
    console.info(`Creating metadata for mint...`);
    await createV1(umi, {
        mint: mintSigner.publicKey,
        authority: payer.publicKey,
        name: tokenName,
        symbol: tokenSymbol,
        decimals: decimals,
        uri: updatedMetadataUri,
        sellerFeeBasisPoints: 0,
        splTokenProgram: SPL_TOKEN_2022_PROGRAM_ID,
        tokenStandard: TokenStandard.Fungible,
    }).sendAndConfirm(umi);

    // Find associated token PDA
    const tokenPDA = await findAssociatedTokenPda(umi, {
        mint: mintSigner.publicKey,
        owner: payer.publicKey,
        tokenProgramId: SPL_TOKEN_2022_PROGRAM_ID,
    });

    // Mint the token
    await mintV1(umi, {
        mint: mintSigner.publicKey,
        token: tokenPDA,
        authority: payer.publicKey,
        amount: quantity,
        tokenOwner: payer.publicKey,
        splTokenProgram: SPL_TOKEN_2022_PROGRAM_ID,
        tokenStandard: TokenStandard.Fungible,
    }).sendAndConfirm(umi);

    console.info(`Token successfully minted and metadata attached.`);
    return mintSigner.publicKey;
}