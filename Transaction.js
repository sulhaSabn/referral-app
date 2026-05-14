const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
    txid: {
        type: String,
        unique: true
    },
    address: String,
    amount: Number,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model(
    "Transaction",
    transactionSchema
);
