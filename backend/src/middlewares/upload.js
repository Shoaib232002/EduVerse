const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Export both single and array upload for flexibility
module.exports = {
  upload,
  singleFile: upload.single('file'),
  multipleFiles: upload.array('files', 10) // max 10 files
}; 