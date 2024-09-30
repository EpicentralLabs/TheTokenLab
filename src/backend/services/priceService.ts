// priceService.ts
import fetch from 'node-fetch';

const API_KEY = '4d9a32c538a44ddd8fb7ad6d14aadec5';
const SOL_ADDRESS = 'So11111111111111111111111111111111111111112';
const LABS_ADDRESS = 'LABSh5DTebUcUbEoLzXKCiXFJLecDFiDWiBGUU1GpxR';

export const fetchPrices = async () => {
    try {
        const solResponse = await fetch(`https://public-api.birdeye.so/defi/price?address=${SOL_ADDRESS}`, {
            method: 'GET',
            headers: {
                'X-API-KEY': API_KEY,
            },
        });

        const labsResponse = await fetch(`https://public-api.birdeye.so/defi/price?address=${LABS_ADDRESS}`, {
            method: 'GET',
            headers: {
                'X-API-KEY': API_KEY,
            },
        });

        // Check if responses are OK
        if (!solResponse.ok) {
            throw new Error('Failed to fetch SOL price');
        }
        if (!labsResponse.ok) {
            throw new Error('Failed to fetch LABS price');
        }

        const solData = await solResponse.json();
        const labsData = await labsResponse.json();

        return {
            solPrice: solData.data.value,
            labsPrice: labsData.data.value,
        };
    } catch (error) {
        console.error('Error fetching prices:', error);
        throw new Error('Failed to fetch prices');
    }
};
