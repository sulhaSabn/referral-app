const express = require("express");
const router = express.Router();

let messages = [];

router.post("/send",(req,res)=>{
    const {name,email,message} = req.body;

    messages.push({
        _id:Date.now().toString(),
        name,
        email,
        message,
        reply:""
    });

    res.json({
        message:"Message sent successfully"
    });
});

router.get("/all",(req,res)=>{
    res.json(messages);
});

router.post("/reply",(req,res)=>{
    const {id,reply} = req.body;

    const msg = messages.find(m=>m._id === id);

    if(!msg){
        return res.status(404).json({
            message:"Message not found"
        });
    }

    msg.reply = reply;

    res.json({
        message:"Reply sent successfully"
    });
});

module.exports = router;
