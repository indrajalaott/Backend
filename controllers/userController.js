const { Carousels } = require("../models/Carousels");
const { Movies } = require("../models/Movies");
const jwt = require('jsonwebtoken');
const {User} = require('../models/User');
const bcrypt = require('bcrypt');
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(404).json({ message: "no data" })
        }
        else {
            const exist = await User.findOne({ email });
             if (exist) {
                console.log("error");
                return res.status(404).json({ message: "duplicate" });
            }
            const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }


            const hashedPassword = await bcrypt.hash(password, 10)
            const user = await User.create({ 
              name,
              email,
              password:hashedPassword })
            await user.save()

            const token = jwt.sign({ userId: user._id }, process.env.SECRET, { expiresIn: '30d' })
            res.status(201).json({ token })

            return res.status(200).json({ message: "success" })
        }
    } catch (error) {
        console.log(error);
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (email && password) {
            const user = await User.findOne({ email: email })
            if (!user) {
                return (
                    res.status(401).json({ error: "login failed" })
                )
            }
            const passwordMatch = await bcrypt.compare(password, user.password)
            if (!passwordMatch) {
                return res.status(401).json({ message: "no authentication" })
            }
            const token = jwt.sign({ userId: user._id }, process.env.SECRET, { expiresIn: '30d' })
            res.status(200).json({ token })
        } else {
            console.log("not found");
            res.status(404).json({ error: 'no data' })
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "login failed" })
    }
}

const resetPassword = async (req, res) => {
    try {
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({ error: "Please provide a password." });
        }

        const user = await User.findById(req.user.userId);
        console.log("req.user.userId:", req.user.userId);
        if (!user) {
            return res.status(400).json({ error: "Invalid credentials." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        await user.save();

        return res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        console.error("Error during password reset:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};




module.exports={
  
  register,
  login,
  resetPassword
  
}