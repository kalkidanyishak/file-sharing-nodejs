// routes/files.js

const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { upload, uploadDir } = require("../config/multerConfig");
const { broadcastUpdate } = require("../services/sseService");

const router = express.Router();

// Route to upload one or more files
router.post("/upload", upload.array("file"), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send("No files were uploaded.");
  }

  const userName = req.headers["x-user-name"] || "anonymous";
  let errors = [];
  let processedCount = 0;

  req.files.forEach(file => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(file.path);

    stream.on("data", data => hash.update(data));
    stream.on("end", () => {
      const fileHash = hash.digest("hex");
      const sanitizedOriginalName = Buffer.from(file.originalname, "latin1").toString("utf-8");
      const newFileName = `${fileHash}-${userName}-${sanitizedOriginalName}`;
      const newFilePath = path.join(uploadDir, newFileName);

      // Check if a file with the same hash already exists
      const fileExists = fs.readdirSync(uploadDir).some(f => f.startsWith(fileHash));

      if (fileExists) {
        errors.push(`${sanitizedOriginalName}`); // Add original name to list of duplicates
        fs.unlinkSync(file.path); // Clean up the temp file
      } else {
        fs.renameSync(file.path, newFilePath);
      }
      
      processedCount++;
      if (processedCount === req.files.length) {
        broadcastUpdate();
        if (errors.length > 0) {
          return res.status(409).json({ message: "Some files already exist.", duplicates: errors });
        }
        res.send("All files uploaded successfully.");
      }
    });

    stream.on("error", (err) => {
        console.error("Error processing file stream:", err);
        processedCount++; // Still count it as processed to not hang the response
    });
  });
});

// Route to list all files
router.get("/files", (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      return res.status(500).send("Could not list files.");
    }
    const fileDetails = files.map(file => {
      const stats = fs.statSync(path.join(uploadDir, file));
      const parts = file.split("-");
      return {
        filename: file,
        hash: parts[0],
        uploaderName: parts[1],
        originalName: parts.slice(2).join("-"),
        size: (stats.size / (1024 * 1024)).toFixed(2), // in MB
        lastModified: stats.mtime.toLocaleString(),
      };
    });
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.json(fileDetails);
  });
});

// Route to download a specific file
router.get("/files/:filename", (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).send("File not found.");
    }

    const originalName = filename.split("-").slice(2).join("-");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename*=UTF-8''${encodeURIComponent(originalName)}`
    );
    fs.createReadStream(filePath).pipe(res);
});

// Route to delete a file by its hash
router.delete("/files/:hash", (req, res) => {
    const { hash } = req.params;
    const fileToDelete = fs.readdirSync(uploadDir).find(f => f.startsWith(hash));

    if (!fileToDelete) {
        return res.status(404).send("File not found.");
    }

    fs.unlink(path.join(uploadDir, fileToDelete), (err) => {
        if (err) {
            return res.status(500).send("Error deleting the file.");
        }
        broadcastUpdate();
        res.send("File deleted successfully.");
    });
});

// Route to delete all files
router.delete("/files", (req, res) => {
    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            return res.status(500).send("Error reading files directory.");
        }
        files.forEach(file => {
            fs.unlinkSync(path.join(uploadDir, file));
        });
        broadcastUpdate();
        res.status(200).send("All files deleted successfully.");
    });
});

module.exports = router;