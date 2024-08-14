const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const adminAuth = require('../middleware/adminAuth');
const multer = require("multer");

// Image storage configurations
const imagestorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./public/movieImage");
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
});

const imageUpload = multer({ storage: imagestorage });

// Video storage configurations
const videostorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./public/movieVideos");
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
});

const videoUpload = multer({ storage: videostorage });

// Configure multer to handle multiple file uploads for movie details
const cpUpload = imageUpload.fields([
    { name: 'movieFullImage', maxCount: 1 },
    { name: 'movieLogoImage', maxCount: 1 },
    { name: 'movieMobileImage', maxCount: 1 },
    { name: 'smallMovieImage', maxCount: 1 },
    { name: 'trailerVideo', maxCount: 1 },
    { name: 'movieVideo', maxCount: 1 }
]);
router.post('/login', adminController.adminLogin);
router.post('/add-videos', adminAuth, cpUpload, adminController.AddVideos);
router.get('/videos/:id', adminController.videoStreams);


// Route to Fetch the Individual Details of the Movie where the URL of Movie is passed
router.get('/Individual-MovieDetails/:url', adminController.getIndividualMovieDetails);

//Latest Movies Fetching
router.get('/Corrosil-Desktop', adminController.getLastThreeMovies);

// POST route to create a new list in Recommendations
router.post('/Create-list', adminAuth, adminController.createList);

module.exports = router;
