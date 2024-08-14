const mongoose = require("mongoose");

const recommendationSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    items: {
        type: [String],
        required: true
    }
});

const Recommendation = mongoose.model('Recommendation', recommendationSchema);

module.exports = Recommendation;
