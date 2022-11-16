const cloudinary = require("cloudinary");

const cloudinaryConfig = cloudinary.config({
    cloud_name: process.env.COOKIE_CLOUD_NAME,
    api_key: process.env.COOKIE_CLOUD_API_KEY,
    api_secret: process.env.COOKIE_CLOUD_SECRET,
    secure: true
});

module.exports = cloudinaryConfig