require("dotenv").config();
const messageRoutes = require("./messages");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("./tronMonitor");
const authRoutes = require("./auth");
const projectRoutes = require("./project");
const withdrawRoutes = require("./withdraw");
const adminRoutes = require("./admin");

const app = express();
const axios = require("axios");
const User = require("./models/User");
const Transaction = require("./models/Transaction");
/* Security */
app.use(helmet());

app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        message: "Too many requests, try again later"
    }
}));

/* Middlewares */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* Static files */
app.use(express.static(__dirname));

/* MongoDB */
mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("✅ MongoDB Connected");
})
.catch((err) => {
    console.log("❌ MongoDB Error:", err);
});

/* API Routes */
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/withdraw", withdrawRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/messages", messageRoutes);
/* Frontend Routes */
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/reset-password.html", (req, res) => {
    res.sendFile(path.join(__dirname, "reset-password.html"));
});
app.post("/api/create-wallet/:userId", async (req, res) => {
    try {
        const response = await axios.post(
            "https://chaingateway.io/api/v2/newAddress",
            {
                currency: "USDT",
                network: "TRC20"
            },
            {
                headers: {
                    "x-api-key": process.env.CHAIN_API_KEY
                }
            }
        );

        const walletAddress = response.data.address;

        await User.findByIdAndUpdate(
            req.params.userId,
            { walletAddress }
        );

        res.json({
            walletAddress
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Wallet creation failed"
        });
    }
});
app.post("/webhook/deposit", async (req, res) => {
    try {
        const { address, amount, txid } = req.body;

        const existingTx = await Transaction.findOne({ txid });

        if (existingTx) {
            return res.sendStatus(200);
        }

        const user = await User.findOne({
            walletAddress: address
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        await Transaction.create({
            txid,
            address,
            amount
        });

        user.balance += Number(amount);
        await user.save();

        res.sendStatus(200);

    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});
/*404 Handler */
app.use((req, res) => {
    res.status(404).json({
        message: "Route not found"
    });
});

/* Error Handler */
app.use((err, req, res, next) => {
    console.error(err.stack);

    res.status(500).json({
        message: "Internal server error"
    });
});

/* Start Server */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
