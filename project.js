const express = require("express");
const router = express.Router();

const User = require("./User");

const projects = {
    1:100,
    2:300,
    3:500,
    4:1000,
    5:3000
};

router.post("/buy", async(req,res)=>{
    try{
        const {username,projectId} = req.body;

        const user = await User.findOne({username});

        if(!user){
            return res.status(404).json({
                message:"User not found"
            });
        }

        if(!user.depositApproved){
            return res.status(400).json({
                message:"Deposit required"
            });
        }

        const price = projects[projectId];

        if(user.balance < price){
            return res.status(400).json({
                message:"Insufficient balance"
            });
        }

        user.balance -= price;
        await user.save();

        res.json({
            message:"Project purchased",
            balance:user.balance
        });

    }catch(err){
        res.status(500).json({message:err.message});
    }
});

module.exports = router;
