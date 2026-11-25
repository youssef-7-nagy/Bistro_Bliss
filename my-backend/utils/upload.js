const multer = require("multer");

const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

// Use memory storage so uploads work on read-only serverless filesystems (e.g. Vercel) as well as locally
const storage = multer.memoryStorage();

const fileFilter = (request, file, cb) => {
  if (!file.mimetype || !ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase())) {
    return cb(new Error("Only PNG, JPG, and WEBP image uploads are allowed."));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 4 * 1024 * 1024,
    files: 5,
  },
});

const uploadDishImages = (req, res, next) => {
  upload.array("images", 5)(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "Each image must be 4 MB or smaller." });
      }
      if (err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({ message: "You can upload up to 5 images per dish." });
      }
      return res.status(400).json({ message: err.message });
    }
    return res.status(400).json({ message: err.message || "Invalid image upload." });
  });
};

module.exports = { upload, uploadDishImages };
