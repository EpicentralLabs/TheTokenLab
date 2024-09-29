import {
    clusterApiUrl,
    Connection,
    Keypair,
    PublicKey,
    sendAndConfirmTransaction,
    SystemProgram,
    Transaction
} from '@solana/web3.js';
import { createInitializeMintInstruction } from '@solana/spl-token';
import * as mplTokenMetadata from "@metaplex-foundation/mpl-token-metadata";
import logger from "./logger.mjs";

const { createCreateMetadataAccountV3Instruction } = mplTokenMetadata;
const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

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
    const SPL_TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
    const systemAuthority = new PublicKey(process.env.MINTING_ADDRESS);

    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    const mintLamports = await connection.getMinimumBalanceForRentExemption(82);
    const mintSigner = Keypair.generate();

    try {
        const mintTransaction = new Transaction().add(
            SystemProgram.createAccount({
                fromPubkey: payer.publicKey,
                newAccountPubkey: mintSigner.publicKey,
                lamports: mintLamports,
                space: 82,
                programId: SPL_TOKEN_PROGRAM_ID,
            }),
            createInitializeMintInstruction(
                mintSigner.publicKey,
                parsedDecimals,
                systemAuthority,
                freezeChecked ? systemAuthority : null,
                SPL_TOKEN_PROGRAM_ID
            )
        );

        const mintSignature = await sendAndConfirmTransaction(connection, mintTransaction, [payer, mintSigner], { commitment: 'confirmed' });
        console.log('Mint transaction confirmed with signature:', mintSignature);

        try {
            const [metadataAccount] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from('metadata'),
                    TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                    mintSigner.publicKey.toBuffer(),
                ],
                TOKEN_METADATA_PROGRAM_ID
            );

            console.log('Metadata account derived:', metadataAccount.toBase58());

            const metadataData = {
                name: tokenName,
                symbol: tokenSymbol,
                uri: updatedMetadataUri,
                sellerFeeBasisPoints: 0,
                creators: null,
                collection: null,
                uses: null,
            };
            console.log("metadataData:", JSON.stringify(metadataData, null, 2));

            const transaction = new Transaction();
            const createMetadataAccountInstruction = createCreateMetadataAccountV3Instruction(
                {
                    metadata: metadataAccount,
                    mint: mintSigner.publicKey,
                    mintAuthority: systemAuthority,
                    payer: payer.publicKey,
                    updateAuthority: systemAuthority,
                },
                {
                    createMetadataAccountArgsV3: {
                        data: metadataData,
                        isMutable: !immutableChecked,
                        collectionDetails: null,
                    }
                }
            );

            console.log('createMetadataAccountInstruction:', JSON.stringify(createMetadataAccountInstruction, null, 2));

            console.log("metadataAccount:", metadataAccount.toBase58());
            console.log("mint:", mintSigner.publicKey.toBase58());
            console.log("mintAuthority:", systemAuthority.toBase58());
            console.log("payer:", payer.publicKey.toBase58());
            console.log("updateAuthority:", systemAuthority.toBase58());

            transaction.add(createMetadataAccountInstruction);

            console.log("userPublicKey (before conversion):", userPublicKey);
            const userPublicKeyString = new PublicKey(userPublicKey);
            console.log("userPublicKey (after conversion):", userPublicKeyString.toBase58());
            const signers = [payer, mintSigner, userPublicKeyString];
            console.log("Signers before transaction:");
            signers.forEach((signer, index) => {
                if (signer && signer.publicKey) {
                    console.log(`Signer ${index}:`, signer.publicKey.toBase58());
                } else {
                    console.error(`Signer ${index} is undefined or has no publicKey property:`, signer);
                }
            });
            const metadataSignature = await sendAndConfirmTransaction(connection, transaction, signers, { commitment: 'confirmed' });

            // const metadataSignature = await sendAndConfirmTransaction(connection, transaction, [payer, mintSigner, userPublicKeyString], { commitment: 'confirmed' });

            console.log('Metadata transaction confirmed with signature:', metadataSignature);

            return mintSigner.publicKey.toBase58();
        } catch (error) {
            console.error(`Error creating metadata: ${error.message}`, error);
            throw new Error(`Metadata creation failed: ${error.message}`);
        }

    } catch (error) {
        console.error(`Error during mint creation: ${error.message}`, error);
        throw new Error(`Mint creation failed: ${error.message}`);
    }
}