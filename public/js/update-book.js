// General function to close whichever form is open
function closeForm() {
    document.getElementById('edit-overlay').style.display = 'none';
    document.getElementById('editFormContainer').style.display = 'none';
}

// Function to check if a title already exists, ignoring the current book
async function isTitleUnique(newTitle, bookId) {
    const response = await fetch(`/books`);
    const books = await response.json();

    return books.every(book => book.title !== newTitle || book._id === bookId);
}

// Function to validate ISBN
function isValidISBN(isbn) {
    // Remove any hyphens
    isbn = isbn.replace(/-/g, '');

    // Check if the ISBN is 10 or 13 characters long
    if (isbn.length === 10) {
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            if (isbn[i] < '0' || isbn[i] > '9') return false; // Ensure all characters are digits
            sum += (i + 1) * parseInt(isbn[i], 10);
        }

        let checksum = isbn[9];
        if (checksum === 'X') {
            sum += 10 * 10;
        } else if (checksum >= '0' && checksum <= '9') {
            sum += 10 * parseInt(checksum, 10); //calculates the weighted sum for each digit by multiplying the digit's position
        } else {
            return false;
        }
        return sum % 11 === 0;
    } else if (isbn.length === 13) {
        let sum = 0;
        for (let i = 0; i < 13; i++) {
            const digit = parseInt(isbn[i], 10);
            if (isNaN(digit)) return false; // Ensure all characters are digits
            sum += i % 2 === 0 ? digit : digit * 3;
        }
        return sum % 10 === 0;
    }
    return false;
}

// Function to open the update form with current book details
async function editBook(bookId) {

    try {
        // Fetch the book details from the server using the book ID
        const response = await fetch(`/books/${bookId}`);

        if (response.ok) {
            const book = await response.json();

            // Set the form fields with current book details
            document.getElementById('editTitle').value = book.title;
            document.getElementById('editAuthor').value = book.author;
            document.getElementById('editIsbn').value = book.isbn;
            document.getElementById('editGenre').value = book.genre;
            document.getElementById('editCopies').value = book.availableCopies;
            document.getElementById('editBookId').value = book._id;
            document.getElementById('editImage').value = ''; // Reset image input

            // Set the image preview element if there's an existing image
            const imageElement = document.getElementById('editBookPreviewImage');
            if (book.image) {
                imageElement.src = `data:image/jpeg;base64,${book.image}`;
                imageElement.style.display = 'block'; // Show the image if it exists
            } else {
                imageElement.style.display = 'none'; // Hide the image if not available
            }

            // Display the form
            document.getElementById('editFormContainer').style.display = 'block';
            document.getElementById('edit-overlay').style.display = 'block';
        } else {
            alert('Failed to fetch book details for editing.');
        }
    } catch (error) {
        console.error('Error fetching book for editing:', error);
        alert('An error occurred while fetching the book details.');
    }
}

// Event listener to handle image preview when a new image is selected
document.getElementById('editImage').addEventListener('change', function (event) {
    const file = event.target.files[0];
    
    // Check if an image file is selected
    if (file) {
        // Check if file size exceeds 16MB (16 * 1024 * 1024 bytes)
        if (file.size > 16 * 1024 * 1024) {
            alert('Image size should not exceed 16MB. Please select a smaller file.');
            event.target.value = ''; // Clear the file input
            return;
        }

        // Proceed with displaying the image preview if the size is valid
        const reader = new FileReader();
        reader.onload = function (e) {
            const imageElement = document.getElementById('editBookPreviewImage');
            imageElement.src = e.target.result;
            imageElement.style.display = 'block'; // Show the preview
        };
        reader.readAsDataURL(file);
    }
});

// Function to handle update form submission
document.getElementById('editBookForm').addEventListener('submit', async function (event) {
    event.preventDefault(); // Prevent default form submission

    const form = new FormData(this);
    const bookId = document.getElementById('editBookId').value;
    const title = document.getElementById('editTitle').value.trim(); 
    const author = document.getElementById('editAuthor').value.trim();
    const isbn = document.getElementById('editIsbn').value;

    // Title and Author length validation
    if (title.length > 100) {
        alert('Title must be 100 characters or fewer.');
        return;
    }

    if (author.length > 150) {
        alert('Author name must be 150 characters or fewer.');
        return;
    }

    if (!isValidISBN(isbn)) {
        alert('Invalid ISBN. Please enter a valid ISBN-10 or ISBN-13.');
        return;
    }

    // Check if title is unique (ignoring the current book's own title)
    const isUniqueTitle = await isTitleUnique(title, bookId);
    if (!isUniqueTitle) {
        alert('Title already exists. Please choose a different title.');
        return;
    }

    const isConfirmed = confirm("Are you sure you want to update the book details?");
    if (!isConfirmed) {
        return; // Exit function if user does not confirm
    }

    try {
        const response = await fetch(`/updateBook/${bookId}`, {
            method: 'PUT',
            body: form,
        });

        if (response.ok) {
            alert('Book updated successfully!');
            closeForm(); // Close the edit form
            getBooks(); // Refresh the book list
        } else {
            alert('Failed to update book. Please try again later.');
        }
    } catch (error) {
        alert('An error occurred while updating the book. Please check the console for details.');
    }
});
