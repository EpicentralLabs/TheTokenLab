// @ts-ignore
import express, { Request, Response, NextFunction } from 'express';
import * as bodyParser from 'body-parser';
import { Cluster, clusterApiUrl, Connection } from '@solana/web3.js';
import 'dotenv/config';
import { fileURLToPath } from 'url';
// @ts-ignore
import multer, { FileFilterCallback } from 'multer';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as path from 'path';
import cors from 'cors';
import mintRoutes from './routes/mint';
import uploadRoutes from './routes/upload';

const app = express();

const network: Cluster = 'devnet';
const connection: Connection = new Connection(clusterApiUrl(network), 'confirmed');
const expectedUrl: string = clusterApiUrl(network);
console.log(`Connected to: ${expectedUrl}`);

app.use(express.json());
app.use(bodyParser.json());

if (process.env.APP_ENV === 'production' && connection.rpcEndpoint.includes('devnet')) {
    throw new Error('This application is set to production but is connected to the devnet cluster.');
}
if (connection.rpcEndpoint !== expectedUrl) {
    throw new Error(`Unexpected RPC endpoint: Expected ${expectedUrl}, but got ${connection.rpcEndpoint}.`);
}

const port: number = Number(process.env.REACT_APP_BACKEND_PORT) || 3001;
console.log(`Backend is running on port ${port}`);

const allowedOrigin: string = `http://${process.env.REACT_APP_PUBLIC_URL}:${process.env.REACT_APP_FRONTEND_PORT}`;
app.use(cors({
    origin: allowedOrigin,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.options('*', cors());


app.use('/api/mint', mintRoutes);
app.use('/upload', uploadRoutes);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});