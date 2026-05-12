const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true
    },

    email:{
        type:String,
        required:true,
        unique:true
    },

    password:{
        type:String,
        required:true
    },

    balance:{
        type:Number,
        default:0
    },

    depositApproved:{
        type:Boolean,
        default:false
    },

    referralCode:{
        type:String,
        unique:true
    },

    invitedBy:{
        type:String,
        default:null
    },

    invitedCount:{
        type:Number,
        default:0
    },

    isAdmin:{
        type:Boolean,
        default:false
    }
});

module.exports = mongoose.model("User", userSchema);
