import * as admin from 'firebase-admin';
import * as serviceAccount from "@/app/api/services/libs/firebase_account.json";
import { getStorage } from "firebase-admin/storage";
import { initializeApp } from "firebase-admin";
import { cert } from "firebase-admin/app";

// Initialize Firebase Admin
initializeApp({
    credential: cert(serviceAccount as admin.ServiceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

const storage = getStorage();
const bucket = storage.bucket();

/**
 * Uploads a file to Firebase Storage.
 *
 * @param {File} file - The file to be uploaded.
 * @returns {Promise<{ publicUrl: string }>} - A promise that resolves with the public URL of the uploaded file.
 * @throws {Error} - Throws an error if the upload fails.
 */
export async function uploadToFirebase(file: File) {
    const fileName = `${Date.now()}_${file.name}`;
    const fileUpload = bucket.file(fileName);
    console.log(`🚀 Uploading file to Firebase Storage with name: ${fileName}`);

    return new Promise<{ publicUrl: string }>(async (resolve, reject) => {
        const stream = fileUpload.createWriteStream({
            metadata: {
                contentType: file.type,
            },
        });

        stream.on('error', (error) => {
            console.error('❌ Error uploading file:', error);
            reject(new Error('Error uploading file.'));
        });

        stream.on('finish', () => {
            const publicUrl = `https://storage.googleapis.com/${process.env.FIREBASE_STORAGE_BUCKET}/${fileName}`;
            console.log(`✅ File upload finished: ${fileName}`);
            resolve({ publicUrl });
        });

        stream.end(Buffer.from(await file.arrayBuffer()));
    });
}
