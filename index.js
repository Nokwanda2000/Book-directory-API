const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const dotenv = require('dotenv')



dotenv.config();
const app = express();
const PORT = 3000;
const API_KEY = process.env.API_KEY;
console.log("Loaded API Key:", process.env.API_KEY);
app.use(bodyParser.json());

// Middleware for API key authorization
app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== API_KEY) {
    return res.status(403).json({ error: 'Forbidden: Invalid API Key' });
  }
  next();
});

// Helper functions to read and write to `books.json`
const readBooks = () => JSON.parse(fs.readFileSync('books.json'));
const writeBooks = (data) => fs.writeFileSync('books.json', JSON.stringify(data, null, 2));

// GET: Retrieve all books or specific book by ISBN
app.get('/books', (req, res) => {
  const books = readBooks();
  const { isbn } = req.query;
  if (isbn) {
    const book = books.find((b) => b.isbn === isbn);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    return res.json(book);
  }
  res.json(books);
});

// POST: Add a new book
app.post('/books', (req, res) => {
  const { title, author, publisher, publishedDate, isbn } = req.body;
  if (!title || !author || !isbn || isNaN(isbn)) {
    return res.status(400).json({ error: 'Invalid input' });
  }
  const books = readBooks();
  const newBook = { title, author, publisher, publishedDate, isbn };
  books.push(newBook);
  writeBooks(books);
  res.status(201).json(newBook);
});

// PUT/PATCH: Update an existing book by ISBN
app.put('/books/:isbn', (req, res) => {
  const { isbn } = req.params;
  const { title, author, publisher, publishedDate } = req.body;
  const books = readBooks();
  const bookIndex = books.findIndex((b) => b.isbn === isbn);
  if (bookIndex === -1) return res.status(404).json({ error: 'Book not found' });

  const updatedBook = { ...books[bookIndex], title, author, publisher, publishedDate };
  books[bookIndex] = updatedBook;
  writeBooks(books);
  res.json(updatedBook);
});

// DELETE: Remove a book by ISBN
app.delete('/books/:isbn', (req, res) => {
  const { isbn } = req.params;
  const books = readBooks();
  const filteredBooks = books.filter((b) => b.isbn !== isbn);
  if (filteredBooks.length === books.length) return res.status(404).json({ error: 'Book not found' });

  writeBooks(filteredBooks);
  res.status(204).end();
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
