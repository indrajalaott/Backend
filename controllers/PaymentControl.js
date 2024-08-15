const { Carousels } = require("../models/Carousels");
const { Movies } = require("../models/Movies");
const jwt = require('jsonwebtoken');
const {User} = require('../models/User');
const bcrypt = require('bcrypt');
const axios = require('axios'); // You may need to install axios for making HTTP requests
require('dotenv').config(); // Ensure to load environment variables

const triggerPaymentPhonePey = async (req, res) => {
    try {
        // Extract the token from the headers
        const token = req.headers['x-access-protected'];
        const { letter } = req.body;
        
        // Check if the token is provided
        if (!token) {
            return res.status(401).json({ message: 'No token provided.' });
        }

        // Decode the token to get the user ID
        const decoded = jwt.verify(token, process.env.SECRET); // Use the secret from .env

        // Fetch the user details from the database
        const user = await User.findById(decoded.id); // Assuming the ID is stored in the token payload as 'id'

        // Check if user exists
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Store user details in separate variables
        const userName = user.name;
        const userEmail = user.email;
        const userPhoneNumber = user.phonenumber;
        const transactionID = generatedTranscId(); // Use the provided function to generate a transaction ID
        const price = getPriceForLetter(letter); // Use the provided function to get the price for the letter
        
        // Set the values to variables for later use
        this.name = userName;
        this.email = userEmail;
        this.user = decoded.id; // Use the decoded user ID
        this.phone = userPhoneNumber;
        this.tempId = transactionID;
        this.price = price;

        const data = {
            merchantId: "M22Q6ZEWHB37Z",
            merchantTransactionId: transactionID,
            merchantUserId: 'MUID' + decoded.id, // Use the decoded user ID
            name: userName,
            amount: price * 100, // Multiply by 100 to convert to paisa
            redirectUrl: `http://localhost:20000/api/Payments/status/${transactionID}`,
            redirectMode: "POST",
            mobileNumber: userPhoneNumber,
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

        axios.request(requestData)
            .then(async function (response) {
                const phonePeTransactionId = response.data.transactionId;
                res.status(201).send({
                    msg: "payment done",
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


function generateTransactionID() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; // Capital letters A-Z
    const numbers = '0123456789'; // Numbers 0-9

    // Start with a random letter
    let transactionID = letters.charAt(Math.floor(Math.random() * letters.length));

    // Append 11 more characters (letters and numbers)
    for (let i = 1; i < 12; i++) {
        const randomChar = Math.random() < 0.5 
            ? letters.charAt(Math.floor(Math.random() * letters.length)) 
            : numbers.charAt(Math.floor(Math.random() * numbers.length));
        transactionID += randomChar;
    }

    return transactionID;
}


function getPriceForLetter(letter) {
    let price;

    switch (letter) {
        case 'A':
            price = 299; // A > 299
            break;
        case 'B':
            price = 499; // B -> 499
            break;
        case 'C':
            price = 699; // C -> 699
            break;
        default:
            price = 299; // Any letter other than A, B, C is set to 299
            break;
    }

    return price;
}


module.exports = {
    triggerPaymentPhonePey
};