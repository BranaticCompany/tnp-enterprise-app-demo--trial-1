const db = require('../utils/database');
const { deleteFile, getFileInfo } = require('../middleware/upload');
const path = require('path');

// Upload student resume
const uploadResume = async (req, res) => {
    
    try {
        console.log('=== RESUME UPLOAD DEBUG ===');
        console.log('Student ID:', req.params.id);
        console.log('User ID:', req.user.id);
        console.log('User Role:', req.user.role);
        console.log('File:', req.file);

        const studentId = req.params.id;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Authorization check: students can only upload their own resume, admins can upload for any student
        if (userRole === 'student' && studentId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only upload your own resume.',
                error: 'UNAUTHORIZED'
            });
        }

        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded. Please select a PDF file.',
                error: 'NO_FILE'
            });
        }

        // Verify student exists
        const studentCheck = await db.query(
            'SELECT id FROM users WHERE id = $1 AND role = $2',
            [studentId, 'student']
        );

        if (studentCheck.rows.length === 0) {
            // Delete uploaded file if student doesn't exist
            await deleteFile(req.file.path);
            return res.status(404).json({
                success: false,
                message: 'Student not found.',
                error: 'STUDENT_NOT_FOUND'
            });
        }

        // Get current resume to delete old file
        const currentResume = await db.query(
            'SELECT resume_url FROM profiles WHERE user_id = $1',
            [studentId]
        );

        // Store relative path in database
        const relativePath = `uploads/resumes/${req.file.filename}`;

        // Update profile with new resume URL
        const updateResult = await db.query(
            'UPDATE profiles SET resume_url = $1, updated_at = NOW() WHERE user_id = $2 RETURNING *',
            [relativePath, studentId]
        );

        if (updateResult.rows.length === 0) {
            // Delete uploaded file if profile update failed
            await deleteFile(req.file.path);
            return res.status(404).json({
                success: false,
                message: 'Student profile not found.',
                error: 'PROFILE_NOT_FOUND'
            });
        }

        // Delete old resume file if it exists
        if (currentResume.rows.length > 0 && currentResume.rows[0].resume_url) {
            try {
                await deleteFile(currentResume.rows[0].resume_url);
            } catch (error) {
                console.error('Error deleting old resume file:', error);
                // Don't fail the upload if old file deletion fails
            }
        }

        // Get file info for response
        const fileInfo = getFileInfo(relativePath);

        console.log('Resume uploaded successfully:', {
            studentId,
            filename: req.file.filename,
            size: req.file.size,
            path: relativePath
        });

        res.status(200).json({
            success: true,
            message: 'Resume uploaded successfully.',
            data: {
                filename: req.file.filename,
                originalName: req.file.originalname,
                size: req.file.size,
                uploadDate: new Date(),
                resumeUrl: relativePath,
                fileInfo
            }
        });

    } catch (error) {
        console.error('=== RESUME UPLOAD ERROR ===');
        console.error('Error:', error);

        // Delete uploaded file on error
        if (req.file) {
            try {
                await deleteFile(req.file.path);
            } catch (deleteError) {
                console.error('Error deleting file after upload error:', deleteError);
            }
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error during resume upload.',
            error: 'UPLOAD_ERROR'
        });
    }
};

// Delete student resume
const deleteResume = async (req, res) => {
    
    try {
        console.log('=== RESUME DELETE DEBUG ===');
        console.log('Student ID:', req.params.id);
        console.log('User ID:', req.user.id);
        console.log('User Role:', req.user.role);

        const studentId = req.params.id;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Authorization check: students can only delete their own resume, admins can delete any
        if (userRole === 'student' && studentId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own resume.',
                error: 'UNAUTHORIZED'
            });
        }

        // Get current resume URL
        const currentResume = await db.query(
            'SELECT resume_url FROM profiles WHERE user_id = $1',
            [studentId]
        );

        if (currentResume.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found.',
                error: 'PROFILE_NOT_FOUND'
            });
        }

        const resumeUrl = currentResume.rows[0].resume_url;

        if (!resumeUrl) {
            return res.status(400).json({
                success: false,
                message: 'No resume found to delete.',
                error: 'NO_RESUME'
            });
        }

        // Clear resume URL from database
        await db.query(
            'UPDATE profiles SET resume_url = NULL, updated_at = NOW() WHERE user_id = $1',
            [studentId]
        );

        // Delete physical file
        try {
            await deleteFile(resumeUrl);
        } catch (error) {
            console.error('Error deleting resume file:', error);
            // Don't fail the operation if file deletion fails
        }

        console.log('Resume deleted successfully:', {
            studentId,
            resumeUrl
        });

        res.status(200).json({
            success: true,
            message: 'Resume deleted successfully.',
            data: {
                deletedFile: resumeUrl
            }
        });

    } catch (error) {
        console.error('=== RESUME DELETE ERROR ===');
        console.error('Error:', error);

        res.status(500).json({
            success: false,
            message: 'Internal server error during resume deletion.',
            error: 'DELETE_ERROR'
        });
    }
};

// Get resume file (for downloading/viewing)
const getResume = async (req, res) => {
    try {
        console.log('=== RESUME GET DEBUG ===');
        console.log('Student ID:', req.params.id);
        console.log('User ID:', req.user.id);
        console.log('User Role:', req.user.role);

        const studentId = req.params.id;
        const userRole = req.user.role;

        // Get resume URL from database
        const result = await db.query(
            'SELECT p.resume_url, u.email, p.full_name FROM profiles p JOIN users u ON p.user_id = u.id WHERE p.user_id = $1',
            [studentId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found.',
                error: 'PROFILE_NOT_FOUND'
            });
        }

        const { resume_url, email, full_name } = result.rows[0];

        if (!resume_url) {
            return res.status(404).json({
                success: false,
                message: 'No resume found for this student.',
                error: 'NO_RESUME'
            });
        }

        // Build full file path
        const fullPath = path.join(__dirname, '../../', resume_url);

        // Check if file exists
        const fileInfo = getFileInfo(resume_url);
        if (!fileInfo.exists) {
            return res.status(404).json({
                success: false,
                message: 'Resume file not found on server.',
                error: 'FILE_NOT_FOUND'
            });
        }

        console.log('Serving resume file:', {
            studentId,
            filename: fileInfo.filename,
            path: fullPath
        });

        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${full_name}_Resume.pdf"`);
        
        // Send file
        res.sendFile(fullPath, (err) => {
            if (err) {
                console.error('Error sending file:', err);
                if (!res.headersSent) {
                    res.status(500).json({
                        success: false,
                        message: 'Error serving resume file.',
                        error: 'FILE_SERVE_ERROR'
                    });
                }
            }
        });

    } catch (error) {
        console.error('=== RESUME GET ERROR ===');
        console.error('Error:', error);

        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Internal server error while retrieving resume.',
                error: 'GET_ERROR'
            });
        }
    }
};

// Get resume info (metadata without downloading file)
const getResumeInfo = async (req, res) => {
    try {
        const studentId = req.params.id;

        // Get resume URL from database
        const result = await db.query(
            'SELECT resume_url, updated_at FROM profiles WHERE user_id = $1',
            [studentId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found.',
                error: 'PROFILE_NOT_FOUND'
            });
        }

        const { resume_url, updated_at } = result.rows[0];

        if (!resume_url) {
            return res.status(200).json({
                success: true,
                data: {
                    hasResume: false,
                    resumeUrl: null,
                    fileInfo: null
                }
            });
        }

        // Get file info
        const fileInfo = getFileInfo(resume_url);

        res.status(200).json({
            success: true,
            data: {
                hasResume: true,
                resumeUrl: resume_url,
                lastUpdated: updated_at,
                fileInfo
            }
        });

    } catch (error) {
        console.error('Error getting resume info:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while getting resume info.',
            error: 'INFO_ERROR'
        });
    }
};

module.exports = {
    uploadResume,
    deleteResume,
    getResume,
    getResumeInfo
};
