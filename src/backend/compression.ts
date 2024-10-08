import express, { Request, Response, Router } from 'express';
import { Connection, clusterApiUrl, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { mintCompressedToken } from './createCompressedTokenMint';
import {chargeMintingFee} from "./mintingFee";
import {fetchPrices} from "./priceService";
import {AuthorityType, getMint, setAuthority} from "@solana/spl-token";
const router: Router = express.Router();

interface CompressedMintBody {
    userPublicKey: string;
    quantity: number;
    mintChecked: boolean;
    decimals: string;
    paymentType: string;
}

const validateRequiredFields = (reqBody: CompressedMintBody) => {
    const missingFields: (keyof CompressedMintBody)[] = [];
    const requiredFields: (keyof CompressedMintBody)[] = ['quantity', 'mintChecked', 'decimals', 'paymentType'];

    for (const field of requiredFields) {
        if (reqBody[field] === undefined || reqBody[field] === null) {
            missingFields.push(field);
        }
    }
    return missingFields;
};
const handleErrorResponse = (res: Response, error: Error, defaultMessage: string) => {
    console.error('❌ Error:', error.message);
    return res.status(500).json({ error: defaultMessage });
};
function isBuffer(data: any): data is Buffer {
    return Buffer.isBuffer(data);
}
async function logCurrentAuthorities(connection: Connection, tokenMintAccount: PublicKey) {
    const mintAccountInfo = await connection.getParsedAccountInfo(tokenMintAccount);

    if (!mintAccountInfo.value) {
        console.error('❌ Error: Failed to fetch mint account information.');
        return;
    }

    const { data } = mintAccountInfo.value;
    // Check if data is a Buffer or ParsedAccountData
    if (isBuffer(data)) {
        console.error('❌ Error: Received Buffer instead of ParsedAccountData.');
        return;
    }
}



// Define the /api/compress endpoint
// @ts-ignore
router.post('/', async (req: Request<{}, {}, CompressedMintBody>, res: Response) => {


    const {
        userPublicKey,
        quantity,
        mintChecked,
        decimals,
        paymentType,
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
        parsedDecimals = decimals ? parseInt(decimals) : 0
        if (isNaN(parsedDecimals) || parsedDecimals < 0 || parsedDecimals > 9) {
            console.error('❌ Validation Error: Invalid decimals. Must be a non-negative integer and <= 9.');
            return res.status(400).json({message: 'Invalid decimals. Must be a non-negative integer and <= 9.'});
        }
        console.log('✅ Decimals validated:', parsedDecimals);



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
            const labsPerUnit = labsPrice / 10 ** 9; // LABS uses 9 decimal places
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


        let tokenMintAccount: PublicKey;
        let result: any;

        try {
            result = await mintCompressedToken(parsedDecimals, quantity, userPublicKeyInstance);
            console.log('✅ Tokens minted:', quantity, 'Decimals:', parsedDecimals);

            const {tokenMint, userTokenAccount} = result;

            if (mintChecked) {
                console.log('🔄 Starting process to set MintTokens authority...');
                try {
                    // Set the mint authority
                    await setAuthority(
                        connection,
                        payer,
                        tokenMint,
                        payer.publicKey,
                        AuthorityType.MintTokens,
                        null
                    );
                    console.log('✅ Successfully set MintTokens authority.');
                } catch (error) {
                    console.error('❌ Error setting MintTokens authority:', (error as Error).message || error);
                    return handleErrorResponse(res, error as Error, 'Failed to set MintTokens authority');
                }
            } else {
                console.log('ℹ️ mintChecked is false, skipping minting authority process.');
            }

            // Log current authorities
            await logCurrentAuthorities(connection, tokenMint);

            // Successful response with token information
            return res.status(200).json({
                message: `✅ Tokens minted successfully.`,
                explorerLink: `https://explorer.solana.com/tx/${result.tokenMint}?cluster=devnet`,
                mintAddress: result.tokenMint,
                tokenAccount: result.userTokenAccount,
            });
        } catch (error) {
            console.error('❌ Error: Failed to mint tokens.', (error as Error).message || error);
            return handleErrorResponse(res, error as Error, 'Failed to mint tokens');
        }

    } catch (error) {
        return handleErrorResponse(res, error as Error, 'Internal Server Error');
    }
});
export default router;

