"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImageToPinata = uploadImageToPinata;
exports.uploadImageAndPinJSON = uploadImageAndPinJSON;
const form_data_1 = __importDefault(require("form-data"));
const fs = __importStar(require("fs"));
const node_fetch_1 = __importDefault(require("node-fetch")); // Ensure this imports node-fetch@2
const logger_1 = __importDefault(require("./logger"));
// Helper function to assert and validate PinataFileResponse type
function assertIsPinataFileResponse(data) {
    if (!data || typeof data.IpfsHash !== 'string') {
        throw new Error(`Invalid PinataFileResponse data: ${JSON.stringify(data)}`);
    }
}
async function uploadImageToPinata(imagePath, pinataApiKey, pinataSecretApiKey) {
    const formData = new form_data_1.default();
    formData.append('file', fs.createReadStream(imagePath));
    try {
        const response = await (0, node_fetch_1.default)('https://api.pinata.cloud/pinning/pinFileToIPFS', {
            method: 'POST',
            headers: {
                'pinata_api_key': pinataApiKey,
                'pinata_secret_api_key': pinataSecretApiKey,
            },
            body: formData,
        });
        if (!response.ok)
            throw new Error(`Error uploading image: ${response.statusText}`);
        const responseData = await response.json();
        assertIsPinataFileResponse(responseData); // Validate the response
        const imageCid = responseData.IpfsHash; // Return just the CID
        logger_1.default.info(`Image uploaded to IPFS with CID: ${imageCid}`);
        return imageCid;
    }
    catch (error) {
        logger_1.default.error(`Error uploading image to IPFS: ${error.message}`);
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
