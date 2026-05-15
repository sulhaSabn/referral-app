const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    password: {
        type: String,
        required: true
    },

    balance: {
        type: Number,
        default: 0
    },

    walletAddress: {
        type: String,
        default: "",
        unique: true,
        sparse: true
    },

    privateKey: {
        type: String,
        default: ""
    },

    referralCode: {
        type: String,
        unique: true
    },

    invitedBy: {
        type: String,
        default: null
    },

    invitedCount: {
        type: Number,
        default: 0
    },

    depositApproved: {
        type: Boolean,
        default: false
    },

    projects: {
        type: Array,
        default: []
    },

    resetToken: {
        type: String,
        default: null
    },

    resetTokenExpiry: {
        type: Date,
        default: null
    },

    isAdmin: {
        type: Boolean,
        default: false
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("User", userSchema);
