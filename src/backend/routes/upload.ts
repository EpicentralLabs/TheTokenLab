import express, { Router, Request, Response } from 'express';
import multer from 'multer';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes } from 'firebase/storage'; // Import necessary functions
import 'dotenv/config';

const router = Router();

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app); // Get the storage service

const upload = multer({ storage: multer.memoryStorage() });

// Define the /upload route
// @ts-ignore
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
    const file = req.file;
    if (file) {
        const fileName = `${Date.now()}_${file.originalname}`; // Create a unique filename
        const storageRef = ref(storage, fileName); // Create a reference to the file location

        try {
            // Upload the file to Firebase Storage
            await uploadBytes(storageRef, file.buffer, {
                contentType: file.mimetype,
            });

            const publicUrl = `https://storage.googleapis.com/${process.env.FIREBASE_STORAGE_BUCKET}/${fileName}`;
            console.log(`✅ File uploaded successfully: ${file.originalname}`);
            return res.status(200).json({
                message: 'File uploaded successfully!',
                path: publicUrl,
            });
        } catch (err) {
            console.error('❌ Error uploading file:', err);
            return res.status(500).json({ message: 'Failed to upload file.' });
        }
    } else {
        console.error('❌ Error: File upload failed!');
        return res.status(400).json({ message: 'File upload failed!' });
    }
});

// Error handling middleware
// @ts-ignore
router.use((err: any, req: Request, res: Response, next: any) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: err.message });
    }
    next(err);
});

export default router;
