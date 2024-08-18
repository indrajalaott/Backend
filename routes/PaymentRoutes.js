const express = require("express");
const router = express.Router();
const paymentControll = require('../controllers/paymentControll');
const {userAuth}=require('../middleware/userAuth');



// register and login routes

router.post('/phonepe',paymentControll.checkout);
router.post('/phonepayStatus/:txnID',paymentControll.checkStatus)                               


module.exports = router