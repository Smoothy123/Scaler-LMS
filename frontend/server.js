const express = require('express');
const path = require('path');
const app = express();

// Serve all static files in this folder
app.use(express.static(__dirname));

// Default route -> serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Frontend running on port ${PORT}`);
});
