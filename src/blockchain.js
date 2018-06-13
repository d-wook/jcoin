const CryptoJS = require("crypto-js");
const hexToBinary = require("hex-to-binary");

const BLOCK_GENERATION_INTERVAL = 10;
const DIFFICULTY_ADJESTMENT_INTERVAL = 10;

class Block {
    constructor(index, hash, previousHash, timestamp, data, difficulty, nonce) {
        this.index = index;
        this.hash = hash;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.data = data;
        this.difficulty = difficulty;
        this.nonce = nonce;
    }
}

const genesisBlock = new Block(
    0,
    '84A1AD226F597799C37D8853D16DBDF45BD815B4FAFA961C5BB0D459B9D1AF81',
    null,
    1528887083,
    "This is the genesis!",
    0,
    0
);

let blockchain = [genesisBlock];

const getLatestBlock = () => blockchain[blockchain.length - 1];

const getTimestamp = () => Math.round(new Date().getTime() / 1000);

const getBlockChain = () => blockchain;

const createHash = (index, previousHash, timestamp, data, difficulty, nonce) => {
    return CryptoJS.SHA256(index + previousHash + timestamp + 
                            JSON.stringify(data) + difficulty + nonce).toString();
}

const createNewBlock = data => {
    const previousBlock = getLatestBlock();
    const newBlockIndex = previousBlock.index + 1;
    const newTimestamp = getTimestamp();
    const difficulty = findDifficulty(getBlockChain());
    const newBlock = findBlock(
        newBlockIndex,
        previousBlock.hash,
        newTimestamp,
        data,
        difficulty
    );

    addBlockToChain(newBlock);
    require('./p2p').broadcastNewBlock();
    return newBlock;
};

const findDifficulty = () => {
    const latestBlock = getLatestBlock();
    if(latestBlock.index % DIFFICULTY_ADJESTMENT_INTERVAL === 0
        && latestBlock.index !== 0) {
        // calculate new difficulty
        return calculateNewDifficulty(latestBlock, getBlockChain());
    } else {
        return latestBlock.difficulty;
    }
}

const calculateNewDifficulty = (latestBlock, blockchain) => {
    const lastCalculatedBlock = 
        blockchain[blockchain.length - DIFFICULTY_ADJESTMENT_INTERVAL];
    const timeExpected = 
        BLOCK_GENERATION_INTERVAL * DIFFICULTY_ADJESTMENT_INTERVAL;
    const timeTaken = latestBlock.timestamp - lastCalculatedBlock.timestamp;

    if(timeTaken < timeExpected / 2) {
        return lastCalculatedBlock.difficulty + 1;
    } else if(timeTaken > timeExpected * 2){
        return lastCalculatedBlock.difficulty - 1;
    } else {
        return lastCalculatedBlock.difficulty;
    }
}

const findBlock = (index, previousHash, timestamp, data, difficulty) => {
    let nonce = 0;
    while(true) {
        const hash = createHash(
            index, 
            previousHash,
            timestamp,
            data,
            difficulty,
            nonce
        );
        
        // to do: check amount of zeros (hash matches difficulty)
        if(hashMatchesDifficulty(hash, difficulty)) {
            console.log("nonce", nonce);
            return new Block(index, hash, previousHash, timestamp, data, difficulty, nonce);
        }
        nonce++;
    }
}

const hashMatchesDifficulty = (hash, difficulty) => {
    const hashInBinary = hexToBinary(hash);
    const requiredZeros = "0".repeat(difficulty);
    console.log('Trying difficulty: ', difficulty, "with hash: ", hashInBinary);
    return hashInBinary.startsWith(requiredZeros);
}

const getBlockHash = (block) => 
    createHash(
        block.index, 
        block.previousHash, 
        block.timestamp, 
        block.data,
        block.difficulty,
        block.nonce
    );

const isTimestampValid = (newBlock, oldBlock) => {
    return (oldBlock.timestamp - 60 < newBlock.timestamp && 
            newBlock.timestamp - 60 < getTimestamp())
}


const isBlockValid = (candidateBlock, latestBlock) => {
    if(!isBlockStructureValid(candidateBlock)) {
        console.log('The candidate block structure is not valid');
        return false;
    } else if(latestBlock.index + 1 !== candidateBlock.index) {
        console.log(`The candidate block doesn't have a valid index`);
        return false;
    } else if(latestBlock.hash !== candidateBlock.previousHash) {
        console.log(`The previous of the candidate block is not the hash of the latest block`);
        return false;
    } else if(getBlockHash(candidateBlock) !== candidateBlock.hash) {
        console.log(`The hash of this block is invalid`);
        return false;
    } else if(!isTimestampValid(candidateBlock, latestBlock)){
        console.log(`Time timestamp of this block is not valid`);
        return false;
    }

    return true;
}

const isBlockStructureValid = (block) => {
    return (
        typeof block.index === 'number' && 
        typeof block.hash === 'string' &&
        typeof block.previousHash === 'string' &&
        typeof block.timestamp === 'number' &&
        typeof block.data === 'string'
    );
}

const isChainValid = (candidateChain) => {
    const isGenesisValid = block => {
        return JSON.stringify(block) === JSON.stringify(genesisBlock);
    };
    if(!isGenesisValid(candidateChain[0])) {
        console.log(`The candidate chain's genesis block is not the same as our genesis block`);

        return false;
    }

    for(let i = 1, length = candidateChain.length; i < length; i++){
        if(!isBlockValid(candidateChain[i], candidateChain[i-1])){
            return false;
        }
    }

    return true;
}

const replaceChain = candidateChain => {
    if(isChainValid(candidateChain) && candidateChain.length > getBlockChain().length) {
        blockchain = candidateChain;
        return true;
    } else {
        return false;
    }
}

const addBlockToChain = candidateBlock => {
    if(isBlockValid(candidateBlock, getLatestBlock())) {
        getBlockChain().push(candidateBlock);
        return true;
    } else {
        return false;
    }
}

module.exports = {
    getBlockChain,
    createNewBlock,
    getLatestBlock,
    isBlockStructureValid,
    addBlockToChain,
    replaceChain
}