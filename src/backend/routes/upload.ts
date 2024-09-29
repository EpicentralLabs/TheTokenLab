// @ts-ignore
import express, { Router, Request, Response } from 'express';
// @ts-ignore
import multer, { FileFilterCallback } from 'multer';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as path from 'path';

const router = Router();

// File upload handling
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '..', '..', 'uploads');

        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
            console.log(`📁 Created upload directory: ${uploadPath}`);
        }
        console.log(`📤 Uploading file to: ${uploadPath}`);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const hashedName = crypto.randomBytes(16).toString('hex') + path.extname(file.originalname);
        console.log(`📝 Generated filename: ${hashedName} for original file: ${file.originalname}`);
        cb(null, hashedName);
    }
});


const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
        const fileTypes = /jpeg|jpg|png|gif|webp/;
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = fileTypes.test(file.mimetype);

        if (mimetype && extname) {
            console.log(`✅ File accepted: ${file.originalname}`);
            return cb(null, true);
        }
        console.error(`❌ Error: File upload only supports the following file types: ${fileTypes}`);
        cb(new Error('Error: File upload only supports the following filetypes - ' + fileTypes));
    },
});

// Define the /upload route
// @ts-ignore
router.post('/', upload.single('file'), (req: Request, res: Response) => {
    if (req.file) {
        console.log(`✅ File uploaded successfully: ${req.file.originalname}`);
        return res.status(200).json({
            message: 'File uploaded successfully!',
            path: `/uploads/${req.file.filename}`,
        });
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
