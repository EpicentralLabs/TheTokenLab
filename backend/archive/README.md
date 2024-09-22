This is like automated version of previous repos. They are a bit unorganized, I apologize. automate_minting is essentially the metadata part please ignore the name. And Server runs the autoamte_minting file. If you have any questions let me know.

# Manually doing it:

## Steps to Mint Token and ATA using Solana CLI

### This is the part we need to automate using Solana Web3JS

1. Airdrop yourself some devnet SOL
2. 'spl-token create-token'
   3. If you're running WSL you need to compile the rust binarys on your system.
   4. ```curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y```
      5. You should see ' Rust is installed now. Great!'
   6. run ```. "$HOME/.cargo/env"```
   7. Run  ```rustc --version```
8. Run ```solana-keygen new -o ~/keypairs/token-lab-keypair.json```
9. Run ```solana-keygen new -o ~/.config/solana/id.json```
10. Run `solana config set -ud`
11. Run `solana airdrop 10`
12. Run ```solana-keygen grind --start s-with a:1```
13. 
```
3. 'spl-token create-account [Token Mint Address]'
4. 'spl-token mint [Token Mint Address] [Quantity]'
5. 'spl-token accounts' to check that everything worked. 

## Steps to Upload Metadata to an EXISTING TOKEN
BE SURE TO MINT A TOKEN ADDRESS FIRST AND MAKE SURE IT HAS AN ASSOCIATED ACCOUNT. THIS IS ONLY FOR METADATA.

MAKE SURE YOU ARE IN THE 'token-lab-metadata-upload' DIRECTORY WHEN TRYING THIS! (This repo)

### Install dependancies manually or it wont work:
npm install -D tsx
npm install ts-node typescript @types/node
npm install tsx@4.16.5 
npm install esm 
npm install @solana-developers/helpers 
npm install moralis@latest 
npm install @solana/web3.js 
npm install @metaplex-foundation/mpl-token-metadata 
npm install @metaplex-foundation/mpl-token-metadata@2 
npm install -g ts-node
npm install

1. Make sure you have a wallet keypair set in a /keypairs folder (hidden in .gitignore)
2. In terminal: solana config set -k [Your PubKey]
4. In terminal: solana config set -ud (This sets ur environment to the devnet)
5. Put an image in the 'token-image' folder. 
6. 'cd ipfs_uploads'

STEPS BELOW MAKE SURE YOU ARE IN 'ipfs_uploads' DIRECTORY

7. Go to '1_upload_image.js' file (an API key is already provided, internal team use only).
    * Add the appropriate file paths (read the comments)
    * run the script 'node 1-upload-image.js'
    * a link will then be provided in the terminal.
8. Go to 'uri.json' input the information you need. INCLUDING the image IPFS link.
    * Add the appropriate file paths (read the comments)
    * run the script 'node 2-upload-uri.js'
    * a link will then be provided in the terminal. (This is your uri ipfs link)

FOR STEPS BELOW MAKE SURE YOU ARE IN 'token-lab-metadata-upload' DIRECTORY

9. Go to 'update_token_metadata.ts'
10. Input the Token Name, Symbol (again) and the URI link.
11. run the script 'npx tsx src/update_token_metadata.ts'
