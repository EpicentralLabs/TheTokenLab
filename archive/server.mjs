import express from 'express';
import bodyParser from 'body-parser';
import { clusterApiUrl, Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction } from '@solana/web3.js';
import { createMint, createTransferInstruction, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import 'dotenv/config';
import { fileURLToPath } from 'url';
import path from 'path';
import multer from 'multer';

/*
Modularized Imports
*/
import { preliminaryChecks } from './checks.mjs';
import { logBalances } from './logBalances.mjs';
import logger from './logger.mjs';
import { uploadImageAndPinJSON } from './ipfs.mjs';
import { createNewMint } from './createNewMint.mjs';
import { mintTokens } from './mintTokens.mjs';
import cors from 'cors';
import fs from "fs";
import crypto from 'crypto';

/*
END OF IMPORTS
*/

// File upload handling
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
            console.log(`Created upload directory: ${uploadPath}`);
        }
        console.log(`Uploading file to: ${uploadPath}`);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const hashedName = crypto.randomBytes(16).toString('hex') + path.extname(file.originalname);
        console.log(`Generated filename: ${hashedName} for original file: ${file.originalname}`);
        cb(null, hashedName);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // Limit files to 5 MB
    },
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png|gif/; // Allowed file types
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = fileTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Error: File upload only supports the following filetypes - ' + fileTypes));
    },
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const network = process.env.APP_ENV === 'production' ? 'mainnet-beta' : 'devnet';
const connection = new Connection(clusterApiUrl(network), 'confirmed');
const expectedUrl = clusterApiUrl(network);
logger.debug(`Connected to: ${expectedUrl}`);

app.use(express.json());
app.use(bodyParser.json());

if (process.env.APP_ENV === 'production' && connection.rpcEndpoint.includes('devnet')) {
    throw new Error('This application is set to production but is connected to the devnet cluster.');
}
if (connection.rpcEndpoint !== expectedUrl) {
    throw new Error(`Unexpected RPC endpoint: Expected ${expectedUrl}, but got ${connection.rpcEndpoint}.`);
}

const port = process.env.REACT_APP_BACKEND_PORT || 3001;
logger.info(`Backend is running on port ${port}`);
app.use(express.static(path.join(__dirname, 'public')));
const allowedOrigin = 'http://localhost:3000';

app.use(cors({
    origin: allowedOrigin,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.options('*', cors());

/*
Endpoint for minting tokens
*/
app.post('/api/mint', async (req, res) => {
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

    let userPublicKeyInstance, parsedDecimals, fullPath, payer;

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
        const missingFields = [];
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
        let updatedMetadataUri;
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

        // Create mint
        let mintPublicKey;
        try {
            const mintAddress = await createNewMint(
                payer,
                updatedMetadataUri,
                tokenSymbol,
                tokenName,
                parsedDecimals,
                quantity,
                freezeChecked,
                userPublicKey,
                mintChecked,
                immutableChecked
            );
            mintPublicKey = new PublicKey(mintAddress);
            console.log('Mint created successfully:', mintPublicKey.toBase58());
        } catch (err) {
            console.error('Error creating mint:', err.message);
            return res.status(500).json({ error: 'Failed to create mint.' });
        }

        // Mint tokens to the payer's account
        let payerTokenAccount;
        try {
            payerTokenAccount = await mintTokens(
                connection,
                mintPublicKey,
                quantity,
                payer,
                parsedDecimals,
                paymentType
            );
            console.log('Tokens minted to payer account:', payerTokenAccount.address.toBase58());
        } catch (err) {
            console.error('Error minting tokens:', err.message);
            return res.status(500).json({ error: 'Failed to mint tokens.' });
        }

        // Create user token account
        let userTokenAccount;
        try {
            userTokenAccount = await getOrCreateAssociatedTokenAccount(
                connection,
                payer,
                mintPublicKey,
                userPublicKeyInstance
            );
            console.log('User token account created:', userTokenAccount.address.toBase58());
        } catch (err) {
            console.error('Error creating user token account:', err.message);
            return res.status(500).json({ error: 'Failed to create user token account.' });
        }

        // Transfer tokens to the user's account
        try {
            const transferTx = new Transaction().add(
                createTransferInstruction(
                    payerTokenAccount.address,
                    userTokenAccount.address,
                    payer.publicKey,
                    quantity * Math.pow(10, parsedDecimals)
                )
            );
            console.log('Transfer transaction created:', transferTx);

            const signature = await sendAndConfirmTransaction(connection, transferTx, [payer]);
            console.log('Transfer confirmed with signature:', signature);

            // Log balances
            await logBalances(connection, payer, payer.publicKey, userPublicKeyInstance, mintPublicKey);
            console.log('Balances logged after transfer.');

            return res.status(200).json({
                message: 'Mint and transfer successful!',
                mintAddress: mintPublicKey.toBase58(),
                tokenAccount: payerTokenAccount.address.toBase58(),
                metadataUploadOutput: 'Metadata uploaded successfully.',
            });

        } catch (err) {
            console.error('Error during transfer:', err.message);
            return res.status(500).json({ error: 'Failed to transfer tokens.' });
        }

    } catch (error) {
        console.error('Unexpected error during minting process:', {
            message: error.message,
            stack: error.stack,
            requestBody: req.body,
            connectionStatus: connection ? 'active' : 'not connected',
        });
        return res.status(500).json({ error: 'An unexpected error occurred during the minting process.' });
    }
});

app.post('/upload', upload.single('file'), (req, res) => {
    console.log('Received file upload request.');
    if (!req.file) {
        console.error('No file uploaded.');
        return res.status(400).send('No file uploaded.');
    }
    console.log('File uploaded successfully:', {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        storedName: req.file.filename,
        path: `/uploads/${req.file.filename}`
    });
    const filePath = path.join('uploads', req.file.filename);
    console.log('File path:', filePath);
    // Respond with the successful upload details
    return res.json({
        message: 'File uploaded successfully!',
        filename: req.file.filename,
        path: `/uploads/${req.file.filename}`
    });
});
if (process.env.APP_ENV !== 'production') {
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
}
app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
});
