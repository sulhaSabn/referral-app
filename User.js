const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username:{type:String,unique:true},
    email:{type:String,unique:true},
    password:String,

    balance:{type:Number,default:0},
    depositApproved:{type:Boolean,default:false},

    referralCode:{type:String,unique:true},
    invitedBy:{type:String,default:null},
    invitedCount:{type:Number,default:0},

    isAdmin:{type:Boolean,default:false},

    resetToken:{type:String,default:null}
});

module.exports = mongoose.model("User", userSchema);
