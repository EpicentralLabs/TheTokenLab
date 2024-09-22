import {createUmi} from "@metaplex-foundation/umi";
import {Keypair, sendAndConfirmTransaction, SystemProgram, Transaction} from "@solana/web3.js";
import {CollectionAuthorityRecord as connection, TokenStandard} from "@metaplex-foundation/mpl-token-metadata";
import {createInitializeMintInstruction} from "@solana/spl-token";
import {findAssociatedTokenPda} from "@metaplex-foundation/mpl-toolbox";

export async function createNewMint(payer, updatedMetadataUri, symbol, name) {
    // Correct SPL Token Program ID
    const SPL_TOKEN_2022_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
    const umi = createUmi(connection);

    try {
        if (!payer || !updatedMetadataUri || !symbol || !name) {
            throw new Error('Missing required parameters: payer, updatedMetadataUri, symbol, or name.');
        }

        console.info(`Creating new mint with symbol: ${symbol}, name: ${name}, and metadata URI: ${updatedMetadataUri}`);

        // Generate a new mint account
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
            createInitializeMintInstruction(mintSigner.publicKey, 1, payer.publicKey, null)
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
            name: name,
            symbol: symbol,
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
            amount: 1,
            tokenOwner: payer.publicKey,
            splTokenProgram: SPL_TOKEN_2022_PROGRAM_ID,
            tokenStandard: TokenStandard.Fungible,
        }).sendAndConfirm(umi);

        console.info(`Token successfully minted and metadata attached.`);
        return mintSigner.publicKey;
    } catch (error) {
        console.error(`Error during mint creation: ${error.message}`);
        console.error(`Stack Trace: ${error.stack}`);
        throw error;
    }
}