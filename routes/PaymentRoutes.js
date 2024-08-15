const express = require("express");
const router = express.Router();
const userController = require('../controllers/PaymentControl');
const { userAuth } = require('../middleware/userAuth');

// Payment route PhonePe PaymentGateay
router.post('/paymentPhonepe', userAuth, userController.triggerPaymentPhonePey);

module.exports = router;