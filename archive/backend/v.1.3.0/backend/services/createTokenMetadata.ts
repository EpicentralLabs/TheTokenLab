import "dotenv/config";
import { getKeypairFromEnvironment, getExplorerLink } from "@solana-developers/helpers";
import {
    Connection,
    PublicKey,
    Transaction,
    sendAndConfirmTransaction, clusterApiUrl,
} from "@solana/web3.js";
import { createCreateMetadataAccountV3Instruction } from "@metaplex-foundation/mpl-token-metadata";

const user = getKeypairFromEnvironment("SOLANA_PRIVATE_KEY");
const rpcEndpoint = process.env.CUSTOM_RPC_ENDPOINT;
const connection = new Connection(rpcEndpoint || clusterApiUrl('devnet'), 'confirmed');

async function checkConnection() {
    try {
        const version = await connection.getVersion();
        console.log("Connected to Solana Devnet, version:", version);
    } catch (error) {
        console.error("Failed to connect to Devnet:", error);
        throw error;
    }
}

export async function createMetadata(
    tokenName: string,
    tokenSymbol: string,
    userPublicKeyInstance: PublicKey,
    updatedMetadataUri: string,
    payer: PublicKey,
    parsedDecimals: number,
    quantity: number,
    freezeChecked: boolean,
    mintChecked: boolean,
    immutableChecked: boolean,
    tokenMintAccount: PublicKey
) {
    await checkConnection();

    const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");


    // Metadata details (using parameters)
    const metadataData = {
        name: tokenName,
        symbol: tokenSymbol,
        uri: updatedMetadataUri,
        sellerFeeBasisPoints: 0,
        creators: null,
        collection: null,
        uses: null,
    };

    const [metadataPDA] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("metadata"),
            TOKEN_METADATA_PROGRAM_ID.toBuffer(),
            tokenMintAccount.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
    );

    const metadataAccountInfo = await connection.getAccountInfo(metadataPDA);
    if (metadataAccountInfo) {
        console.log("Metadata account already exists at this address.");
        return;
    }

    const transaction = new Transaction();

    const createMetadataAccountInstruction =
        createCreateMetadataAccountV3Instruction(
            {
                metadata: metadataPDA,
                mint: tokenMintAccount,
                mintAuthority: user.publicKey,
                payer: user.publicKey,
                updateAuthority: user.publicKey,
            },
            {
                createMetadataAccountArgsV3: {
                    collectionDetails: null,
                    data: metadataData,
                    isMutable: !immutableChecked,
                },
            }
        );

    transaction.add(createMetadataAccountInstruction);

    const transactionSignature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [user]
    );

    const transactionLink = getExplorerLink(
        "transaction",
        transactionSignature,
        "devnet"
    );

    console.log(`✅ Transaction confirmed, explorer link is: ${transactionLink}!`);
}
