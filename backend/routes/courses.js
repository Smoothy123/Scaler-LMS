const express = require('express');
const router = express.Router();
const dynamoDB = require('../config/db');
const authMiddleware = require('../middlewares/auth');
const { v4: uuidv4 } = require('uuid');

const COURSES_TABLE = "Courses";

// ================= CREATE COURSE =================
router.post('/', authMiddleware, (req, res) => {
  const { title, description } = req.body;
  const courseId = uuidv4();

  const params = {
    TableName: COURSES_TABLE,
    Item: { courseId, instructorId: req.user.userId, title, description }
  };

  dynamoDB.put(params, (err) => {
    if (err) return res.status(500).json({ message: err });
    res.json({ message: "Course created successfully" });
  });
});

// ================= GET ALL COURSES FOR STUDENT =================
router.get('/', authMiddleware, (req, res) => {
  const params = {
    TableName: COURSES_TABLE
  };

  dynamoDB.scan(params, (err, data) => {
    if (err) return res.status(500).json({ message: err });
    res.json(data.Items); // send all courses to student
  });
});

// ================= SEARCH COURSES =================
router.get('/search', authMiddleware, (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ message: "Query is required" });

  const params = {
    TableName: COURSES_TABLE,
    FilterExpression: 'contains(#title, :q) OR contains(#desc, :q)',
    ExpressionAttributeNames: {
      "#title": "title",
      "#desc": "description"
    },
    ExpressionAttributeValues: {
      ":q": query
    }
  };

  dynamoDB.scan(params, (err, data) => {
    if (err) return res.status(500).json({ message: err });
    res.json(data.Items);
  });
});

module.exports = router;


