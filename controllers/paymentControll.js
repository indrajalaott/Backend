const { Carousels } = require("../models/Carousels");
const { Movies } = require("../models/Movies");
const jwt = require('jsonwebtoken');
const {User} = require('../models/User');
const bcrypt = require('bcrypt');

// Function to generate a unique transaction ID
function generatedTranscId() {
  return 'INDTR' + Date.now();
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

     
      const data = {
        merchantId: "PGTESTPAYUAT",
        merchantTransactionId: generatedTranscId(),
        merchantUserId: 'MUID' + user_id,
        name: name,
        amount: price * 100,
        redirectUrl: `http://localhost:3001/api/v1/orders/status/${generatedTranscId()}`,
        redirectMode: "POST",
        mobileNumber: phone,
        paymentInstrument: {
            type: "PAY_PAGE",
        },
    };

      
  } catch (error) {
      // Handle any errors that occur during the process
      console.error("Error during checkout:", error);
      return res.status(500).json({ message: "Server error." });
  }
};


module.exports={
  
  checkout
  
}