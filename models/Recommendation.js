const mongoose = require("mongoose");

const recommendationSchema = new mongoose.Schema({
    
    categoryName: {
        type: String,
        required: true,  // Ensure categoryName is not null and is required
       
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
        required: true,
        unique:true,
    },
    
    movieMobileImage: {
        type: String,
    },
    
});



const Recommendation = mongoose.model('Recommendation', recommendationSchema);

module.exports = Recommendation;
