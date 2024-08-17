// PaymentModel.js

const mongoose = require('mongoose');

// paymentSchema.js
const initPaymentSchema = new mongoose.Schema({
   body:Object,
});

const InitPayment = mongoose.model('InitPayment', initPaymentSchema);
module.exports = InitPayment;
