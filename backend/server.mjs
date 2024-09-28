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
    try {
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

        // Validate userPublicKey
        let userPublicKeyInstance;
        try {
            userPublicKeyInstance = new PublicKey(userPublicKey);
        } catch (err) {
            return res.status(400).json({ message: 'Invalid user public key.' });
        }

        // Validate decimals
        const parsedDecimals = parseInt(decimals, 10);
        if (isNaN(parsedDecimals) || parsedDecimals < 0 || parsedDecimals > 6) {
            return res.status(400).json({ message: 'Decimals must be a non-negative integer and less than or equal to 6.' });
        }

        if (!PublicKey.isOnCurve(userPublicKeyInstance)) {
            return res.status(400).json({ message: 'User public key is not on the curve.' });
        }

        // Validate image path
        if (!imagePath) {
            return res.status(400).json({ message: 'Image path is missing.' });
        }

        const fullPath = path.join(__dirname, imagePath);
        if (!fs.existsSync(fullPath)) {
            return res.status(400).json({ message: 'File not found at the specified path.' });
        }

        // Validate required fields
        const missingFields = [];
        if (!tokenName) missingFields.push('tokenName');
        if (!tokenSymbol) missingFields.push('tokenSymbol');
        if (!userPublicKeyInstance) missingFields.push('userPublicKey');
        if (!quantity) missingFields.push('quantity');
        if (typeof freezeChecked === 'undefined') missingFields.push('freezeChecked');
        if (typeof mintChecked === 'undefined') missingFields.push('mintChecked');
        if (typeof immutableChecked === 'undefined') missingFields.push('immutableChecked');
        if (typeof decimals === 'undefined') missingFields.push('decimals');

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Required fields are missing: ' + missingFields.join(', ')
            });
        }

        // Ensure paymentType is valid
        if (!['SOL', 'LABS'].includes(paymentType)) {
            return res.status(400).json({ success: false, message: 'Invalid payment type. Must be SOL or LABS.' });
        }

        // Construct the payer keypair using SOLANA_PRIVATE_KEY
        const payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.SOLANA_PRIVATE_KEY)));

        // Run preliminary checks (if any)
        await preliminaryChecks(userPublicKeyInstance, payer, connection, logger, clusterApiUrl, createMint, getOrCreateAssociatedTokenAccount, decimals);

        // Upload image to Pinata and pin JSON metadata
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

        const updatedMetadataUri = `https://gateway.pinata.cloud/ipfs/${imageCid}`;
        console.log(`Updated Token Metadata URI: ${updatedMetadataUri}`);

        try {
            // Create a new mint
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
            const mintPublicKey = new PublicKey(mintAddress);

            // Mint the tokens to the payer's account
            const payerTokenAccount = await mintTokens(
                connection,
                mintPublicKey,  // Mint public key
                quantity,
                payer,
                parsedDecimals,
                paymentType
            );

            // Create or get the user's token account
            const userTokenAccount = await getOrCreateAssociatedTokenAccount(
                connection,
                payer,
                mintPublicKey,
                userPublicKeyInstance
            );

            // Transfer tokens to the user's account
            const transferTx = new Transaction().add(
                createTransferInstruction(
                    payerTokenAccount.address,
                    userTokenAccount.address,
                    payer.publicKey,
                    quantity * Math.pow(10, parsedDecimals)
                )
            );
            const signature = await sendAndConfirmTransaction(connection, transferTx, [payer]);
            console.log(`Transfer confirmed with signature: ${signature}`);

            // Log balances
            await logBalances(connection, payer, payer.publicKey, userPublicKeyInstance, mintPublicKey);

            return res.status(200).json({
                message: 'Mint and transfer successful!',
                mintAddress: mintPublicKey.toBase58(),
                tokenAccount: payerTokenAccount.address.toBase58(),
                metadataUploadOutput: 'Metadata uploaded successfully.'
            });

        } catch (error) {
            console.error(`Error processing /mint request during minting: ${error.message}`);
            return res.status(500).json({ error: 'An error occurred during the minting process.' });
        }
    } catch (error) {
        console.error(`Error processing /mint request: ${error.message}`);
        return res.status(500).json({ error: 'An error occurred during the minting process.' });
    }
});

app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
});
