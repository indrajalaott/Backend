const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const jwtsecret = process.env.JWT_ADMIN_SECRET;
const { Movies } = require('../models/Movies');
const { Carousels } = require('../models/Carousels');
const Admin = require('../models/Admin');
const Recommendation = require('../models/Recommendation');

const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find admin by email
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // Compare the password with the hashed password
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // Generate JWT token
        const token = jwt.sign({ adminId: admin._id }, process.env.JWT_ADMIN_SECRET, { expiresIn: '1d' });
        return res.status(200).json({ token });
    } catch (error) {
        console.error("Error during admin login:", error);
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
        });

        res.status(200).json(carouselImage);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
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

// Function to add videos along with movie details
const AddVideos = async (req, res) => {
  try {
      // Extract movie details from the request body
      const {
          movieName,
          description,
          starring,
          ageLimit,
          category,
          duration,
          rating,
          url,
      } = req.body;

      // Extract uploaded files from the request
      const files = req.files;

      // Get filenames from uploaded files
      const movieFullImage = files['movieFullImage'] ? files['movieFullImage'][0].filename : null;
      const movieLogoImage = files['movieLogoImage'] ? files['movieLogoImage'][0].filename : null;
      const movieMobileImage = files['movieMobileImage'] ? files['movieMobileImage'][0].filename : null;
      const smallMovieImage = files['smallMovieImage'] ? files['smallMovieImage'][0].filename : null;
      const trailerVideo = files['trailerVideo'] ? files['trailerVideo'][0].filename : null;
      const movieVideo = files['movieVideo'] ? files['movieVideo'][0].filename : null;

      // Create a new movie entry in the database
      const newMovie = await Movies.create({
          movieName,
          description,
          starring,
          ageLimit,
          category,
          duration,
          rating,
          url,
          movieFullImage: movieFullImage ? `/carouselImage/${movieFullImage}` : null,
          movieLogoImage: movieLogoImage ? `/movieImage/${movieLogoImage}` : null,
          movieMobileImage: movieMobileImage ? `/imageGallery/${movieMobileImage}` : null,
          smallMovieImage: smallMovieImage ? `/imageGallery/${smallMovieImage}` : null,
          trailerVideo: trailerVideo ? `/videoGallery/${trailerVideo}` : null,
          movieVideo: movieVideo ? `/videosUpload/${movieVideo}` : null,
      });

      // Respond with the newly created movie entry
      res.status(200).json(newMovie);
  } catch (error) {
      console.error("Error adding movie:", error.message);
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

// The Corrosil Section Goes from Here. Now Only 3 Will be Listed if need Increase the count
const getLastThreeMovies = async (req, res) => {
    try {
        const movies = await Movies.find({}, 'movieFullImage description movieName year rating url')
            .sort({ createdAt: -1 })
            .limit(5);

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



const fetchAllMovies = async (req, res) => {
    try {
        const movies = await Movies.find({}, '-__v'); // Exclude the __v field if you want

        if (movies.length === 0) {
            return res.status(404).json({ message: "No movies found" });
        }

        res.status(200).json(movies);
    } catch (error) {
        console.error("Error fetching all movies:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


const getIndividualMovieById = async (req, res) => {
    try {
        const { id } = req.params; // Get the movie ID from the request parameters

        // Find the movie by ID
        const movie = await Movies.findById(id);
        if (!movie) {
            return res.status(404).json({ error: "Movie not found" });
        }

        // Return the movie details
        res.status(200).json(movie);
    } catch (error) {
        console.error("Error fetching movie details:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


const getIndividualMovieDelete = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedMovie = await Movies.findByIdAndDelete(id);

        if (!deletedMovie) {
            return res.status(404).json({ error: 'Movie not found' });
        }

        res.status(200).json({ message: 'Movie deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete movie' });
    }
};



const deleteList = async (req, res) => {
    const { name } = req.body; // Expecting the list name to be passed in the request body

    // Log the received body for debugging
    console.log('Received body:', req.body);

    try {
        // Find and delete the list by name
        const deletedList = await Recommendation.findOneAndDelete({ name });

        // Check if the list was found and deleted
        if (!deletedList) {
            return res.status(404).json({ message: 'List not found' });
        }

        res.status(200).json({ message: 'List deleted successfully', deletedList });
    } catch (error) {
        console.error('Error deleting list:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const addItems = async (req, res) => {
    const { name, items } = req.body;

    // Basic validation
    if (!name || !Array.isArray(items)) {
        return res.status(400).json({ message: 'Invalid input: name and items are required' });
    }

    try {
        // Find the list by name
        const list = await Recommendation.findOne({ name });

        if (!list) {
            return res.status(404).json({ message: 'List not found' });
        }

        // Add the new items to the existing items array
        // Optionally handle duplicates
        list.items = [...new Set([...list.items, ...items])];

        // Save the updated list
        await list.save();

        res.status(200).json({ message: 'Items added successfully', list });
    } catch (error) {
        console.error('Error adding items:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const removeItems = async (req, res) => {
    const { name, items } = req.body;

    // Basic validation
    if (!name || !Array.isArray(items)) {
        return res.status(400).json({ message: 'Invalid input: name and items are required' });
    }

    try {
        // Find the list by name
        const list = await Recommendation.findOne({ name });

        if (!list) {
            return res.status(404).json({ message: 'List not found' });
        }

        // Remove the specified items from the existing items array
        list.items = list.items.filter(item => !items.includes(item));

        // Save the updated list
        await list.save();

        res.status(200).json({ message: 'Items removed successfully', list });
    } catch (error) {
        console.error('Error removing items:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const fetchMovieDetailsByRecommendationName = async (req, res) => {
    const { name } = req.body;

    // Basic validation
    if (!name) {
        return res.status(400).json({ message: 'Invalid input: name is required' });
    }

    try {
        // Find the Recommendation list by name
        const recommendation = await Recommendation.findOne({ name });

        if (!recommendation) {
            return res.status(404).json({ message: 'Recommendation list not found' });
        }

        // Fetch movie details for the IDs in the recommendation list
        const movieIds = recommendation.items; // Assuming items field contains movie IDs
        if (!Array.isArray(movieIds) || movieIds.length === 0) {
            return res.status(404).json({ message: 'No movies found in the recommendation list' });
        }

        // Fetch movies from the database
        const movies = await Movies.find({ '_id': { $in: movieIds } });

        // Map the result to extract relevant details
        const movieDetails = movies.map(movie => ({
            name: movie.movieName,
            description: movie.description,
            category: movie.category,
            url: movie.url
        }));

        res.status(200).json({ message: 'Movie details fetched successfully', movies: movieDetails });
    } catch (error) {
        console.error('Error fetching movie details by recommendation name:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



module.exports = {
    adminLogin,
    addCarousels,
    fetchAllMovies,
    deleteCarousel,
    createList,
    getIndividualMovieDelete,
    getIndividualMovieById,
    AddVideos,


    addItems,
    removeItems,    
    fetchMovieDetailsByRecommendationName,


    deleteList,
    videoStreams,
    movieDetails,
    getIndividualMovieDetails,
    getLastThreeMovies,
};