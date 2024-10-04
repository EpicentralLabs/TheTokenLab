import FormData from 'form-data';
import fetch from 'node-fetch'; // Ensure this imports node-fetch@2
import logger from '../libs/tools/logger';

// Define interfaces for the responses from Pinata
interface PinataFileResponse {
    IpfsHash: string; // Required property for the uploaded image's CID
}

interface PinataJSONResponse {
    IpfsHash: string; // Required property for the uploaded JSON metadata's CID
}

/**
 * Helper function to assert and validate PinataFileResponse type.
 *
 * @param {any} data - The data to be validated.
 * @throws {Error} Throws an error if the data does not conform to PinataFileResponse.
 */function assertIsPinataFileResponse(data: any): asserts data is PinataFileResponse {
    if (!data || typeof data.IpfsHash !== 'string') {
        throw new Error(`Invalid PinataFileResponse data: ${JSON.stringify(data)}`);
    }
}
/**
 * Uploads an image to Pinata and returns its IPFS CID.
 *
 * @param {string} imageUrl - The URL of the image to upload.
 * @param {string} pinataApiKey - The API key for Pinata.
 * @param {string} pinataSecretApiKey - The secret API key for Pinata.
 * @returns {Promise<string>} A promise that resolves to the IPFS CID of the uploaded image.
 * @throws {Error} Throws an error if the upload process fails.
 */
export async function uploadImageToPinata(imageUrl: string, pinataApiKey: string, pinataSecretApiKey: string): Promise<string> {
    const formData = new FormData();

    try {
        // Fetch the image from Firebase Storage using its public URL
        const imageResponse = await fetch(imageUrl);

        if (!imageResponse.ok) throw new Error(`Error fetching image: ${imageResponse.statusText}`);

        // Append the fetched image to form data
        formData.append('file', imageResponse.body, { filename: 'image.png' }); // You can adjust the filename if needed

        // Upload the image to Pinata
        const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
            method: 'POST',
            headers: {
                'pinata_api_key': pinataApiKey,
                'pinata_secret_api_key': pinataSecretApiKey,
            },
            body: formData,
        });

        if (!pinataResponse.ok) throw new Error(`Error uploading image to Pinata: ${pinataResponse.statusText}`);

        const pinataData = await pinataResponse.json();
        assertIsPinataFileResponse(pinataData); // Validate the response

        const imageCid = pinataData.IpfsHash; // Return the CID of the uploaded image
        logger.info(`Image uploaded to IPFS with CID: ${imageCid}`);
        return imageCid;
    } catch (error) {
        logger.error(`Error uploading image to Pinata: ${(error as Error).message}`);
        throw error;
    }
}

/**
 * Helper function to assert and validate PinataJSONResponse type.
 *
 * @param {any} data - The data to be validated.
 * @throws {Error} Throws an error if the data does not conform to PinataJSONResponse.
 */
function assertIsPinataJSONResponse(data: any): asserts data is PinataJSONResponse {
    if (!data || typeof data.IpfsHash !== 'string') {
        throw new Error(`Invalid PinataJSONResponse data: ${JSON.stringify(data)}`);
    }
}
/**
 * Uploads an image and corresponding JSON metadata to Pinata, returning the JSON's IPFS CID.
 *
 * @param {string} imagePath - The path or URL of the image to upload.
 * @param {string} pinataApiKey - The API key for Pinata.
 * @param {string} pinataSecretApiKey - The secret API key for Pinata.
 * @param {string} bearerToken - The bearer token for authentication.
 * @param {string} [name] - Optional name for the metadata.
 * @param {string} [symbol] - Optional symbol for the metadata.
 * @param {string} [description] - Optional description for the metadata.
 * @returns {Promise<string>} A promise that resolves to the IPFS CID of the uploaded JSON metadata.
 * @throws {Error} Throws an error if the upload process fails.
 */
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
            image: imageUrl,
            external_url: imageUrl,
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
        assertIsPinataJSONResponse(uriData); // Validate the response

        logger.info(`Metadata uploaded successfully: ${JSON.stringify(uriData, null, 2)}`);

        return uriData.IpfsHash; // Return the CID from the response
    } catch (error) {
        logger.error(`Error uploading image and JSON to Pinata: ${(error as Error).message}`);
        throw error;
    }
}