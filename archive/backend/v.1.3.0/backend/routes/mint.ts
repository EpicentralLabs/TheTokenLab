// @ts-ignore
import express, { Request, Response } from 'express';
import { PublicKey, Keypair } from '@solana/web3.js';
import * as fs from 'fs';
// @ts-ignore
import path from 'path';
import { mintToken } from '../services/createTokenMint';
import { createMetadata } from '../services/createTokenMetadata';
import { uploadImageToPinata, uploadImageAndPinJSON } from "../services/pinata";

const router = express.Router();

// Define the /api/mint endpoint
router.post('/', async (req: Request, res: Response) => {
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
            return res.status(400).json({
                success: false,
                message: 'Required fields are missing: ' + missingFields.join(', '),
            });
        }

        // 2. Validate payment type
        if (!['SOL', 'LABS'].includes(paymentType)) {
            return res.status(400).json({ success: false, message: 'Invalid payment type. Must be SOL or LABS.' });
        }

        // 3. Validate user public key
        try {
            userPublicKeyInstance = new PublicKey(userPublicKey);
        } catch {
            return res.status(400).json({ message: 'Invalid user public key.' });
        }

        // 4. Validate decimals
        parsedDecimals = parseInt(decimals, 10);
        if (isNaN(parsedDecimals) || parsedDecimals < 0 || parsedDecimals > 6) {
            return res.status(400).json({ message: 'Invalid decimals. Must be a non-negative integer and <= 6.' });
        }

        // 5. Validate image path
        fullPath = path.join(__dirname, imagePath);
        if (!fs.existsSync(fullPath)) {
            return res.status(400).json({ message: 'File not found at the specified path.' });
        }

        // 6. Initialize payer keypair
        try {
            payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.SOLANA_PRIVATE_KEY)));
        } catch (err) {
            return res.status(500).json({ message: 'Failed to initialize payer keypair.' });
        }

        // 7. Upload image and metadata to Pinata
        let updatedMetadataUri: string;
        try {
            const description = `This is a token for ${tokenSymbol.toUpperCase()} with a total supply of ${quantity}.`;
            const imageCid = await uploadImageAndPinJSON(
                fullPath,
                process.env.PINATA_API_KEY,
                process.env.PINATA_SECRET_API_KEY,
                process.env.PINATA_BEARER_TOKEN,
                tokenSymbol.toUpperCase(),
                tokenName,
                description
            );
            updatedMetadataUri = `https://gateway.pinata.cloud/ipfs/${imageCid}`;
        } catch {
            return res.status(500).json({ message: 'Failed to upload image and metadata.' });
        }

        // 8. Mint tokens
        try {
            const tokenMintAccount = await mintToken(parsedDecimals, Number(quantity));
        } catch (error) {
            return res.status(500).json({ error: 'Failed to mint tokens' });
        }

        // 9. Create token metadata
        try {
            await createMetadata(
                tokenName,
                tokenSymbol,
                userPublicKeyInstance,
                updatedMetadataUri,
                payer,
                parsedDecimals,
                quantity,
                freezeChecked,
                mintChecked,
                immutableChecked,
                tokenMintAccount
            );
        } catch (error) {
            return res.status(500).json({ error: 'Failed to create token metadata' });
        }

        // 10. Return success response after both minting and metadata creation
        res.status(200).json({ message: `Minted ${quantity} tokens with ${decimals} decimals and metadata created` });
    } catch (error) {
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});

export default router;
