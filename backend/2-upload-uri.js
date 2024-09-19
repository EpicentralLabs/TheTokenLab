import fs from 'fs';
import path from 'path';

async function uploadURI(Moralis, uriFilePath) {
  console.log('Starting URI upload process...');

  // Log the URI file path
  console.log(`URI File Path: ${uriFilePath}`);

  try {
    // Read the JSON file and encode it in base64
    console.log('Reading URI file and encoding in base64...');
    const content = fs.readFileSync(uriFilePath, { encoding: 'base64' });
    console.log('File read successfully and content encoded.');

    // Prepare the upload array
    const uploadArray = [
      {
        path: path.basename(uriFilePath),
        content: content,  // Send the base64-encoded content
      },
    ];

    console.log('Preparing to upload URI to IPFS...', uploadArray);

    // Perform the upload to IPFS
    const response = await Moralis.EvmApi.ipfs.uploadFolder({
      abi: uploadArray,
    });

    console.log('IPFS upload response:', response);

    if (response.result && response.result.length > 0) {
      const uriLink = response.result[0].path;
      console.log('URI uploaded successfully. URI Link:', uriLink);
      return uriLink;
    } else {
      console.error('Failed to upload URI to IPFS. Response:', response);
      throw new Error('Failed to upload URI to IPFS');
    }
  } catch (error) {
    // Log any errors that occur during the process
    console.error('Error during URI upload:', error);
    throw error;  // Re-throw the error after logging it
  }
}

export default uploadURI;
