require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./auth");
const projectRoutes = require("./project");

const app = express();
app.use(express.json());
app.use(cors());

// اتصال به دیتابیس
mongoose.connect("mongodb://localhost:27017/referralApp", {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(()=>console.log("MongoDB Connected"))
  .catch(err=>console.log(err));

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);

app.listen(5000, ()=>console.log("Server running on port 5000"));