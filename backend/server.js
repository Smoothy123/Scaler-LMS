const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();

app.use(cors()); // ✅ this fixes CORS
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const lectureRoutes = require('./routes/lectures');

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lectures', lectureRoutes);

const PORT = process.env.PORT || 5000;
console.log("Starting server...");
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
