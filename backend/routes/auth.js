const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dynamoDB = require('../config/db');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const USERS_TABLE = "Users"; // DynamoDB table

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) return res.status(400).json({ message: "Username and password required" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    const params = {
      TableName: USERS_TABLE,
      Item: { userId, username, password: hashedPassword }
    };

    dynamoDB.put(params, (err) => {
      if (err) return res.status(500).json({ message: "Error creating user", error: err });
      res.json({ message: "User created successfully" });
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) return res.status(400).json({ message: "Username and password required" });

  // Use query if username is not the primary key (requires GSI on username)
  const params = {
    TableName: USERS_TABLE,
    IndexName: "username-index",
    KeyConditionExpression: "username = :u",
    ExpressionAttributeValues: { ":u": username }
  };

  dynamoDB.query(params, async (err, data) => {
    if (err) return res.status(500).json({ message: "Error fetching user", error: err });
    if (!data.Items || data.Items.length === 0) return res.status(404).json({ message: "User not found" });

    const user = data.Items[0];
    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign({ userId: user.userId, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  });
});

module.exports = router;
