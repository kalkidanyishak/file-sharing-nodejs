const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const fse = require("fs-extra");
const cors = require("cors");
const os = require("os");
const crypto = require("crypto"); // Import the crypto module
const app = express();
const port = 5000;
const uploadDir = path.join(__dirname, "uploads");

// Ensure the upload directory exists
fse.ensureDirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const sanitizedFileName = Buffer.from(file.originalname, "latin1").toString(
      "utf-8"
    );
    cb(null, sanitizedFileName); // Use the sanitized file name
  },
});

const upload = multer({ storage: storage });

// Allow CORS for all routes
app.use(cors());

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Route to serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

let clients = [];

app.get("/events", (req, res) => {
  // Set headers for SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Send an initial event to acknowledge the connection
  res.write("data: Connection established\n\n");

  // Store the connection
  clients.push(res);

  // Remove the client when it closes the connection
  req.on("close", () => {
    clients = clients.filter((client) => client !== res);
    console.log("Client disconnected");
  });

  console.log("New SSE connection established");
});


app.post("/upload", upload.array("file"), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send("No files were uploaded.");
  }

  const userName = req.headers["x-user-name"];
  let errors = [];
  let filesProcessed = 0;

  for (const file of req.files) {
    const hash = crypto.createHash("sha256");
    const input = fs.createReadStream(file.path);

    input.on("readable", () => {
      const data = input.read();
      if (data) {
        hash.update(data);
      } else {
        const fileHash = hash.digest("hex");
        continueProcessing(req, res, fileHash, file, userName, (err) => {
          if (err) {
            errors.push(err);
          }
          filesProcessed++;
          if (filesProcessed === req.files.length) {
            // If all files are processed, send the response
            if (errors.length > 0) {
              return res.status(409).send(JSON.stringify(errors));
            }
            res.send("All files uploaded successfully.");
          }
        });
      }
    });

    input.on("error", (err) => {
      console.error("Error reading file for hashing:", err);
      fs.unlink(file.path, () => {});
      errors.push("Error processing file.");
      filesProcessed++;
      if (filesProcessed === req.files.length) {
        if (errors.length > 0) {
          return res.status(500).send(errors.join(", "));
        }
        res.status(500).send("Error processing files.");
      }
    });
  }

  function continueProcessing(req, res, fileHash, file, userName, callback) {
    const sanitizedOriginalName = Buffer.from(
      file.originalname,
      "latin1"
    ).toString("utf-8");
    const newFileName = `${fileHash}-${userName}-${sanitizedOriginalName}`;
    const newFilePath = path.join(uploadDir, newFileName);

    fs.readdir(uploadDir, (err, files) => {
      if (err) {
        console.error("Error reading directory:", err);
        fs.unlink(file.path, () => {});
        return callback("Error listing files.");
      }

      const fileExists = files.some((existingFile) =>
        existingFile.startsWith(fileHash)
      );
      if (fileExists) {
        // Clean up temp file
        fs.unlink(file.path, (err) => {
          if (err) {
            console.error("Error deleting temp file:", err);
          }
        });
        return callback(`${newFileName}`);
      }

      fs.rename(file.path, newFilePath, (err) => {
        if (err) {
          console.error("Error renaming file:", err);
          fs.unlink(file.path, () => {});
          return callback("Error saving file.");
        }

        const message = {
          event: "data-retrieved",
          timestamp: new Date(),
        };

        clients.forEach((client) => {
          client.write(`data: ${JSON.stringify(message)}\n\n`);
        });

        callback(null); // File successfully processed
      });
    });
  }
});

app.get("/files", (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      console.error("Error reading directory:", err);
      return res.status(500).send("Could not list files.");
    }

    const fileDetailsPromises = files.map((file) => {
      return new Promise((resolve, reject) => {
        const filePath = path.join(uploadDir, file);
        fs.stat(filePath, (err, stats) => {
          if (err) {
            reject(err);
          } else {
            resolve({
              filename: file,
              uploaderName: file.split("-")[1],
              originalName: file.split("-").slice(2).join("-"),
              size: (stats.size / (1024 * 1024)).toFixed(2),
              lastModified: stats.mtime.toLocaleString(),
            });
          }
        });
      });
    });

    Promise.all(fileDetailsPromises)
      .then((fileDetails) => {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.json(fileDetails);
      })
      .catch((err) => {
        console.error("Error getting file details:", err);
        res.status(500).send("Could not retrieve file details.");
      });
  });
});

app.get("/get-ip", (req, res) => {
  const networkInterfaces = os.networkInterfaces();
  const wifiInterfaceNames = ["en0", "wlan0", "Wi-Fi", "Wireless Network Connection"];
  let wifiIp = null;

  for (const name of wifiInterfaceNames) {
    const iface = networkInterfaces[name];
    if (iface) {
      for (const info of iface) {
        if (!info.internal && info.family === "IPv4") {
          wifiIp = info.address;
          break;
        }
      }
    }
    if (wifiIp) break;
  }

  if (wifiIp) {
    res.json({ ip: wifiIp });
  } else {
    res.status(404).json({ error: "Wi-Fi IP not found" });
  }
});

app.get("/files/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadDir, filename);

  const fileStream = fs.createReadStream(filePath);

  fileStream.on("error", (err) => {
    console.error("Error streaming file:", err);
    res.status(404).send("File not found.");
  });

  const encodedFilename = encodeURIComponent(
    filename.split("-").slice(2).join("-")
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename*=UTF-8''${encodedFilename}`
  );
  fileStream.pipe(res);
});

app.delete("/files/:hash", (req, res) => {
  const fileHash = req.params.hash;
  const filePath = path.join(
    uploadDir,
    fs.readdirSync(uploadDir).find((file) => file.startsWith(fileHash))
  );

  if (!filePath) {
    return res.status(404).send("File not found.");
  }

  fs.unlink(filePath, (err) => {
    if (err) {
      console.error("Error deleting file:", err);
      return res.status(500).send("Error deleting the file.");
    }
    res.send("File deleted successfully.");

    const message = { event: "data-retrieved", timestamp: new Date() };

    // Notify all connected clients via SSE
    clients.forEach((client) => {
      client.write(`data: ${JSON.stringify(message)}\n\n`);
    });
  });
});

app.delete("/files", (req, res) => {
  const filesDir = "./uploads";
  fs.readdir(filesDir, (err, files) => {
    if (err) {
      return res.status(500).send("Error reading files directory");
    }

    // Delete all files
    files.forEach((file) => {
      const filePath = path.join(filesDir, file);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Error deleting file ${file}:`, err);
        }
      });
    });

    res.status(200).send("All files deleted successfully");
    const message = { event: "data-retrieved", timestamp: new Date() };

    // Notify all connected clients via SSE
    clients.forEach((client) => {
      client.write(`data: ${JSON.stringify(message)}\n\n`);
    });
  });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on http://localhost:${port}`);
});
