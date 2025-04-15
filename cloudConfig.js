const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name : process.env.CLOUD_NAME,
    api_key : process.env.CLOUD_API_KEY,
    api_secret : process.env.CLOUD_API_SECRET,
});

const postsStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'ChessApp/posts',
      allowed_formats: ["jpg","jpeg","png"],
      transformation: [
        { quality: "auto", fetch_format: "auto" }  
      ]
    },
});

const profileStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'ChessApp/profile',
      allowed_formats: ["jpg","jpeg","png"],
      transformation: [
        { quality: "auto", fetch_format: "auto" }  
      ]
    },
});

module.exports={cloudinary,postsStorage,profileStorage};