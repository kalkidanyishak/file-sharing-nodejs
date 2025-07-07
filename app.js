// index.js

const express = require("express");
const cors = require("cors");
const path = require("path");

// Import route handlers
const fileRoutes = require("./routes/files");
const systemRoutes = require("./routes/system");

const app = express();
const port = 5000;

// --- Global Middleware ---
// Allow Cross-Origin Resource Sharing
app.use(cors());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// --- Routes ---
// Use the imported routers
app.use(fileRoutes);   // Handles /upload, /files, etc.
app.use(systemRoutes); // Handles /get-ip, /events

// Main route to serve the application's front-end
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// --- Server Startup ---
app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`Access on your local network might be available at other IPs.`);
});