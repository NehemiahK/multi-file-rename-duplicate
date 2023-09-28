const express = require('express');
const fileUpload = require('express-fileupload');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const { Readable } = require('stream');

const app = express();
const port = process.env.PORT || 3000;

// Middleware for handling file uploads
app.use(fileUpload());

// Serve static files (CSS and JavaScript)
app.use(express.static(path.join(__dirname, 'public')));

// Serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Endpoint for handling file uploads
app.post('/upload', async (req, res) => {
  if (!req.files || !req.files.pdfFile || !req.files.csvFile) {
    return res.status(400).json({ error: 'PDF file and CSV file are required' });
  }

  const pdfFile = req.files.pdfFile;
  const csvFile = req.files.csvFile;
  const pdfName = req.body.pdfName || 'Document'; // Default PDF name if not provided

  const pdfDuplicates = [];

  try {
    // Process the CSV file with a comma delimiter (default)
    const csvDataBuffer = req.files.csvFile.data;

    const stream = new Readable();
    stream.push(csvDataBuffer);
    stream.push(null);

    stream
      .pipe(csv())
      .on('data', (row) => {
        const filename = row.filename; // Assuming "filename" is the column name
        const uniqueFilename = `${filename} - ${pdfName}.pdf`;

        // Copy the PDF file content directly
        const pdfData = Buffer.from(pdfFile.data);

        // Push the duplicated PDF file content
        pdfDuplicates.push({ name: uniqueFilename, data: pdfData });
      })
      .on('end', () => {
        // Create a zip file containing duplicated PDFs
        const zip = new JSZip();
        pdfDuplicates.forEach((pdf) => {
          zip.file(pdf.name, pdf.data);
        });

        // Generate the zip file
        zip
          .generateAsync({ type: 'nodebuffer' })
          .then((content) => {
            // Send the zip file as a response
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', 'attachment; filename=pdf_duplicates.zip');
            res.send(content);
          })
          .catch((err) => {
            res.status(500).json({ error: 'Failed to create the zip file' });
          });
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process the files' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
