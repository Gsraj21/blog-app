const cloudinary = require('cloudinary').v2;
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
  });

const cloudinaryUploadImg = async(fileToUpload)=>{
    try{
        const data = await cloudinary.uploader.upload(fileToUpload,{
            resource_type:"auto",

        })
        return {
            url:data.secure_url
        }; 
    }catch(error){
        return error;
    }
}

module.exports = cloudinaryUploadImg
 