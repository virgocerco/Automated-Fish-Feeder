// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');

// Initialize the Firebase Admin SDK
const serviceAccount = require('./node-time-testing-only/serviceAccountKey.json'); // Replace with your actual path

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://sixteen-app-db-default-rtdb.asia-southeast1.firebasedatabase.app' // Replace with your Firebase database URL
});

const db = admin.database();
const app = express();
const port = 3000;

// Middleware to parse incoming JSON requests
app.use(bodyParser.json());

// Function to update Philippine time in Firebase
function updatePhilippineTime() {
  const now = new Date();

  // Convert to Philippine Time (GMT+8)
  const philippineTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));

  const hour = philippineTime.getHours();
  const minute = philippineTime.getMinutes();

  // Update the Firebase RTDB
  db.ref('/HISTORY/philippineTime').set({
    hour,
    minute
  })
  .then(() => {
    console.log('Philippine time updated successfully');
  })
  .catch(error => {
    console.error('Error updating time:', error);
  });
}

// Schedule updates every second
setInterval(updatePhilippineTime, 1000);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
