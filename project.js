const express = require("express");
const User = require("./User");
const router = express.Router();
const Binance = require("node-binance-api");

// اتصال به Binance
const binance = new Binance().options({
  APIKEY: process.env.BINANCE_API_KEY,
  APISECRET: process.env.BINANCE_SECRET_KEY
});

const projectList = [
  {id:1, price:2, profit:0.5},
  {id:2, price:20, profit:2},
  {id:3, price:40, profit:4},
  {id:4, price:100, profit:10},
  {id:5, price:500, profit:25}
];

// خرید پروژه با واریز واقعی
router.post("/buy", async(req,res)=>{
  const {username,projectId} = req.body;
  const user = await User.findOne({username});
  const proj = projectList.find(p=>p.id===projectId);
  if(!proj) return res.status(400).json({message:"پروژه یافت نشد"});

  if(user.balance>=proj.price){
    try {
      // واریز واقعی به Binance
      await binance.withdraw("USDT", "TDE8mMioHzXWff1bKfsVpc32AcnWrufPrB", proj.price);
      
      user.balance -= proj.price;
      user.projects.push(proj);
      await user.save();
      res.json({message:"پروژه خریداری شد و واریز انجام شد", balance:user.balance});
    } catch(err){
      res.status(400).json({message:"خطا در واریز", error:err.message});
    }
  } else {
    res.status(400).json({message:"موجودی کافی نیست"});
  }
});

// افزودن سود روزانه
router.post("/profit", async(req,res)=>{
  const {username} = req.body;
  const user = await User.findOne({username});
  let totalProfit = 0;
  user.projects.forEach(p=> totalProfit += p.profit);
  user.balance += totalProfit;
  await user.save();
  res.json({message:"سود روزانه اضافه شد", balance:user.balance});
});

module.exports = router;
