const express = require("express");
const dotenv = require("dotenv").config();
const path = require('path');


const admin = require("./routes/adminRoutes");
const user =require("./routes/userRoutes");
const Payment=require("./routes/PaymentRoutes")


const db= require("./models/mongoose");

const app =express();


const port = process.env.PORT || 3000;

app.use(express.json());
app.use("/api/admin",admin);
app.use("/api/user",user);
app.use("/api/Payments",Payment);

app.use('/public', express.static(path.join(__dirname, 'public')));


app.get("/",(req,res)=>{
    res.send("Hello ,Shortfilm Viewers ...")
});
app.listen(port,()=>{
    console.log(`Server  running on port ${port}`);
});