const express = require("express");
const router = express.Router();

const Withdraw = require("./Withdraw");
const User = require("./User");

router.post("/request", async(req,res)=>{
    try{
        const {username,wallet} = req.body;

        const user = await User.findOne({username});

        if(!user){
            return res.status(404).json({
                message:"User not found"
            });
        }

        const withdraw = new Withdraw({
            username,
            wallet,
            amount:user.balance
        });

        await withdraw.save();

        res.json({
            message:"Withdraw submitted"
        });

    }catch(err){
        res.status(500).json({message:err.message});
    }
});

router.get("/all", async(req,res)=>{
    const all = await Withdraw.find();
    res.json(all);
});

module.exports = router;
