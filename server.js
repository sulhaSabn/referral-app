require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./auth");
const projectRoutes = require("./project");
const withdrawRoutes = require("./withdraw");
const adminRoutes = require("./admin");

const app = express();

app.use(cors());
app.use(express.json());
app.use(helmet());

app.use(rateLimit({
    windowMs:15*60*1000,
    max:100
}));

mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("MongoDB Connected"))
.catch(err=>console.log(err));

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/withdraw", withdrawRoutes);
app.use("/api/admin", adminRoutes);

app.listen(process.env.PORT || 5000, ()=>{
    console.log("Server running");
});
