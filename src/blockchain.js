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
    CryptoJS.SHA256(
        index + previousHash + timestamp + JSON.stringify(data)
    ).toString();
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

const getBlockHash = (block) => createHash(block.index, block.previousHash, block.timestamp, block.data);

const isNewBlockValid = (candidateBlock, latestBlock) => {
    if(latestBlock.index + 1 !== candidateBlock.index) {
        console.log(`The candidate block doesn't have a valid index`);
        return false;
    } else if(latestBlock.hash !== candidateBlock.previousHash) {
        console.log(`The previous of the candidate block is not the hash of the latest block`);
        return false;
    } else if(getBlockHash(candidateBlock) !== candidateBlock.hash) {
        console.log(`The hash of this block is invalid`);
        return false;
    }

    return true;
}

const isNewStructureValid = (block) => {
    return (
        typeof block.index === 'number' && 
        typeof block.hash === 'string' &&
        typeof block.previousHash === 'string' &&
        typeof block.timestamp === 'number' &&
        typeof block.date === 'string'
    );
}