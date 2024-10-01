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
const router = (0, express_1.Router)();
// Initialize Firebase with service account
(0, app_1.initializeApp)({
    credential: (0, app_1.cert)(serviceAccount),
    storageBucket: "epicentrallabs-93373.appspot.com", // Ensure this environment variable is set
});
const storage = (0, storage_1.getStorage)(); // Get the storage service
const bucket = storage.bucket(); // Get a reference to the storage bucket
console.log('✅ Firebase initialized successfully with service account.');
// Set up multer for file uploads
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// Define the /upload route
router.post('/', upload.single('file'), async (req, res) => {
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
        }
        catch (err) {
            console.error('❌ Error uploading file:', err); // Log error details
            console.log(`💡 Possible reasons for the error: Ensure the Firebase Storage bucket exists and has the correct permissions.`);
            // @ts-ignore
            res.status(500).json({ message: 'Failed to upload file.', error: err.message });
        }
    }
    else {
        console.error('❌ Error: File upload failed! No file found in request.'); // Log if no file was found
        res.status(400).json({ message: 'File upload failed! No file provided.' });
    }
});
// Error handling middleware
router.use((err, req, res, next) => {
    console.error('❌ Error in middleware:', err);
    // Check if the error is a Multer error
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
