const multer = require("multer");

const storage = multer.diskStorage({
  destination: (request, file, cb) => cb(null, "uploads/"),
  filename: (request, file, cb) =>
    cb(null,`${Date.now()}-${file.originalname}`),   
});

const upload = multer({ storage });

module.exports = { upload };