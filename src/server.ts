// Import necessary modules
import express, { Request, Response, NextFunction } from 'express';
import * as bodyParser from 'body-parser';
import { Cluster, clusterApiUrl, Connection } from '@solana/web3.js';
import 'dotenv/config';
import * as path from 'path';
import cors from 'cors';
import mintRoutes from './backend/routes/mint';
import uploadRoutes from './backend/routes/upload';
import compressionRoutes from './backend/routes/compression';

// Create an instance of the Express app
const app = express();

// Connect to Solana
const network: Cluster = 'devnet';
const rpcEndpoint = process.env.CUSTOM_RPC_ENDPOINT || clusterApiUrl(network);
const connection = new Connection(rpcEndpoint, 'confirmed');

console.log(`🔗 Connected to Solana RPC at: ${rpcEndpoint}`);

// Middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(cors());

// Backend Port Configuration
const port: number = Number(process.env.REACT_APP_BACKEND_PORT) || 3001;
console.log(`Backend is running on port ${port}`);


app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Routes
app.use('/api/mint', mintRoutes);
app.use('/api/upload', uploadRoutes);
app.use('api/compress-mint', compressionRoutes);
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
});


if (process.env.REACT_APP_APP_ENV === 'development') {
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
}
export default app;

