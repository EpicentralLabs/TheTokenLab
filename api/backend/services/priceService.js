"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchPrices = void 0;
// priceService.ts
const node_fetch_1 = __importDefault(require("node-fetch"));
const API_KEY = '4d9a32c538a44ddd8fb7ad6d14aadec5';
const SOL_ADDRESS = 'So11111111111111111111111111111111111111112';
const LABS_ADDRESS = 'LABSh5DTebUcUbEoLzXKCiXFJLecDFiDWiBGUU1GpxR';
const fetchPrices = async () => {
    console.log('🌐 Starting price fetch process...');
    try {
        console.log('🚀 Fetching SOL price...');
        const solResponse = await (0, node_fetch_1.default)(`https://public-api.birdeye.so/defi/price?address=${SOL_ADDRESS}`, {
            method: 'GET',
            headers: {
                'X-API-KEY': API_KEY,
            },
        });
        console.log('🚀 Fetching LABS price...');
        const labsResponse = await (0, node_fetch_1.default)(`https://public-api.birdeye.so/defi/price?address=${LABS_ADDRESS}`, {
            method: 'GET',
            headers: {
                'X-API-KEY': API_KEY,
            },
        });
        console.log('🔄 Checking response statuses...');
        if (!solResponse.ok) {
            console.error('❌ Failed to fetch SOL price');
            throw new Error('Failed to fetch SOL price');
        }
        if (!labsResponse.ok) {
            console.error('❌ Failed to fetch LABS price');
            throw new Error('Failed to fetch LABS price');
        }
        console.log('✅ Successfully fetched prices. Parsing data...');
        const solData = await solResponse.json();
        const labsData = await labsResponse.json();
        console.log(`🌞 SOL Price: ${solData.data.value}`);
        console.log(`🧪 LABS Price: ${labsData.data.value}`);
        return {
            solPrice: solData.data.value,
            labsPrice: labsData.data.value,
        };
    }
    catch (error) {
        console.error('🔥 Error fetching prices:', error);
        throw new Error('Failed to fetch prices');
    }
};
exports.fetchPrices = fetchPrices;
