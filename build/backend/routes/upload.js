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
// @ts-ignore
const express_1 = require("express");
// @ts-ignore
const multer_1 = __importDefault(require("multer"));
const fs = __importStar(require("fs"));
const crypto = __importStar(require("crypto"));
const path = __importStar(require("path"));
const router = (0, express_1.Router)();
// File upload handling
const storage = multer_1.default.diskStorage({
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
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
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
router.post('/', upload.single('file'), (req, res) => {
    if (req.file) {
        console.log(`✅ File uploaded successfully: ${req.file.originalname}`);
        return res.status(200).json({
            message: 'File uploaded successfully!',
            path: `/uploads/${req.file.filename}`,
        });
    }
    else {
        console.error('❌ Error: File upload failed!');
        return res.status(400).json({ message: 'File upload failed!' });
    }
});
// Error handling middleware
// @ts-ignore
router.use((err, req, res, next) => {
    if (err instanceof multer_1.default.MulterError) {
        return res.status(400).json({ message: err.message });
    }
    next(err);
});
exports.default = router;
