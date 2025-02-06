const { Schema, model } = require('mongoose');

// Define a schema for the Book model, which outlines the structure of each book document in the database
const BookSchema = new Schema({
    // Title of the book (required field)
    title: { type: String, required: true },
    // Author of the book (required field)
    author: { type: String, required: true },
    // ISBN of the book, must be unique (required field)
    isbn: { type: String, required: true, unique: true },
    // Genre or category of the book (required field)
    genre: { type: String, required: true },
    // Number of available copies, cannot be less than 0 (required field)
    availableCopies: { type: Number, required: true, min: 0 },
    // Base64 encoded image of the book cover (required field)
    image: { type: String, required: true },
}, 
{ 
    // Add timestamps for created and updated times
    timestamps: true 
});

// Export the Book model based on the defined schema
module.exports = model('Books', BookSchema);
