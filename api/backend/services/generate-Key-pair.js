"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
// Generate a new keypair
const keypair = web3_js_1.Keypair.generate();
console.log(`The public key is:`, keypair.publicKey.toBase58());
console.log(`The secret key is:`, keypair.secretKey);
