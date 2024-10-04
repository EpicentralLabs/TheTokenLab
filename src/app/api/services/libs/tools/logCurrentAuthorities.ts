import {Connection, PublicKey} from "@solana/web3.js";


function isBuffer(data: any): data is Buffer {
    return Buffer.isBuffer(data);
}
export async function logCurrentAuthorities(connection: Connection, tokenMintAccount: PublicKey) {
    const mintAccountInfo = await connection.getParsedAccountInfo(tokenMintAccount);

    if (!mintAccountInfo.value) {
        console.error('❌ Error: Failed to fetch mint account information.');
        return;
    }

    const { data } = mintAccountInfo.value;

    // Check if data is a Buffer or ParsedAccountData
    if (isBuffer(data)) {
        console.error('❌ Error: Received Buffer instead of ParsedAccountData.');
        return;
    }

    // Now we know data is of type ParsedAccountData
    console.log('Current Mint Authority:', data.parsed.info.mintAuthority);
    console.log('Current Freeze Authority:', data.parsed.info.freezeAuthority);
    console.log('Current Owner:', data.parsed.info.owner);
}
