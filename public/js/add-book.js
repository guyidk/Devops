function addBookFeature() {
    // Add an event listener to handle the book form submission
    document.getElementById('bookForm').addEventListener('submit', async function (event) {
        event.preventDefault(); // Prevent default form submission

        // Get field values and check if they meet requirements
        const title = document.getElementById('title').value.trim();
        const author = document.getElementById('author').value.trim();
        const isbn = document.getElementById('isbn').value.trim();
        const genre = document.getElementById('genre').value;
        const availableCopies = document.getElementById('copies').value;
        const image = document.getElementById('image').files[0];

        // Front-end validations to check if all fields are filled
        if (!title || !author || !isbn || !genre || !availableCopies || !image) {
            alert("All fields are required. Please fill in the required fields.");
            return;
        }

        // Character limit validation for title and author
        if (title.length > 100) {
            alert("Title should not exceed 100 characters.");
            return;
        }

        if (author.length > 150) {
            alert("Author's name should not exceed 150 characters.");
            return;
        }

        // Validate ISBN to ensure it is a 13-digit number and starts with 978 or 979
        if (!/^(978|979)\d{10}$/.test(isbn)) {
            alert("Please enter a valid ISBN number.");
            return;
        }

        // Ask for confirmation before sending data to the server
        const userConfirmed = confirm("Are you sure you want to add this book?");
        if (!userConfirmed) {
            // If the user cancels, reset the form and close the dialog
            resetForm();
            closeForm();
            return;
        }

        // Prepare form data for backend validation
        const form = new FormData();
        form.append('title', title);
        form.append('author', author);
        form.append('isbn', isbn);
        form.append('genre', genre);
        form.append('availableCopies', availableCopies);
        form.append('image', image);

        try {
            // Send data to the server after confirmation
            const response = await fetch('/addBook', {
                method: 'POST',
                body: form,
            });

            // Check backend validation responses for errors
            if (!response.ok) {
                const errorData = await response.json();
                if (errorData.error === 'title_exists') {
                    alert("The title already exists. Please use a unique title.");
                } else if (errorData.error === 'isbn_exists') {
                    alert("The ISBN already exists. Please use a unique ISBN.");
                } else if (errorData.error === 'isbn_invalid') {
                    alert("Please enter a valid ISBN number.");
                } else {
                    alert('Failed to add book.');
                }
                return; // Stop if backend validation fails
            }

            // Notify user of success and reset form
            alert('Book added successfully!');
            resetForm();
            closeForm();
            getBooks(); // Refresh the book list
        } catch (error) {
            console.error('Error:', error); // Log any errors
            alert('An error occurred while adding the book.'); // Alert user of failure
        }
    });

    // Image preview functionality and size validation when a file is selected
    document.getElementById('image').addEventListener('change', function () {
        const imagePreview = document.getElementById('imagePreview');
        imagePreview.innerHTML = ''; // Clear previous image preview
        const file = this.files[0];

        // Check if the file exists and validate its size
        if (file) {
            if (file.size > 16 * 1024 * 1024) { // 16 MB in bytes
                alert("The image file size should not exceed 16 MB.");
                this.value = ''; // Clear the file input
                imagePreview.innerHTML = '<span>No Image Selected</span>'; // Reset image preview
                return;
            }
            
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file); // Display selected image
            imagePreview.appendChild(img);
        } else {
            imagePreview.innerHTML = '<span>No Image Selected</span>'; // Default message if no image selected
        }
    });
}

// Helper function to reset the form and clear the image preview
function resetForm() {
    document.getElementById('formContainer').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('bookForm').reset(); // Clear all form fields
    const imagePreview = document.getElementById('imagePreview');
    document.getElementById('image').value = '';  
    imagePreview.innerHTML = '<span>No Image Selected</span>'; // Clear image preview
}

// Function to open the form by displaying the form and overlay
function openForm() {
    document.getElementById('formContainer').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
}

// // Function to close the form, reset it, and hide the form and overlay
// function closeForm() {
//     resetForm(); // Reset the form when closing
//     document.getElementById('formContainer').style.display = 'none';
//     document.getElementById('overlay').style.display = 'none';
// }

// Initialize the addBookFeature function to set up event listeners
addBookFeature();
