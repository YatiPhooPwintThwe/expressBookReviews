const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username)=> //returns boolean
    typeof username === 'string' && username.trim().length > 0;
//write code to check is the username is valid


const authenticatedUser = (username,password)=>{ //returns boolean
    return users.some(u => u.username === username && u.password === password);

//write code to check if username and password match the one we have in records.
}

//only registered users can login
regd_users.post("/login", (req, res) => {
    const { username, password } = req.body || {};
  
    if (!isValid(username) || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    if (!authenticatedUser(username, password)) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
  
    // issue JWT and store in session (plus username for later)
    const accessToken = jwt.sign({ username }, "access", { expiresIn: 60 * 60 });
    req.session.authorization = { accessToken, username };
  
    return res.status(200).json({ message: "Customer logged in successfully" });
  });

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
    const { isbn } = req.params;
    const review = req.query.review;          // per lab: ?review=good
  
    if (!review) {
      return res.status(400).json({ message: "Review query parameter is required (?review=...)" });
    }
  
    const book = books[isbn];
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
  
    // username from session (set at login)
    const username = req.session?.authorization?.username;
    if (!username) {
      return res.status(401).json({ message: "User not logged in" });
    }
  
    if (!book.reviews) book.reviews = {};
    book.reviews[username] = review;          // add or update
  
    // match the sample screenshot’s plain-text response
    return res.status(200).send(`The review for the book with ISBN ${isbn} has been added/updated.`);
  });
  regd_users.delete("/auth/review/:isbn", (req, res) => {
    const { isbn } = req.params;
  
    // who is logged in (set at /customer/login)
    const username = req.session?.authorization?.username;
    if (!username) {
      return res.status(401).json({ message: "User not logged in" });
    }
  
    const book = books[isbn];
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
  
    // no reviews or no review by this user
    if (!book.reviews || !book.reviews[username]) {
      return res
        .status(404)
        .send(`No reviews for the ISBN ${isbn} posted by the user ${username} to delete.`);
    }
  
    // delete only this user's review
    delete book.reviews[username];
  
    // match the lab's sample response
    return res
      .status(200)
      .send(`Reviews for the ISBN ${isbn} posted by the user ${username} deleted.`);
  });  

module.exports = {
    authenticated: regd_users,
    isValid,
    users,
    authenticatedUser
}
