const mongoose = require("mongoose");

const userShema=mongoose.Schema({
    name: {
        type: String,
      
    },
    email: {
        type: String,
      
    },
    password: {
        type: String,
      
    },
    count:{
        type:Number,
        required: true,
        default: 0
    },
    otpSendTime:{
        type:Date, 
        default:Date.now
    },
    forgot_otp: {
        type: Number,
        default: null,
      },

   
   
})
const User=mongoose.model('User',userShema)
module.exports={User}