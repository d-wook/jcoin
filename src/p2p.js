const WebSockets = require('ws');
const Blockchain = require('./blockchain');
const { getLatestBlock, isBlockStructureValid, 
        addBlockToChain, replaceChain, 
        getBlockChain } = Blockchain;

const sockets = [];
const getSockets = () => sockets;

// Message Types
const GET_LATEST = "GET_LATEST";
const GET_ALL = "GET_ALL";
const BLOCKCHAIN_RESPONSE = "BLOCKCHAIN_RESPONSE";

// Message Creators
const getLatest = () => {
    return {
        type: GET_LATEST,
        data: null
    };
}

const getAll = () => {
    return {
        type: GET_ALL,
        data: null
    }
}

const startP2PServer = server => {
    const wsServer = new WebSockets.Server({ server });
    wsServer.on("connection", ws => {
        initSocketConnection(ws);
    });

    console.log('JCoin P2P Server is running');
}

const initSocketConnection = ws => {
    sockets.push(ws);
    handleSocketMessages(ws);
    handleSocketError(ws);
    sendMessage(ws, getLatest());
}

const parseData = data => {
    try {
        return JSON.parse(data);
    } catch(e) {
        console.log(e);
        return null;
    }
}

const handleSocketMessages = ws => {
    ws.on('message', data => {
        const message = parseData(data);
        if(message === null) {
            return;
        }
        console.log(message);
        switch(message.type){
            case GET_LATEST:
                sendMessage(ws, responseLatest());
                break;
            case GET_ALL:
                sendMessage(ws, responseAll());
                break;
            case BLOCKCHAIN_RESPONSE:
                const receivedBlocks = message.data;
                if(receivedBlocks === null){
                    break;
                }
                handleBlockchainResponse(receivedBlocks)
                break;
        }
    });
}

const handleBlockchainResponse = receivedBlocks => {
    if(receivedBlocks.length === 0) {
        console.log('Received Blocks have a length of 0');
        return;
    } 

    const latestReceivedBlock = receivedBlocks[receivedBlocks.length - 1];
    if(!isBlockStructureValid(latestReceivedBlock)){
        console.log('The block structure of the received block is not valid');
        return;
    }

    const latestBlock = getLatestBlock();
    if(latestReceivedBlock.index > latestBlock.index) {
        if(latestBlock.hash === latestReceivedBlock.previousHash){
            if(addBlockToChain(latestReceivedBlock)){
                broadcastNewBlock();
            }
        } else if(receivedBlocks.length === 1){
            // to do get all the blocks, we are waaaay behind
            sendMessageToAll(getAll());
        } else {
            // replace chain
            replaceChain(receivedBlocks);
        }
    }
}

const sendMessage = (ws, message) => {
    ws.send(JSON.stringify(message));
}

const sendMessageToAll = message => {
    sockets.forEach(ws => {
        sendMessage(ws, message);
    });
}

const responseLatest = () => {
    return blockchainResponse([getLatestBlock()]);
}

const responseAll = () => {
    return blockchainResponse(getBlockChain());
}

const broadcastNewBlock = () => sendMessageToAll(responseLatest());

const blockchainResponse = data => {
    return {
        type: BLOCKCHAIN_RESPONSE,
        data
    }
}

const handleSocketError = ws => {
    const closeSocketConnection = ws => {
        ws.close();
        sockets.splice(sockets.indexOf(ws), 1);
    }
    ws.on('close', () => {
        closeSocketConnection(ws)
    });
    ws.on('error', () => {
        closeSocketConnection(ws)
    });
}

const connectToPeers = newPeer => {
    const ws = new WebSockets(newPeer);

    ws.on('open', () => {
        initSocketConnection(ws);
    });
}

module.exports = {
    startP2PServer,
    connectToPeers,
    broadcastNewBlock
}