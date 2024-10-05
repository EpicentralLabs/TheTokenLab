// src/app/api/mint/route.ts
import { NextRequest, NextResponse } from 'next/server';
import path from "path";
import {clusterApiUrl, Connection, Keypair, PublicKey} from "@solana/web3.js";
import fs from "fs";
import {uploadImageAndPinJSON} from "@/app/api/services/ipfs/pinata";
import {chargeMintingFee} from "@/app/api/services/Minting/mintingFee";
import {fetchPrices} from "@/app/api/services/libs/Prices/priceService";
import {mintToken} from "@/app/api/services/Minting/createTokenMint";
import {AuthorityType, setAuthority} from "@solana/spl-token";
import {createMetadata} from "@/app/api/services/Minting/createTokenMetadata";
import {handleErrorResponse} from "@/app/api/services/libs/tools/handleErrorResponse";
import {deleteFileFromFirebase} from "@/app/api/services/libs/Firebase/deleteFileFromFirebase";
import {extractFilePathFromFirebaseUrl} from "@/app/api/services/libs/Firebase/extractFilePathFromFirebaseUrl";
import {logCurrentAuthorities} from "@/app/api/services/libs/tools/logCurrentAuthorities";
import {Simulate} from "react-dom/test-utils";
import error = Simulate.error;
import errorMessage from "@/app/components/ErrorMessage";



export async function GET() {
    return NextResponse.json({ message: '/api/mint can only accept POST requests!' }, { status: 405 });
}

/**
 * Handles POST requests for minting tokens.
 *
 * @param {NextRequest} req - The request object containing details
 * about the incoming HTTP request.
 *
 * @returns {Promise<Response>} A promise that resolves to a
 * Response object, indicating the outcome of the minting operation.
 *
 * @throws {Error} Throws an error if the minting process fails
 * or if the request payload is invalid.
 */
export async function POST(req: NextRequest) {
    const {
        tokenName,
        tokenSymbol,
        userPublicKey,
        quantity,
        mintChecked,
        immutableChecked,
        decimals,
        paymentType,
        imagePath,
    } = await req.json();

    let userPublicKeyInstance: PublicKey;
    let parsedDecimals: number;
    let fullPath: string;
    let payer: Keypair;
    let totalCharged: number;
    const firebaseURL = imagePath;
    const rpcEndpoint = process.env.CUSTOM_RPC_ENDPOINT;
    const connection = new Connection(rpcEndpoint || clusterApiUrl('devnet'), 'confirmed');
    let userTokenAccount: PublicKey;
    let tokenMintAccount: PublicKey;
    let result: any;
    let transactionLink: any;
    const res = NextResponse.json({message: 'Failed to set MintTokens authority.'}, {status: 500}) as any;
    const filePath = extractFilePathFromFirebaseUrl(firebaseURL);
    console.log(`🔗 Connected to Solana RPC at: ${rpcEndpoint || clusterApiUrl('devnet')}`);

    try {
        const missingFields = await validateRequiredFields(req.body);
        if (missingFields.length > 0) {
            console.error('❌ Validation Error: Required fields are missing: ' + missingFields.join(', '));
            return NextResponse.json({
                success: false,
                message: 'Required fields are missing: ' + missingFields.join(', '),
            }, {status: 400});
        }
        console.log('✅ All required fields validated.');

        // Validate payment type
        if (!['SOL', 'LABS'].includes(paymentType)) {
            console.error('❌ Validation Error: Invalid payment type. Must be SOL or LABS.');
            return NextResponse.json({
                success: false,
                message: 'Invalid payment type. Must be SOL or LABS.'
            }, {status: 400});
        }
        console.log('✅ Payment type validated.');

        // Validate user public key
        try {
            userPublicKeyInstance = new PublicKey(userPublicKey);
            console.log('✅ User public key validated:', userPublicKey);
        } catch {
            console.error('❌ Validation Error: Invalid user public key.');
            return NextResponse.json({message: 'Invalid user public key.'}, {status: 400});
        }

        // Validate decimals
        parsedDecimals = decimals ? parseInt(decimals) : 0;
        if (isNaN(parsedDecimals) || parsedDecimals < 0 || parsedDecimals > 9) {
            console.error('❌ Validation Error: Invalid decimals. Must be a non-negative integer and <= 9.');
            return NextResponse.json({message: 'Invalid decimals. Must be a non-negative integer and <= 9.'}, {status: 400});
        }
        console.log('✅ Decimals validated:', parsedDecimals);

        // Validate image path
        fullPath = path.join(process.cwd(), 'uploads', path.basename(imagePath)); // Update path as needed

        console.log('🔍 Checking file path:', fullPath);

        if (imagePath.startsWith('https://storage.googleapis.com')) {
            console.log('✅ Validating file via Firebase Storage URL:', imagePath);
        } else {
            if (!fs.existsSync(fullPath)) {
                console.error('❌ Validation Error: File not found at the specified path:', fullPath);
                return NextResponse.json({message: 'File not found at the specified path.'}, {status: 400});
            }
            console.log('✅ Image path validated:', fullPath);
        }

        // Initialize payer keypair
        const privateKey = process.env.SOLANA_PRIVATE_KEY;
        if (!privateKey) {
            console.error('❌ Missing SOLANA_PRIVATE_KEY environment variable');
            await deleteFileFromFirebase(firebaseURL, await filePath);
            return NextResponse.json({error: 'Missing SOLANA_PRIVATE_KEY'}, {status: 500});
        }

        let secretKeyArray: number[];
        try {
            secretKeyArray = JSON.parse(privateKey);
            payer = Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));
            console.log('✅ Payer keypair initialized.');
        } catch (err) {
            console.error('❌ Error: Failed to initialize payer keypair.', (err as Error).message || err);
            await deleteFileFromFirebase(firebaseURL, await filePath);
            return handleErrorResponse(err as Error, 'Failed to initialize payer keypair.');
        }

        const SOL_FEE = parseFloat(process.env.MINTING_FEE_SOL || '0.05'); // Default to 0.05 if not set
        const LABS_FEE = parseInt(process.env.MINTING_FEE_LABS || '5000'); // Default to 5000 if not set

        try {
            const {solPrice, labsPrice} = await fetchPrices();
            const mintingFee = paymentType === 'SOL' ? SOL_FEE : LABS_FEE;

            totalCharged = await
                /**
                 * Charges the minting fee to the specified user account.
                 *
                 * @param {Connection} connection - The connection object to the Solana network.
                 * @param {Signer} payer - The account responsible for paying the transaction fees.
                 * @param {PublicKey} userPublicKey - The public key of the user account being charged.
                 * @param {string} paymentType - The type of payment being used (e.g., SOL or LABS).
                 * @param feeAmount - The amount to charge the user for the minting fee.
                 *
                 * @returns {Promise<number>} A promise that resolves to the total amount charged.
                 *
                 * @throws {Error} Throws an error if the payment cannot be processed.
                 */
                chargeMintingFee(
                    connection,
                    payer,
                    userPublicKeyInstance,
                    paymentType,
                    mintingFee);

            console.log('✅ Minting fee charged successfully!');

            // Calculate price per lamport (USD value of 1 lamport)
            const solPerLamport = solPrice / 10 ** 9; // SOL uses 9 decimal Places
            const labsPerUnit = labsPrice / 10 ** 9; // LABS uses 9 decimal places
            console.table([
                {'Metric': 'Minting Fee', 'Value': `${mintingFee} ${paymentType === 'SOL' ? 'USD (SOL)' : 'LABS'}`},
                {'Metric': 'Current SOL Price', 'Value': `${solPrice} USD`},
                {'Metric': 'Current LABS Price', 'Value': `${labsPrice} USD`},
                {'Metric': 'Price per Lamport (SOL)', 'Value': `${solPerLamport.toFixed(12)} USD`},
                {'Metric': 'Price per LABS Unit', 'Value': `${labsPerUnit.toFixed(12)} USD`}
            ]);
            console.log('-----------------------------------------');
        } catch (error) {
            console.error('❌ Error: Failed to charge minting fee:', (error as Error).message || error);
            await deleteFileFromFirebase(firebaseURL, await filePath);
            return handleErrorResponse(error, "Failed to mint tokens.");
        }

        let updatedMetadataUri: string;
        try {
            const description = `This is a token for ${tokenSymbol.toUpperCase()} with a total supply of ${quantity}.`;
            const imageUrl = imagePath;
            /**
             * Uploads an image to Pinata and pins the associated JSON metadata.
             *
             * @param {string} imageUrl - The URL of the image to be uploaded; this
             * will be stored on IPFS through Pinata.
             * @param {string} pinataApiKey - The API key for authenticating with
             * the Pinata service; this is required for upload permissions.
             * @param {string} pinataSecretApiKey - The secret API key for
             * authenticating with Pinata; this is used in conjunction with the API key.
             * @param {string} pinataBearerToken - The Bearer token for additional
             * authentication with the Pinata API; this is used for secured requests.
             * @param {string} tokenSymbol - The symbol of the token being minted;
             * this will be included in the JSON metadata.
             * @param {string} tokenName - The name of the token being minted; this
             * will also be included in the JSON metadata.
             * @param {string} description - A description of the token being minted;
             * this will provide additional context about the token in the metadata.
             *
             * @returns {string} imageCid - The Content Identifier (CID) of the
             * uploaded image, which can be used to retrieve the image from IPFS.
             */
            const imageCid = await uploadImageAndPinJSON(
                imageUrl,
                process.env.PINATA_API_KEY || '',
                process.env.PINATA_SECRET_API_KEY || '',
                process.env.PINATA_BEARER_TOKEN || '',
                tokenSymbol.toUpperCase(),
                tokenName,
                description
            );
            updatedMetadataUri = `https://gateway.pinata.cloud/ipfs/${imageCid}`;
            console.log('✅ Image and metadata uploaded to Pinata:', updatedMetadataUri);
        } catch (err) {
            console.error('❌ Error: Failed to upload image and metadata.', (err as Error).message || err);
            await deleteFileFromFirebase(firebaseURL, await filePath);
            return handleErrorResponse(error, "Failed to upload Token Data to IPFS.");
        }


        try {
            result = await
                /**
                 * Mints a new token for the specified user account.
                 *
                 * @param {number} parsedDecimals - The number of decimal places for the token.
                 * @param {number} quantity - The quantity of tokens to mint.
                 * @param {PublicKey} userPublicKey - The public key of the user account receiving the minted tokens.
                 *
                 * @returns {Promise<TokenMintResult>} A promise that resolves to the result of the minting operation.
                 *
                 * @throws {Error} Throws an error if the minting process fails.
                 */
                mintToken(
                    parsedDecimals,
                    quantity,
                    userPublicKeyInstance);
            tokenMintAccount = result.tokenMint;
            userTokenAccount = result.userTokenAccount;
            console.log('✅ Tokens minted:', quantity, 'Decimals:', parsedDecimals);
            console.log(`Freeze checked: ${result.freezeChecked}`);
        } catch (error) {
            console.error('❌ Error: Failed to mint tokens:', (error as Error).message || error);
            await deleteFileFromFirebase(firebaseURL, await filePath);
            return handleErrorResponse(error, "Failed to mint tokens.");
        }

        try {
            /**
             * Creates metadata for a specified token mint account.
             *
             * @param {string} tokenName - The name of the token being minted,
             * which will be included in the token's metadata.
             * @param {string} tokenSymbol - The symbol for the token, typically
             * a short string that represents the token in trading platforms.
             * @param {PublicKey} userPublicKeyInstance - The public key of the user
             * who is minting the token; this represents the wallet address of the user.
             * @param {string} updatedMetadataUri - The URI pointing to the metadata
             * JSON file containing additional information about the token.
             * @param {Account} payer - The payer of the transaction fees; this
             * account will cover the costs associated with the metadata creation.
             * @param {number} parsedDecimals - The number of decimal places for the
             * token; this defines the precision of the token's value.
             * @param {number} quantity - The quantity of tokens to mint; this
             * indicates how many tokens should be created in this transaction.
             * @param {boolean} mintChecked - A boolean flag indicating whether
             * the minting process should occur (true) or be skipped (false).
             * @param {boolean} immutableChecked - A boolean flag indicating
             * whether the token metadata should be marked as immutable (true)
             * or allow future updates (false).
             * @param {PublicKey} tokenMintAccount - The address of the token mint
             * account for which the metadata is being created.
             *
             * @returns {string} transactionLink - A link to the transaction result
             * for the metadata creation process.
             */
            transactionLink = await createMetadata(
                tokenName,
                tokenSymbol,
                userPublicKeyInstance,
                updatedMetadataUri,
                payer,
                parsedDecimals,
                quantity,
                mintChecked,
                immutableChecked,
                tokenMintAccount);

            console.log('✅ Metadata created:', transactionLink);
        } catch (error) {
            console.error('❌ Error: Failed to create metadata:', (error as Error).message || error);
            await deleteFileFromFirebase(firebaseURL, await filePath);
            return handleErrorResponse(error, "Failed to create metadata.");
        }
        try {
            /**
             * Sets the authority for a specified token mint account.
             *
             * @param {Connection} connection - The connection to the Solana network,
             * allowing interaction with the blockchain.
             * @param {Account} payer - The payer of the transaction fees; this account
             * will cover the costs associated with the authority change.
             * @param {PublicKey} tokenMintAccount - The address of the token mint account
             * whose authority is being modified.
             * @param {PublicKey} currentAuthority - The current authority for the mint
             * account; in this case, the payer is also the existing authority.
             * @param {AuthorityType} authorityType - The type of authority being set;
             * here, it indicates that we are dealing with the Freeze authority.
             * @param {PublicKey | null} newAuthority - The new authority being set;
             * passing `null` indicates that we are removing the Freeze authority,
             * leaving it without an active authority.
             */
            await setAuthority(
                connection,
                payer,
                tokenMintAccount,
                payer,
                AuthorityType.FreezeAccount,
                null
            );
            await logCurrentAuthorities(connection, tokenMintAccount);
        } catch (error) {
            console.error('❌ Error: Failed to set authority:', (error as Error).message || error);
            await deleteFileFromFirebase(firebaseURL, await filePath);
            return handleErrorResponse(error, "Failed to set authority.");
        }

        try {
            if (mintChecked) {
                console.log('🔄 Starting process to set MintTokens authority...');
                /**
                 * Sets the authority for the token mint account to allow minting tokens.
                 *
                 * @param {Connection} connection - The connection object to the Solana network.
                 * @param {Signer} payer - The account responsible for paying the transaction fees.
                 * @param {PublicKey} tokenMintAccount - The address of the token mint account.
                 * @param {PublicKey} currentAuthority - The current authority of the token mint account.
                 * @param {AuthorityType} authorityType - The type of authority being set (e.g., MintTokens).
                 * @param {PublicKey | null} newAuthority - The new authority to set, or null to remove authority.
                 *
                 * @returns {Promise<void>} A promise that resolves when the authority is set successfully.
                 *
                 * @throws {Error} Throws an error if the authority cannot be set.
                 */
                await setAuthority(
                    connection,
                    payer,
                    tokenMintAccount,
                    payer.publicKey,
                    AuthorityType.MintTokens,
                    null
                );
                console.log('✅ Successfully set MintTokens authority.');
            } else {
                console.log('ℹ️ mintChecked is false, skipping minting process.');
            }

            await logCurrentAuthorities(connection, tokenMintAccount);
            return NextResponse.json({
                success: true,
                message: 'Token minted successfully!',
                data: {
                    tokenMintAccount: tokenMintAccount.toString(),
                    userTokenAccount: userTokenAccount.toString(),
                    transactionLink,
                },
            });
        } catch (error) {
            console.error('❌ Error during minting process:', (error as Error).message || error);
            await deleteFileFromFirebase(firebaseURL, await filePath);
            return NextResponse.json({message: 'Failed to mint tokens.'}, {status: 500});
        } finally {
            if (firebaseURL) {
                try {
                    await deleteFileFromFirebase(firebaseURL, await filePath);
                    console.log('🗑️ Uploaded image file deleted successfully:', firebaseURL);
                } catch (err) {
                    console.error('❌ Error deleting image file:', (err instanceof Error) ? err.message : String(err));
                }
            }
        }
    } catch (error) {
        console.error('❌ Error:', (error as Error).message || error);
        return handleErrorResponse(error as Error, 'Failed to mint tokens.');

    }
}

async function validateRequiredFields(reqBody: any) {
    const missingFields: string[] = [];
    const requiredFields: string[] = [
        'tokenName',
        'tokenSymbol',
        'quantity',
        'mintChecked',
        'immutableChecked',
        'decimals',
        'paymentType',
        'imagePath'
    ];

    for (const field of requiredFields) {
        if (reqBody[field] === undefined || reqBody[field] === null || reqBody[field] === '') {
            missingFields.push(field);
        }
    }

    return missingFields;
}

