const fs = require('fs');
const path = require('path');

// Simple function to create demo PDF-like files for testing
// Note: These are not real PDFs, but text files with .pdf extension for demo purposes
// In a real implementation, you would use a PDF library like PDFKit or jsPDF

const createDemoResumes = () => {
    const uploadsDir = path.join(__dirname, '../../uploads/resumes');
    
    // Ensure directory exists
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Demo resume data
    const demoResumes = [
        {
            filename: 'john_doe_resume.pdf',
            content: `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(John Doe - Software Engineer) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
298
%%EOF`
        },
        {
            filename: 'jane_smith_resume.pdf',
            content: `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Jane Smith - Data Scientist) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
298
%%EOF`
        },
        {
            filename: 'alex_johnson_resume.pdf',
            content: `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 48
>>
stream
BT
/F1 12 Tf
72 720 Td
(Alex Johnson - Frontend Developer) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
302
%%EOF`
        }
    ];

    // Create demo resume files
    demoResumes.forEach(resume => {
        const filePath = path.join(uploadsDir, resume.filename);
        fs.writeFileSync(filePath, resume.content);
        console.log(`Created demo resume: ${resume.filename}`);
    });

    console.log(`\nDemo resumes created in: ${uploadsDir}`);
    console.log('Files created:');
    demoResumes.forEach(resume => {
        console.log(`- ${resume.filename}`);
    });
};

// Run the function if this script is executed directly
if (require.main === module) {
    createDemoResumes();
}

module.exports = { createDemoResumes };
