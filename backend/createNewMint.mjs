import {
    clusterApiUrl,
    Connection,
    Keypair,
    PublicKey,
    sendAndConfirmTransaction,
    SystemProgram,
    Transaction,
} from "@solana/web3.js";
import { createInitializeMintInstruction } from "@solana/spl-token";
import * as mplTokenMetadata from "@metaplex-foundation/mpl-token-metadata";
import { findAssociatedTokenPda } from "@metaplex-foundation/mpl-toolbox";
import { createUmi } from "@metaplex-foundation/umi";

const { createV1, mintV1, TokenStandard } = mplTokenMetadata;

export async function createNewMint(
    payer,
    updatedMetadataUri,
    tokenSymbol,
    tokenName,
    parsedDecimals,
    quantity,
    freezeChecked,
    userPublicKey,
    mintChecked,
    immutableChecked
) {
    // Correct SPL Token Program ID
    const SPL_TOKEN_2022_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
    const umi = createUmi();

    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

    const mintLamports = await connection.getMinimumBalanceForRentExemption(82);
    const mintSigner = Keypair.generate();

    try {
        console.log('Begin creating mint transaction...');
        console.log(`User Public Key: ${userPublicKey}`);
        const userPublicKeyInstance = new PublicKey(userPublicKey);
        console.log(`Converted User Public Key: ${userPublicKeyInstance.toBase58()}`);

        if (!payer || !payer.publicKey) {
            throw new Error('Payer is undefined or does not have a public key');
        }

        console.log(`Mint Lamports: ${mintLamports}`);
        console.log(`Decimals: ${parsedDecimals}`);
        console.log(`Freeze Checked: ${freezeChecked}`);
        console.log(`Mint Checked: ${mintChecked}`);
        console.log(`Immutable Checked: ${immutableChecked}`);
        console.log(`Payer Public Key: ${payer.publicKey.toBase58()}`);
        console.log(`Mint Signer Public Key: ${mintSigner.publicKey.toBase58()}`);
        console.log(`SPL Token Program ID: ${SPL_TOKEN_2022_PROGRAM_ID.toBase58()}`);
        console.log('Begin creating mint transaction...');
        console.info(`Creating mint transaction with following details:`);
        console.info(`Payer Public Key: ${payer.publicKey.toBase58()}`);
        console.info(`Mint Signer Public Key: ${mintSigner.publicKey.toBase58()}`);
        const mintTransaction = new Transaction().add(
            SystemProgram.createAccount({
                fromPubkey: payer.publicKey,
                newAccountPubkey: mintSigner.publicKey,
                lamports: mintLamports,
                space: 82,
                programId: SPL_TOKEN_2022_PROGRAM_ID,
            }),
            createInitializeMintInstruction(
                mintSigner.publicKey,
                parsedDecimals,
                userPublicKeyInstance,
                userPublicKeyInstance,
                SPL_TOKEN_2022_PROGRAM_ID,
            )
        );

        // Send and confirm mint transaction
        console.info(`Sending mint transaction...`);
        const mintSignature = await sendAndConfirmTransaction(connection, mintTransaction, [payer, mintSigner], { commitment: 'confirmed' });
        console.info(`Mint transaction confirmed with signature: ${mintSignature}`);

        console.log(mplTokenMetadata);
        console.info(`Creating metadata for mint...`);
        await createV1(umi, {
            mint: mintSigner.publicKey,
            authority: payer.publicKey,
            name: tokenName,
            symbol: tokenSymbol,
            uri: updatedMetadataUri,
            sellerFeeBasisPoints: 0, // Adjust as needed
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
        return mintSigner.publicKey.toBase58();
    } catch (error) {
        console.error(`Error during mint creation: ${error.message}`);
        console.error(`Stack Trace: ${error.stack}`);
        throw error;
    }
}
