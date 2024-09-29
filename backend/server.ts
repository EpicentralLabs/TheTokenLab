import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { clusterApiUrl, Connection } from '@solana/web3.js';
import 'dotenv/config';
import { fileURLToPath } from 'url';
import path from 'path';
import multer, { FileFilterCallback } from 'multer';
import fs from 'fs';
import crypto from 'crypto';
import cors from 'cors';
import mintRoutes from './routes/mint'; // Import your mint routes
import uploadRoutes from './routes/upload'; // Import your upload routes

// Create an express application
const app = express();

// Define network and connection
const network: string = process.env.APP_ENV === 'production' ? 'mainnet-beta' : 'devnet';
const connection: Connection = new Connection(clusterApiUrl(network), 'confirmed');
const expectedUrl: string = clusterApiUrl(network);
console.log(`Connected to: ${expectedUrl}`);

// Middleware for JSON body parsing
app.use(express.json());
app.use(bodyParser.json());

// Environment checks
if (process.env.APP_ENV === 'production' && connection.rpcEndpoint.includes('devnet')) {
    throw new Error('This application is set to production but is connected to the devnet cluster.');
}
if (connection.rpcEndpoint !== expectedUrl) {
    throw new Error(`Unexpected RPC endpoint: Expected ${expectedUrl}, but got ${connection.rpcEndpoint}.`);
}

// Set up the server port
const port: number = Number(process.env.REACT_APP_BACKEND_PORT) || 3001;
console.log(`Backend is running on port ${port}`);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// CORS configuration
const allowedOrigin: string = 'http://localhost:3000';
app.use(cors({
    origin: allowedOrigin,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.options('*', cors());

// File upload handling
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'uploads');
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
        fileSize: 5 * 1024 * 1024, // Limit files to 5 MB
    },
    fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
        const fileTypes = /jpeg|jpg|png|gif/; // Allowed file types
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = fileTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Error: File upload only supports the following filetypes - ' + fileTypes));
    },
});

// Define your routes here
app.use('/api/mint', mintRoutes); // Use the mint routes
app.use('/upload', uploadRoutes); // Use the upload routes

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
