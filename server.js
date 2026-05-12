require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./auth");
const projectRoutes = require("./project");
const withdrawRoutes = require("./withdraw");
const adminRoutes = require("./admin");

const app = express();

/* Middleware */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* MongoDB Connection */
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
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

/* Test Route */
app.get("/", (req, res) => {
    res.send("Referral API Running...");
});

/* Server */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
