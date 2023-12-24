const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
//storage
const multerStorage = multer.memoryStorage();


const multerFilter = (req, file, cb) => {
  // Check if the file mimetype starts with "image"
  if (file.mimetype.startsWith("image")) {
    cb(null, true); // Accept the file
  } else {
    // Reject the file with an error message
    cb(
      {
        message: "Unsupported file format. Please upload an image.",
      },
      false
    );
  }
};



const photoUpload = multer({
  storage: multerStorage,
  fileFilter: multerFilter, // Use the multerFilter function here
  limits: { fileSize: 1000000 },
});

//Image Resizing
const profilePhotoResize = async (req, res, next) => {
  //check if there is no file
  if (!req.file) return next();
  req.file.filename = `user-${Date.now()}-${req.file.originalname}`;

  await sharp(req.file.buffer)
    .resize(250, 250)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(path.join(`public/images/profile/${req.file.filename}`));
  next();
};

//Post Image Resizing
const postImgResize = async (req, res, next) => {

  //check if there is no file
  if (!req.file) return next();

  req.file.filename = `user-${Date.now()}-${req.file.originalname}`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpg")
    .jpeg({ quality: 90 })
    .toFile(path.join(`public/images/posts/${req.file.filename}`));
  next();
};
module.exports = { photoUpload, profilePhotoResize, postImgResize };
