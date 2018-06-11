const WebSockets = require('ws');

const sockets = [];

const startP2PServer = server => {
    const wsServer = new WebSockets.Server({ server });
    wsServer.on("connection", ws => {
        console.log(`Hello ${ws}`);
    });

    console.log('JCoin P2P Server is running');
};

module.exports = {
    startP2PServer
};