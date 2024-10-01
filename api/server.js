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
const mint_1 = __importDefault(require("./backend/routes/mint"));
const upload_1 = __importDefault(require("./backend/routes/upload"));
// Create an instance of the Express app
const app = (0, express_1.default)();
// Connect to Solana
const network = 'devnet';
const rpcEndpoint = process.env.CUSTOM_RPC_ENDPOINT || (0, web3_js_1.clusterApiUrl)(network);
const connection = new web3_js_1.Connection(rpcEndpoint, 'confirmed');
console.log(`🔗 Connected to Solana RPC at: ${rpcEndpoint}`);
// Middleware
app.use(express_1.default.json());
app.use(bodyParser.json());
app.use((0, cors_1.default)());
// Backend Port Configuration
const port = Number(process.env.REACT_APP_BACKEND_PORT) || 3001;
console.log(`Backend is running on port ${port}`);
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Routes
app.use('/api/mint', mint_1.default);
app.use('/api/upload', upload_1.default);
app.use((err, req, res, next) => {
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
exports.default = app;
