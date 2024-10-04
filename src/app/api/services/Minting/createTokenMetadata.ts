import "dotenv/config";
import { getKeypairFromEnvironment, getExplorerLink } from "@solana-developers/helpers";
import {
    Connection,
    PublicKey,
    Transaction,
    sendAndConfirmTransaction,
    clusterApiUrl, Keypair,
} from "@solana/web3.js";
import {checkConnection} from "@/app/api/services/libs/tools/checkConnection";

const user = getKeypairFromEnvironment("SOLANA_PRIVATE_KEY");
const rpcEndpoint = process.env.CUSTOM_RPC_ENDPOINT;
const connection = new Connection(rpcEndpoint || clusterApiUrl('devnet'), 'confirmed');

/**
 * Creates metadata for a new token on the Solana blockchain.
 *
 * @param {string} tokenName - The name of the token to be minted.
 * @param {string} tokenSymbol - The symbol representing the token.
 * @param {PublicKey} userPublicKeyInstance - The public key of the user account receiving the minted tokens.
 * @param {string} updatedMetadataUri - The URI pointing to the token's metadata.
 * @param {PublicKey} payer - The public key of the payer for the transaction fees.
 * @param {number} parsedDecimals - The number of decimal places for the token.
 * @param {number} quantity - The quantity of tokens to mint.
 * @param {boolean} mintChecked - Indicates whether minting should proceed or not.
 * @param {boolean} immutableChecked - Indicates if the metadata should be immutable.
 * @param {PublicKey} tokenMintAccount - The public key of the token mint account.
 *
 * @returns {Promise<string>} A promise that resolves to the transaction ID or metadata link.
 *
 * @throws {Error} Throws an error if the metadata creation fails.
 */
export async function createMetadata(
    tokenName: string,
    tokenSymbol: string,
    userPublicKeyInstance: PublicKey,
    updatedMetadataUri: string,
    payer: Keypair,
    parsedDecimals: number,
    quantity: number,
    mintChecked: boolean,
    immutableChecked: boolean,
    tokenMintAccount: PublicKey
): Promise<string> {
    await checkConnection();
    let createMetadataAccountInstruction;
    const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

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
        return "";
    }
    const transaction = new Transaction();
    const updateAuthority = !immutableChecked ? user.publicKey : PublicKey.default;
    if (mintChecked || immutableChecked) {
        console.log("updateAuthority: ", updateAuthority);
        console.log("one of the options is checked; setting appropriate fields.");
        // @ts-ignore
        createMetadataAccountInstruction = CreateMetadataAccountV3Instruction(
            {
                metadata: metadataPDA,
                mint: tokenMintAccount,
                mintAuthority: user.publicKey,
                payer: user.publicKey,
                updateAuthority: updateAuthority,
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
    } else {
        // @ts-ignore
        createMetadataAccountInstruction = createCreateMetadataAccountV3Instruction(
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
    }
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

    return transactionLink;
}
