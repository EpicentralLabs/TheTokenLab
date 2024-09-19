import fs from 'fs';
import path from 'path';

async function uploadImage(Moralis, imagePath) {
  console.log('Starting image upload process...');

  // Log the image path and read operation
  console.log(`Image Path: ${imagePath}`);

  try {
    // Read the image file and encode it in base64
    const fileContent = fs.readFileSync(imagePath, { encoding: 'base64' });
    console.log('Image file read successfully, encoding in base64...');

    const uploadArray = [
      {
        path: path.basename(imagePath),
        content: fileContent,
      },
    ];

    console.log('Preparing to upload image to IPFS...', uploadArray);

    // Perform the upload to IPFS
    const response = await Moralis.EvmApi.ipfs.uploadFolder({
      abi: uploadArray,
    });

    console.log('IPFS upload response:', response);

    if (response.result && response.result.length > 0) {
      const imageURL = response.result[0].path;
      console.log('Image uploaded successfully. Image URL:', imageURL);
      return imageURL;
    } else {
      console.error('Failed to upload image to IPFS. Response:', response);
      throw new Error('Failed to upload image to IPFS');
    }
  } catch (error) {
    // Log any errors that occur during the process
    console.error('Error during image upload:', error);
    throw error;  // Re-throw the error after logging it
  }
}

export default uploadImage;
