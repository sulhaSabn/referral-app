const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type:String, required:true, unique:true },
  password: { type:String, required:true },
  balance: { type:Number, default:2 }, // هدیه ثبت‌نام
  projects: [{ id:Number, price:Number, profit:Number }],
  referralCode: { type:String, unique:true },
  referredBy: { type:String }
});

module.exports = mongoose.model("User", UserSchema);