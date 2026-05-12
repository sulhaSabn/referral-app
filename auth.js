const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();

const User = require("./User");

function generateReferral(){
    return Math.random().toString(36).substring(2,8).toUpperCase();
}

function generateResetToken(){
    return Math.random().toString(36).substring(2,12);
}

router.post("/register", async(req,res)=>{
    try{
        const {username,email,password,referralCode} = req.body;

        const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;

        if(!passwordRegex.test(password)){
            return res.status(400).json({message:"Weak password"});
        }

        const exist = await User.findOne({
            $or:[{username},{email}]
        });

        if(exist){
            return res.status(400).json({
                message:"User exists"
            });
        }

        if(referralCode){
            const inviter = await User.findOne({referralCode});

            if(!inviter){
                return res.status(400).json({
                    message:"Invalid referral"
                });
            }

            inviter.invitedCount += 1;
            await inviter.save();
        }

        const hashed = await bcrypt.hash(password,10);

        const user = new User({
            username,
            email,
            password:hashed,
            referralCode:generateReferral()
        });

        await user.save();

        res.json({message:"Registered"});
    }catch(err){
        res.status(500).json({message:err.message});
    }
});

router.post("/login", async(req,res)=>{
    const {username,password} = req.body;

    const user = await User.findOne({username});

    if(!user){
        return res.status(404).json({message:"Not found"});
    }

    const valid = await bcrypt.compare(password,user.password);

    if(!valid){
        return res.status(400).json({message:"Wrong password"});
    }

    const token = jwt.sign(
        {
            id:user._id,
            username:user.username,
            isAdmin:user.isAdmin
        },
        process.env.JWT_SECRET
    );

    res.json({
        token,
        user
    });
});

router.post("/forgot-password", async(req,res)=>{
    const {email} = req.body;

    const user = await User.findOne({email});

    if(!user){
        return res.status(404).json({
            message:"Email not found"
        });
    }

    const token = generateResetToken();
    user.resetToken = token;
    await user.save();

    res.json({
        message:"Reset token generated",
        token
    });
});

router.post("/reset-password", async(req,res)=>{
    const {token,newPassword} = req.body;

    const user = await User.findOne({resetToken:token});

    if(!user){
        return res.status(400).json({
            message:"Invalid token"
        });
    }

    user.password = await bcrypt.hash(newPassword,10);
    user.resetToken = null;

    await user.save();

    res.json({
        message:"Password changed"
    });
});

module.exports = router;
