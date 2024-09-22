import express from 'express';
import fetch from 'node-fetch';
import FormData from 'form-data';
import bodyParser from 'body-parser';
import {
    clusterApiUrl,
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    sendAndConfirmTransaction, SystemProgram,
    Transaction} from '@solana/web3.js';
import {
    createInitializeMintInstruction,
    createMint,
    createTransferInstruction,
    getOrCreateAssociatedTokenAccount,
    mintTo,  TOKEN_PROGRAM_ID} from '@solana/spl-token';
import 'dotenv/config';
import '@pinata/sdk';
import winston from 'winston';
import {fileURLToPath} from 'url';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

import { findAssociatedTokenPda } from '@metaplex-foundation/mpl-toolbox';
import {createUmi, generateSigner, percentAmount} from '@metaplex-foundation/umi';
import mplTokenMetadata from '@metaplex-foundation/mpl-token-metadata';
const { createV1, TokenStandard } = mplTokenMetadata

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Directory to save uploaded files
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to filename
    }
});

const upload = multer({ storage: storage });
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// TODO: CLEAN IMPORTS @ TURK
// TODO: REFACTOR FUNCTIONS - SO THEY'RE IN ORDER OF USE @ TURK


// Configure logging
const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level}]: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),
    ],
});

// Initialize Express
const app = express();
app.use(bodyParser.json());

// Configure the connection and wallets
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

const expectedUrl = clusterApiUrl('devnet');


if (connection.rpcEndpoint !== expectedUrl) {
    throw new Error('This application only works on the devnet cluster.');
}const payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.SOLANA_PRIVATE_KEY)));

// TODO: FIX THIS CONSTANT @ TURK - IT'S UN-USED.
const treasuryWallet = new PublicKey(process.env.TREASURY_WALLET_PUBLIC_KEY);

const MINT_DECIMALS = 9;

// TODO: RE-IMPLEMENT FEE AMOUNT @ TURK
const FEE_AMOUNT = 0.05 * LAMPORTS_PER_SOL;

async function checkAccountExists(publicKey) {
    try {
        if (!(publicKey instanceof PublicKey)) {
            throw new Error('Invalid publicKey parameter. It should be an instance of PublicKey.');
        }
        const accountInfo = await connection.getAccountInfo(publicKey);
        logger.info(`Account info for ${publicKey.toBase58()}: ${JSON.stringify(accountInfo, null, 2)}`);

        return accountInfo !== null;
    } catch (error) {
        logger.error(`Failed to check account existence for ${publicKey.toBase58()}: ${error.message}`);
        return false;
    }
}
async function preliminaryChecks(userPublicKey) {
    try {
        const devnetUrl = clusterApiUrl('devnet');
        logger.info(`Devnet URL: ${devnetUrl}`);

        // Verify payer keypair
        if (!payer || !payer.publicKey) {
            throw new Error('Payer keypair is not properly initialized.');
        }
        logger.info(`Payer Public Key: ${payer.publicKey.toBase58()}`);

        // Check if payer account exists
        const payerExists = await checkAccountExists(payer.publicKey);
        if (!payerExists) {
            throw new Error('Payer account does not exist.');
        }

        // Check if user account exists
        const userExists = await checkAccountExists(userPublicKey);
        if (!userExists) {
            throw new Error('User account does not exist.');
        }

        // Log payer balance
        const payerBalance = await connection.getBalance(payer.publicKey);
        logger.info(`Payer balance: ${payerBalance}`);

        // Log user balance
        const userBalance = await connection.getBalance(userPublicKey);
        logger.info(`User balance: ${userBalance}`);

        // Create mint
        logger.info(`Creating mint with payer: ${payer.publicKey.toBase58()}`);
        const mint = await createMint(connection, payer, payer.publicKey, payer.publicKey, MINT_DECIMALS);
        logger.info(`Mint created: ${mint.toBase58()}`);

        // Create or get payer token account
        logger.info(`Creating or getting payer token account for mint: ${mint.toBase58()}`);
        const payerTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            payer,
            mint,
            payer.publicKey
        );
        logger.info(`Payer token account address: ${payerTokenAccount.address.toBase58()}`);

        // Create or get user's token account
        logger.info(`Creating or getting user token account for mint: ${mint.toBase58()}`);
        const userTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            payer,
            mint,
            userPublicKey
        );
        logger.info(`User token account address: ${userTokenAccount.address.toBase58()}`);

    } catch (error) {
        logger.error(`Preliminary checks failed: ${error.message}`);
        throw error;
    }
}
// Function to create a new token mint


async function createNewMint(payer, updatedMetadataUri, symbol, name) {
    // Correct SPL Token Program ID
    const SPL_TOKEN_2022_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
    const umi = createUmi(connection);

    try {
        if (!payer || !updatedMetadataUri || !symbol || !name) {
            throw new Error('Missing required parameters: payer, updatedMetadataUri, symbol, or name.');
        }

        console.info(`Creating new mint with symbol: ${symbol}, name: ${name}, and metadata URI: ${updatedMetadataUri}`);

        // Generate a new mint account
        const mintSigner = Keypair.generate();

        // Create transaction for minting the token
        const mintLamports = await connection.getMinimumBalanceForRentExemption(82); // Adjust space as needed
        const mintTransaction = new Transaction().add(
            SystemProgram.createAccount({
                fromPubkey: payer.publicKey,
                newAccountPubkey: mintSigner.publicKey,
                lamports: mintLamports,
                space: 82,
                programId: SPL_TOKEN_2022_PROGRAM_ID,
            }),
            createInitializeMintInstruction(mintSigner.publicKey, 1, payer.publicKey, null)
        );

        // Send and confirm mint transaction
        console.info(`Sending mint transaction...`);
        const mintSignature = await sendAndConfirmTransaction(connection, mintTransaction, [payer, mintSigner], { commitment: 'confirmed' });
        console.info(`Mint transaction confirmed with signature: ${mintSignature}`);

        // Create metadata for the mint
        console.info(`Creating metadata for mint...`);
        await createV1(umi, {
            mint: mintSigner.publicKey,
            authority: payer.publicKey,
            name: name,
            symbol: symbol,
            uri: updatedMetadataUri,
            sellerFeeBasisPoints: 0, // Adjust as needed
            splTokenProgram: SPL_TOKEN_2022_PROGRAM_ID,
            tokenStandard: TokenStandard.Fungible,
        }).sendAndConfirm(umi);

        // Find associated token PDA
        const tokenPDA = await findAssociatedTokenPda(umi, {
            mint: mintSigner.publicKey,
            owner: payer.publicKey,
            tokenProgramId: SPL_TOKEN_2022_PROGRAM_ID,
        });

        // Mint the token
        await mintV1(umi, {
            mint: mintSigner.publicKey,
            token: tokenPDA,
            authority: payer.publicKey,
            amount: 1,
            tokenOwner: payer.publicKey,
            splTokenProgram: SPL_TOKEN_2022_PROGRAM_ID,
            tokenStandard: TokenStandard.Fungible,
        }).sendAndConfirm(umi);

        console.info(`Token successfully minted and metadata attached.`);
        return mintSigner.publicKey;
    } catch (error) {
        console.error(`Error during mint creation: ${error.message}`);
        console.error(`Stack Trace: ${error.stack}`);
        throw error;
    }
}

// async function createNewMint(payer, mint, metadataUri, symbol, name) {
//     try {
//         const metadata: TokenMetadata = {
//             mint: mint.publicKey.toBase58(),
//             name: name,
//             symbol: symbol,
//             uri: metadataUri,
//
//         };
//         logger.info(`Starting mint creation...`);
//         logger.info(`Payer PublicKey: ${payer.publicKey.toBase58()}`);
//         logger.info(`Mint PublicKey: ${mint.publicKey.toBase58()}`);
//
//         // Debugging: Check mint and payer objects
//         logger.info(`Payer Object: ${JSON.stringify(payer)}`);
//         logger.info(`Mint Object: ${JSON.stringify(mint)}`);
//
//         // Get mint length and log
//         const mintLen = getMintLen();
//         logger.info(`Mint Length (Calculated): ${mintLen}`);
//         if (mintLen === undefined) {
//             logger.error(`Mint Length is undefined`);
//         }
//         const totalSpace = mintLen;
//         logger.info(`Total Space Required: ${totalSpace}`);
//
//         // Check metadata length and lamports
//         const metadataLen = TYPE_SIZE + LENGTH_SIZE + (metadata ? pack(metadata).length : 0);
//         logger.info(`Metadata Length: ${metadataLen}`);
//         const mintLamports = await connection.getMinimumBalanceForRentExemption(totalSpace);
//         logger.info(`Mint Lamports Required: ${mintLamports}`);
//
//         // Create transaction
//         const mintTransaction = new Transaction().add(
//             SystemProgram.createAccount({
//                 fromPubkey: payer.publicKey,
//                 newAccountPubkey: mint.publicKey,
//                 lamports: mintLamports,
//                 space: totalSpace,
//                 programId: TOKEN_2022_PROGRAM_ID,
//             }),
//             createInitializeInstruction(
//                 mint.publicKey,
//                 MINT_DECIMALS,
//                 payer.publicKey,
//                 null,
//                 TOKEN_2022_PROGRAM_ID
//             ),
//             createInitializeMintInstruction(mint.publicKey, MINT_DECIMALS, payer.publicKey, null, TOKEN_2022_PROGRAM_ID)
//         );
//
//         logger.info(`Transaction Instructions Prepared:`);
//         mintTransaction.instructions.forEach((instruction, index) => {
//             logger.info(`Instruction ${index}: ${JSON.stringify(instruction)}`);
//         });
//
//         // Send and confirm transaction
//         logger.info(`Sending transaction...`);
//         const mintSignature = await sendAndConfirmTransaction(connection, mintTransaction, [payer, mint], { commitment: 'confirmed' });
//         logger.info(`Transaction Sent. Signature: ${mintSignature}`);
//
//         logger.info(`Waiting for transaction confirmation...`);
//         await connection.confirmTransaction({ signature: mintSignature, strategy: { type: 'finalized' } });
//         logger.info(`Transaction Confirmed.`);
//
//         // Log success
//         logger.info(`Mint created successfully.`);
//         logger.info(`Mint Address: ${mint.publicKey.toBase58()}`);
//
//         return mint.publicKey;
//     } catch (error) {
//         // Log error details
//         logger.error(`Error during mint creation: ${error.message}`);
//         logger.error(`Stack Trace: ${error.stack}`);
//         throw error;  // Optional: re-throw for further handling
//     }
// }

// Mint tokens
async function mintTokens(connection, mint, amount, payer) {
    try {
        logger.info('Payer:', payer.publicKey.toBase58());
        logger.info('Mint:', mint.toBase58());
        logger.info('Amount:', amount);

        if (!payer || !payer.publicKey) {
            throw new Error('Payer is not defined or missing publicKey');
        }

        const payerTokenAccount = await getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey);
        logger.info('Payer Token Account:', payerTokenAccount.address.toBase58());

        await mintTo(
            connection,
            payer,
            mint,
            payerTokenAccount.address,
            payer.publicKey,
            amount * Math.pow(10, MINT_DECIMALS) // Ensure this matches token decimals
        );

        logger.info(`Minted ${amount} tokens to payer token account ${payerTokenAccount.address.toBase58()}`);
        return payerTokenAccount;
    } catch (error) {
        logger.error(`Error in mintTokens: ${error.message}`);
        throw error;
    }
}

async function logTokenAccountDetails(tokenAccount) {
    try {
        const accountInfo = await connection.getParsedAccountInfo(tokenAccount.address);
        if (accountInfo.value) {
            await logAccountInfo(accountInfo.value);
        } else {
            logger.error('Token account info is null or undefined.');
        }
        const balanceInfo = await connection.getTokenAccountBalance(tokenAccount.address);
        if (balanceInfo.value) {
            await logAccountBalance(balanceInfo);
        } else {
            logger.error('Token account balance is null or undefined.');
        }
        logger.info(`Token Account Address: ${tokenAccount.address.toBase58()}`);
    } catch (error) {
        logger.error(`Error logging token account details: ${error.message}`);
    }
}

async function logAccountInfo(accountInfo) {
    if (!accountInfo) {
        logger.error('Account info is null or undefined.');
        return;
    }
    logger.info('Token Account Info:', {
        data: {
            parsed: {
                info: {
                    isNative: accountInfo.data.parsed.info.isNative,
                    mint: accountInfo.data.parsed.info.mint,
                    owner: accountInfo.data.parsed.info.owner,
                    state: accountInfo.data.parsed.info.state,
                    tokenAmount: {
                        amount: accountInfo.data.parsed.info.tokenAmount.amount,
                        decimals: accountInfo.data.parsed.info.tokenAmount.decimals,
                        uiAmount: accountInfo.data.parsed.info.tokenAmount.uiAmount,
                        uiAmountString: accountInfo.data.parsed.info.tokenAmount.uiAmountString
                    }
                }
            },
            program: accountInfo.data.program,
            space: accountInfo.space
        },
        executable: accountInfo.executable,
        lamports: accountInfo.lamports,
        owner: accountInfo.owner,
        rentEpoch: accountInfo.rentEpoch
    });
}


// ---------------------------------------------------------------------------------------------------

// TODO: Re-integrate IPFS Logic - KEEP THIS AS A FUNCTION WITHIN HERE, DO NOT SEPARATE - YET

// helper function to upload image to Pinata



async function uploadImageToPinata(imagePath, pinataApiKey, pinataSecretApiKey) {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(imagePath));

    try {
        const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
            method: 'POST',
            headers: {
                'pinata_api_key': pinataApiKey,
                'pinata_secret_api_key': pinataSecretApiKey,
            },
            body: formData,
        });

        if (!response.ok) throw new Error(`Error uploading image: ${response.statusText}`);

        const responseData = await response.json();
        if (!responseData || !responseData.IpfsHash) throw new Error(`Invalid CID data: ${JSON.stringify(responseData)}`);

        const imageCid = responseData.IpfsHash; // Return just the CID
        logger.info(`Image uploaded to IPFS with CID: ${imageCid}`);
        return imageCid;
    } catch (error) {
        logger.error(`Error uploading image to IPFS: ${error.message}`);
        throw error;
    }
}

async function uploadImageAndPinJSON(imagePath, pinataApiKey, pinataSecretApiKey, bearerToken, name, symbol, description) {
    try {
        logger.info(`Uploading image and JSON to Pinata...`);

        // Upload image and get CID
        const imageCid = await uploadImageToPinata(imagePath, pinataApiKey, pinataSecretApiKey);
        logger.info(`Image CID: ${imageCid}`);

        // Construct the full URL for the image
        const imageUrl = `https://gateway.pinata.cloud/ipfs/${imageCid}`;
        const contractUriJSON = {
            name: name || process.env.METADATA_NAME || 'Default Name',
            symbol: symbol || process.env.METADATA_SYMBOL || 'Default Symbol',
            description: description || 'No Description Provided',
            image: imageUrl, // Correctly formatted CID
            external_url: imageUrl,
            dao: process.env.METADATA_DAO || 'LABS DAO',
            type: "fungible",
        };

        logger.info(`JSON Metadata: ${JSON.stringify(contractUriJSON, null, 2)}`);

        // Upload metadata JSON to Pinata
        const jsonRes = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${bearerToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                pinataOptions: {
                    cidVersion: 1,
                },
                pinataMetadata: {
                    name: "metadata.json",
                },
                pinataContent: contractUriJSON,
            }),
        });

        if (!jsonRes.ok) throw new Error(`Error uploading JSON metadata: ${jsonRes.statusText}`);

        const uriData = await jsonRes.json();
        logger.info(`Metadata uploaded successfully: ${JSON.stringify(uriData, null, 2)}`);

        return uriData.IpfsHash;
    } catch (error) {
        logger.error(`Error uploading image and JSON to Pinata: ${error.message}`);
        throw error;
    }
}

async function logAccountBalance(balanceInfo) {
    if (!balanceInfo || !balanceInfo.value) {
        logger.error('Balance info or value is null or undefined.');
        return;
    }
    logger.info('Token Account Balance:', {
        amount: balanceInfo.value.amount,
        decimals: balanceInfo.value.decimals,
        uiAmount: balanceInfo.value.uiAmount,
        uiAmountString: balanceInfo.value.uiAmountString
    });
}
async function logBalances(payerPublicKey, userPublicKey, mint) {
    try {
        const payerTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            payer,
            mint,
            payerPublicKey
        );
        const userTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            payer,
            mint,
            userPublicKey
        );
        const payerBalance = await connection.getTokenAccountBalance(payerTokenAccount.address);
        const userBalance = await connection.getTokenAccountBalance(userTokenAccount.address);
        logger.info(`Payer's token account balance: ${payerBalance.value.uiAmountString} tokens`);
        logger.info(`User's token account balance: ${userBalance.value.uiAmountString} tokens`);
    } catch (error) {
        logger.error(`Error logging balances: ${error.message}`);
    }
}
// Handle mint and transfer logic
app.post('/api/mint', async (req, res) => {
    try {
        const { ticker, userPublicKey, amount, imageURI } = req.body;

        // Check for required fields
        if (!ticker || !userPublicKey || !amount || !imageURI) {
            return res.status(400).json({ success: false, message: 'Required fields are missing.' });
        }

        // Resolve the image path (assuming imageURI is the CID)
        const imagePath = path.join(__dirname, imageURI);
        logger.info('Received data:', { imagePath, ticker, userPublicKey, amount, imageURI });

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
        await preliminaryChecks(userKey);

        // Create a new mint
        const mint = Keypair.generate(); // Generate a new mint Keypair
        const symbol = ticker.toUpperCase();
        const name = `${symbol} Token`;
        const description = `This is a token for ${symbol} with a total supply of ${amount}.`;

        // Upload image and JSON metadata
        const imageCid = await uploadImageAndPinJSON(
            imagePath,
            process.env.PINATA_API_KEY,
            process.env.PINATA_SECRET_API_KEY,
            process.env.PINATA_BEARER_TOKEN,
            ticker.toUpperCase(),
            ticker.toUpperCase(),
            description
        );

        // Construct updated metadata URI
        const updatedMetadataUri = `https://gateway.pinata.cloud/ipfs/${imageCid}`;
        logger.info(`Updated Token Metadata URI: ${updatedMetadataUri}`);

        // Create new mint on the blockchain
        const mintAddress = await createNewMint(payer, mint, updatedMetadataUri, symbol, name);

        // Mint tokens
        logger.info(`Minting ${amount} tokens to the payer token account.`);
        const payerTokenAccount = await mintTokens(connection, mintAddress, amount, payer);

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
                amount * Math.pow(10, MINT_DECIMALS)
            )
        );

        // Send and confirm transfer transaction
        logger.info('Sending transfer transaction...');
        const signature = await sendAndConfirmTransaction(connection, transferTx, [payer]);
        logger.info(`Transfer confirmed with signature: ${signature}`);

        // Log balances for verification
        await logBalances(payer.publicKey, userKey, mintAddress);

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
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.listen(3001, () => {
    logger.info('Server is running on port 3000');
});
