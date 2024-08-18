const { Carousels } = require("../models/Carousels");
const { Movies } = require("../models/Movies");
const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const bcrypt = require('bcrypt');
const axios = require('axios');
const CryptoJS = require('crypto-js');

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

      // Prepare the payment data
      const data = {
          merchantId: "M22Q6ZEWHB37Z",
          merchantTransactionId: transactionId,
          merchantUserId: 'MUID' + userId,
          name: Name,
          amount: Amount * 100,
          redirectUrl: `http://localhost:3001/api/v1/orders/status/${transactionId}`,
          redirectMode: "POST",
          mobileNumber: PhoneNumber,
          paymentInstrument: {
              type: "PAY_PAGE",
          },
      };
      const payload = JSON.stringify(data);
      const payloadMain = Buffer.from(payload).toString("base64");

      const key = "9a7f4495-02f2-4948-a2d1-3ff39387bf34";
      const keyIndex = 1;
      const string = payloadMain + "/pg/v1/pay" + key;

      const sha256 = CryptoJS.SHA256(string).toString();
      const checksum = sha256 + "###" + keyIndex;

      const prod_URL = "https://api.phonepe.com/apis/hermes";
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

module.exports = {
  checkout
};
