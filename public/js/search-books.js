// Function to search books
function searchBooks() {
    const query = document.getElementById('searchInput').value.trim();

    // Handling empty search string
    if (!query) {
        alert('Empty or whitespace search term is not allowed');
        return; // Exit function if the search term is empty
    }

    // Limit query length to 100 characters
    if (query.length > 100) {
        alert('Search term is too long. Please limit to 100 characters.');
        return; // Exit function if the query exceeds 100 characters
    }
    
    // Removed input sanitization for special characters

    // Create an XMLHttpRequest to fetch the search results from the backend
    const request = new XMLHttpRequest();
    document.getElementById('loading').style.display = 'block'; // Show loading indicator

    // Open a GET request with the query as a URL parameter
    request.open('GET', `/search?query=${encodeURIComponent(query)}`, true);

    // Define the onload event handler for the request
    request.onload = function () {
        document.getElementById('loading').style.display = 'none'; // Hide loading indicator

        // Check if the request was successful (status code between 200 and 299)
        if (request.status >= 200 && request.status < 300) {
            // Parse the JSON response to get the filtered books array
            const filteredBooks = JSON.parse(request.responseText);
            
            // Handle no data found
            if (filteredBooks.length === 0) {
                alert('No books found matching your search criteria.');
            } else {
                // Display filtered books only if some books are found
                displayBooks(filteredBooks);
            }
        } 
        // Handle invalid search query (status 400)
        else if (request.status === 400) {
            alert('Invalid search query. Please ensure you are using the correct format and try again.');
            console.error('Invalid search query:', request.statusText);
        } 
        // Handle no books found (status 404)
        else if (request.status === 404) {
            alert('No books found matching your search criteria.', request.statusText);
        } 
        // Handle other unsuccessful status codes
        else {
            console.error('Error fetching search results:', request.statusText);
            alert('Failed to retrieve search results. Please try again later.');
        }
    };

    // Define the onerror event handler for network errors
    request.onerror = function () {
        document.getElementById('loading').style.display = 'none'; // Hide loading indicator
        
        // Log network error and alert the user
        console.error('Network error while fetching search results');
        alert('An error occurred while fetching search results. Please check the console for details.');
    };
    // Define the ontimeout event handler for request timeout
    request.ontimeout = function () {
        document.getElementById('loading').style.display = 'none'; // Hide loading indicator
        
        // Alert the user about the request timeout
        alert('The request timed out. Please try again.');
    };
    // Send the request to the server
    request.send();
}

function toggleClearButton() {
    const searchInput = document.getElementById('searchInput');
    const clearButton = document.getElementById('clearSearchBtn');
    clearButton.style.display = searchInput.value.trim() ? 'inline' : 'none';
}

// Function to clear the search input and reset the book list
function clearSearch() {
    document.getElementById('searchInput').value = '';
    toggleClearButton();
    getBooks(); // Display all books again
}
