// Import necessary modules
import express, { Request, Response, NextFunction } from 'express';
import * as bodyParser from 'body-parser';
import { Cluster, clusterApiUrl, Connection } from '@solana/web3.js';
import 'dotenv/config';
import cors from 'cors';
import mintRoutes from './backend/routes/mint';
import uploadRoutes from './backend/routes/upload';
import compressionRoutes from './backend/routes/compression';
import * as os from 'os';
import { Writable } from 'stream';
import logger from './backend/services/security';
import ipinfo from "ipinfo-express";

const app = express();

// Connect to Solana
const network: Cluster = 'devnet';
const rpcEndpoint = process.env.CUSTOM_RPC_ENDPOINT || clusterApiUrl(network);
const connection = new Connection(rpcEndpoint, 'confirmed');

console.log(`🔗 Connected to Solana RPC at: ${rpcEndpoint}`);

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(ipinfo({
    token: process.env.IP_INFO_API_KEY,
    cache: null,
    timeout: 5000,
    ipSelector: undefined
}));
app.set('trust proxy', true);

const port: number = Number(process.env.REACT_APP_BACKEND_PORT) || 3001;
console.log(`Backend is running on port ${port}`);

const logStream = new Writable({
    write(chunk: Buffer | string, encoding: string, callback: (error?: Error | null) => void) {
        console.log(chunk.toString());
        callback();
    }
});

// Logging middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('🔴 Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: 'Internal Server Error',
    });
});

const logRequest = (req: Request, res: Response, next: NextFunction) => {
    const logMessage = `📥 ${req.method} request to ${req.url} from IP: ${req.ip}`;
    logStream.write(logMessage);
    next();
};

// Use logging middleware
app.use(logRequest);

// Routes
app.use('/api/mint', mintRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/compress-mint', compressionRoutes);

// Health check route
app.get('/api/health', async (req: Request, res: Response) => {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    let pingLatency = 0;

    // Measure ping latency
    const start = Date.now();
    try {
        await fetch('https://google.com', { method: 'HEAD' });
        pingLatency = Date.now() - start;
    } catch (error) {
        pingLatency = -1;
    }

    const healthMetrics = {
        status: 'OK',
        uptime: uptime,
        memoryUsage: {
            rss: memoryUsage.rss,
            heapTotal: memoryUsage.heapTotal,
            heapUsed: memoryUsage.heapUsed,
            external: memoryUsage.external,
        },
        ping: {
            latency: pingLatency,
            unit: 'ms',
        },
        hostname: os.hostname(),
        timestamp: new Date().toISOString(),
    };

    res.status(200).json(healthMetrics);
});

if (process.env.REACT_APP_APP_ENV === 'development') {
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
}

// @ts-ignore
app.get('/api/logs', (req: Request, res: Response) => {
    if (process.env.REACT_APP_APP_ENV === 'production') {
        return res.status(403).json({ message: 'Log streaming is not available in production.' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendLog = (logMessage: string) => {
        res.write(`data: ${logMessage}\n\n`);
    };

    const interval = setInterval(() => {
        sendLog('📦 Log message at ' + new Date().toISOString());
    }, 2000);

    res.on('close', () => {
        clearInterval(interval);
        res.end();
    });
});

export default app;
