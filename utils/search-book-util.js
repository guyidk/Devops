// Import the Book model to interact with the database
const Book = require('../models/book.js');
const mongoose = require('mongoose'); // Import mongoose to validate object IDs

async function searchBooks(req, res) {
    const query = req.query.query?.toLowerCase(); // Use optional chaining to safely access query

    // Check if the query is provided and valid
    if (!query || typeof query !== 'string' || query.trim() === '') {
        return res.status(400).json({ error: 'Invalid parameter: "query" is required and must be a non-empty string.' });
    }
    // Limit query length to 100 characters
    if (query.length > 100) {
        return res.status(400).json({ error: 'Query is too long. Max length is 100 characters.' });
    }

    try {
        // Search for books that match the title 
        const filteredBooks = await Book.find({
            title: { $regex: escapeRegex(query), $options: 'i' } // Case-insensitive search with escaped query
        });

        // Check if any books are found
        if (filteredBooks.length === 0) {
            return res.status(404).json({ message: 'No books found matching your search.' });
        }

        // Return the filtered results
        res.status(200).json(filteredBooks); // Send 200 OK status with the results
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).json({ message: 'An error occurred while searching for books.', error: error.message });
    }
}

// Function to escape regex special characters
function escapeRegex(text) {
    return text.replace(/[-\/\\^$.*+?()[\]{}|]/g, '\\$&'); // Escape special characters
}

module.exports = { searchBooks }; // Export the searchBooks function to be used in index.js