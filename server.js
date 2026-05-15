require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

/* Start deposit monitor */
require("./tronMonitor");

/* Routes */
const authRoutes = require("./auth");
const projectRoutes = require("./project");
const withdrawRoutes = require("./withdraw");
const adminRoutes = require("./admin");
const messageRoutes = require("./messages");

const app = express();

/* Security */
app.use(helmet());

app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: {
            message: "Too many requests, try again later"
        }
    })
);

/* Middlewares */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* Static files */
app.use(express.static(path.join(__dirname)));

/* API Routes */
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/withdraw", withdrawRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/messages", messageRoutes);

/* Home route */
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

/* 404 handler */
app.use((req, res) => {
    res.status(404).json({
        message: "Route not found"
    });
});

/* MongoDB + Start server */
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected");

        const PORT = process.env.PORT || 3000;

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.log("MongoDB Error:", err);
    });
