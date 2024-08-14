const mongoose = require("mongoose");

const videoShema=mongoose.Schema({
    title: {
        type: String,
      
    },
    url:{
        type:String,
    },
    video: {
        type: String,
    },
    description:{
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
   
})
const Videos=mongoose.model('Video',videoShema)
module.exports={Videos}