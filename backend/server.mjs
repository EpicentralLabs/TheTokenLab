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
import { preliminaryChecks } from './checks.js';
import { logBalances } from './logBalances.js';
import logger from './logger.js';
import { uploadImageAndPinJSON } from './ipfs.js';
import { createNewMint } from './createNewMint.js';
import {mintTokens} from "./mintTokens.js";
/*
END OF IMPORTS
 */

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

/*
Constants
 */
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const network = process.env.APP_ENV === 'production' ? 'mainnet-beta' : 'devnet';
const connection = new Connection(clusterApiUrl(network), 'confirmed');
const expectedUrl = clusterApiUrl(network);
logger.debug(`Connected to: ${expectedUrl}`);
const payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.SOLANA_PRIVATE_KEY)));

const decimals = 9;
const FEE_quantity = 0.05 * LAMPORTS_PER_SOL;
if (process.env.APP_ENV === 'production' && connection.rpcEndpoint.includes('devnet')) {
    throw new Error('This application is set to production but is connected to the devnet cluster.');
}
if (connection.rpcEndpoint !== expectedUrl) {
    throw new Error(`Unexpected RPC endpoint: Expected ${expectedUrl}, but got ${connection.rpcEndpoint}.`);
}
const port = process.env.BACKEND_PORT || 3001;
logger.info(`Backend is running on port ${port}`);
/*
END OF CONSTANTS
 */

// Handle mint and transfer logic
app.post('/api/mint', async (req, res) => {
    try {
        const { tokenName, tokenSymbol,  userPublicKey, quantity, imageURI, freezeChecked, mintChecked, immutableChecked, decimals,  } = req.body;

        // Check for required fields
        if (!tokenSymbol || !userPublicKey || !quantity || !imageURI) {
            return res.status(400).json({ success: false, message: 'Required fields are missing.' });
        }

        // Resolve the image path (assuming imageURI is the CID)
        const imagePath = path.join(__dirname, imageURI);
        logger.info('Received data:', { tokenName, tokenSymbol,  userPublicKey, quantity, imageURI, freezeChecked, mintChecked, immutableChecked, decimals, imagePath });

        // Initialize PublicKey and check for errors
        let userKey;
        try {
            userKey = new PublicKey(userPublicKey);
            logger.info('User PublicKey:', userKey.toBase58());
        } catch (error) {
            logger.error('Error initializing PublicKey:', error.message);
            return res.status(400).json({ success: false, message: 'Invalid user public key.' });
        }

        // Check if payer is defined and has publicKey
        if (!payer || !payer.publicKey) {
            logger.error('Payer is not properly initialized.');
            return res.status(500).json({ success: false, message: 'Payer is not properly initialized.' });
        }

        // Perform preliminary checks
        await preliminaryChecks(userPublicKey, payer, connection, logger, clusterApiUrl, createMint, getOrCreateAssociatedTokenAccount, decimals);

        // Create a new mint
        const mint = Keypair.generate(); // Generate a new mint Keypair
        const symbol = tokenSymbol.toUpperCase();
        const name = `${symbol} Token`;
        const description = `This is a token for ${symbol} with a total supply of ${quantity}.`;

        // Upload image and JSON metadata
        const imageCid = await uploadImageAndPinJSON(
            imagePath,
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
        const mintAddress = await createNewMint(payer, mint, updatedMetadataUri, quantity, tokenSymbol, tokenName, freezeChecked, mintChecked, immutableChecked, decimals);
        // Mint tokens
        logger.info(`Minting ${quantity} tokens to the payer token account.`);
        const payerTokenAccount = await mintTokens(connection, mintAddress, quantity, payer);

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
        res.status(200).json({
            message: 'Mint and transfer successful!',
            mintAddress: mintAddress.toBase58(),
            tokenAccount: payerTokenAccount.address.toBase58(),
            metadataUploadOutput: 'Metadata uploaded successfully.'
        });

    } catch (error) {
        logger.error(`Error processing /mint request: ${error.message}`);
        res.status(500).json({ error: 'An error occurred' });
    }
});
app.post('/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        res.json({ uri: `/uploads/${req.file.filename}` });
    } catch (err) {
        console.error('Error uploading file:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

if (process.env.APP_ENV !== 'production') {
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
}

app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
});
