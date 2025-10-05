const express = require('express');
const router = express.Router();
const dynamoDB = require('../config/db');
const authMiddleware = require('../middlewares/auth');
const { v4: uuidv4 } = require('uuid');

const LECTURES_TABLE = "Lectures";
const COURSES_TABLE = "Courses";

// ================= Add lecture =================
router.post('/', authMiddleware, async (req, res) => {
  const { courseId, title, content, type, week, youtubeUrl } = req.body;

  if (!courseId || !title || !type || !week) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // check course ownership
  const course = await dynamoDB.get({
    TableName: COURSES_TABLE,
    Key: { courseId }
  }).promise();

  if (!course.Item || course.Item.instructorId !== req.user.userId) {
    return res.status(403).json({ message: "Not authorized to add lecture" });
  }

  const lectureId = uuidv4();
  const params = {
    TableName: LECTURES_TABLE,
    Item: { 
      lectureId,
      courseId,
      title,
      content: content || "",
      type, // video / reading / quiz
      week: Number(week),
      youtubeUrl: youtubeUrl || ""
    }
  };

  try {
    await dynamoDB.put(params).promise();
    res.json({ message: "Lecture added successfully", lectureId });
  } catch (err) {
    console.error("DynamoDB error:", err);
    res.status(500).json({ message: "Failed to add lecture" });
  }
});

// ================= Get lectures for a course =================
router.get('/:courseId', authMiddleware, async (req, res) => {
  const { courseId } = req.params;
  if (!courseId) return res.status(400).json({ message: "Course ID is required" });

  const params = {
    TableName: LECTURES_TABLE,
    FilterExpression: 'courseId = :cid',
    ExpressionAttributeValues: { ':cid': courseId }
  };

  try {
    const data = await dynamoDB.scan(params).promise();
    const sortedLectures = data.Items.sort((a, b) => a.week - b.week);
    res.json(sortedLectures);
  } catch (err) {
    console.error("DynamoDB scan error:", err);
    res.status(500).json({ message: "Failed to fetch lectures" });
  }
});

// ================= Update lecture =================
router.put('/:lectureId', authMiddleware, async (req, res) => {
  const { lectureId } = req.params;
  const { title, content, type, week, youtubeUrl } = req.body;

  try {
    // get lecture
    const lecture = await dynamoDB.get({
      TableName: LECTURES_TABLE,
      Key: { lectureId }
    }).promise();

    if (!lecture.Item) return res.status(404).json({ message: "Lecture not found" });

    // check ownership via course
    const course = await dynamoDB.get({
      TableName: COURSES_TABLE,
      Key: { courseId: lecture.Item.courseId }
    }).promise();

    if (!course.Item || course.Item.instructorId !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized to edit this lecture" });
    }

    const params = {
      TableName: LECTURES_TABLE,
      Key: { lectureId },
      UpdateExpression: "set #t = :t, #c = :c, #type = :ty, #w = :w, #y = :y",
      ExpressionAttributeNames: {
        "#t": "title",
        "#c": "content",
        "#type": "type",
        "#w": "week",
        "#y": "youtubeUrl"
      },
      ExpressionAttributeValues: {
        ":t": title || lecture.Item.title,
        ":c": content || lecture.Item.content,
        ":ty": type || lecture.Item.type,
        ":w": week || lecture.Item.week,
        ":y": youtubeUrl || lecture.Item.youtubeUrl
      }
    };

    await dynamoDB.update(params).promise();
    res.json({ message: "Lecture updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update lecture" });
  }
});

// ================= Delete lecture =================
router.delete('/:lectureId', authMiddleware, async (req, res) => {
  const { lectureId } = req.params;

  try {
    const lecture = await dynamoDB.get({
      TableName: LECTURES_TABLE,
      Key: { lectureId }
    }).promise();

    if (!lecture.Item) return res.status(404).json({ message: "Lecture not found" });

    // check ownership
    const course = await dynamoDB.get({
      TableName: COURSES_TABLE,
      Key: { courseId: lecture.Item.courseId }
    }).promise();

    if (!course.Item || course.Item.instructorId !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized to delete this lecture" });
    }

    await dynamoDB.delete({
      TableName: LECTURES_TABLE,
      Key: { lectureId }
    }).promise();

    res.json({ message: "Lecture deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete lecture" });
  }
});

module.exports = router;
