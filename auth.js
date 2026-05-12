const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./User");

const router = express.Router();

// ثبت‌نام
router.post("/register", async(req,res)=>{
  const {username,password,ref} = req.body;
  try {
    const hashed = await bcrypt.hash(password,10);
    const referralCode = username + Date.now();
    const user = new User({username,password:hashed,referralCode,referredBy:ref||null});
    await user.save();
    res.json({message:"ثبت‌نام موفق", balance:user.balance});
  } catch(err){
    res.status(400).json({message:"خطا در ثبت‌نام", error:err.message});
  }
});

// ورود
router.post("/login", async(req,res)=>{
  const {username,password} = req.body;
  const user = await User.findOne({username});
  if(!user) return res.status(400).json({message:"کاربر یافت نشد"});
  const isMatch = await bcrypt.compare(password,user.password);
  if(!isMatch) return res.status(400).json({message:"رمز اشتباه"});
  const token = jwt.sign({id:user._id}, "secretKey");
  res.json({token, user});
});

module.exports = router;