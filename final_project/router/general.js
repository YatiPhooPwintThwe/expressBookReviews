const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();


public_users.post("/register", (req, res) => {
    const { username, password } = req.body || {};
    if (!isValid(username)) return res.status(400).json({ message: "Invalid username" });
    if (!password)          return res.status(400).json({ message: "Password is required" });
    if (users.find(u => u.username === username))
      return res.status(409).json({ message: "User already exists" });
  
    users.push({ username, password });
    return res.status(200).json({ message: "Customer successfully registered. Now you can login" });
  });
  const base = (req) => `${req.protocol}://${req.get("host")}`;

/* ---------- INTERNAL: NO Axios ---------- */
public_users.get("/_internal/books", (req, res) => {
  res.status(200).json({ books });
});

public_users.get("/_internal/isbn/:isbn", (req, res) => {
  const b = books[req.params.isbn];
  if (!b) return res.status(404).json({ message: "Book not found" });
  res.status(200).json(b);
});

public_users.get("/_internal/author/:author", (req, res) => {
  const a = req.params.author.toLowerCase();
  const out = Object.entries(books)
    .filter(([, b]) => b.author && b.author.toLowerCase() === a)
    .map(([isbn, b]) => ({ isbn, title: b.title, reviews: b.reviews }));
  if (!out.length) return res.status(404).json({ message: "Author not found" });
  res.status(200).json(out);
});

public_users.get("/_internal/title/:title", (req, res) => {
  const t = req.params.title.toLowerCase();
  const out = Object.entries(books)
    .filter(([, b]) => b.title && b.title.toLowerCase() === t)
    .map(([isbn, b]) => ({ isbn, author: b.author, reviews: b.reviews }));
  if (!out.length) return res.status(404).json({ message: "Title not found" });
  res.status(200).json(out);
});

/* ---------- PUBLIC (Tasks 10–13): USE Axios ---------- */
// Task 10: all books  (also add this as "/" so your Postman GET / works)
public_users.get("/", async (req, res) => {
  try {
    const r = await axios.get(`${base(req)}/_internal/books`);
    res.status(200).json(r.data);
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch books", error: e.message });
  }
});

// Task 11: by ISBN
public_users.get("/isbn/:isbn", async (req, res) => {
  try {
    const r = await axios.get(`${base(req)}/_internal/isbn/${encodeURIComponent(req.params.isbn)}`);
    res.status(200).json(r.data);
  } catch (e) {
    res.status(404).json({ message: "Book not found", error: e.message });
  }
});

// Task 12: by author
public_users.get("/author/:author", async (req, res) => {
  try {
    const r = await axios.get(`${base(req)}/_internal/author/${encodeURIComponent(req.params.author)}`);
    res.status(200).json(r.data);
  } catch (e) {
    res.status(404).json({ message: "Author not found", error: e.message });
  }
});

// Task 13: by title
public_users.get("/title/:title", async (req, res) => {
  try {
    const r = await axios.get(`${base(req)}/_internal/title/${encodeURIComponent(req.params.title)}`);
    res.status(200).json(r.data);
  } catch (e) {
    res.status(404).json({ message: "Title not found", error: e.message });
  }
});


//  Get book review
public_users.get('/review/:isbn', (req, res) => {
    const { isbn } = req.params;
    const book = books[isbn];
    if (!book) return res.status(404).json({ message: "Book not found" });
  
    const reviews = book.reviews || {};
    // return only the reviews, wrapped
    return res.status(200).send(JSON.stringify({ reviews }, null, 4));
  });
module.exports.general = public_users;
