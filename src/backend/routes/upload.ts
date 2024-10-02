import express, { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import * as admin from 'firebase-admin';
import * as serviceAccount from './firebase_account.json';
import 'dotenv/config';
import path from 'path';

const router = Router();

// Initialize Firebase with service account
initializeApp({
    credential: cert(serviceAccount as admin.ServiceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET, // Ensure this environment variable is set
});
const storage = getStorage();
const bucket = storage.bucket();

console.log('✅ Firebase initialized successfully with service account.');

// Set up multer for file uploads with validation
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png|gif|pdf/; // Allowed file types
        const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimeType = fileTypes.test(file.mimetype);

        if (extName && mimeType) {
            return cb(null, true);
        } else {
            cb(new Error('Error: File type not allowed!'));
        }
    },
    limits: { fileSize: 2 * 1024 * 1024 },
});

// Define the /upload route
router.post('/', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
    const file = req.file;

    if (file) {
        const fileName = `${Date.now()}_${file.originalname}`;
        const fileUpload = bucket.file(fileName);

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
            const errorMessage = (err as Error).message;
            console.error('❌ Error uploading file:', errorMessage);
            res.status(500).json({ message: 'Failed to upload file.', error: errorMessage });
        }
    } else {
        console.error('❌ Error: File upload failed! No file found in request.');
        res.status(400).json({ message: 'File upload failed! No file provided.' });
    }
});

// Error handling middleware
router.use((err: any, req: Request, res: Response, next: NextFunction): void => {
    console.error('❌ Error in middleware:', err);
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
