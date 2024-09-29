import FormData from 'form-data';
import fs from 'fs';
import fetch from 'node-fetch';
import logger from './logger';

// Define an interface for the response data from Pinata
interface PinataResponse {
    IpfsHash?: string; // Optional property for the uploaded image's CID
}

export async function uploadImageToPinata(imagePath: string, pinataApiKey: string, pinataSecretApiKey: string): Promise<string> {
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

        const responseData: PinataResponse = await response.json(); // Cast response to PinataResponse
        if (!responseData || !responseData.IpfsHash) throw new Error(`Invalid CID data: ${JSON.stringify(responseData)}`);

        const imageCid = responseData.IpfsHash; // Return just the CID
        logger.info(`Image uploaded to IPFS with CID: ${imageCid}`);
        return imageCid;
    } catch (error) {
        logger.error(`Error uploading image to IPFS: ${error.message}`);
        throw error;
    }
}

export async function uploadImageAndPinJSON(
    imagePath: string,
    pinataApiKey: string,
    pinataSecretApiKey: string,
    bearerToken: string,
    name?: string,
    symbol?: string,
    description?: string
): Promise<string> {
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
            type: 'fungible',
        };

        logger.info(`JSON Metadata: ${JSON.stringify(contractUriJSON, null, 2)}`);

        // Upload metadata JSON to Pinata
        const jsonRes = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
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

        if (!jsonRes.ok) throw new Error(`Error uploading JSON metadata: ${jsonRes.statusText}`);

        const uriData = await jsonRes.json();
        logger.info(`Metadata uploaded successfully: ${JSON.stringify(uriData, null, 2)}`);

        return uriData.IpfsHash; // Ensure this property is defined in the response structure
    } catch (error) {
        logger.error(`Error uploading image and JSON to Pinata: ${error.message}`);
        throw error;
    }
}
