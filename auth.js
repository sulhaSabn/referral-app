const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();

const User = require("./User");

function generateReferral(){
    return Math.random().toString(36).substring(2,8).toUpperCase();
}

router.post("/register", async(req,res)=>{
    try{
        const {username,email,password,referralCode} = req.body;

        const passwordRegex=/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;

        if(!passwordRegex.test(password)){
            return res.status(400).json({
                message:"Weak password"
            });
        }

        const existingUser = await User.findOne({
            $or:[{username},{email}]
        });

        if(existingUser){
            return res.status(400).json({
                message:"User already exists"
            });
        }

        let inviter=null;

        if(referralCode){
            inviter = await User.findOne({referralCode});

            if(!inviter){
                return res.status(400).json({
                    message:"Invalid referral code"
                });
            }

            inviter.invitedCount += 1;
            await inviter.save();
        }

        const hashedPassword = await bcrypt.hash(password,10);

        const user = new User({
            username,
            email,
            password:hashedPassword,
            referralCode:generateReferral(),
            invitedBy: referralCode || null
        });

        await user.save();

        res.json({message:"Registration successful"});
    }catch(err){
        res.status(500).json({message:err.message});
    }
});

router.post("/login", async(req,res)=>{
    try{
        const {username,password} = req.body;

        const user = await User.findOne({username});

        if(!user){
            return res.status(400).json({
                message:"User not found"
            });
        }

        const valid = await bcrypt.compare(password,user.password);

        if(!valid){
            return res.status(400).json({
                message:"Wrong password"
            });
        }

        res.json({
            message:"Login success",
            user
        });

    }catch(err){
        res.status(500).json({message:err.message});
    }
});

module.exports = router;
