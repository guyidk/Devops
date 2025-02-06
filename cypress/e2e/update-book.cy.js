describe('Update Book Frontend', () => {
  let baseUrl;
  before(() => {
    cy.task('startServer').then((url) => {
      baseUrl = url; // Store the base URL
    });
  });
  after(() => {
    return cy.task('stopServer'); // Stop the server after the report is done
  });
  // Visit the application before each test
  beforeEach(() => {
    cy.visit(baseUrl); // Ensure the app starts fresh for each test
  });

  //Image validations-------------------------------------------------------------------------------------------------------------
  it('should preview the image when a valid image file is selected', () => {

    // Trigger the edit form for the first book
    cy.get('.book-card').first().within(() => {
      cy.get('input#editBtn').click();
    });

    // Ensure the form is visible
    cy.get("#editFormContainer").should("be.visible");

    // Simulate selecting a valid image file
    const fileName = 'images/valid-test-image.jpg';
    cy.fixture(fileName, 'base64').then(fileContent => {
      cy.get("#editImage").attachFile({
        fileContent: Cypress.Blob.base64StringToBlob(fileContent),
        fileName,
        mimeType: 'image/jpeg',
      });
    });

    // Verify that the image preview is updated and visible
    cy.get('#editBookPreviewImage')
      .should('be.visible')
      .and(($img) => {
        // Ensure the src is updated
        const src = $img.attr('src');
        expect(src).to.match(/^data:image\/jpeg;base64,/); // Check for the base64 prefix
      });
  });

  it('should hide the image preview if the image is not available', () => {
    // Mock the book details API response to exclude the image
    cy.intercept('GET', '/books/*', {
      statusCode: 200,
      body: { 
        _id: '123',
        title: 'Book Without Image',
        author: 'Author Name',
        isbn: '978-0451524935',
        genre: 'Fiction',
        availableCopies: 5,
        image: null, // No image provided
      },
    }).as('getBookDetails');

    // Trigger the edit form for a book
    cy.get('.book-card').first().within(() => {
      cy.get('input#editBtn').click();
    });

    // Wait for the mocked API response
    cy.wait('@getBookDetails');

    // Verify that the image preview element is hidden
    cy.get('#editBookPreviewImage').should('not.be.visible');
  });

  it('should not preview the image and show an alert if the file size is too large', () => {

    cy.get('.book-card').first().within(() => {
      cy.get('input#editBtn').click();
    });

    // Ensure the form is visible
    cy.get("#editFormContainer").should("be.visible");

    // Spy on the window alert
    cy.window().then((win) => {
      cy.spy(win, "alert");
    });

    // Simulate selecting an oversized file
    cy.get("#editImage").attachFile("images/large-test-image.jpg");

    // Check that the alert was called with the correct message
    cy.window().its("alert").should("be.calledWith", "Image size should not exceed 16MB. Please select a smaller file.");
  });

  //ISBN Validations-----------------------------------------------------------------------------------------------------------------
  it('should display an error for ISBN that does not have either 10 or 13 digits exactly', () => {
    // Ensure that the resource we just added is visible in the table
    cy.get('.book-card').first().within(() => {
      cy.get('input#editBtn').click();
    });

    cy.get('#editTitle').clear().type('Some Title');
    cy.get('#editAuthor').clear().type('Some Author');
    cy.get('#editIsbn').clear().type('12345678910'); // Invalid ISBN
    cy.get('#editBookForm').submit();

    cy.on('window:alert', (text) => {
      expect(text).to.contains('Invalid ISBN. Please enter a valid ISBN-10 or ISBN-13.');
    });
  });


  it('should display an error for ISBN-10 containing both numbers and letters', () => {
    // Ensure that the resource we just added is visible in the table
    cy.get('.book-card').first().within(() => {
      cy.get('input#editBtn').click();
    });

    cy.get('#editTitle').clear().type('Some Title');
    cy.get('#editAuthor').clear().type('Some Author');
    cy.get('#editIsbn').clear().type('1234567A89'); // Invalid ISBN
    cy.get('#editBookForm').submit();

    cy.on('window:alert', (text) => {
      expect(text).to.contains('Invalid ISBN. Please enter a valid ISBN-10 or ISBN-13.');
    });
  });

  it('should accept valid ISBN with "X" as the checksum character', () => {
    // Navigate to the edit form
    cy.get('.book-card').first().within(() => {
      cy.get('input#editBtn').click();
    });

    // Input a valid ISBN-10 where the checksum is 'X'
    cy.get('#editTitle').clear().type('Some Title');
    cy.get('#editAuthor').clear().type('Some Author');
    cy.get('#editIsbn').clear().type('156881111X'); // Valid ISBN-10 with 'X' as checksum
    cy.get('#editBookForm').submit();

    // Ensure no alert is displayed
    cy.on('window:alert', (text) => {
      expect(text).not.to.contains('Invalid ISBN');
    });

    // Ensure the form submission was successful
    cy.get('.book-card').should('contain', '156881111X');
  });

  it('should display an error for ISBN with invalid checksum character', () => {
    // Navigate to the edit form
    cy.get('.book-card').first().within(() => {
      cy.get('input#editBtn').click();
    });

    // Input an invalid ISBN-10 with an invalid checksum character
    cy.get('#editTitle').clear().type('Some Title');
    cy.get('#editAuthor').clear().type('Some Author');
    cy.get('#editIsbn').clear().type('123456789Y'); // Invalid checksum character 'Y'
    cy.get('#editBookForm').submit();

    // Validate the error alert
    cy.on('window:alert', (text) => {
      expect(text).to.contains('Invalid ISBN. Please enter a valid ISBN-10 or ISBN-13.');
    });
  });

  it('should display an error for ISBN with exactly 10 digits (invalid format)', () => {
    // Ensure that the resource we just added is visible in the table
    cy.get('.book-card').first().within(() => {
      cy.get('input#editBtn').click();
    });

    cy.get('#editTitle').clear().type('Some Title');
    cy.get('#editAuthor').clear().type('Some Author');
    cy.get('#editIsbn').clear().type('1234567890'); // Invalid ISBN
    cy.get('#editBookForm').submit();

    cy.on('window:alert', (text) => {
      expect(text).to.contains('Invalid ISBN. Please enter a valid ISBN-10 or ISBN-13.');
    });
  });

  it('should display an error for ISBN-13 containing both numbers and letters', () => {
    // Ensure that the resource we just added is visible in the table
    cy.get('.book-card').first().within(() => {
      cy.get('input#editBtn').click();
    });

    cy.get('#editTitle').clear().type('Some Title');
    cy.get('#editAuthor').clear().type('Some Author');
    cy.get('#editIsbn').clear().type('1234567A89123'); // Invalid ISBN
    cy.get('#editBookForm').submit();

    cy.on('window:alert', (text) => {
      expect(text).to.contains('Invalid ISBN. Please enter a valid ISBN-10 or ISBN-13.');
    });
  });

  //Successfull update-----------------------------------------------------------------------------------------------------------------
  
  it('should handle form submission correctly', () => {

    // Trigger the edit form for the first book
    cy.get('.book-card').first().within(() => {
      cy.get('input#editBtn').click();
    });

    // Fill in valid form inputs
    cy.get('#editTitle').clear().type('Valid Book Title');
    cy.get('#editAuthor').clear().type('Valid Author Name');
    cy.get('#editIsbn').clear().type('978-3-16-148410-0');
    cy.get("#editImage").then(($input) => {
      // Trigger change event with no files
      const inputElement = $input[0];
      const changeEvent = new Event('change', { bubbles: true });
      inputElement.value = ''; // Clear the value
      inputElement.dispatchEvent(changeEvent);
    });

    // Stub the PUT request to simulate a successful update
    cy.intercept('PUT', '/updateBook/*', {
      statusCode: 200,
      body: { message: 'Book updated successfully!' },
    }).as('updateBook');

    // Submit the form
    cy.get('#editBookForm').submit();

    // Confirm that the alert displays a success message
    cy.on('window:alert', (text) => {
      expect(text).to.equal('Book updated successfully!');
    });

    // Wait for the PUT request and confirm it was sent
    cy.wait('@updateBook').then((interception) => {
      expect(interception.response.statusCode).to.equal(200);
    });

    // Ensure the form and overlay are closed after submission
    cy.get('#editFormContainer').should('not.be.visible');
    cy.get('#edit-overlay').should('not.be.visible');
  });

  it('should not proceed if user cancels the confirmation dialog', () => {

    // Trigger the edit form for the first book
    cy.get('.book-card').first().within(() => {
      cy.get('input#editBtn').click();
    });

    // Fill in the form with valid data
    cy.get('#editTitle').clear().type('Unique Book Title');
    cy.get('#editAuthor').clear().type('Author Name');
    cy.get('#editIsbn').clear().type('978-3-16-148410-0');

    // Stub the `window.confirm` to simulate the user clicking "Cancel"
    cy.window().then((win) => {
      cy.stub(win, 'confirm').returns(false); // Simulate cancel action
    });

    // Submit the form
    cy.get('#editBookForm').submit();

    // Ensure the confirmation dialog was triggered
    cy.window().its('confirm').should('be.calledWith', 'Are you sure you want to update the book details?');

    // Ensure the form is still visible
    cy.get('#editFormContainer').should('be.visible');
});

  //Tests that interact with backend--------------------------------------------------------------------------------------------
  it('should display an alert if book details fail to fetch for editing', () => {
    // Intercept the GET request for fetching book details with a failed response
    cy.intercept('GET', '/books/*', {
      statusCode: 500,
      body: { message: 'Internal Server Error' },
    }).as('fetchBookDetailsError');

    // Attempt to open the edit form for the first book
    cy.get('.book-card').first().within(() => {
      cy.get('input#editBtn').click();
    });

    // Wait for the intercepted request to be triggered
    cy.wait('@fetchBookDetailsError');

    // Verify the alert message
    cy.on('window:alert', (text) => {
      expect(text).to.contains('Failed to fetch book details for editing.');
    });
  });

  it('should display the alert if there is a network error while fetching book details for editing', () => {
    // Intercept the GET request for fetching book details and force a network error
    cy.intercept('GET', '/books/*', { forceNetworkError: true }).as('fetchBookDetailsError');
  
    // Visit the base URL and set up the console error stub
    cy.visit(baseUrl).then((win) => {
      cy.stub(win.console, 'error').as('consoleError');
    });
  
    // Attempt to open the edit form for the first book
    cy.get('.book-card').first().within(() => {
      cy.get('input#editBtn').click();
    });
  
    // Wait for the intercepted request to fail
    cy.wait('@fetchBookDetailsError');
  
    // Validate the alert message
    cy.on('window:alert', (alertText) => {
      expect(alertText).to.contains('An error occurred while fetching the book details.');
    });
  
    // Ensure the console error was logged
    cy.get('@consoleError').should('be.called');
    cy.get('@consoleError').invoke('getCall', 0).its('args.0').should('contain', 'Error fetching book for editing:');
  });
  

  it('should handle server errors gracefully during update', () => {
    // Stub the PUT request to return a server error
    cy.intercept('PUT', '/updateBook/*', {
      statusCode: 500,
      body: { message: 'Internal Server Error' },
    }).as('updateBookError');

    cy.get('.book-card').first().within(() => {
      cy.get('input#editBtn').click();
    });

    cy.get('#editTitle').clear().type('New Title');
    cy.get('#editBookForm').submit();

    cy.wait('@updateBookError');
    cy.on('window:alert', (text) => {
      expect(text).to.contains('Failed to update book. Please try again later.');
    });
  });

  it('should display an alert and log an error if the book update fails', () => {

    // Trigger the edit form for the first book
    cy.get('.book-card').first().within(() => {
      cy.get('input#editBtn').click();
    });

    // Fill in valid form inputs
    cy.get('#editTitle').clear().type('Updated Book Title');
    cy.get('#editAuthor').clear().type('Updated Author Name');
    cy.get('#editIsbn').clear().type('978-3-16-148410-0');

    // Stub the PUT request to simulate a failure
    cy.intercept('PUT', '/updateBook/*', {
      statusCode: 500,
      body: { message: 'Internal Server Error' },
    }).as('updateBookError');

    // Submit the form
    cy.get('#editBookForm').submit();

    // Confirm that the alert displays the error message
    cy.on('window:alert', (alertText) => {
      expect(alertText).to.contains(
        'An error occurred while updating the book. Please check the console for details.'
      );
    });

    // Wait for the PUT request and ensure it failed
    cy.wait('@updateBookError').then((interception) => {
      expect(interception.response.statusCode).to.equal(500);
    });
  });


  // Title & author validations-----------------------------------------------------------------------------------------------------

  it('should show an alert if the title is not unique', () => {
    // Trigger the edit form for the first book
    cy.get('.book-card').first().within(() => {
      cy.get('input#editBtn').click();
    });

    // Fill in the form with a duplicate title
    cy.get('#editTitle').clear().type('Duplicate Book Title');
    cy.get('#editAuthor').clear().type('Valid Author Name');
    cy.get('#editIsbn').clear().type('978-3-16-148410-0');

    // Stub the fetch call to simulate non-unique title
    cy.intercept('GET', '/books', {
      statusCode: 200,
      body: [
        { title: 'Duplicate Book Title', _id: '123' }, // Existing book with the same title
        { title: 'Another Book Title', _id: '456' },
      ],
    }).as('fetchBooks');

    cy.intercept('GET', '/books/*', {
      statusCode: 200,
      body: {
        title: 'Current Book Title',
        author: 'Current Author',
        isbn: '978-3-16-148410-0',
        _id: '789',
      },
    }).as('fetchBookDetails');

    // Submit the form
    cy.get('#editBookForm').submit();

    // Assert that the alert displays the expected message
    cy.on('window:alert', (text) => {
      expect(text).to.equal('Title already exists. Please choose a different title.');
    });
  });

  it('should prevent updating book with a title > 100', () => {

    cy.get('.book-card').first().within(() => {
      cy.get('input#editBtn').click();
    });

    cy.get('#editTitle').clear().type('a'.repeat(105));
    cy.get('#editAuthor').clear().type('Updated Author');
    cy.get('#editIsbn').clear().type('978-3-16-148410-0');
    cy.get('#editBookForm').submit();

    cy.on('window:alert', (text) => {
      expect(text).to.contains('Title must be 100 characters or fewer.');
    });
  });

  it('should prevent updating book with a author > 150', () => {

    cy.get('.book-card').first().within(() => {
      cy.get('input#editBtn').click();
    });

    cy.get('#editTitle').clear().type('author check Title');
    cy.get('#editAuthor').clear().type('a'.repeat(151));
    cy.get('#editIsbn').clear().type('978-0062439591');
    cy.get('#editBookForm').submit();

    cy.on('window:alert', (text) => {
      expect(text).to.contains('Author name must be 150 characters or fewer.');
    });
  });

});
