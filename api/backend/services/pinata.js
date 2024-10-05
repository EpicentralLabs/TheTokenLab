"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImageToPinata = uploadImageToPinata;
exports.uploadImageAndPinJSON = uploadImageAndPinJSON;
const form_data_1 = __importDefault(require("form-data"));
const node_fetch_1 = __importDefault(require("node-fetch")); // Ensure this imports node-fetch@2
const logger_1 = __importDefault(require("./logger"));
// Helper function to assert and validate PinataFileResponse type
function assertIsPinataFileResponse(data) {
    if (!data || typeof data.IpfsHash !== 'string') {
        throw new Error(`Invalid PinataFileResponse data: ${JSON.stringify(data)}`);
    }
}
async function uploadImageToPinata(imageUrl, pinataApiKey, pinataSecretApiKey) {
    const formData = new form_data_1.default();
    try {
        // Fetch the image from Firebase Storage using its public URL
        const imageResponse = await (0, node_fetch_1.default)(imageUrl);
        if (!imageResponse.ok)
            throw new Error(`Error fetching image: ${imageResponse.statusText}`);
        // Append the fetched image to form data
        formData.append('file', imageResponse.body, { filename: 'image.png' }); // You can adjust the filename if needed
        // Upload the image to Pinata
        const pinataResponse = await (0, node_fetch_1.default)('https://api.pinata.cloud/pinning/pinFileToIPFS', {
            method: 'POST',
            headers: {
                'pinata_api_key': pinataApiKey,
                'pinata_secret_api_key': pinataSecretApiKey,
            },
            body: formData,
        });
        if (!pinataResponse.ok)
            throw new Error(`Error uploading image to Pinata: ${pinataResponse.statusText}`);
        const pinataData = await pinataResponse.json();
        assertIsPinataFileResponse(pinataData); // Validate the response
        const imageCid = pinataData.IpfsHash; // Return the CID of the uploaded image
        logger_1.default.info(`Image uploaded to IPFS with CID: ${imageCid}`);
        return imageCid;
    }
    catch (error) {
        logger_1.default.error(`Error uploading image to Pinata: ${error.message}`);
        throw error;
    }
}
// Helper function to assert and validate PinataJSONResponse type
function assertIsPinataJSONResponse(data) {
    if (!data || typeof data.IpfsHash !== 'string') {
        throw new Error(`Invalid PinataJSONResponse data: ${JSON.stringify(data)}`);
    }
}
async function uploadImageAndPinJSON(imagePath, pinataApiKey, pinataSecretApiKey, bearerToken, name, symbol, description) {
    try {
        logger_1.default.info(`Uploading image and JSON to Pinata...`);
        // Upload image and get CID
        const imageCid = await uploadImageToPinata(imagePath, pinataApiKey, pinataSecretApiKey);
        logger_1.default.info(`Image CID: ${imageCid}`);
        // Construct the full URL for the image
        const imageUrl = `https://gateway.pinata.cloud/ipfs/${imageCid}`;
        const contractUriJSON = {
            name: name || process.env.METADATA_NAME || 'Default Name',
            symbol: symbol || process.env.METADATA_SYMBOL || 'Default Symbol',
            description: description || 'No Description Provided',
            image: imageUrl,
            external_url: imageUrl,
        };
        logger_1.default.info(`JSON Metadata: ${JSON.stringify(contractUriJSON, null, 2)}`);
        // Upload metadata JSON to Pinata
        const jsonRes = await (0, node_fetch_1.default)('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${bearerToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                pinataOptions: {
                    cidVersion: 1,
                },
                pinataMetadata: {
                    name: 'metadata.json',
                },
                pinataContent: contractUriJSON,
            }),
        });
        if (!jsonRes.ok)
            throw new Error(`Error uploading JSON metadata: ${jsonRes.statusText}`);
        const uriData = await jsonRes.json();
        assertIsPinataJSONResponse(uriData); // Validate the response
        logger_1.default.info(`Metadata uploaded successfully: ${JSON.stringify(uriData, null, 2)}`);
        return uriData.IpfsHash; // Return the CID from the response
    }
    catch (error) {
        logger_1.default.error(`Error uploading image and JSON to Pinata: ${error.message}`);
        throw error;
    }
}
