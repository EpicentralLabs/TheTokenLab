import "dotenv/config";
import { getKeypairFromEnvironment, getExplorerLink } from "@solana-developers/helpers";
import {
    Connection,
    PublicKey,
    Transaction,
    sendAndConfirmTransaction,
} from "@solana/web3.js";
import { createCreateMetadataAccountV3Instruction } from "@metaplex-foundation/mpl-token-metadata";

const user = getKeypairFromEnvironment("SOLANA_PRIVATE_KEY");
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

async function checkConnection() {
    try {
        const version = await connection.getVersion();
        console.log("Connected to Solana Devnet, version:", version);
    } catch (error) {
        console.error("Failed to connect to Devnet:", error);
        throw error;
    }
}

async function createMetadata() {
    await checkConnection();

    const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
    const tokenMintAccount = new PublicKey("YguxhPjmtoEHZySRo8B3BwLC8Rj2EzCgjMxUjPzMjZT");

    const metadataData = {
        name: "OPTIC",
        symbol: "OPTICAL",
        uri: "https://gateway.pinata.cloud/ipfs/bafkreicvlfjmmthfdgoitrzyaqdnihfwmnb42bks3f5gwfu5mgalxnumu4",
        sellerFeeBasisPoints: 0,
        creators: null,
        collection: null,
        uses: null,
    };

    const metadataPDAAndBump = PublicKey.findProgramAddressSync(
        [
            Buffer.from("metadata"),
            TOKEN_METADATA_PROGRAM_ID.toBuffer(),
            tokenMintAccount.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
    );

    const metadataPDA = metadataPDAAndBump[0];

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
                    isMutable: true,
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


createMetadata().catch(console.error);
