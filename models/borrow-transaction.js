// models/BorrowTransaction.js
const mongoose = require('mongoose');

// Define the BorrowTransaction schema
const BorrowTransactionSchema = new mongoose.Schema({
    book_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Books', // Reference to the Books model
        required: true,
    },
    borrower: {
        name: {
            type: String,
            required: true,
        },
    },
    borrowDate: {
        type: Date,
        required: true,
    },
    returnDate: {
        type: Date,
        required: true,
    },
});

// Create the BorrowTransaction model
const BorrowTransaction = mongoose.model('BorrowTransaction', BorrowTransactionSchema);

module.exports = BorrowTransaction;
