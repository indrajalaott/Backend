const express = require("express");
const dotenv = require("dotenv").config();
const path = require('path');
const cors = require('cors'); // Import the cors package

const admin = require("./routes/adminRoutes");
const user = require("./routes/userRoutes");
const Payment = require("./routes/PaymentRoutes");

const db = require("./models/mongoose");

const app = express();

const port = process.env.PORT || 3000;

// Enable CORS for all origins
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify the allowed methods
  credentials: true // Allow credentials if needed
}));

app.use(express.json());
app.use("/api/admin", admin);
app.use("/api/user", user);
app.use("/api/Payments", Payment);

app.use('/public', express.static(path.join(__dirname, 'public')));

app.get("/", (req, res) => {
    res.send("Hello, Shortfilm Viewers ...");
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
