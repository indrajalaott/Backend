const { Carousels } = require("../models/Carousels");
const { Movies } = require("../models/Movies");
const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const bcrypt = require('bcrypt');
const axios = require('axios'); // You may need to install axios for making HTTP requests

module.exports = {
    processPayment: async (req, res) => {
        try {
            // Extract the JWT token from the request headers
            const token = req.headers['authorization'].split(' ')[1];
            const decoded = jwt.verify(token, 'your_jwt_secret'); // Replace with your JWT secret

            // Extract the payment type (A, B, or C) from the request body
            const paymentType = req.body.type; // Expecting { type: 'A' | 'B' | 'C' }
            let amount;

            // Determine the payment amount based on the type
            switch (paymentType) {
                case 'A':
                    amount = 299;
                    break;
                case 'B':
                    amount = 699;
                    break;
                case 'C':
                    amount = 999;
                    break;
                default:
                    return res.status(400).json({ message: 'Invalid payment type' });
            }

            // Prepare the payment request to PhonePe
            const paymentRequest = {
                merchantId: 'M22Q6ZEWHB37Z', // Replace with your PhonePe merchant ID
                amount: amount,
                // Additional parameters may be required based on PhonePe's API documentation
                // e.g., orderId, callbackUrl, etc.
            };

            // Make the payment request to PhonePe
            const response = await axios.post('https://api.phonepe.com/v1/payment', paymentRequest, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, // Include the JWT token if required
                },
            });

            // Handle the response from PhonePe
            if (response.data.success) {
                return res.status(200).json({ message: 'Payment successful', data: response.data });
            } else {
                return res.status(500).json({ message: 'Payment failed', error: response.data });
            }
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    },
};