const express = require("express");
const router = express.Router();
const userController = require('../controllers/PaymentControl');
const { userAuth } = require('../middleware/userAuth');

// Payment route
router.post('/payment', userAuth, userController.processPayment);

module.exports = router;