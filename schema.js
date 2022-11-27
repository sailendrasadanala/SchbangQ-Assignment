const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name:{
    type:String,
    unique:true,
    required:true
  },
  email: {
    type: String,
    required: true,
    unique:true,
  },
  password:String,
  role:{
    type:String,
    default:'Employee',
    required:true
  }
});


const userModel = mongoose.model("user", userSchema);

module.exports = userModel;