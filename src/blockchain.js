const CryptoJS = require('crypto-js');

class Block {
    constructor(index, hash, previousHash, timestamp, data) {
        this.index = index;
        this.hash = hash;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.data = data;
    }
}

const genesisBlock = new Block(
    0,
    '84A1AD226F597799C37D8853D16DBDF45BD815B4FAFA961C5BB0D459B9D1AF81',
    null,
    1528540106572,
    "This is the genesis!"
);

let blockchain = [genesisBlock];

const getLatestBlock = () => blockchain[blockchain.length - 1];

const getTimestamp = () => new Date().getTime() / 1000;

const createHash = (index, previousHash, timestamp, data) => {
    CryptoJS.SHA256(index + previousHash + timestamp + data).toString();
}

const createNewBlock = data => {
    const previousBlock = getLatestBlock();
    const newBlockIndex = previousBlock.index + 1;
    const newTimestamp = getTimestamp();
    const newHash = createHash(
        newBlockIndex, 
        previousBlock.hash, 
        newTimestamp, 
        data
    );

    return new Block(
        newBlockIndex,
        newHash,
        previousBlock.hash,
        newTimestamp,
        data
    );
};

