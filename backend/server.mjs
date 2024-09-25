import express from 'express';
import bodyParser from 'body-parser';
import {clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction} from '@solana/web3.js';
import {createMint, createTransferInstruction, getOrCreateAssociatedTokenAccount} from '@solana/spl-token';
import 'dotenv/config';
import '@pinata/sdk';
import {fileURLToPath} from 'url';
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
import {mintTokens} from "./mintTokens.mjs";
import cors from 'cors';
import fs from "fs";
import crypto from 'crypto';

/*
END OF IMPORTS
 */



/*
Constants
 */
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
// Initialize multer with the storage configuration
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
const payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.SOLANA_PRIVATE_KEY)));


if (process.env.APP_ENV === 'production' && connection.rpcEndpoint.includes('devnet')) {
    throw new Error('This application is set to production but is connected to the devnet cluster.');
}
if (connection.rpcEndpoint !== expectedUrl) {
    throw new Error(`Unexpected RPC endpoint: Expected ${expectedUrl}, but got ${connection.rpcEndpoint}.`);
}
const port = process.env.BACKEND_PORT || 3001;
logger.info(`Backend is running on port ${port}`);
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
const allowedOrigin = 'http://localhost:3000';

app.use(cors({
    origin: allowedOrigin,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.options('*', cors());
/*
END OF CONSTANTS
 */


app.post('/api/mint', upload.single('file'), async (req, res) => {
    try {
        const imageFile = req.file;
        let imageURI = '';

        if (imageFile) {
            imageURI = imageFile.path;
        } else {
            return res.status(400).json({ success: false, message: 'No image file uploaded.' });
        }

        const {
            tokenName,
            tokenSymbol,
            userPublicKey,
            quantity,
            freezeChecked,
            mintChecked,
            immutableChecked,
            decimals,
            paymentType
        } = req.body;
            console.log(req.body)
        // Validate paymentType
        if (!paymentType || !['SOL', 'LABS'].includes(paymentType)) {
            return res.status(400).json({ success: false, message: 'Invalid payment type. Must be SOL or LABS.' });
        }

        const missingFields = [];
        if (!tokenName) missingFields.push('tokenName');
        if (!tokenSymbol) missingFields.push('tokenSymbol');
        if (!userPublicKey) missingFields.push('userPublicKey');
        if (!quantity) missingFields.push('quantity');
        if (!imageURI) missingFields.push('imageURI');
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

        logger.info('Received data:', {
            tokenName,
            tokenSymbol,
            userPublicKey,
            quantity,
            imageURI,
            freezeChecked,
            mintChecked,
            immutableChecked,
            decimals
        });

        // Initialize PublicKey and check for errors
        let userKey;
        try {
            userKey = new PublicKey(userPublicKey);
            logger.info('User PublicKey:', userKey.toBase58());
        } catch (error) {
            logger.error('Error initializing PublicKey:', error.message);
            return res.status(400).json({ success: false, message: 'Invalid user public key.' });
        }
        const payer = {
            publicKey: userKey,
        };
        // Check if payer is defined and has publicKey
        if (!payer || !payer.publicKey) {
            logger.error('Payer is not properly initialized.');
            return res.status(500).json({ success: false, message: 'Payer is not properly initialized.' });
        }

        // Perform preliminary checks
        await preliminaryChecks(userPublicKey, payer, connection, logger, clusterApiUrl, createMint, getOrCreateAssociatedTokenAccount, decimals);

        // Create a new mint
        const mint = Keypair.generate();
        const symbol = tokenSymbol.toUpperCase();
        const description = `This is a token for ${symbol} with a total supply of ${quantity}.`;

        // Upload image and JSON metadata
        const imageCid = await uploadImageAndPinJSON(
            imageURI,
            process.env.PINATA_API_KEY,
            process.env.PINATA_SECRET_API_KEY,
            process.env.PINATA_BEARER_TOKEN,
            tokenSymbol.toUpperCase(),
            tokenSymbol.toUpperCase(),
            description
        );

        // Construct updated metadata URI
        const updatedMetadataUri = `https://gateway.pinata.cloud/ipfs/${imageCid}`;
        logger.info(`Updated Token Metadata URI: ${updatedMetadataUri}`);

        // Create new mint on the blockchain
        const mintAddress = await createNewMint(
            payer,
            mint,
            updatedMetadataUri,
            quantity,
            tokenSymbol,
            tokenName,
            freezeChecked,
            mintChecked,
            immutableChecked,
            decimals
        );

        // Use the same mintTokens function for both payment types
        const payerTokenAccount = await mintTokens(connection, mintAddress, quantity, payer, decimals);

        // Create or get user's token account
        const userTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            payer,
            mintAddress,
            userKey
        );

        // Create transfer transaction
        const transferTx = new Transaction().add(
            createTransferInstruction(
                payerTokenAccount.address,
                userTokenAccount.address,
                payer.publicKey,
                quantity * Math.pow(10, decimals)
            )
        );

        // Send and confirm transfer transaction
        logger.info('Sending transfer transaction...');
        const signature = await sendAndConfirmTransaction(connection, transferTx, [payer]);
        logger.info(`Transfer confirmed with signature: ${signature}`);

        await logBalances(connection, payer, payer.publicKey, userPublicKey, mint);

        // Respond with success
        return res.status(200).json({
            message: 'Mint and transfer successful!',
            mintAddress: mintAddress.toBase58(),
            tokenAccount: payerTokenAccount.address.toBase58(),
            metadataUploadOutput: 'Metadata uploaded successfully.'
        });

    } catch (error) {
        logger.error(`Error processing /mint request: ${error.message}`, {
            stack: error.stack,
            requestBody: req.body,
        });
        return res.status(500).json({ error: 'An error occurred during the minting process.' });
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
