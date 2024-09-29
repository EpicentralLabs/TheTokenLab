import express, { Request, Response } from 'express';
import { PublicKey, Keypair } from '@solana/web3.js';
import * as fs from 'fs';
import path from 'path';
import { createTokenMint, mintToken, uploadImageAndPinJSON } from '../services/minting'; // Adjust the import path if necessary

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
        // Validate userPublicKey
        try {
            userPublicKeyInstance = new PublicKey(userPublicKey);
            console.log('User Public Key validated:', userPublicKeyInstance.toBase58());
        } catch (err) {
            console.error('Invalid user public key:', userPublicKey);
            return res.status(400).json({ message: 'Invalid user public key.' });
        }

        // Validate decimals
        try {
            parsedDecimals = parseInt(decimals, 10);
            if (isNaN(parsedDecimals) || parsedDecimals < 0 || parsedDecimals > 6) {
                throw new Error('Invalid decimals. Must be a non-negative integer and <= 6.');
            }
            console.log('Decimals validated:', parsedDecimals);
        } catch (err) {
            console.error('Decimals validation failed:', decimals);
            return res.status(400).json({ message: err.message });
        }

        // Ensure the public key is on the curve
        if (!PublicKey.isOnCurve(userPublicKeyInstance)) {
            console.error('User public key is not on the curve:', userPublicKeyInstance.toBase58());
            return res.status(400).json({ message: 'User public key is not on the curve.' });
        }

        // Validate image path
        try {
            if (!imagePath) throw new Error('Image path is missing.');
            fullPath = path.join(__dirname, imagePath);
            if (!fs.existsSync(fullPath)) throw new Error('File not found at the specified path.');
            console.log('Image path validated:', fullPath);
        } catch (err) {
            console.error('Image path validation failed:', imagePath);
            return res.status(400).json({ message: err.message });
        }

        // Validate other required fields
        const missingFields: string[] = [];
        if (!tokenName) missingFields.push('tokenName');
        if (!tokenSymbol) missingFields.push('tokenSymbol');
        if (!quantity) missingFields.push('quantity');
        if (typeof freezeChecked === 'undefined') missingFields.push('freezeChecked');
        if (typeof mintChecked === 'undefined') missingFields.push('mintChecked');
        if (typeof immutableChecked === 'undefined') missingFields.push('immutableChecked');
        if (typeof decimals === 'undefined') missingFields.push('decimals');

        if (missingFields.length > 0) {
            console.error('Required fields are missing:', missingFields.join(', '));
            return res.status(400).json({
                success: false,
                message: 'Required fields are missing: ' + missingFields.join(', '),
            });
        }

        // Validate paymentType
        if (!['SOL', 'LABS'].includes(paymentType)) {
            console.error('Invalid payment type:', paymentType);
            return res.status(400).json({ success: false, message: 'Invalid payment type. Must be SOL or LABS.' });
        }

        // Initialize payer keypair
        try {
            payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.SOLANA_PRIVATE_KEY)));
            console.log('Payer initialized:', payer.publicKey.toBase58());
        } catch (err) {
            console.error('Failed to initialize payer keypair:', err.message);
            return res.status(500).json({ message: 'Failed to initialize payer keypair.' });
        }

        // Upload image and metadata to Pinata
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
            console.log(`Updated Token Metadata URI: ${updatedMetadataUri}`);
        } catch (err) {
            console.error('Error uploading image or metadata:', err.message);
            return res.status(500).json({ message: 'Failed to upload image and metadata.' });
        }

        // Create token mint and mint tokens
        let mintPublicKey: PublicKey;
        try {
            mintPublicKey = await mintToken(quantity); // Adjust this as needed
            console.log('Mint created successfully:', mintPublicKey.toBase58());
        } catch (err) {
            console.error('Error creating mint:', err.message);
            return res.status(500).json({ error: 'Failed to create mint.' });
        }

        res.status(200).json({
            success: true,
            message: 'Token minted and metadata created successfully',
            mintAddress: mintPublicKey.toBase58(),
            metadataUri: updatedMetadataUri,
        });
    } catch (error) {
        console.error('Minting error:', error);
        res.status(500).json({
            success: false,
            message: 'Error minting token or creating metadata',
            error: error.message,
        });
    }
});

export {
    createMetadata,
    mintToken,
    uploadImageToPinata,
    uploadImageAndPinJSON,
};