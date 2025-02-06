require('dotenv').config(); // Load environment variables from a .env file into process.env
const express = require('express');                       // Import Express to create the server
const bodyParser = require('body-parser');                // Import body-parser to parse incoming request bodies
const multer = require('multer');                         // Import multer for handling file uploads
const mongoose = require('mongoose');                     // Import mongoose for MongoDB interaction
const cors = require('cors');                             // Import cors to enable Cross-Origin Resource Sharing
const { Gauge } = require('prom-client');


const { addBook } = require('./utils/add-book-util.js');   // Import the addBook function for handling book addition
const { addTransaction } = require("./utils/add-transaction-util.js");
const { updateBook, fetchBookById } = require('./utils/update-book-util.js'); // Import the utility functions for updating books
const { getBooks } = require('./utils/get-book-util'); // Import the getBooks function for fetching books
const { searchBooks } = require('./utils/search-book-util'); // Import the searchBooks function for searching books

const Book = require('./models/book.js'); // Import your Book model

const promClient = require('prom-client'); // Import Prometheus client

// Initialize an Express application
const app = express();
const logger = require('./logger');

// Create a new registry for Prometheus metrics
const register = new promClient.Registry();


// Create a Counter metric to track the number of requests
const httpRequestCounter = new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status'], // Labels for route, method, and status
});

// Register the metric
register.registerMetric(httpRequestCounter);

// Collect default metrics like CPU, memory, etc.
promClient.collectDefaultMetrics({ register });

// Add middleware to count requests to the '/' route
app.use((req, res, next) => {
    res.on('finish', () => {
        httpRequestCounter.inc({
            method: req.method,
            route: req.route ? req.route.path : req.path,
            status: res.statusCode,
        });
    });
    next();
});

// Define a route to expose metrics at '/metrics'
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

// Export Node.js version as a metric
const nodeVersionGauge = new Gauge({
    name: 'nodejs_version_info',
    help: 'Node.js version info',
    labelNames: ['version'],
});

// Set the version label based on the current Node.js process version
nodeVersionGauge.set({ version: process.version }, 1);

const PORT = process.env.PORT || 5500; // Set the server port from environment variables or default to 5500
const startPage = 'index.html';        // Define the main entry HTML file

// Enable Cross-Origin Resource Sharing (CORS) for all routes
app.use(cors());

// Configure body-parser to handle URL-encoded data and JSON data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files from the 'public' directory (e.g., HTML, CSS, JS)
app.use(express.static('./public'));

const statusMonitor = require('express-status-monitor');
app.use(statusMonitor());

// Connect to MongoDB using the MONGODB_URI environment variable from .env file
mongoose.connect(
    process.env.MONGODB_URI,
).then(() => console.log('Connected to MongoDB Atlas with working PM2'))
    .catch((error) => console.error('Error connecting to MongoDB:', error));

// Set up multer to store uploaded files in memory as buffer objects
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }); // Create an upload handler with memory storage

app.post('/addBook', upload.single('image'), addBook); // Define a POST route for adding a new book, expecting a single file upload under the 'image' field
app.get('/books', getBooks); // Use the getBooks function directly
app.get('/search', searchBooks); // Define a route for searching books

// Define a PUT route for updating a book by ID
app.get('/books/:id', fetchBookById);

app.put('/updateBook/:id', upload.single('image'), updateBook);

app.post('/addTransaction', addTransaction);

// Define a route to serve the main HTML page at the root URL
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/' + startPage); // Send the 'index.html' file as a response
});


// Start the server on the defined PORT
const server = app.listen(PORT, function () {
    // Retrieve the server's network address information
    const address = server.address();
    // Construct the base URL, defaulting to 'localhost' if IPv6 loopback address is used
    const baseUrl = `http://${address.address === '::' ? 'localhost' : address.address}:${address.port}`;
    console.log(`BookTrack app running at: ${baseUrl}`);
    logger.info(`Demo project at: ${baseUrl}`);
});

// Export the app and server instances for use in other modules or testing
module.exports = { app, server };
