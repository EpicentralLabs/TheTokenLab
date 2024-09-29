import express, { Request, Response, Router } from 'express';
import { PublicKey, Keypair } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';
import { mintToken } from '../services/createTokenMint';
import { createMetadata } from '../services/createTokenMetadata';
import { uploadImageToPinata, uploadImageAndPinJSON } from "../services/pinata";

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

    let userPublicKeyInstance: PublicKey;
    let parsedDecimals: number;
    let fullPath: string;
    let payer: Keypair;

    try {
        // 1. Validate required fields
        const missingFields: string[] = [];
        if (!tokenName) missingFields.push('tokenName');
        if (!tokenSymbol) missingFields.push('tokenSymbol');
        if (!quantity) missingFields.push('quantity');
        if (typeof freezeChecked === 'undefined') missingFields.push('freezeChecked');
        if (typeof mintChecked === 'undefined') missingFields.push('mintChecked');
        if (typeof immutableChecked === 'undefined') missingFields.push('immutableChecked');
        if (typeof decimals === 'undefined') missingFields.push('decimals');

        if (missingFields.length > 0) {
            console.error('❌ Validation Error: Required fields are missing: ' + missingFields.join(', '));
            return res.status(400).json({
                success: false,
                message: 'Required fields are missing: ' + missingFields.join(', '),
            });
        }
        console.log('✅ All required fields validated.');

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
        fullPath = path.join(__dirname, imagePath);
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
            return res.status(500).json({message: 'Failed to initialize payer keypair.'});
        }

        // 7. Upload image and metadata to Pinata
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
            return res.status(500).json({message: 'Failed to upload image and metadata.'});
        }

        // 8. Mint tokens
        let tokenMintAccount;
        try {
            tokenMintAccount = await mintToken(parsedDecimals, Number(quantity), payer.publicKey);
            console.log('✅ Tokens minted:', quantity, 'Decimals:', parsedDecimals);
        } catch (error) {
            console.error('❌ Error: Failed to mint tokens:', (error as Error).message || error);
            return res.status(500).json({error: 'Failed to mint tokens'});
        }

        // 9. Create token metadata
        try {
            await createMetadata(
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
        } catch (error) {
            console.error('❌ Error: Failed to create token metadata:', (error as Error).message || error);
            return res.status(500).json({error: 'Failed to create token metadata'});
        }

        // 10. Return success response after both minting and metadata creation
        res.status(200).json({message: `Minted ${quantity} tokens with ${decimals} decimals and metadata created`});
    } catch (error) {
        console.error('❌ Unexpected Error:', (error as Error).message || error);
        res.status(500).json({error: 'An unexpected error occurred'});
    }
});

export default router;
