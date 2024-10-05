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
// Import necessary modules
const express_1 = __importDefault(require("express"));
const bodyParser = __importStar(require("body-parser"));
const web3_js_1 = require("@solana/web3.js");
require("dotenv/config");
const cors_1 = __importDefault(require("cors"));
const mint_1 = __importDefault(require("./mint"));
const upload_1 = __importDefault(require("./upload"));
const compression_1 = __importDefault(require("./compression"));
const os = __importStar(require("os"));
const stream_1 = require("stream");
const ipinfo_express_1 = __importDefault(require("ipinfo-express"));
const app = (0, express_1.default)();
// Connect to Solana
const network = 'devnet';
const rpcEndpoint = process.env.CUSTOM_RPC_ENDPOINT || (0, web3_js_1.clusterApiUrl)(network);
const connection = new web3_js_1.Connection(rpcEndpoint, 'confirmed');
console.log(`🔗 Connected to Solana RPC at: ${rpcEndpoint}`);
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(bodyParser.json());
app.use((0, ipinfo_express_1.default)({
    token: process.env.IP_INFO_API_KEY,
    cache: null,
    timeout: 5000,
    ipSelector: undefined
}));
app.set('trust proxy', true);
const port = Number(process.env.REACT_APP_BACKEND_PORT) || 3001;
console.log(`Backend is running on port ${port}`);
const logStream = new stream_1.Writable({
    write(chunk, encoding, callback) {
        console.log(chunk.toString());
        callback();
    }
});
// Logging middleware
app.use((err, req, res, next) => {
    console.error('🔴 Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: 'Internal Server Error',
    });
});
const logRequest = (req, res, next) => {
    const logMessage = `📥 ${req.method} request to ${req.url} from IP: ${req.ip}`;
    logStream.write(logMessage);
    next();
};
// Use logging middleware
app.use(logRequest);
// Routes
app.use('/api/mint', mint_1.default);
app.use('/api/upload', upload_1.default);
app.use('/api/compress-mint', compression_1.default);
// Health check route
app.get('/api/health', async (req, res) => {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    let pingLatency = 0;
    // Measure ping latency
    const start = Date.now();
    try {
        await fetch('https://google.com', { method: 'HEAD' });
        pingLatency = Date.now() - start;
    }
    catch (error) {
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
app.get('/api/logs', (req, res) => {
    if (process.env.REACT_APP_APP_ENV === 'production') {
        return res.status(403).json({ message: 'Log streaming is not available in production.' });
    }
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    const sendLog = (logMessage) => {
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
exports.default = app;
