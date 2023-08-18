const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const cors = require('cors'); // Import the 'cors' package

dotenv.config();
const app = express();
const port = process.env.PORT || 5000; // Allow using the port defined in the environment or use 3000 by default

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

// Define a schema and create a model
const dataSchema = new mongoose.Schema({
  name: String,
  email: String,
  course: String,
});

const Data = mongoose.model('Data', dataSchema);

// Set up multer to handle file uploads
const upload = multer({ dest: 'uploads/' });

// Use cors middleware
app.use(cors());

// Serve the index.html file
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/excel.html');
});

// Handle form submission and save data to MongoDB
app.post('/upload', upload.single('excelFile'), async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).send('No file uploaded.');
  }

  const filePath = file.path;

  try {
    // Read the Excel file
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet);

    // Save each row to the MongoDB database
    for (const data of jsonData) {
      await Data.create(data);
    }

    res.send('Data uploaded successfully.');
  } catch (error) {
    console.error('Error saving data to MongoDB:', error);
    res.status(500).send('Error saving data to MongoDB.');
  } finally {
    // Delete the uploaded file after processing
    fs.unlinkSync(filePath);
  }
});

// GET API to retrieve all data from MongoDB
app.get('/data', async (req, res) => {
  try {
    const allData = await Data.find();
    res.json(allData);
  } catch (error) {
    console.error('Error retrieving data from MongoDB:', error);
    res.status(500).send('Error retrieving data from MongoDB.');
  }
});
// GET API to authenticate user based on name and email
app.get('/authenticate', async (req, res) => {
  const { name, email } = req.query;
  try {
    const user = await Data.findOne({ name, email });
    if (user) {
      res.json(true); // User is authenticated
    } else {
      res.json(false); // User is not authenticated
    }
  } catch (error) {
    console.error('Error authenticating user:', error);
    res.status(500).send('Error authenticating user.');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
