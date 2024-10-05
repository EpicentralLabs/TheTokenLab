"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const app_1 = require("firebase-admin/app");
const storage_1 = require("firebase-admin/storage");
const serviceAccount = __importStar(require("./firebase_account.json"));
require("dotenv/config");
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
(0, app_1.initializeApp)({
    credential: (0, app_1.cert)(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});
const storage = (0, storage_1.getStorage)();
const bucket = storage.bucket();
console.log('✅ Firebase initialized successfully with service account.');
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png|gif|pdf/;
        const extName = fileTypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const mimeType = fileTypes.test(file.mimetype);
        if (extName && mimeType) {
            return cb(null, true);
        }
        else {
            cb(new Error('Error: File type not allowed!'));
        }
    },
    limits: { fileSize: 2 * 1024 * 1024 },
});
router.post('/', upload.single('file'), async (req, res) => {
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
        }
        catch (err) {
            const errorMessage = err.message;
            console.error('❌ Error uploading file:', errorMessage);
            res.status(500).json({ message: 'Failed to upload file.', error: errorMessage });
        }
    }
    else {
        console.error('❌ Error: File upload failed! No file found in request.');
        res.status(400).json({ message: 'File upload failed! No file provided.' });
    }
});
// Error handling middleware
router.use((err, req, res, next) => {
    console.error('❌ Error in middleware:', err);
    if (err instanceof multer_1.default.MulterError) {
        console.error('🔴 Multer error details:', err);
        res.status(400).json({ message: err.message });
    }
    else {
        console.error('🔴 General error details:', err);
        res.status(500).json({
            success: false,
            message: err.message || 'Internal Server Error',
        });
    }
});
exports.default = router;
