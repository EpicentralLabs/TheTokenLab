import express, { Request, Response, Router } from 'express';
import { Connection, clusterApiUrl, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';
import { mintToken } from '../services/createTokenMint';
import { createMetadata } from '../services/createTokenMetadata';
import { uploadImageToPinata, uploadImageAndPinJSON } from "../services/pinata";
import {chargeMintingFee} from "../services/mintingFee";
import {fetchPrices} from "../services/priceService";
import {AuthorityType, getMint, setAuthority} from "@solana/spl-token";
import {getStorage} from "firebase-admin/storage";
const router: Router = express.Router();
// import { createWriteStream } from 'fs';

interface MintRequestBody {
    tokenName: string;
    tokenSymbol: string;
    userPublicKey: string;
    quantity: number;
    mintChecked: boolean;
    immutableChecked: boolean;
    decimals: string;
    paymentType: string;
    imagePath: string;
}

const validateRequiredFields = (reqBody: MintRequestBody) => {
    const missingFields: (keyof MintRequestBody)[] = [];
    const requiredFields: (keyof MintRequestBody)[] = ['tokenName', 'tokenSymbol', 'quantity', 'mintChecked', 'immutableChecked', 'decimals', 'paymentType', 'imagePath'];

    for (const field of requiredFields) {
        if (reqBody[field] === undefined || reqBody[field] === null) {
            missingFields.push(field);
        }
    }
    return missingFields;
};
const handleErrorResponse = (res: Response, error: Error, defaultMessage: string) => {
    console.error('❌ Error:', error.message);
    return res.status(500).json({ error: defaultMessage });
};
function isBuffer(data: any): data is Buffer {
    return Buffer.isBuffer(data);
}
async function logCurrentAuthorities(connection: Connection, tokenMintAccount: PublicKey) {
    const mintAccountInfo = await connection.getParsedAccountInfo(tokenMintAccount);

    if (!mintAccountInfo.value) {
        console.error('❌ Error: Failed to fetch mint account information.');
        return;
    }

    const { data } = mintAccountInfo.value;

    // Check if data is a Buffer or ParsedAccountData
    if (isBuffer(data)) {
        console.error('❌ Error: Received Buffer instead of ParsedAccountData.');
        return;
    }

    // Now we know data is of type ParsedAccountData
    console.log('Current Mint Authority:', data.parsed.info.mintAuthority);
    console.log('Current Freeze Authority:', data.parsed.info.freezeAuthority);
    console.log('Current Owner:', data.parsed.info.owner);
}


async function deleteFileFromFirebase(firebaseUrl: string) {
    try {
        const bucket = getStorage().bucket();
        const filePath = extractFilePathFromFirebaseUrl(firebaseUrl);
        const file = bucket.file(filePath);
        await file.delete();

        console.log(`🗑️ File deleted successfully from Firebase Storage: ${firebaseUrl}`);
    } catch (error) {
        const deleteErrorMessage = (error as Error).message || String(error);
        console.error('❌ Error deleting file from Firebase Storage:', deleteErrorMessage);
    }
}


function extractFilePathFromFirebaseUrl(firebaseUrl: string): string {
    const url = new URL(firebaseUrl);
    return url.pathname.substring(1);
}
// Define the /api/mint endpoint
// @ts-ignore
router.post('/', async (req: Request<{}, {}, MintRequestBody>, res: Response) => {



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
    } = req.body;

    console.log('ℹ️ Request received:', req.body);



    let userPublicKeyInstance: PublicKey;
    let parsedDecimals: number;
    let fullPath: string;
    let payer: Keypair;
    let totalCharged: number;
    let firebaseURL = req.body.imagePath;
    const rpcEndpoint = process.env.CUSTOM_RPC_ENDPOINT;
    const connection = new Connection(rpcEndpoint || clusterApiUrl('devnet'), 'confirmed');




    console.log(`🔗 Connected to Solana RPC at: ${rpcEndpoint || clusterApiUrl('devnet')}`);




    try {






        const missingFields = validateRequiredFields(req.body);
        if (missingFields.length > 0) {
            console.error('❌ Validation Error: Required fields are missing: ' + missingFields.join(', '));
            return res.status(400).json({
                success: false,
                message: 'Required fields are missing: ' + missingFields.join(', '),
            });
        }
        console.log('✅ All required fields validated.');

        if (!imagePath) {
            console.error('❌ Validation Error: Invalid image path:', imagePath);
            return res.status(400).json({message: 'Invalid image path provided.'});
        }
        // 2. Validate payment type
        if (!['SOL', 'LABS'].includes(paymentType)) {
            console.error('❌ Validation Error: Invalid payment type. Must be SOL or LABS.');
            return res.status(400).json({success: false, message: 'Invalid payment type. Must be SOL or LABS.'});
        }
        console.log('✅ Payment type validated.');
        // 3. Validate user public key
        try {
            userPublicKeyInstance = new PublicKey(userPublicKey);
            console.log('✅ User public key validated:', userPublicKey);
        } catch {
            console.error('❌ Validation Error: Invalid user public key.');
            return res.status(400).json({message: 'Invalid user public key.'});
        }
        // 4. Validate decimals
        parsedDecimals = decimals ? parseInt(decimals) : 0
        if (isNaN(parsedDecimals) || parsedDecimals < 0 || parsedDecimals > 9) {
            console.error('❌ Validation Error: Invalid decimals. Must be a non-negative integer and <= 9.');
            return res.status(400).json({message: 'Invalid decimals. Must be a non-negative integer and <= 9.'});
        }
        console.log('✅ Decimals validated:', parsedDecimals);
        // 5. Validate image path
        // eslint-disable-next-line no-undef
        const fullPath = path.join(__dirname, '..', '..', 'uploads', path.basename(imagePath));

        console.log('🔍 Checking file path:', fullPath);

        if (imagePath.startsWith('https://storage.googleapis.com')) {
            console.log('✅ Validating file via Firebase Storage URL:', imagePath);
        } else {
            if (!fs.existsSync(fullPath)) {
                console.error('❌ Validation Error: File not found at the specified path:', fullPath);
                return res.status(400).json({ message: 'File not found at the specified path.' });
            }
            console.log('✅ Image path validated:', fullPath);
        }

        // 6. Initialize payer keypair
        const privateKey = process.env.SOLANA_PRIVATE_KEY;
        if (!privateKey) {
            console.error('❌ Missing SOLANA_PRIVATE_KEY environment variable');
            await deleteFileFromFirebase(firebaseURL);
            return res.status(500).json({error: 'Missing SOLANA_PRIVATE_KEY'});
        }

        let secretKeyArray: number[];
        try {
            secretKeyArray = JSON.parse(privateKey);
            payer = Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));
            console.log('✅ Payer keypair initialized.');
        } catch (err) {
            console.error('❌ Error: Failed to initialize payer keypair.', (err as Error).message || err);
            await deleteFileFromFirebase(firebaseURL);
            return handleErrorResponse(res, err as Error, 'Failed to initialize payer keypair.');
        }

         // TODO: TURK - FIGURE OUT WHY THE FUCK WE'RE REQUESTING, > 10055 SOL FOR MINTING
        const SOL_FEE = parseFloat(process.env.MINTING_FEE_SOL || '0.05'); // Default to 0.05 if not set
        const LABS_FEE = parseInt(process.env.MINTING_FEE_LABS || '5000'); // Default to 5000 if not set

        try {
            const { solPrice, labsPrice } = await fetchPrices();
            const mintingFee = paymentType === 'SOL'
                ? SOL_FEE
                : LABS_FEE;

            totalCharged = await chargeMintingFee(connection, payer, userPublicKeyInstance, paymentType, mintingFee);

            console.log('✅ Minting fee charged successfully!');

            // Calculate price per lamport (USD value of 1 lamport)
            const solPerLamport = solPrice / 10 ** 9; // SOL uses 9 decimal Places
            const labsPerUnit = labsPrice / 10 ** 9; // LABS uses 9 decimal places
            console.table([
                { 'Metric': 'Minting Fee', 'Value': `${mintingFee} ${paymentType === 'SOL' ? 'USD (SOL)' : 'LABS'}` },
                { 'Metric': 'Current SOL Price', 'Value': `${solPrice} USD` },
                { 'Metric': 'Current LABS Price', 'Value': `${labsPrice} USD` },
                { 'Metric': 'Price per Lamport (SOL)', 'Value': `${solPerLamport.toFixed(12)} USD` },
                { 'Metric': 'Price per LABS Unit', 'Value': `${labsPerUnit.toFixed(12)} USD` }
            ]);
            console.log('-----------------------------------------');
        } catch (error) {
            console.error('❌ Error: Failed to charge minting fee:', (error as Error).message || error);
            await deleteFileFromFirebase(firebaseURL);
            return handleErrorResponse(res, error as Error, 'Failed to charge minting fee.');
        }

        let updatedMetadataUri: string;
        try {
            const description = `This is a token for ${tokenSymbol.toUpperCase()} with a total supply of ${quantity}.`;
            let imageUrl = imagePath;
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
            await deleteFileFromFirebase(firebaseURL);
            return handleErrorResponse(res, err as Error, 'Failed to upload image and metadata.');
        }

        let userTokenAccount: PublicKey;
        let tokenMintAccount: PublicKey;
        let result: any;

        try {
            result = await mintToken(parsedDecimals, quantity, userPublicKeyInstance);
            tokenMintAccount = result.tokenMint;
            userTokenAccount = result.userTokenAccount;
            console.log('✅ Tokens minted:', quantity, 'Decimals:', parsedDecimals);
            console.log(`Freeze checked: ${result.freezeChecked}`);
        } catch (error) {
            console.error('❌ Error: Failed to mint tokens:', (error as Error).message || error);
            await deleteFileFromFirebase(firebaseURL);
            return handleErrorResponse(res, error as Error, 'Failed to mint tokens.');
        }
        let transactionLink: any;
        try {
            transactionLink = await createMetadata(
                tokenName,
                tokenSymbol,
                userPublicKeyInstance,
                updatedMetadataUri,
                payer.publicKey,
                parsedDecimals,
                quantity,
                mintChecked,
                immutableChecked,
                tokenMintAccount
            );
            console.log('✅ Token metadata created for:', tokenName);
            console.log('✅ Status of Mint Checked:', mintChecked);
        } catch (error) {
            console.error('❌ Error during minting or metadata creation:', (error as Error).message || error);
            await deleteFileFromFirebase(firebaseURL);
            return handleErrorResponse(res, error as Error, 'Failed to create token metadata.');
        }
        try {
            const actionsPerformed: string[] = [];
            // Handle Mint Authority, set it to null if checked
            if (mintChecked) {
                console.log('🔄 Starting process to set MintTokens authority...');
                try {
                    await setAuthority(
                        connection,
                        payer,
                        tokenMintAccount,
                        payer.publicKey,
                        AuthorityType.MintTokens,
                        null
                    );
                    actionsPerformed.push('Minting');
                    console.log('✅ Successfully set MintTokens authority.');
                } catch (error) {
                    console.error('❌ Error setting MintTokens authority:', (error as Error).message || error);
                    await deleteFileFromFirebase(firebaseURL);
                    return handleErrorResponse(res, error as Error, 'Failed to set MintTokens authority');
                }
            } else {
                console.log('ℹ️ mintChecked is false, skipping minting process.');
            }
            await logCurrentAuthorities(connection, tokenMintAccount);

             // Handle Freeze Authority, set it to null if checked
        //      if (freezeChecked) {
        //          console.log('🔄 Starting process to set freezeAccount (freeze) authority...');
        //          try {
        //              const mintInfo = await getMint(connection, tokenMintAccount);
        //              console.log("Current Mint Authority:", mintInfo.mintAuthority);
        //              console.log("Current Freeze Authority:", mintInfo.freezeAuthority);
        //              await setAuthority(
        //                 connection,
        //                 payer,
        //                 tokenMintAccount,
        //                 payer.publicKey,
        //                 AuthorityType.FreezeAccount,
        //                 null
        //             );
        //             actionsPerformed.push('Freeze authority');
        //             console.log('✅ Successfully set FreezeAccount Authority (Freeze) authority to null.');
        //          } catch (error) {
        //              console.error('❌ Error setting FreezeAccount authority:', (error as Error).message || error);
        //              await deleteFileFromFirebase(firebaseURL);
        //              return handleErrorResponse(res, error as Error, 'Failed to set FreezeAccount authority');
        // }
        //      } else {
        //          console.log('ℹ️ freezeChecked is false, skipping mint authority process.');
        //      }


            try {
                await deleteFileFromFirebase(firebaseURL);
                console.log('🗑️ Uploaded image file deleted successfully:', fullPath);
            } catch (err) {
                console.error('❌ Error deleting image file:', (err as Error).message || err);
            }
            // If we reach here, all actions were successful
            return res.status(200).json({
                message: `✅ Successfully completed: ${actionsPerformed.join(', ')}.`,
                explorerLink: transactionLink,
                mintAddress: tokenMintAccount.toString(),
                tokenAccount: userTokenAccount?.toString(),
                metadataUploadOutput: `Metadata created at: ${transactionLink}`,
                totalCharged: totalCharged
            });

        } catch (error) {
            const errorMessage = (error as Error).message || String(error);
            const errorMapping: { [key: string]: string } = {
                'mint': 'Failed to set mint authority.',
                'freeze': 'Failed to set freeze authority.',
                'AccountOwner': 'Failed to set immutable authority.',
            };

            const errorKey = Object.keys(errorMapping).find(key => errorMessage.includes(key));

            if (errorKey) {
                console.error(`❌ Error: ${errorMapping[errorKey]}:`, errorMessage);
                return handleErrorResponse(res, error as Error, errorMapping[errorKey])
            }

            console.error('❌ Unexpected Error:', errorMessage);
            if (fullPath) {
                try {
                    console.error('❌ Minting failed. Deleting uploaded image file:', fullPath);
                    await deleteFileFromFirebase(firebaseURL);
                    console.log('🗑️ Uploaded image file deleted successfully:', fullPath);
                    console.log('✅ All Process completed successfully!');
                } catch (err) {
                    console.error('❌ Error deleting image file:', (err as Error).message || err);
                }
            }

            return handleErrorResponse(res, error as Error, 'Internal Server Error');
        } finally {
            if (firebaseURL) {
                try {
                    await deleteFileFromFirebase(firebaseURL);
                    console.log('🗑️ Uploaded image file deleted successfully:', firebaseURL);
                } catch (err) {
                    const deleteErrorMessage = (err instanceof Error) ? err.message : String(err);
                    console.error('❌ Error deleting image file:', deleteErrorMessage);
                }
            }
        }
    } catch (error) {
        return handleErrorResponse(res, error as Error, 'Internal Server Error');
    }});
export default router;

