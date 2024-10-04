<<<<<<<< HEAD:archive/src/backend/services/priceService.ts
// priceService.ts
import fetch from 'node-fetch';

const API_KEY = '4d9a32c538a44ddd8fb7ad6d14aadec5';
const SOL_ADDRESS = 'So11111111111111111111111111111111111111112';
const LABS_ADDRESS = 'LABSh5DTebUcUbEoLzXKCiXFJLecDFiDWiBGUU1GpxR';

export const fetchPrices = async () => {
    console.log('🌐 Starting price fetch process...');

    try {
        console.log('🚀 Fetching SOL price...');
        const solResponse = await fetch(`https://public-api.birdeye.so/defi/price?address=${SOL_ADDRESS}`, {
            method: 'GET',
            headers: {
                'X-API-KEY': API_KEY,
            },
        });

        console.log('🚀 Fetching LABS price...');
        const labsResponse = await fetch(`https://public-api.birdeye.so/defi/price?address=${LABS_ADDRESS}`, {
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

        const solData: any = await solResponse.json();
        const labsData: any = await labsResponse.json();

        console.log(`🌞 SOL Price: ${solData.data.value}`);
        console.log(`🧪 LABS Price: ${labsData.data.value}`);

        return {
            solPrice: solData.data.value,
            labsPrice: labsData.data.value,
        };
    } catch (error) {
        console.error('🔥 Error fetching prices:', error);
        throw new Error('Failed to fetch prices');
    }
};
========
// priceService.ts
import fetch from 'node-fetch';

const API_KEY = '4d9a32c538a44ddd8fb7ad6d14aadec5';
const SOL_ADDRESS = 'So11111111111111111111111111111111111111112';
const LABS_ADDRESS = 'LABSh5DTebUcUbEoLzXKCiXFJLecDFiDWiBGUU1GpxR';

export const fetchPrices = async () => {
    console.log('🌐 Starting price fetch process...');

    try {
        console.log('🚀 Fetching SOL price...');
        const solResponse = await fetch(`https://public-api.birdeye.so/defi/price?address=${SOL_ADDRESS}`, {
            method: 'GET',
            headers: {
                'X-API-KEY': API_KEY,
            },
        });

        console.log('🚀 Fetching LABS price...');
        const labsResponse = await fetch(`https://public-api.birdeye.so/defi/price?address=${LABS_ADDRESS}`, {
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
    } catch (error) {
        console.error('🔥 Error fetching prices:', error);
        throw new Error('Failed to fetch prices');
    }
};
>>>>>>>> 70c071f4d7c7acc7b60a275d6af3e606a535fc94:archive/src/backend/priceService.ts
