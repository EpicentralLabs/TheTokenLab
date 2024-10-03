import { Keypair } from "@solana/web3.js";

// Generate a new keypair
const keypair = Keypair.generate();

console.log(`The public key is:`, keypair.publicKey.toBase58());
console.log(`The secret key is:`, keypair.secretKey);