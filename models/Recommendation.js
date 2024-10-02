const mongoose = require("mongoose");

const recommendationSchema = new mongoose.Schema({
    categoryName: {
        type: String,
        required: true,  // Ensure categoryName is not null and is required
        index: true      // Keep this indexed, but without the unique constraint
    },
    movieName: {
        type: String,
        required: true,  // Ensure movieName is required
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

// Add a compound unique index
recommendationSchema.index({ categoryName: 1, movieName: 1 }, { unique: true });


const Recommendation = mongoose.model('Recommendation', recommendationSchema);

module.exports = Recommendation;
