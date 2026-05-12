const mongoose = require("mongoose");

const withdrawSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    wallet: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        default: "Pending"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model(
    "Withdraw",
    withdrawSchema
);
