"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const web3_js_1 = require("@solana/web3.js");
const createTokenMint_1 = require("./createTokenMint");
const mintingFee_1 = require("./mintingFee");
const priceService_1 = require("./priceService");
const spl_token_1 = require("@solana/spl-token");
const router = express_1.default.Router();
const validateRequiredFields = (reqBody) => {
    const missingFields = [];
    const requiredFields = ['quantity', 'mintChecked', 'decimals', 'paymentType'];
    for (const field of requiredFields) {
        if (reqBody[field] === undefined || reqBody[field] === null) {
            missingFields.push(field);
        }
    }
    return missingFields;
};
const handleErrorResponse = (res, error, defaultMessage) => {
    console.error('❌ Error:', error.message);
    return res.status(500).json({ error: defaultMessage });
};
function isBuffer(data) {
    return Buffer.isBuffer(data);
}
async function logCurrentAuthorities(connection, tokenMintAccount) {
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
    // Now we know data is of type ParsedAccountData
    console.log('Current Mint Authority:', data.parsed.info.mintAuthority);
    console.log('Current Freeze Authority:', data.parsed.info.freezeAuthority);
    console.log('Current Owner:', data.parsed.info.owner);
}
// Define the /api/mint endpoint
// @ts-ignore
router.post('/', async (req, res) => {
    const { userPublicKey, quantity, mintChecked, decimals, paymentType, } = req.body;
    console.log('ℹ️ Request received:', req.body);
    let userPublicKeyInstance;
    let parsedDecimals;
    let fullPath;
    let payer;
    let totalCharged;
    const rpcEndpoint = process.env.CUSTOM_RPC_ENDPOINT;
    const connection = new web3_js_1.Connection(rpcEndpoint || (0, web3_js_1.clusterApiUrl)('devnet'), 'confirmed');
    console.log(`🔗 Connected to Solana RPC at: ${rpcEndpoint || (0, web3_js_1.clusterApiUrl)('devnet')}`);
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
            return res.status(400).json({ success: false, message: 'Invalid payment type. Must be SOL or LABS.' });
        }
        console.log('✅ Payment type validated.');
        // 3. Validate user public key
        try {
            userPublicKeyInstance = new web3_js_1.PublicKey(userPublicKey);
            console.log('✅ User public key validated:', userPublicKey);
        }
        catch {
            console.error('❌ Validation Error: Invalid user public key.');
            return res.status(400).json({ message: 'Invalid user public key.' });
        }
        // 4. Validate decimals
        parsedDecimals = decimals ? parseInt(decimals) : 0;
        if (isNaN(parsedDecimals) || parsedDecimals < 0 || parsedDecimals > 9) {
            console.error('❌ Validation Error: Invalid decimals. Must be a non-negative integer and <= 9.');
            return res.status(400).json({ message: 'Invalid decimals. Must be a non-negative integer and <= 9.' });
        }
        console.log('✅ Decimals validated:', parsedDecimals);
        // 6. Initialize payer keypair
        const privateKey = process.env.SOLANA_PRIVATE_KEY;
        if (!privateKey) {
            console.error('❌ Missing SOLANA_PRIVATE_KEY environment variable');
            return res.status(500).json({ error: 'Missing SOLANA_PRIVATE_KEY' });
        }
        let secretKeyArray;
        try {
            secretKeyArray = JSON.parse(privateKey);
            payer = web3_js_1.Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));
            console.log('✅ Payer keypair initialized.');
        }
        catch (err) {
            console.error('❌ Error: Failed to initialize payer keypair.', err.message || err);
            return handleErrorResponse(res, err, 'Failed to initialize payer keypair.');
        }
        // TODO: TURK - FIGURE OUT WHY THE FUCK WE'RE REQUESTING, > 10055 SOL FOR MINTING
        const SOL_FEE = parseFloat(process.env.MINTING_FEE_SOL || '0.05'); // Default to 0.05 if not set
        const LABS_FEE = parseInt(process.env.MINTING_FEE_LABS || '5000'); // Default to 5000 if not set
        try {
            const { solPrice, labsPrice } = await (0, priceService_1.fetchPrices)();
            const mintingFee = paymentType === 'SOL'
                ? SOL_FEE
                : LABS_FEE;
            totalCharged = await (0, mintingFee_1.chargeMintingFee)(connection, payer, userPublicKeyInstance, paymentType, mintingFee);
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
        }
        catch (error) {
            console.error('❌ Error: Failed to charge minting fee:', error.message || error);
            return handleErrorResponse(res, error, 'Failed to charge minting fee.');
        }
        let userTokenAccount;
        let tokenMintAccount;
        let result;
        try {
            result = await (0, createTokenMint_1.mintToken)(parsedDecimals, quantity, userPublicKeyInstance);
            tokenMintAccount = result.tokenMint;
            userTokenAccount = result.userTokenAccount;
            console.log('✅ Tokens minted:', quantity, 'Decimals:', parsedDecimals);
        }
        catch (error) {
            console.error('❌ Error: Failed to mint tokens:', error.message || error);
            return handleErrorResponse(res, error, 'Failed to mint tokens.');
        }
        let transactionLink;
        try {
            const actionsPerformed = [];
            if (mintChecked) {
                console.log('🔄 Starting process to set MintTokens authority...');
                try {
                    await (0, spl_token_1.setAuthority)(connection, payer, tokenMintAccount, payer.publicKey, spl_token_1.AuthorityType.MintTokens, null);
                    actionsPerformed.push('Minting');
                    console.log('✅ Successfully set MintTokens authority.');
                }
                catch (error) {
                    console.error('❌ Error setting MintTokens authority:', error.message || error);
                    return handleErrorResponse(res, error, 'Failed to set MintTokens authority');
                }
            }
            else {
                console.log('ℹ️ mintChecked is false, skipping minting process.');
            }
            await logCurrentAuthorities(connection, tokenMintAccount);
            //      // Handle Freeze Authority, set it to null if checked
            //      if (freezeChecked) {
            //          console.log('🔄 Starting process to set freezeAccount (freeze) authority...');
            //          try {
            //              const mintInfo = await getMint(connection, tokenMintAccount);
            //              console.log("Current Mint Authority:", mintInfo.mintAuthority);
            //              console.log("Current Freeze Authority:", mintInfo.freezeAuthority);
            //              await setAuthority(
            //                 connection,
            //                 payer,
            //                 tokenMintAccount,
            //                 payer.publicKey,
            //                 AuthorityType.FreezeAccount,
            //                 null
            //             );
            //             actionsPerformed.push('Freeze authority');
            //             console.log('✅ Successfully set FreezeAccount Authority (Freeze) authority to null.');
            //          } catch (error) {
            //              console.error('❌ Error setting FreezeAccount authority:', (error as Error).message || error);
            //              return handleErrorResponse(res, error as Error, 'Failed to set FreezeAccount authority');
            // }
            //      } else {
            //          console.log('ℹ️ freezeChecked is false, skipping mint authority process.');
            //      }
            //
            //
            //
            //
            // If we reach here, all actions were successful
            return res.status(200).json({
                message: `✅ Successfully completed: ${actionsPerformed.join(', ')}.`,
                explorerLink: transactionLink,
                mintAddress: tokenMintAccount.toString(),
                tokenAccount: userTokenAccount?.toString(),
                metadataUploadOutput: `Metadata created at: ${transactionLink}`,
                totalCharged: totalCharged
            });
        }
        catch (error) {
            const errorMessage = error.message || String(error);
            const errorMapping = {
                'mint': 'Failed to set mint authority.',
                'freeze': 'Failed to set freeze authority.',
                'AccountOwner': 'Failed to set immutable authority.',
            };
            const errorKey = Object.keys(errorMapping).find(key => errorMessage.includes(key));
            if (errorKey) {
                console.error(`❌ Error: ${errorMapping[errorKey]}:`, errorMessage);
                return handleErrorResponse(res, error, errorMapping[errorKey]);
            }
            console.error('❌ Unexpected Error:', errorMessage);
            return handleErrorResponse(res, error, 'Internal Server Error');
        }
        finally {
            // Clean up HERE
        }
    }
    catch (error) {
        return handleErrorResponse(res, error, 'Internal Server Error');
    }
});
exports.default = router;
