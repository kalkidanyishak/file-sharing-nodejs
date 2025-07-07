// config/multerConfig.js

const multer = require("multer");
const path = require("path");
const fse = require("fs-extra");

const uploadDir = path.join(__dirname, "..", "uploads");

// Ensure the upload directory exists
fse.ensureDirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Sanitize file name to handle special characters correctly
    const sanitizedFileName = Buffer.from(file.originalname, "latin1").toString(
      "utf-8"
    );
    cb(null, sanitizedFileName);
  },
});

const upload = multer({ storage: storage });

module.exports = { upload, uploadDir };