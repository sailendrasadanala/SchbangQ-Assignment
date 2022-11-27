const mongoose = require("mongoose")

const courseSchema = new mongoose.Schema({
   title:String,
   description:String,
   video_Url:String,
   topics:Array,
   duration:Number,
   category:String,
   approved:{
    type:Boolean,
    default:false
   }
})

const  courseModal = mongoose.model("course",courseSchema)

module.exports = courseModal;