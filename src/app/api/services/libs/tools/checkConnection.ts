import { clusterApiUrl, Connection } from "@solana/web3.js";

const rpcEndpoint = process.env.CUSTOM_RPC_ENDPOINT;
const connection = new Connection(rpcEndpoint || clusterApiUrl('devnet'), 'confirmed');

/**
 * Checks the connection to the Solana network.
 *
 * @returns {Promise<Connection>} A promise that resolves to the Connection object if successful.
 *
 * @throws {Error} Throws an error if the connection check fails.
 */
export async function checkConnection(): Promise<Connection> {
    try {
        // Attempt to get the version of the connected Solana cluster
        const version = await connection.getVersion();
        console.log("Connected to Solana Devnet, version:", version);
    } catch (error) {
        console.error("Failed to connect to Devnet:", error);
        throw error; // Rethrow the error for handling elsewhere
    }
    return connection; // Return the connection object
}

/**
 * Gets the initialized connection to the Solana network.
 *
 * @returns {Connection} The initialized Connection object.
 */
export function getConnection(): Connection {
    return connection; // Return the initialized connection object
}

export { connection };