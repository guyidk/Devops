const Book = require('../models/book.js');
const mongoose = require('mongoose'); // Import mongoose to validate object IDs

// Define an asynchronous function to handle getting books
async function getBooks(req, res) {
    try {
        const books = await Book.find(); // Fetch all books from the Book model

        // Check if no books are found and return a 404 status with a message
        if (books.length === 0) {
            return res.status(404).json({ message: 'No books found' });
        }

        res.status(200).json(books); // Send the books as a JSON response with 200 status
    } catch (error) {
        console.error('Error fetching books:', error);

        // Improved error response with status 500 and error message
        res.status(500).json({ message: 'Server error while fetching books', error: error.message });
    }
}



// Export the function to make it available for use in your routes

// Export the searchBooks function to make it available in other parts of the application
// Export the getBooks function to make it available in other parts of the application
module.exports = { getBooks};
