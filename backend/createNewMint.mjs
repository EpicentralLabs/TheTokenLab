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
    const mintSigner = systemAuthority;

    try {
        const userPublicKeyInstance = new PublicKey(userPublicKey);

        const mintTransaction = new Transaction().add(
            SystemProgram.createAccount({
                fromPubkey: payer.publicKey,
                newAccountPubkey: mintSigner,
                lamports: mintLamports,
                space: 82,
                programId: SPL_TOKEN_PROGRAM_ID,
            }),
            createInitializeMintInstruction(
                mintSigner,
                parsedDecimals,
                systemAuthority, // Set systemAuthority as the mint authority
                freezeChecked ? systemAuthority : null, // Optional freeze authority
                SPL_TOKEN_PROGRAM_ID
            )
        );

        const mintSignature = await sendAndConfirmTransaction(connection, mintTransaction, [payer, mintSigner], { commitment: 'confirmed' });

        const [metadataAccount] = await PublicKey.findProgramAddress(
            [
                Buffer.from('metadata'),
                TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                mintSigner.toBuffer(),
            ],
            TOKEN_METADATA_PROGRAM_ID
        );

        const metadataTransaction = new Transaction().add(
            createCreateMetadataAccountV3Instruction(
                {
                    metadata: metadataAccount,
                    mint: mintSigner,
                    mintAuthority: systemAuthority,
                    payer: payer.publicKey,
                    updateAuthority: systemAuthority
                },
                {
                    createMetadataAccountArgsV2: {
                        data: {
                            name: tokenName,
                            symbol: tokenSymbol,
                            uri: updatedMetadataUri,
                            sellerFeeBasisPoints: 0,
                            creators: null,
                            collection: null,
                            uses: null,
                        },
                        isMutable: !immutableChecked,
                    }
                }
            )
        );

        const metadataSignature = await sendAndConfirmTransaction(connection, metadataTransaction, [payer], { commitment: 'confirmed' });

        return mintSigner.toBase58();
    } catch (error) {
        throw new Error(`Error during mint creation: ${error.message}`);
    }
}
