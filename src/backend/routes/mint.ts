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
const router: Router = express.Router();

interface MintRequestBody {
    tokenName: string;
    tokenSymbol: string;
    userPublicKey: string;
    quantity: number;
    freezeChecked: boolean;
    mintChecked: boolean;
    immutableChecked: boolean;
    decimals: string;
    paymentType: string;
    imagePath: string;
}

const validateRequiredFields = (reqBody: MintRequestBody) => {
    const missingFields: (keyof MintRequestBody)[] = [];
    const requiredFields: (keyof MintRequestBody)[] = ['tokenName', 'tokenSymbol', 'quantity', 'freezeChecked', 'mintChecked', 'immutableChecked', 'decimals', 'paymentType', 'imagePath']; // Specify the required fields with type

    for (const field of requiredFields) {
        if (reqBody[field] === undefined || reqBody[field] === null) { // Check for both undefined and null
            missingFields.push(field);
        }
    }
    return missingFields;
};
const handleErrorResponse = (res: Response, error: Error, defaultMessage: string) => {
    console.error('❌ Error:', error.message);
    return res.status(500).json({ error: defaultMessage });
};

async function logCurrentAuthorities(connection: Connection, tokenMintAccount: PublicKey) {
    const mintAccountInfo = await connection.getParsedAccountInfo(tokenMintAccount);

    if (!mintAccountInfo.value) {
        console.error('❌ Error: Failed to fetch mint account information.');
        return;
    }

    const { data } = mintAccountInfo.value;

    // Check if data is a Buffer or ParsedAccountData
    if (data instanceof Buffer) {
        console.error('❌ Error: Received Buffer instead of ParsedAccountData.');
        return;
    }

    // Now we know data is of type ParsedAccountData
    console.log('Current Mint Authority:', data.parsed.info.mintAuthority);
    console.log('Current Freeze Authority:', data.parsed.info.freezeAuthority);
    console.log('Current Owner:', data.parsed.info.owner);
}

// Define the /api/mint endpoint
// @ts-ignore
router.post('/', async (req: Request<{}, {}, MintRequestBody>, res: Response) => {
    const {
        tokenName,
        tokenSymbol,
        userPublicKey,
        quantity,
        freezeChecked,
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
        parsedDecimals = parseInt(decimals, 10);
        if (isNaN(parsedDecimals) || parsedDecimals < 0 || parsedDecimals > 6) {
            console.error('❌ Validation Error: Invalid decimals. Must be a non-negative integer and <= 6.');
            return res.status(400).json({message: 'Invalid decimals. Must be a non-negative integer and <= 6.'});
        }
        console.log('✅ Decimals validated:', parsedDecimals);
        // 5. Validate image path
        // eslint-disable-next-line no-undef
        fullPath = path.join(__dirname, '..', '..', 'uploads', path.basename(imagePath));
        if (!fs.existsSync(fullPath)) {
            console.error('❌ Validation Error: File not found at the specified path:', fullPath);
            return res.status(400).json({message: 'File not found at the specified path.'});
        }
        console.log('✅ Image path validated:', fullPath);

        // 6. Initialize payer keypair
        const privateKey = process.env.SOLANA_PRIVATE_KEY;
        if (!privateKey) {
            console.error('❌ Missing SOLANA_PRIVATE_KEY environment variable');
            return res.status(500).json({error: 'Missing SOLANA_PRIVATE_KEY'});
        }

        let secretKeyArray: number[];
        try {
            secretKeyArray = JSON.parse(privateKey);
            payer = Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));
            console.log('✅ Payer keypair initialized.');
        } catch (err) {
            console.error('❌ Error: Failed to initialize payer keypair.', (err as Error).message || err);
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
            const labsPerUnit = labsPrice / 10 ** 9; // TODO: Confirm LABS also uses 9 decimal places
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
            return handleErrorResponse(res, error as Error, 'Failed to charge minting fee.');
        }

        let updatedMetadataUri: string;
        try {
            const description = `This is a token for ${tokenSymbol.toUpperCase()} with a total supply of ${quantity}.`;
            const imageCid = await uploadImageAndPinJSON(
                fullPath,
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
            return handleErrorResponse(res, err as Error, 'Failed to upload image and metadata.');
        }

        let userTokenAccount: PublicKey;
        let tokenMintAccount: PublicKey;
        let result: any;

        try {
            result = await mintToken(parsedDecimals, quantity, userPublicKeyInstance, freezeChecked);
            tokenMintAccount = result.tokenMint;
            userTokenAccount = result.userTokenAccount;
            console.log('✅ Tokens minted:', quantity, 'Decimals:', parsedDecimals);
            console.log(`Freeze checked: ${result.freezeChecked}`);
        } catch (error) {
            console.error('❌ Error: Failed to mint tokens:', (error as Error).message || error);
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
                freezeChecked,
                mintChecked,
                immutableChecked,
                tokenMintAccount
            );
            console.log('✅ Token metadata created for:', tokenName);
            console.log('✅ Status of Mint Checked:', mintChecked);
        } catch (error) {
            console.error('❌ Error during minting or metadata creation:', (error as Error).message || error);
            return handleErrorResponse(res, error as Error, 'Failed to create token metadata.');
        }
        try {
            const actionsPerformed: string[] = [];
            if (mintChecked) {
                console.log('🔄 Starting process to set MintTokens authority...');
                try {
                    await setAuthority(
                        connection,
                        payer,
                        tokenMintAccount,
                        payer.publicKey,
                        AuthorityType.MintTokens,
                        userPublicKeyInstance
                    );
                    actionsPerformed.push('Minting');
                    console.log('✅ Successfully set MintTokens authority.');
                } catch (error) {
                    console.error('❌ Error setting MintTokens authority:', (error as Error).message || error);
                    return handleErrorResponse(res, error as Error, 'Failed to set MintTokens authority');
                }
            } else {
                console.log('ℹ️ mintChecked is false, skipping minting process.');
            }
            await logCurrentAuthorities(connection, tokenMintAccount);

            // Handle AccountOwner Authority
            if (immutableChecked) {
                console.log('🔄 Starting process to set AccountOwner (Immutable) authority...');
                try {
                    const mintInfo = await getMint(connection, tokenMintAccount);
                    console.log("Current Mint Authority:", mintInfo.mintAuthority);
                    console.log("Current Freeze Authority:", mintInfo.freezeAuthority);
                    await setAuthority(
                        connection,
                        payer,
                        tokenMintAccount,
                        payer.publicKey,
                        AuthorityType.AccountOwner,
                        userPublicKeyInstance
                    );
                    actionsPerformed.push('Immutable authority');
                    console.log('✅ Successfully set AccountOwner (Immutable) authority.');
                } catch (error) {
                    console.error('❌ Error setting AccountOwner authority:', (error as Error).message || error);
                    return handleErrorResponse(res, error as Error, 'Failed to set AccountOwner authority');
                }
            } else {
                console.log('ℹ️ immutableChecked is false, skipping immutable authority process.');
            }
            try {
                fs.unlinkSync(fullPath);
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
                freezeChecked:'Token Freeze Authority is Set?: ' + freezeChecked,
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
                    fs.unlinkSync(fullPath);
                    console.log('🗑️ Uploaded image file deleted successfully:', fullPath);
                    console.log('✅ All Process completed successfully!');
                } catch (err) {
                    console.error('❌ Error deleting image file:', (err as Error).message || err);
                }
            }

            return handleErrorResponse(res, error as Error, 'Internal Server Error');
        } finally {
            if (fullPath) {
                try {
                    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
                        await logCurrentAuthorities(connection, tokenMintAccount);
                        fs.unlinkSync(fullPath);
                        console.log('🗑️ Uploaded image file deleted successfully:', fullPath);
                    } else{
                        console.error('❌ Uploaded Image not found! It was likely deleted already!', fullPath);
                    }
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

