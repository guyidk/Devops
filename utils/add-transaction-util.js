const Book = require('../models/book.js');
const BorrowTransaction = require('../models/borrow-transaction.js');

async function addTransaction(req, res) {
    const { book_id, borrower_name, borrowDate, returnDate } = req.body;

    try {
        // Validate book ID
        const book = await Book.findById(book_id);
        if (!book) {
            return res.status(400).json({ error: "Invalid book ID" });
        }

        // Validate borrower name
        if (!borrower_name) {
            return res.status(400).json({ error: "Borrower name is required" });
        }

        // Validate dates
        const borrowDateObj = new Date(borrowDate);
        const returnDateObj = new Date(returnDate);

        if (isNaN(borrowDateObj.getTime()) || isNaN(returnDateObj.getTime())) {
            return res.status(400).json({ error: "Invalid date format for borrowDate or returnDate" });
        }

        // Check if the book is currently borrowed (e.g., an active transaction exists)
        const activeTransaction = await BorrowTransaction.findOne({
            book_id: book._id,
            returnDate: { $gte: new Date() } // Book is considered "borrowed" if returnDate is in the future
        });

        if (activeTransaction) {
            return res.status(400).json({ error: "This book is already borrowed by another user" });
        }

        // Create new transaction if the book is available
        const newTransaction = new BorrowTransaction({
            book_id: book._id,
            borrower: { name: borrower_name },
            borrowDate: borrowDateObj,
            returnDate: returnDateObj,
        });

        await newTransaction.save();
        res.json({ message: "Transaction added successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Error saving transaction: " + error.message });
    }
}

module.exports = { addTransaction };
