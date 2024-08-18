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


const checkStatus= async (req, res) => {
  try {
      const merchantTransactionId = res.req.body.transactionId; 
      const merchantUserId = res.req.body.merchantId; ;  // Update with your merchant ID
      const key = "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399";  // Update with your API key

      const keyIndex = 1;
      const string = `/pg/v1/status/${merchantUserId}/${merchantTransactionId}` + key;
      const sha256 = CryptoJS.SHA256(string).toString();
      const checksum = sha256 + "###" + keyIndex;

      const URL = `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${merchantUserId}/${merchantTransactionId}`;

      const options = {
          method: 'GET',
          url: URL,
          headers: {
              accept: 'application/json',
              'Content-Type': 'application/json',
              'X-VERIFY': checksum,
              'X-MERCHANT-ID': merchantUserId,
          }
      };

      console.log("Status API Request Options:", options);

      try {
          const response = await axios.request(options);

          if (response.data.data.responseCode === 'SUCCESS') {
             
              // Create a new order instance
              const newOrder = new Order({
                  name: this.name,  
                  phone: this.phone,  
                  email: this.email,  
                  transactionId: merchantTransactionId,
                  paymentStatus: response.data.data.responseCode,
                  price: this.price,  
                  user: this.user, 
                  dateOrdered: Date.now(),
              });

              // Save the new order to the database
              await newOrder.save();

              // Redirect to the success URL
              const url = "http://localhost:4200/success";
              return res.redirect(url);
          } else {
              // Redirect to the failure URL
              const url = `http://localhost:4200/failure`;
              return res.redirect(url);
          }
      } catch (error) {
          console.error("Status API Error:", error.message);
          console.error("Status API Error Response:", error.response.data);
          res.status(500).json({ msg: "Error checking payment status", status: "error", error: error.message });
      }
  } catch (error) {
      console.error("Internal Server Error:", error.message);
      res.status(500).json({ msg: "Internal Server Error", status: "error", error: error.message });
  }
});





module.exports = {
  checkout,   //PhonePe API Call function for Payment CheckOut
  checkStatus //PhonePe API Status Function 
};
