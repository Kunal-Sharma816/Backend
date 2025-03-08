import { v2 as cloudinary } from "cloudinary";
import fs from "fs"; // use to handle file system

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUNDINARY_API_KEY,
  api_secret: process.env.CLOUNDINARY_API_SECRET,
});

// Upload an image
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // file uploded successfully
    console.log("file is upload on cloudinary", response.url);
    fs.unlinkSync(localFilePath)
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved tempary file as the upload operation got failed
    // console.log(error);
    return null;
  }
};

export { uploadOnCloudinary };
