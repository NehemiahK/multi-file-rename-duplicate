const express = require('express');
const fileUpload = require('express-fileupload');
const csvParser = require('csv-parser');
const fs = require('fs');
const PDFLib = require('pdf-lib');
const JSZip = require('jszip');

const app = express();
const port = process.env.PORT || 3000;

// Middleware for handling file uploads
app.use(fileUpload());

// Serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Endpoint for handling file uploads
app.post('/upload', async (req, res) => {
  if (!req.files || !req.files.pdfFile || !req.files.csvFile) {
    return res.status(400).json({ error: 'PDF file and CSV file are required' });
  }

  const pdfFile = req.files.pdfFile;
  const csvFile = req.files.csvFile;
  const pdfName = req.body.pdfName || 'Document'; // Default PDF name if not provided

  // Process the CSV file
  const pdfDuplicates = [];

  fs.createReadStream(csvFile.tempFilePath)
    .pipe(csvParser())
    .on('data', (row) => {
      const filename = row.filename;
      const uniqueFilename = `${filename} - ${pdfName}.pdf`;
      const pdfDoc = PDFLib.PDFDocument.create();
      pdfDoc.addPage([612, 792]); // Letter size page
      const pdfBytes = await pdfDoc.save();
      pdfDuplicates.push({ name: uniqueFilename, data: pdfBytes });
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
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});