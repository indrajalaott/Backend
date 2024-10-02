const mongoose = require("mongoose");

const recommendationSchema = mongoose.Schema({
    categoryName: {
        type: String,
     
    },
    movieName: {
        type: String,
    },
    year: {
        type: Number,
    },
    rating: {
        type: String,
        enum: ['U', 'U/A', 'A']
    },
    ageLimit: {
        type: String,
    },
    description: {
        type: String,
    },
    duration: {
        type: String,
    },
    starring: {
        type: [String],
        required: true
    },
    category: {
        type: [String],
    },
    url: {
        type: String,
    },
    movieFullImage: {
        type: String,
    },
    movieLogoImage: {
        type: String,
    },
    movieMobileImage: {
        type: String,
    },
    smallMovieImage: {
        type: String,
    },
});

const Recommendation = mongoose.model('Recommendation', recommendationSchema);

module.exports = Recommendation;
