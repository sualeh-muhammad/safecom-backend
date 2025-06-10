const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer configuration for memory storage (we'll upload to Cloudinary manually)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Helper function to upload single image to Cloudinary
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        ...options,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    ).end(buffer);
  });
};

// Helper function to upload multiple images to Cloudinary
const uploadMultipleToCloudinary = async (files, folderPrefix = 'uploads') => {
  try {
    const uploadPromises = files.map((file, index) => {
      return uploadToCloudinary(file.buffer, {
        folder: folderPrefix,
        public_id: `${folderPrefix}_${Date.now()}_${index}`,
        transformation: [
          { width: 1024, height: 1024, crop: 'limit' },
          { quality: 'auto' },
          { format: 'auto' }
        ]
      });
    });

    const results = await Promise.all(uploadPromises);
    
    return results.map((result, index) => ({
      url: result.secure_url,
      publicId: result.public_id,
      originalName: files[index].originalname,
      size: files[index].size,
      uploadedAt: new Date().toISOString()
    }));

  } catch (error) {
    console.error('Error uploading multiple images:', error);
    throw new Error('Failed to upload images to Cloudinary');
  }
};

// Helper function to process base64 images and upload them
const uploadBase64ImagesToCloudinary = async (base64Images, folderPrefix = 'uploads') => {
  try {
    const uploadPromises = base64Images.map((imageData, index) => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
          imageData.dataUrl,
          {
            folder: folderPrefix,
            public_id: `${folderPrefix}_${Date.now()}_${index}`,
            transformation: [
              { width: 1024, height: 1024, crop: 'limit' },
              { quality: 'auto' },
              { format: 'auto' }
            ]
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve({
                url: result.secure_url,
                publicId: result.public_id,
                originalName: imageData.name || `image_${index}`,
                size: imageData.size || 0,
                uploadedAt: new Date().toISOString()
              });
            }
          }
        );
      });
    });

    const results = await Promise.all(uploadPromises);
    return results;

  } catch (error) {
    console.error('Error uploading base64 images:', error);
    throw new Error('Failed to upload images to Cloudinary');
  }
};

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB per file.'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'File upload error: ' + error.message
    });
  }
  
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({
      success: false,
      message: 'Only image files are allowed!'
    });
  }
  
  next(error);
};

module.exports = {
  upload,
  uploadToCloudinary,
  uploadMultipleToCloudinary,
  uploadBase64ImagesToCloudinary,
  handleMulterError,
  cloudinary
};