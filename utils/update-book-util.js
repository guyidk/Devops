// Import the Book model to interact with the database
const Book = require('../models/book.js');
// Import mongoose to validate object IDs
const mongoose = require('mongoose');
// Import logger for logging
const logger = require('../logger'); 

// Define an asynchronous function to handle updating a book by ID
async function updateBook(req, res) {
    try {
        // Extract the book ID from the URL parameters
        const { id } = req.params;
        logger.info(`Received request to update book with ID: ${id}`);
        // Destructure the updated book details from the request body
        const { title, author, isbn, genre, availableCopies } = req.body;

        // Validate title and author length
        if (title.length > 100) {
            logger.error('Validation failed: Title exceeds 100 characters');    
            return res.status(400).json({ error: 'Title must be 100 characters or fewer.' });
        }

        if (author.length > 150) {
            logger.error('Validation failed: Author name exceeds 150 characters');
            return res.status(400).json({ error: 'Author name must be 150 characters or fewer.' });
        }

        if (availableCopies < 0) {
            logger.error('Validation failed: Available copies is less than 0');
            return res.status(400).json({ error: 'Available copies should be more that 0' });
        }

        // Retrieve the existing book to check if the title has changed
        const existingBook = await Book.findById(id);
        if (!existingBook) {
            logger.error(`Book with ID: ${id} not found`);
            return res.status(404).json({ error: 'Book not found' });
        }

        // Only check for title uniqueness if the title has changed
        if (existingBook.title !== title) {
            const duplicateBook = await Book.findOne({ title });
            if (duplicateBook) {
                logger.error(`Validation failed: Title "${title}" already exists`);
                return res.status(400).json({ error: 'Title already exists.' });
            }
        }

        // Handle image update if a new image is provided
        let imageBase64;
        if (req.file) {
            // Check if file size exceeds 16MB
            if (req.file.size > 16 * 1024 * 1024) {
                logger.error('Validation failed: Uploaded image exceeds 16MB size limit');
                return res.status(400).json({ error: 'Image size should not exceed 16MB.' });
            }
            imageBase64 = req.file.buffer.toString('base64');
        }

        // Find the book by ID and update it with new details
        const updatedBook = await Book.findByIdAndUpdate(id, {
            title,
            author,
            isbn,
            genre,
            availableCopies,
            ...(req.file && { image: imageBase64 }), // Update image if a new one is uploaded
        }, { new: true }); // Return the updated book document

        if (updatedBook) {
            logger.info(`Book with ID: ${id} updated successfully`);
            res.status(200).json({ message: 'Book updated successfully!', book: updatedBook });
        }else {
            logger.error(`Failed to update book with ID: ${id}`);
            return res.status(500).json({ error: 'Failed to update the book.' });
        }
        
    } catch (error) {
        logger.error(`Error updating book with ID: ${req.params.id}: ${error.message}`);
        console.error('Error updating book:', error);
        res.status(500).json({ error: 'An error occurred while updating the book.' });
    }
}

// Define an asynchronous function to fetch a book by ID
async function fetchBookById(req, res) {
    const { id } = req.params; // Get the ID from the route parameters
    const sanitizedId = id.trim(); // Trim any whitespace from the ID

    logger.info(`Received request to fetch book with ID: ${sanitizedId}`);

    // Check if the provided ID is a valid MongoDB ObjectId
    if (!mongoose.isValidObjectId(sanitizedId)) {
        logger.error(`Invalid book ID format: ${sanitizedId}`);
        return res.status(400).send('Invalid book ID format');
    }

    try {
        const book = await Book.findById(sanitizedId); // Fetch the book by ID
        if (!book) {
            logger.error(`Book with ID: ${sanitizedId} not found`);
            return res.status(404).send('Book not found'); // If no book is found, return a 404 status
        }
        logger.info(`Book with ID: ${sanitizedId} fetched successfully`);
        res.json(book); // Send the book as a JSON response
    } catch (error) {
        logger.error(`Error fetching book with ID: ${sanitizedId}: ${error.message}`);
        console.error('Error fetching book by ID:', error);
        res.status(500).send('Server error'); // Handle any server errors
    }
}

module.exports = { updateBook,fetchBookById  }; // Export the updateBook function to be used in index.js
