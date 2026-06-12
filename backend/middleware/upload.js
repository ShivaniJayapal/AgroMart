const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },

  filename: function (req, file, cb) {
    cb(
      null,
      Date.now() + path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpg|jpeg|png/;

  const ext = allowed.test(
    path.extname(file.originalname).toLowerCase()
  );

  if (ext) {
    cb(null, true);
  } else {
    cb("Only images allowed");
  }
};

const upload = multer({
  storage,
  fileFilter,
});

module.exports = upload;