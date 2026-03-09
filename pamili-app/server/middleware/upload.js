const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configure Cloudinary using environment variables
// The SDK automatically picks up CLOUDINARY_URL from process.env if present.
// We only call config to ensure 'secure' is true.
cloudinary.config({
  secure: true
});

// Explicitly support separate keys if they are used instead of CLOUDINARY_URL
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Use memory storage for multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * Uploads a buffer to Cloudinary and returns the secure URL and public_id
 * @param {Buffer} buffer - The file buffer
 * @param {String} folder - The folder to upload to
 * @returns {Promise<Object>} { url, public_id }
 */
const uploadToCloudinary = (buffer, folder = 'pamili') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          public_id: result.public_id
        });
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

/**
 * Deletes an image from Cloudinary
 * @param {String} public_id - The public ID of the resource
 * @returns {Promise}
 */
const deleteFromCloudinary = async (public_id) => {
  if (!public_id) return;
  try {
    return await cloudinary.uploader.destroy(public_id);
  } catch (error) {
    console.error('Cloudinary destruction error:', error);
  }
};

module.exports = {
  upload,
  uploadToCloudinary,
  deleteFromCloudinary
};
