const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const Blockchain = require('./blockchain');

const { getBlockChain, createNewBlock } = Blockchain;

const PORT = 3000;

const app = express();
app.use(bodyParser.json());
app.use(morgan('combined'));
app.listen(PORT, () => {
    console.log(`Jcoin server running on PORT ${PORT}`);
});