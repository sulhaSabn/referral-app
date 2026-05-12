const express = require("express");
const router = express.Router();

const User = require("./User");
const Withdraw = require("./Withdraw");
const auth = require("./authMiddleware");

router.get("/users", auth, async(req,res)=>{
    if(!req.user.isAdmin){
        return res.status(403).json({message:"Forbidden"});
    }

    const users = await User.find().select("-password");
    res.json(users);
});

router.post("/approve-deposit", auth, async(req,res)=>{
    const {username} = req.body;

    await User.updateOne(
        {username},
        {$set:{depositApproved:true}}
    );

    res.json({message:"Deposit approved"});
});

router.post("/approve-withdraw", auth, async(req,res)=>{
    const {id,status} = req.body;

    await Withdraw.updateOne(
        {_id:id},
        {$set:{status}}
    );

    res.json({message:"Withdraw updated"});
});

module.exports = router;
