const multer = require("multer");

// Use memory storage so uploads work on read-only serverless filesystems (e.g. Vercel) as well as locally
const storage = multer.memoryStorage();

const fileFilter = (request, file, cb) => {
  if (!file.mimetype || !file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image uploads are allowed."));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 4 * 1024 * 1024,
  },
});

module.exports = { upload };
