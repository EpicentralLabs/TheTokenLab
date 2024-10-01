import express, { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import * as admin from 'firebase-admin';
import * as serviceAccount from './firebase_account.json';
import 'dotenv/config';

const router = Router();

// Initialize Firebase with service account
initializeApp({
    credential: cert(serviceAccount as admin.ServiceAccount),
    storageBucket: "epicentrallabs-93373.appspot.com", // Ensure this environment variable is set
});
const storage = getStorage(); // Get the storage service
const bucket = storage.bucket(); // Get a reference to the storage bucket

console.log('✅ Firebase initialized successfully with service account.');

// Set up multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Define the /upload route
router.post('/', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
    const file = req.file;

    if (file) {
        const fileName = `${Date.now()}_${file.originalname}`; // Create a unique filename
        const fileUpload = bucket.file(fileName); // Create a reference to the file location in the bucket

        console.log(`🚀 Uploading file to Firebase Storage with name: ${fileName}`);

        try {
            // Upload the file to Firebase Storage
            await fileUpload.save(file.buffer, {
                metadata: { contentType: file.mimetype },
            });

            const publicUrl = `https://storage.googleapis.com/${process.env.FIREBASE_STORAGE_BUCKET}/${fileName}`;
            console.log(`✅ File uploaded successfully: ${file.originalname}`);
            console.log(`📄 Public URL for uploaded file: ${publicUrl}`);
            res.status(200).json({
                message: 'File uploaded successfully!',
                path: publicUrl,
            });
        } catch (err) {
            console.error('❌ Error uploading file:', err); // Log error details
            console.log(`💡 Possible reasons for the error: Ensure the Firebase Storage bucket exists and has the correct permissions.`);
            // @ts-ignore
            res.status(500).json({ message: 'Failed to upload file.', error: err.message });
        }
    } else {
        console.error('❌ Error: File upload failed! No file found in request.'); // Log if no file was found
        res.status(400).json({ message: 'File upload failed! No file provided.' });
    }
});

// Error handling middleware
router.use((err: any, req: Request, res: Response, next: NextFunction): void => {
    console.error('❌ Error in middleware:', err);

    // Check if the error is a Multer error
    if (err instanceof multer.MulterError) {
        console.error('🔴 Multer error details:', err);
        res.status(400).json({ message: err.message });
    } else {
        console.error('🔴 General error details:', err);
        res.status(500).json({
            success: false,
            message: err.message || 'Internal Server Error',
        });
    }
});

export default router;
