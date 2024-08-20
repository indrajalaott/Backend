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
             // Respond with the token and expiryDate
        res.status(200).json({ 
            token, 
            expiryDate: user.expiryDate 
        });
        } else {
            console.log("not found");
            res.status(404).json({ error: 'no data' })
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "login failed" })
    }
}






const getIndividualMovieDetails = async (req, res) => {
    try {
        const movieUrl = req.params.url; // Extract the URL parameter from the request

        // Find the movie by its URL, excluding the movieVideo and createdAt fields
        const movie = await Movies.findOne({ url: movieUrl }, '-movieVideo');

        // If the movie is not found, return a 404 error
        if (!movie) {
            return res.status(404).json({ error: "Movie not found" });
        }

        // Return the movie details in the response with a 200 status code
        res.status(200).json(movie);
    } catch (error) {
        console.error("Error fetching movie details:", error.message);
        // Return a 500 status code if there is a server error
        res.status(500).json({ error: "Internal Server Error" });
    }
};




const getVideoMovie = async (req, res) => {
    try {
        const id = req.params.id; // Extract the URL parameter from the request

        // Find the movie by its URL, excluding the movieVideo and createdAt fields
        const movie = await Movies.findOne({ _id:id });

        // If the movie is not found, return a 404 error
        if (!movie) {
            return res.status(404).json({ error: "Movie not found" });
        }

        // Return the movie details in the response with a 200 status code
        res.status(200).json(movie);
    } catch (error) {
        console.error("Error fetching movie details:", error.message);
        // Return a 500 status code if there is a server error
        res.status(500).json({ error: "Internal Server Error" });
    }
};





const getIndividualMovieDetailsByID = async (req, res) => {
    try {
        const id = req.params.id; // Extract the URL parameter from the request

        // Find the movie by its URL, excluding the movieVideo and createdAt fields
        const movie = await Movies.findOne({ _id:id }, '-movieVideo');

        // If the movie is not found, return a 404 error
        if (!movie) {
            return res.status(404).json({ error: "Movie not found" });
        }

        // Return the movie details in the response with a 200 status code
        res.status(200).json(movie);
    } catch (error) {
        console.error("Error fetching movie details:", error.message);
        // Return a 500 status code if there is a server error
        res.status(500).json({ error: "Internal Server Error" });
    }
};


const checkexpValid = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ message: "Token is required" });
        }

        // Verify and decode the token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.SECRET);
        } catch (error) {
            return res.status(401).json({ message: "Invalid or malformed token", error: error.message });
        }

        const userId = decoded.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ expiryDate: user.expiryDate });
    } catch (error) {
        console.error('Error decoding token or finding user:', error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};




module.exports={
  
  register,
  login,
  getIndividualMovieDetails,
  getIndividualMovieDetailsByID,


  checkexpValid,   //check The Validity
  getVideoMovie
  
}