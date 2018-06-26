const CryptoJS = require("crypto-js");
const EC = require("elliptic");
const utils = require("./utils");

const ec = new EC('secp256k1');

class TxOut {
    constructor(address, amount) {
        this.address = address;
        this.amount = amount;
    }
}

class TxIn {
    // uTxOutId
    // uTxOutIndex
    // Signature

}

class Transaction {
    // ID
    // txIns[]
    // txOuts[]

}

class UTxOut {
    constructor(txOutId, txOutIndex, address, amount) {
        this.txOutId = txOutId;
        this.txOutIndex = txOutIndex;
        this.address = address;
        this.amount = amount;
    }
}

const uTxOuts = [];

const getTxId = tx => {
    const txInContent = tx.txIns
    .map(txIn => txIn.uTxOutId + txIn.uTxOutIndex)
    .reduce((a, b) => a + b, "");

    const txOutContent = tx.txOuts
    .map(txOut => txOut.address + txOut.amount)
    .reduce((a, b) => a + b, "");

    return Crypto.SHA256(txInContent, txOutContent).toStrng();
}

const findUTxOut = (txOutId, txOutIndex, uTxOutList) => {
    return uTxOutList.find(
        uTxOut => uTxOut.txOutId === txOutId && uTxOut.txOutIndex === txOutIndex
    );
}

const signTxIn = (tx, txInIndex, privateKey, uTxOut) => {
    const txIn = tx.txIns[txInIndex];
    const dataToSign = tx.id;
    // To do: find tx
    const referencedUTxOut = findUTxOut(txIn.txOutId, tx.txOutIndex, uTxOuts);
    if(referencedUTxOut === null) {
        return;
    }

    const key = ec.keyFromPrivate(privateKey, "hex");
    const signature = utils.toHexString(key.sign(dataToSign).toDER());

    return signature;
}

const updateUTxOuts = (newTxs, uTxOutList) => {
    const newUTxOuts = newTxs.map(tx => {
        tx.txOuts.map((txOut, index) => {
            new UTxOut(tx.id, index, txOut.address, txOut.amount);
        });
    }).reduce((a, b) => a.concat(b), []);

    const spentTxOuts = newTxs.map(tx => tx.txIns)
    .reduce((a, b) => a.concat(b), [])
    .map(txIn => new UTxOut(txIn, txOutId, txIn.txOutIndex, "", 0));

    const resultingUTxOuts = uTxOutList
    .filter(uTxO => !findUTxOut(uTxO.txOutId, uTxO.txOutIndex, spentTxOuts))
    .concat(newUTxOuts);

    return resultingUTxOuts;
}