const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const jwtsecret = process.env.JWT_ADMIN_SECRET;
const { Videos } = require('../models/Videos');
const { Movies } = require('../models/Movies');
const { Carousels } = require('../models/Carousels');
const Admin = require('../models/Admin');
const Recommendation = require('../models/Recommendation');

const adminLogin = async (req, res) => {
  try {
      const { email, password } = req.body;

      // Check if email and password are provided
      if (!email || !password) {
          console.log("Email or password not provided");
          return res.status(400).json({ error: 'Email and password are required' });
      }

      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
          return res.status(401).json({ error: "Login failed: User not found" });
      }

      // Compare provided password with stored hash
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
          return res.status(401).json({ error: "Login failed: Invalid password" });
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user._id }, process.env.SECRET, { expiresIn: '1d' });
      return res.status(200).json({ token });
  } catch (error) {
      console.error("Error during login:", error);
      return res.status(500).json({ error: "Internal server error" });
  }
};

const addCarousels = async (req, res) => {
  try {
    const { movieName } = req.body;
    const imageObj = req.file;

    const carouselImage = await Carousels.create({
      movieName: movieName,
      image: `/carousel/${imageObj.filename}`
    })

    res.status(200).json(carouselImage)
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" })
  }
};

const deleteCarousel = async (req, res) => {
  try {
    const carousel = await Carousels.findOneAndDelete({ _id: req.params.id });
    if (!carousel) {
      return res.status(404).json({ error: "Carousel not found" });
    }

    res.status(200).json({ msg: "Carousel removed" });
  } catch (error) {
    console.error("Error deleting carousel:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const movieDetails = async (req, res) => {
  try {
    const { movieName, description, starring, ageLimit, category, duration, url, rating } = req.body;
    const files = req.files;

    const movieFullImage = files['movieFullImage'] ? files['movieFullImage'][0].filename : null;
    const movieLogoImage = files['movieLogoImage'] ? files['movieLogoImage'][0].filename : null;
    const movieMobileImage = files['movieMobileImage'] ? files['movieMobileImage'][0].filename : null;
    const smallMovieImage = files['smallMovieImage'] ? files['smallMovieImage'][0].filename : null;
    const trailerVideo = files['trailerVideo'] ? files['trailerVideo'][0].filename : null;
    const movieVideo = files['movieVideo'] ? files['movieVideo'][0].filename : null;

    const movie = await Movies.create({
      movieName,
      description,
      starring,
      ageLimit,
      category,
      duration,
      rating,
      url,
      movieFullImage: movieFullImage ? `/movieImages/${movieFullImage}` : null,
      movieLogoImage: movieLogoImage ? `/movieImages/${movieLogoImage}` : null,
      movieMobileImage: movieMobileImage ? `/movieImages/${movieMobileImage}` : null,
      smallMovieImage: smallMovieImage ? `/movieImages/${smallMovieImage}` : null,
      trailerVideo: trailerVideo ? `/movieVideos/${trailerVideo}` : null,
      movieVideo: movieVideo ? `/movieVideos/${movieVideo}` : null
    });

    res.status(200).json(movie);
  } catch (error) {
    console.error("Error adding movie details:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const AddVideos = async (req, res) => {
  try {
    const { title, url, description } = req.body;
    const videoObj = req.file;
    const newVideo = await Videos.create({
      title: title,
      url: url,
      description: description,
      video: `/videoGallery/${videoObj.filename}`,
    })
    res.status(200).json(newVideo);
  } catch (error) {
    console.error("Error deleting notification:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const videoStreams = async (req, res) => {
  try {
    const video = await Videos.findById(req.params.id);
    if (!video) {
      return res.status(404).send('Video not found');
    }

    const videoPath = path.join(__dirname, './public', req.params.filename);
    const videoStat = fs.statSync(videoPath);
    const fileSize = videoStat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize) {
        res.status(416).send('Requested range not satisfiable\n' + start + ' >= ' + fileSize);
        return;
      }

      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// Add the controller for getting individual movie details
const getIndividualMovieDetails = async (req, res) => {
  try {
    const movieUrl = req.params.url;
    const movie = await Movies.findOne({ url: movieUrl }, '-movieVideo -createdAt');
    
    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    res.status(200).json(movie);
  } catch (error) {
    console.error("Error fetching movie details:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//The Corrosil Section Goes from Here. Now Only 3 Will be Listed if need Increase the count
const getLastThreeMovies = async (req, res) => {
  try {
    const movies = await Movies.find({}, 'movieFullImage movieName year rating')
      .sort({ createdAt: -1 })
      .limit(3);
    
    res.status(200).json(movies);
  } catch (error) {
    console.error("Error fetching latest movies:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const createList = async (req, res) => {
  const { name, items } = req.body;

  try {
      // Check if the name already exists
      const existingList = await Recommendation.findOne({ name });
      if (existingList) {
          return res.status(400).json({ message: 'List with this name already exists' });
      }

      // Create a new list
      const newList = new Recommendation({
          name,
          items
      });

      // Save the new list to the database
      await newList.save();

      res.status(201).json({ message: 'List created successfully', newList });
  } catch (error) {
      console.error('Error creating list:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
  }
};


module.exports = {
  adminLogin,
  addCarousels,
  deleteCarousel,
  createList,
  AddVideos,
  videoStreams,
  movieDetails,
  getIndividualMovieDetails,
  getLastThreeMovies,  
};

