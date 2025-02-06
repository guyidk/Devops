// Import the Book model to interact with the database
const Book = require('../models/book.js');

// Define an asynchronous function to handle adding a new book
async function addBook(req, res) {
    try {
        // Destructure the required book details from the request body
        const { title, author, isbn, genre, availableCopies } = req.body;

        // Convert the uploaded file buffer to a Base64 encoded string for the image
        const imageBase64 = req.file.buffer.toString('base64');

        // Fetch all existing titles, normalize them, and store in an array
        const existingTitles = await Book.find({}, 'title');
        const normalizedTitles = existingTitles.map(book => book.title.toLowerCase().trim());

        // Check if the normalized input title exists in the array of normalized titles
        const normalizedInputTitle = title.toLowerCase().trim();
        if (normalizedTitles.includes(normalizedInputTitle)) {
            return res.status(400).json({ error: 'title_exists' });
        }

        // Check for existing ISBN to prevent duplicate entries
        const existingISBN = await Book.findOne({ isbn });
        if (existingISBN) {
            return res.status(400).json({ error: 'isbn_exists' });
        }

        // Ensure ISBN is numeric and has exactly 13 digits
        if (!/^\d{13}$/.test(isbn)) {
            return res.status(400).json({ error: 'isbn_invalid' });
        }

        // Create a new instance of the Book model with the provided data
        const newBook = new Book({
            title,
            author,
            isbn,
            genre,
            availableCopies,
            image: imageBase64, // Store image as Base64 encoded string
        });

        // Save the new book instance to the database
        await newBook.save();
        res.status(201).json({ message: 'Book added successfully!' }); // Send success response
    } catch (error) {
        console.error('Error adding book:', error); // Log any errors encountered
        res.status(500).json({ error: 'An error occurred while adding the book.' }); // Send error response
    }
}

// Export the addBook function to make it available in other parts of the application
module.exports = { addBook };
