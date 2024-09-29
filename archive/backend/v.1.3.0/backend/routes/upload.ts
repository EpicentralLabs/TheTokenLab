// @ts-ignore
import express, { Router, Request, Response } from 'express';
// @ts-ignore
import multer, { FileFilterCallback } from 'multer';
// @ts-ignore
import path from 'path';
// @ts-ignore
import crypto from 'crypto';
// @ts-ignore
import fs from 'fs';

// Create a router instance
const router = Router();

// File upload handling
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'backend', 'uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
            console.log(`Created upload directory: ${uploadPath}`);
        }
        console.log(`Uploading file to: ${uploadPath}`);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const hashedName = crypto.randomBytes(16).toString('hex') + path.extname(file.originalname);
        console.log(`Generated filename: ${hashedName} for original file: ${file.originalname}`);
        cb(null, hashedName);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
        const fileTypes = /jpeg|jpg|png|gif/;
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = fileTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Error: File upload only supports the following filetypes - ' + fileTypes));
    },
});

router.post('/', upload.single('file'), (req: Request, res: Response) => {
    if (req.file) {
        res.status(200).json({
            message: 'File uploaded successfully!',
            filePath: req.file.path,
        });
    } else {
        res.status(400).json({ message: 'File upload failed!' });
    }
});

// Export the router
export default router;
