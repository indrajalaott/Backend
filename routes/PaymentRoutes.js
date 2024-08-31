const express = require("express");
const router = express.Router();
const paymentControll = require('../controllers/paymentControll');
const {userAuth}=require('../middleware/userAuth');



// PhonePe Payment Gateway
router.post('/phonepe',paymentControll.checkout);
router.get('/status/:txnID',paymentControll.checkStatus)   


//RazorPay PaymentGateway
router.post('/createOrder',paymentControll.orderCreate);


module.exports = router