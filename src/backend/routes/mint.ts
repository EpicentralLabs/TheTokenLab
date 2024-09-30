import express, { Request, Response, Router } from 'express';
import { Connection, clusterApiUrl, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';
import { mintToken } from '../services/createTokenMint';
import { createMetadata } from '../services/createTokenMetadata';
import { uploadImageToPinata, uploadImageAndPinJSON } from "../services/pinata";
import {chargeMintingFee} from "../services/mintingFee";
import {fetchPrices} from "../services/priceService";
import {AuthorityType, setAuthority} from "@solana/spl-token";
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

    console.log('ℹ️ Request received:', req.body);

    let userPublicKeyInstance: PublicKey;
    let parsedDecimals: number;
    let fullPath: string;
    let payer: Keypair;

    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

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
        if (!paymentType) missingFields.push('paymentType');
        if (!imagePath) missingFields.push('imagePath');

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
            return res.status(500).json({message: 'Failed to initialize payer keypair.'});
        }


        //  TODO: TURK - FIGURE OUT WHY THE FUCK WE'RE REQUESTING, > 10055 SOL FOR MINTING
        // try {
        //     const { solPrice, labsPrice } = await fetchPrices();
        //     const mintingFee = paymentType === 'SOL' ? 0.01 * solPrice * 10 ** 9 : 100;
        //     await chargeMintingFee(connection, payer, userPublicKeyInstance, paymentType, mintingFee);
        //
        //     console.log(`✅ Minting fee charged successfully.\n` +
        //         `-----------------------------------------\n` +
        //         `Minting Fee: ${mintingFee} ${paymentType === 'SOL' ? 'LAMPORTS (SOL)' : 'LABS'}\n` +
        //         `Current SOL Price: ${solPrice} USD\n` +
        //         `Current LABS Price: ${labsPrice} USD\n` +
        //         `-----------------------------------------`);
        // } catch (error) {
        //     console.error('❌ Error: Failed to charge minting fee:', (error as Error).message || error);
        //     return res.status(500).json({ message: 'Failed to charge minting fee.' });
        // }

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

        let userTokenAccount: PublicKey;
        let tokenMintAccount: PublicKey;
        let result: any;
        try {
            result = await mintToken(parsedDecimals, quantity, userPublicKeyInstance);
            tokenMintAccount = result.tokenMint;
            userTokenAccount = result.userTokenAccount;
            console.log('✅ Tokens minted:', quantity, 'Decimals:', parsedDecimals);
        } catch (error) {
            console.error('❌ Error: Failed to mint tokens:', (error as Error).message || error);
            return res.status(500).json({error: 'Failed to mint tokens'});
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


        } catch (error) {
            console.error('❌ Error during minting or metadata creation:', (error as Error).message || error);
            return res.status(500).json({error: 'Failed to mint tokens or create metadata.'});
        }
try {
    if (mintChecked) {
        console.log('🔄 Starting process to set MintTokens authority...');
        await setAuthority(
            connection,
            payer,
            tokenMintAccount,
            payer.publicKey,
            AuthorityType.MintTokens,
            userPublicKeyInstance
        );
        console.log(`✅ Successfully minted ${quantity} tokens with ${parsedDecimals} decimals.`);

        return res.status(200).json({
            message: `✅ Minted ${quantity} tokens with ${parsedDecimals} decimals and metadata created successfully.`,
            explorerLink: transactionLink,
            mintAddress: tokenMintAccount.toString(),
            tokenAccount: userTokenAccount.toString(),
            metadataUploadOutput: `Metadata created at: ${transactionLink}`,
        });
    } else {
        console.log('ℹ️ mintChecked is false, skipping minting process.');
    }

    if (freezeChecked) {
        console.log('🔄 Starting process to set FreezeAccount authority...');
        await setAuthority(
            connection,
            payer,
            tokenMintAccount,
            payer.publicKey,
            AuthorityType.FreezeAccount,
            userPublicKeyInstance
        );
        console.log('✅ Successfully set freeze authority.');
    } else {
        console.log('ℹ️ freezeChecked is false, skipping freeze authority process.');
    }

    if (immutableChecked) {
        console.log('🔄 Starting process to set AccountOwner (Immutable) authority...');
        await setAuthority(
            connection,
            payer,
            tokenMintAccount,
            payer.publicKey,
            AuthorityType.AccountOwner,
            userPublicKeyInstance
        );
        console.log('✅ Successfully set account owner authority (immutable).');
    } else {
        console.log('ℹ️ immutableChecked is false, skipping immutable process.');
    }

} catch (error) {
    const errorMessage = (error as Error).message || error;

    // @ts-ignore
    if (errorMessage.includes('mint')) {
        console.error('❌ Error: Failed to set mint authority:', errorMessage);
        return res.status(500).json({ error: 'Failed to set mint authority.' });
    } else { // @ts-ignore
        if (errorMessage.includes('freeze')) {
                console.error('❌ Error: Failed to set freeze authority:', errorMessage);
                return res.status(500).json({ error: 'Failed to set freeze authority.' });
            } else { // @ts-ignore
            if (errorMessage.includes('AccountOwner')) {
                            console.error('❌ Error: Failed to set immutable (AccountOwner) authority:', errorMessage);
                            return res.status(500).json({ error: 'Failed to set immutable authority.' });
                        } else {
                            console.error('❌ Unexpected Error:', errorMessage);
                            return res.status(500).json({ error: 'Internal Server Error' });
                        }
        }
    }
}   } catch (error) {
    console.error('❌ Error:', (error as Error).message || error);
    return res.status(500).json({error: 'Internal Server Error'});
    }
});

export default router;

