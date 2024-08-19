const { Carousels } = require("../models/Carousels");
const { Movies } = require("../models/Movies");
const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const bcrypt = require('bcrypt');
require('dotenv').config();
const axios = require('axios');
const CryptoJS = require('crypto-js');
const Razorpay = require('razorpay');
const bodyParser = require('body-parser');
const Payment=require('../models/Payment');
const express = require('express');

const app = express();
app.use(bodyParser.json());

const razorpay = new Razorpay({
  key_id: process.env.KEY_ID_RAZORPAY, 
  key_secret: process.env.KEY_SECRET_RAZORPAY
});

const payout = async (req, res) => {

  const { amount } = req.body;

  const options = {
    amount: amount * 100, // amount in the smallest currency unit (paise)
    currency: 'INR',
    receipt: 'receipt#1', // Can be customized
    notes: {}
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
}; 



// Function to generate a unique transaction ID
function generateTranscId() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomLetters = Array.from({ length: 3 }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
  const randomNumbers = Math.floor(10000 + Math.random() * 90000); // Generates a random 5-digit number
  return 'INDTR' + Date.now() + randomLetters + randomNumbers;
}

const checkout = async (req, res) => {
  try {
      // Destructuring the required fields from the request body
      const { Name, Email, PhoneNumber, Amount } = req.body;

      // Validate the input data
      if (!Name || !Email || !PhoneNumber || !Amount) {
          return res.status(400).json({ message: "All fields are required." });
      }

      // Find the user by email
      const user = await User.findOne({ email: Email });

      // If the user does not exist, return an error response
      if (!user) {
          return res.status(404).json({ message: "User not found." });
      }


      // Get the user's ID
      const userId = user._id;

      // Generate a unique transaction ID
      const transactionId = generateTranscId();



      const paymentId = await Payment.countDocuments() + 1; // Simple counter for unique id

        const newPayment = new Payment({
            id: paymentId, // Ensure this is unique
            name: Name,
            email: Email,
            phoneNumber: PhoneNumber,
            amount: Amount,
            status: "Initiated",
            transactionDetails: {
                transactionId: transactionId,
                method: 'PAY_PAGE', // Example method, modify as needed
            },
        });

        await newPayment.save();


      // Prepare the payment data
      const data = {
          merchantId: process.env.MERCHANT_ID, 
          merchantTransactionId: transactionId,
          merchantUserId: 'MUID' + userId,
          name: Name,
          amount: Amount * 100,
          redirectUrl: `http://localhost:20000/api/pay/status/${transactionId}`,
          redirectMode: "GET",
          mobileNumber: PhoneNumber,
          paymentInstrument: {
              type: "PAY_PAGE",
          },
      };


      const payload = JSON.stringify(data);
      const payloadMain = Buffer.from(payload).toString("base64");

      const key = process.env.PHONEPAY_API_KEY;  // Use the key from .env
      const keyIndex = 1;
      const string = payloadMain + "/pg/v1/pay" + key;

      const sha256 = CryptoJS.SHA256(string).toString();
      const checksum = sha256 + "###" + keyIndex;


      const prod_URL = "https://api.phonepe.com/apis/hermes/pg/v1/pay";
      const requestData = {
          method: "POST",
          url: prod_URL,
          headers: {
              accept: "application/json",
              "Content-Type": "application/json",
              "X-VERIFY": checksum,
          },
          data: {
              request: payloadMain,
          },
      };

      // Make the API request
      axios.request(requestData)
          .then(async function (response) {
              const phonePeTransactionId = response.data.transactionId;
              res.status(201).send({
                  msg: "Payment successful",
                  status: "success",
                  data: response.data,
                  phonePeTransactionId: phonePeTransactionId,
              });
              console.log("Payment API Response:", response.data);
          })
          .catch(function (error) {
              console.error("Payment API Error:", error.message);
              res.status(500).json({ msg: "Payment Failed", status: "error", error: error.message });
          });
  } catch (e) {
      console.error("Internal Server Error:", e.message);
      res.status(500).json({ msg: "Internal Server Error", status: "error", error: e.message });
  }
};


const checkStatus = async (req, res) => {
  try {
      const merchantTransactionId = req.params.txnID; // Access txnID from req.params
      const merchantId = process.env.MERCHANT_ID;
      const key = process.env.PHONEPAY_API_KEY;  // Use the key from .env

      const keyIndex = 1;
      const string = `/pg/v1/status/${merchantId}/${merchantTransactionId}` + key;
      const sha256 = CryptoJS.SHA256(string).toString();
      const checksum = sha256 + "###" + keyIndex;

      const URL = `https://api.phonepe.com/apis/hermes/pg/v1/status/${merchantId}/${merchantTransactionId}`;

      const options = {
          method: 'GET',
          url: URL,
          headers: {
              accept: 'application/json',
              'Content-Type': 'application/json',
              'X-VERIFY': checksum,
              'X-MERCHANT-ID': merchantId,
          }
      };

      console.log("Status API Request Options:", options);

      // Make the API request
      const response = await axios.request(options);

      if (response.data.data.responseCode === 'SUCCESS') {
          // Handle success case
          console.log("Payment successful");
          // You can add further logic here, e.g., saving the status to a database, redirecting, etc.
          res.status(200).json({ msg: "Payment status success", status: "success", data: response.data });
      } else {
          // Handle failure case
          console.log("Payment failed or pending");
          // You can add further logic here, e.g., handling failures, etc.
          res.status(400).json({ msg: "Payment status failed or pending", status: "failed", data: response.data });
      }
  } catch (error) {
      console.error("Internal Server Error:", error.message);
      res.status(500).json({ msg: "Internal Server Error", status: "error", error: error.message });
  }
};






module.exports = {
  checkout,   //PhonePe API Call function for Payment CheckOut
  checkStatus, //PhonePe API Status Function 
  payout        //Razorpe API Call for Payment Checkout
};
