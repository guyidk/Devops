function displayMessage(message, type) {
    const messageElement = document.getElementById("message");

    // Set the message text and style based on the type
    messageElement.textContent = message;
    messageElement.style.display = "block"; // Make sure the message element is visible

    if (type === "success") {
        messageElement.style.color = "green"; // Success message color
    } else if (type === "error") {
        messageElement.style.color = "red"; // Error message color
    } 

    // Hide the message after a few seconds
    setTimeout(() => {
        messageElement.style.display = "none";
    }, 3000);
}

function addTransaction() {
    const book_id = document.getElementById("book_id").value;
    const borrower_name = document.getElementById("borrower_name").value;
    const borrowDate = document.getElementById("borrowDate").value;
    const returnDate = document.getElementById("returnDate").value;

    // Check for empty fields
    if (!book_id || !borrower_name || !borrowDate || !returnDate) {
        displayMessage("All fields are required!", "error");
        return;
    }

    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(book_id);
    if (!isValidObjectId) {
        displayMessage("Invalid book_id format. It must be a 24-character hex string.", "error");
        return;
    }

    const borrowDateObj = new Date(borrowDate);
    const returnDateObj = new Date(returnDate);

    if (isNaN(borrowDateObj.getTime()) || isNaN(returnDateObj.getTime())) {
        displayMessage("Invalid date format for borrow or return date.", "error");
        return;
    }
    
    if (returnDateObj <= borrowDateObj) {
        displayMessage("Return date must be after borrow date.", "error");
        return;
    }
    
    const transactionData = { book_id, borrower_name, borrowDate, returnDate };

    // Send transaction data to server
    fetch('/addTransaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            displayMessage(data.message, "success");
            alert("Transaction added successfully!");
            document.getElementById("transactionForm").reset(); // Reset form on success
            closeModal(); // Close modal on success only
        } else if (data.error) {
            displayMessage(data.error, "error");
        }
    })
    .catch(error => {
        console.error("Error:", error);
        displayMessage("An error occurred while submitting the transaction.", "error");
    });
}

// Function to open the modal
function openModal() {
    document.getElementById("modalOverlay").style.display = "flex";
}

// Function to close the modal
function closeModal() {
    document.getElementById("modalOverlay").style.display = "none";
}
