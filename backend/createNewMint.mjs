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
    let connection, mintLamports, mintSigner, mintTransaction, mintSignature;

    try {
        const payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.SOLANA_PRIVATE_KEY)));
        const userPublicKeyInstance = new PublicKey(userPublicKey);

        if (!payer.publicKey || !userPublicKeyInstance.toBase58()) {
            console.error('One or more signers are missing or invalid.');
            return;
        }

        console.log("Payer and userPublicKey initialized successfully.");

        const SPL_TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
        const systemAuthority = new PublicKey(process.env.MINTING_ADDRESS);

        try {
            connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
            console.log("Connection to Solana devnet established.");
        } catch (error) {
            console.error(`Failed to connect to Solana devnet: ${error.message}`);
            throw new Error(`Failed to connect to Solana devnet: ${error.message}`);
        }

        try {
            mintLamports = await connection.getMinimumBalanceForRentExemption(82);
            console.log(`Minimum balance for rent exemption fetched: ${mintLamports} lamports.`);
        } catch (error) {
            console.error(`Failed to fetch minimum balance for rent exemption: ${error.message}`);
            throw new Error(`Failed to fetch rent exemption: ${error.message}`);
        }

        mintSigner = Keypair.generate();

        // Mint Transaction Block
        try {
            mintTransaction = new Transaction().add(
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
            console.log('Mint transaction created.');
        } catch (error) {
            console.error(`Failed to create mint transaction: ${error.message}`);
            throw new Error(`Failed to create mint transaction: ${error.message}`);
        }

        try {
            mintSignature = await sendAndConfirmTransaction(connection, mintTransaction, [payer, mintSigner], { commitment: 'confirmed' });
            console.log('Mint transaction confirmed with signature:', mintSignature);
        } catch (error) {
            console.error(`Failed to send or confirm mint transaction: ${error.message}`);
            throw new Error(`Mint transaction failed: ${error.message}`);
        }

        // Metadata Creation Block
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
            console.log("Metadata Data prepared:", JSON.stringify(metadataData, null, 2));

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
            console.log('Create Metadata Account Instruction prepared.');

            transaction.add(createMetadataAccountInstruction);

            const signers = [payer, mintSigner];
            console.log("Signers prepared:", signers.map(signer => signer.publicKey.toBase58()));

            const metadataSignature = await sendAndConfirmTransaction(connection, transaction, signers, { commitment: 'confirmed' });
            console.log('Metadata transaction confirmed with signature:', metadataSignature);

            return mintSigner.publicKey.toBase58();

        } catch (error) {
            console.error(`Error creating metadata: ${error.message}`);
            throw new Error(`Metadata creation failed: ${error.message}`);
        }

    } catch (error) {
        console.error(`Mint creation process failed: ${error.message}`);
        throw new Error(`Mint creation process failed: ${error.message}`);
    }
}
