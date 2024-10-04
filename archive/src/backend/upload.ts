<<<<<<<< HEAD:archive/src/backend/routes/upload.ts
import  { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import * as admin from 'firebase-admin';
import * as serviceAccount from './firebase_account.json';
import 'dotenv/config';
import path from 'path';
// import { Readable } from 'stream';

const router = Router();

initializeApp({
    credential: cert(serviceAccount as admin.ServiceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});
const storage = getStorage();
const bucket = storage.bucket();

console.log('✅ Firebase initialized successfully with service account.');

const upload = multer({
    storage: multer.memoryStorage(),
    // @ts-ignore
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png|gif|pdf/;
        const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimeType = fileTypes.test(file.mimetype);

        if (extName && mimeType) {
            return cb(null, true);
        } else {
            cb(new Error('Error: File type not allowed!' + ' Allowed file types are: jpeg, jpg, png, gif, pdf'));
        }
    },
    limits: { fileSize: 2 * 1024 * 1024 },
});


router.post('/', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
        // @ts-ignore
    const file = req.file;

    if (file) {
        const fileName = `${Date.now()}_${file.originalname}`;
        const fileUpload = bucket.file(fileName);
        console.log(`🚀 Uploading file to Firebase Storage with name: ${fileName}`);

        try {
            const stream = fileUpload.createWriteStream({
                metadata: {
                    contentType: file.mimetype,
                },
            });

            stream.on('open', () => {
                console.log(`✅ Stream opened for uploading: ${fileName}`);
            });

            stream.on('data', (chunk) => {
                console.log(`📦 Writing chunk of size: ${chunk.length} bytes`);
            });

            stream.on('finish', () => {
                console.log(`✅ File upload finished: ${fileName}`);
                const publicUrl = `https://storage.googleapis.com/${process.env.FIREBASE_STORAGE_BUCKET}/${fileName}`;

                res.status(200).json({
                    message: `✅ File uploaded successfully: ${file.originalname}`,
                    publicUrl: publicUrl,
                });
            });

            stream.on('error', (err) => {
                console.error('❌ Error uploading file:', err);
                res.status(500).json({
                    message: 'Failed to upload file.',
                    error: err.message,
                });
            });

            console.log(`🔄 Starting upload for: ${file.originalname}`);
            stream.end(file.buffer);
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
========
import express, { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import * as admin from 'firebase-admin';
import * as serviceAccount from './firebase_account.json';
import 'dotenv/config';
import path from 'path';
import { Readable } from 'stream';

const router = Router();

initializeApp({
    credential: cert(serviceAccount as admin.ServiceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});
const storage = getStorage();
const bucket = storage.bucket();

console.log('✅ Firebase initialized successfully with service account.');

const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png|gif|pdf/;
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


router.post('/', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
    const file = req.file;

    if (file) {
        const fileName = `${Date.now()}_${file.originalname}`;
        const fileUpload = bucket.file(fileName);
        console.log(`🚀 Uploading file to Firebase Storage with name: ${fileName}`);

        try {
            const stream = fileUpload.createWriteStream({
                metadata: {
                    contentType: file.mimetype,
                },
            });

            stream.on('open', () => {
                console.log(`✅ Stream opened for uploading: ${fileName}`);
            });

            stream.on('data', (chunk) => {
                console.log(`📦 Writing chunk of size: ${chunk.length} bytes`);
            });

            stream.on('finish', () => {
                console.log(`✅ File upload finished: ${fileName}`);
                const publicUrl = `https://storage.googleapis.com/${process.env.FIREBASE_STORAGE_BUCKET}/${fileName}`;

                res.status(200).json({
                    message: `✅ File uploaded successfully: ${file.originalname}`,
                    publicUrl: publicUrl,
                });
            });

            stream.on('error', (err) => {
                console.error('❌ Error uploading file:', err);
                res.status(500).json({
                    message: 'Failed to upload file.',
                    error: err.message,
                });
            });

            console.log(`🔄 Starting upload for: ${file.originalname}`);
            stream.end(file.buffer);
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
>>>>>>>> 70c071f4d7c7acc7b60a275d6af3e606a535fc94:archive/src/backend/upload.ts
