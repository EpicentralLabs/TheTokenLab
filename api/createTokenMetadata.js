"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMetadata = createMetadata;
require("dotenv/config");
const helpers_1 = require("@solana-developers/helpers");
const web3_js_1 = require("@solana/web3.js");
const mpl_token_metadata_1 = require("@metaplex-foundation/mpl-token-metadata");
const user = (0, helpers_1.getKeypairFromEnvironment)("SOLANA_PRIVATE_KEY");
const rpcEndpoint = process.env.CUSTOM_RPC_ENDPOINT;
const connection = new web3_js_1.Connection(rpcEndpoint || (0, web3_js_1.clusterApiUrl)('devnet'), 'confirmed');
async function checkConnection() {
    try {
        const version = await connection.getVersion();
        console.log("Connected to Solana Devnet, version:", version);
    }
    catch (error) {
        console.error("Failed to connect to Devnet:", error);
        throw error;
    }
}
async function createMetadata(tokenName, tokenSymbol, userPublicKeyInstance, updatedMetadataUri, payer, parsedDecimals, quantity, mintChecked, immutableChecked, tokenMintAccount) {
    await checkConnection();
    const TOKEN_METADATA_PROGRAM_ID = new web3_js_1.PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
    const metadataData = {
        name: tokenName,
        symbol: tokenSymbol,
        uri: updatedMetadataUri,
        sellerFeeBasisPoints: 0,
        creators: null,
        collection: null,
        uses: null,
    };
    const [metadataPDA] = web3_js_1.PublicKey.findProgramAddressSync([
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        tokenMintAccount.toBuffer(),
    ], TOKEN_METADATA_PROGRAM_ID);
    const metadataAccountInfo = await connection.getAccountInfo(metadataPDA);
    if (metadataAccountInfo) {
        console.log("Metadata account already exists at this address.");
        return "";
    }
    const transaction = new web3_js_1.Transaction();
    let createMetadataAccountInstruction;
    const updateAuthority = !immutableChecked ? userPublicKeyInstance : web3_js_1.PublicKey.default;
    // const mintAuthority = mintChecked ? PublicKey.default : user.publicKey;
    if (mintChecked || immutableChecked) {
        console.log("updateAuthority: ", updateAuthority);
        console.log("one of the options is checked; setting appropriate fields.");
        createMetadataAccountInstruction = (0, mpl_token_metadata_1.createCreateMetadataAccountV3Instruction)({
            metadata: metadataPDA,
            mint: tokenMintAccount,
            mintAuthority: user.publicKey,
            payer: user.publicKey,
            updateAuthority: updateAuthority,
        }, {
            createMetadataAccountArgsV3: {
                collectionDetails: null,
                data: metadataData,
                isMutable: !immutableChecked,
            },
        });
        transaction.add(createMetadataAccountInstruction);
    }
    else {
        // Add appropriate instruction for when none of the options are checked
        // This part was missing in the original code
        createMetadataAccountInstruction = (0, mpl_token_metadata_1.createCreateMetadataAccountV3Instruction)({
            metadata: metadataPDA,
            mint: tokenMintAccount,
            mintAuthority: user.publicKey,
            payer: user.publicKey,
            updateAuthority: updateAuthority,
        }, {
            createMetadataAccountArgsV3: {
                collectionDetails: null,
                data: metadataData,
                isMutable: true,
            },
        });
        transaction.add(createMetadataAccountInstruction);
    }
    const transactionSignature = await (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [user]);
    const transactionLink = (0, helpers_1.getExplorerLink)("transaction", transactionSignature, "devnet");
    console.log(`✅ Transaction confirmed, explorer link is: ${transactionLink}!`);
    return transactionLink;
}
