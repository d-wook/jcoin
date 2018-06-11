const WebSockets = require('ws');

const sockets = [];

const getSockets = () => sockets;

const startP2PServer = server => {
    const wsServer = new WebSockets.Server({ server });
    wsServer.on("connection", ws => {
        console.log(`Hello ${ws}`);
    });

    console.log('JCoin P2P Server is running');
};

const initSocketConnection = socket => {
    sockets.push(socket);
}

const connectToPeers = newPeer => {
    const ws = new WebSockets(newPeer);

    ws.on('open', () => {
        initSocketConnection(ws);
    })
}

module.exports = {
    startP2PServer,
    connectToPeers
};