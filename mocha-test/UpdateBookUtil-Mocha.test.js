const { describe, it } = require('mocha');
const { expect } = require('chai');
const { app, server } = require('../index');
const sinon = require('sinon');
const Book = require('../models/book');
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
let baseUrl;

describe('Update Book API', () => {
    before(async () => {
        const { address, port } = await server.address();
        baseUrl = `http://${address == '::' ? 'localhost' : address}:${port}`;
    });
    after(() => {
        return new Promise((resolve) => {
            server.close(() => {
                resolve();
            });
        });
    });
    afterEach(() => {
        sinon.restore(); // Restore Sinon stubs after each test
    });

    describe('updateBook', () => {
        
        it('should handle null updatedBook gracefully', async function () {
            this.timeout(3000); // Set timeout to 300ms
            sinon.stub(Book, 'findById').resolves({ _id: '671c94d0607a452e0bc99e54', title: 'Old Title' });
            sinon.stub(Book, 'findByIdAndUpdate').resolves(null);
        
            const res = await chai.request(app)
                .put('/updateBook/671c94d0607a452e0bc99e54')
                .send({
                    title: 'Valid Title',
                    author: 'Valid Author',
                    isbn: '123456789',
                    genre: 'Fiction',
                    availableCopies: 10,
                });
        
            expect(res).to.have.status(500);
            expect(res.body.error).to.equal('Failed to update the book.');
        });        
        
        it('should return 400 if the uploaded file size exceeds 16MB', async () => {
            // Mock the Book model
            sinon.stub(Book, 'findById').resolves({ _id: '123456', title: 'Old Title' });

            // Create a buffer slightly larger than 16MB
            const largeFile = Buffer.alloc(16 * 1024 * 1024 + 1);

            const res = await chai.request(app)
                .put('/updateBook/123456')
                .attach('image', largeFile, 'large-image.jpg')
                .field('title', 'Valid Title')
                .field('author', 'Valid Author')
                .field('isbn', '123456789')
                .field('genre', 'Fiction')
                .field('availableCopies', 10);

            expect(res).to.have.status(400);
            expect(res.body.error).to.equal('Image size should not exceed 16MB.');
        });

        it('should convert the uploaded file to base64 if size is valid and update the book successfully', async () => {
            sinon.stub(Book, 'findById').resolves({ _id: '123456', title: 'Exisitng Title' });
            sinon.stub(Book, 'findByIdAndUpdate').resolves({
                _id: '123456',
                title: 'Exisitng Title',
                author: 'Valid Author',
                isbn: '123456789',
                genre: 'Fiction',
                availableCopies: 10,
                image: '<base64-string>',
            });

            const validFile = Buffer.alloc(16 * 1024 * 1024);

            const res = await chai.request(app)
                .put('/updateBook/123456')
                .attach('image', validFile, 'valid-image.jpg')
                .field('title', 'Exisitng Title')
                .field('author', 'Valid Author')
                .field('isbn', '123456789')
                .field('genre', 'Fiction')
                .field('availableCopies', 10);

            expect(res).to.have.status(200);
            expect(res.body.message).to.equal('Book updated successfully!');
            expect(res.body.book.image).to.exist;
        });

        it('should return 400 if the book title already exists', async () => {
            // Stub the Book model's findById and findOne methods
            sinon.stub(Book, 'findById').resolves({ _id: '123456', title: 'Old Title' });
            sinon.stub(Book, 'findOne').resolves({ _id: '789101', title: 'Duplicate Title' });
        
            // Simulate the request to update the book with a duplicate title
            const res = await chai.request(app)
                .put('/updateBook/123456')
                .send({
                    title: 'Duplicate Title', // New title already exists in the database
                    author: 'Valid Author',
                    isbn: '123456789',
                    genre: 'Fiction',
                    availableCopies: 10,
                });
        
            // Assertions
            expect(res).to.have.status(400);
            expect(res.body.error).to.equal('Title already exists.');
        });       

        it('should return 400 if title exceeds 100 characters', async () => {
            const res = await chai.request(app)
                .put('/updateBook/123456')
                .send({
                    title: 'a'.repeat(101),
                    author: 'Author Name',
                    isbn: '123456789',
                    genre: 'Fiction',
                    availableCopies: 10,
                });

            expect(res).to.have.status(400);
            expect(res.body.error).to.equal('Title must be 100 characters or fewer.');
        });
        
        it('should return 400 if author exceeds 150 characters', async () => {
            const res = await chai.request(app)
                .put('/updateBook/123456')
                .send({
                    title: 'Valid Title',
                    author: 'a'.repeat(151),
                    isbn: '123456789',
                    genre: 'Fiction',
                    availableCopies: 10,
                });

            expect(res).to.have.status(400);
            expect(res.body.error).to.equal('Author name must be 150 characters or fewer.');
        });
        it('should return 400 if availableCopies is less than 0', async () => {
            const res = await chai.request(app)
                .put('/updateBook/123456')
                .send({
                    title: 'Valid Title',
                    author: 'Valid Author',
                    isbn: '123456789',
                    genre: 'Fiction',
                    availableCopies: -1,
                });

            expect(res).to.have.status(400);
            expect(res.body.error).to.equal('Available copies should be more that 0');
        });

        it('should return 404 if the book does not exist', async () => {
            sinon.stub(Book, 'findById').resolves(null);

            const res = await chai.request(app)
                .put('/updateBook/123456')
                .send({
                    title: 'Valid Title',
                    author: 'Valid Author',
                    isbn: '123456789',
                    genre: 'Fiction',
                    availableCopies: 10,
                });

            expect(res).to.have.status(404);
            expect(res.body.error).to.equal('Book not found');
        });

        it('should log error and return 500 if an error occurs during book update', async () => {
            sinon.stub(Book, 'findById').rejects(new Error('Database error'));
        
            const consoleErrorStub = sinon.stub(console, 'error'); // Stub console.error to prevent actual logging
        
            const res = await chai.request(app)
                .put('/updateBook/123456')
                .send({
                    title: 'Valid Title',
                    author: 'Valid Author',
                    isbn: '123456789',
                    genre: 'Fiction',
                    availableCopies: 10,
                });
        
            expect(res).to.have.status(500);
            expect(res.body.error).to.equal('An error occurred while updating the book.');
            expect(consoleErrorStub.calledWithMatch('Error updating book:')).to.be.true;
        
            consoleErrorStub.restore(); // Restore the original console.error
        });
        

    });

    describe('fetchBookById', () => {
        it('should return 400 for invalid ObjectId', (done) => {
            chai.request(app)
                .get('/books/invalid-id')
                .end((err, res) => {
                    expect(res).to.have.status(400);
                    expect(res.text).to.equal('Invalid book ID format');
                    done();
                });
        });

        it('should return 404 if the book is not found', (done) => {
            // Mock Book.findById to return null
            sinon.stub(Book, 'findById').resolves(null);

            chai.request(app)
                .get('/books/5f8f2c8b6a9d1e2b3c7b8f9a')
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    expect(res.text).to.equal('Book not found');
                    done();
                });
        });

        it('should return 200 and fetch the book successfully', (done) => {
            sinon.stub(Book, 'findById').resolves({
                _id: '671c94d0607a452e0bc99e54',
                title: 'Sample Book',
                author: 'John Doe',
            }); // Mock book found

            chai.request(app)
                .get('/books/671c94d0607a452e0bc99e54')
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.include({ _id: '671c94d0607a452e0bc99e54' });
                    done();
                });
        });

        it('should log error and return 500 if an error occurs while fetching the book', (done) => {
            sinon.stub(Book, 'findById').rejects(new Error('Database error')); // Simulate a database error
        
            const consoleErrorStub = sinon.stub(console, 'error'); // Stub console.error to suppress actual logging
        
            chai.request(app)
                .get('/books/5f8f2c8b6a9d1e2b3c7b8f9a')
                .end((err, res) => {
                    expect(res).to.have.status(500);
                    expect(res.text).to.equal('Server error');
                    expect(consoleErrorStub.calledWithMatch('Error fetching book by ID:')).to.be.true;
        
                    consoleErrorStub.restore(); // Restore the original console.error
                    done();
                });
        });
                
    });
});
