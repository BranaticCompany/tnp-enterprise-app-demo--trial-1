const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/resumes');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename: studentId_timestamp.pdf
        const studentId = req.params.id || req.user.id;
        const timestamp = Date.now();
        const extension = path.extname(file.originalname);
        cb(null, `student_${studentId}_${timestamp}${extension}`);
    }
});

// File filter to accept only PDF files
const fileFilter = (req, file, cb) => {
    console.log('File upload attempt:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
    });

    // Check if file is PDF
    if (file.mimetype === 'application/pdf' || path.extname(file.originalname).toLowerCase() === '.pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed'), false);
    }
};

// Configure multer with validation
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 1 // Only one file at a time
    }
});

// Error handling middleware for multer errors
const handleUploadError = (error, req, res, next) => {
    console.error('Upload error:', error);

    if (error instanceof multer.MulterError) {
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                return res.status(400).json({
                    success: false,
                    message: 'File too large. Maximum size allowed is 5MB.',
                    error: 'FILE_TOO_LARGE'
                });
            case 'LIMIT_FILE_COUNT':
                return res.status(400).json({
                    success: false,
                    message: 'Too many files. Only one file allowed.',
                    error: 'TOO_MANY_FILES'
                });
            case 'LIMIT_UNEXPECTED_FILE':
                return res.status(400).json({
                    success: false,
                    message: 'Unexpected file field.',
                    error: 'UNEXPECTED_FILE'
                });
            default:
                return res.status(400).json({
                    success: false,
                    message: 'File upload error.',
                    error: error.code
                });
        }
    }

    if (error.message === 'Only PDF files are allowed') {
        return res.status(400).json({
            success: false,
            message: 'Only PDF files are allowed.',
            error: 'INVALID_FILE_TYPE'
        });
    }

    // Other errors
    return res.status(500).json({
        success: false,
        message: 'Internal server error during file upload.',
        error: 'UPLOAD_ERROR'
    });
};

// Helper function to delete file
const deleteFile = (filePath) => {
    return new Promise((resolve, reject) => {
        if (!filePath) {
            resolve();
            return;
        }

        const fullPath = path.isAbsolute(filePath) ? filePath : path.join(__dirname, '../../', filePath);
        
        fs.unlink(fullPath, (err) => {
            if (err && err.code !== 'ENOENT') {
                console.error('Error deleting file:', err);
                reject(err);
            } else {
                console.log('File deleted successfully:', fullPath);
                resolve();
            }
        });
    });
};

// Helper function to get file info
const getFileInfo = (filePath) => {
    if (!filePath) return null;

    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(__dirname, '../../', filePath);
    
    try {
        const stats = fs.statSync(fullPath);
        return {
            exists: true,
            size: stats.size,
            lastModified: stats.mtime,
            filename: path.basename(filePath)
        };
    } catch (error) {
        console.error('Error getting file info:', error);
        return {
            exists: false,
            filename: path.basename(filePath)
        };
    }
};

module.exports = {
    upload: upload.single('resume'), // 'resume' is the field name
    handleUploadError,
    deleteFile,
    getFileInfo,
    uploadsDir
};
