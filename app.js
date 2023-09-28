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

  const pdfDuplicates = [];

  try {
    // Read the PDF file content
    const pdfData = fs.readFileSync(pdfFile.tempFilePath);

    // Process the CSV file
    fs.createReadStream(csvFile.tempFilePath)
      .pipe(csvParser())
      .on('data', (row) => {
        const filename = row.filename;
        const uniqueFilename = `${filename} - ${pdfName}.pdf`;

        // Clone the PDF by creating a new PDF document and adding pages
        const pdfDoc = PDFLib.PDFDocument.create();
        const pdfBytes = await pdfDoc.addPage(PDFLib.PDFPage.create([612, 792])); // Letter size page
        pdfBytes.copyPages(pdfData);

        pdfDuplicates.push({ name: uniqueFilename, data: pdfDoc.save() });
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
    res.status(500).json({ error: 'Failed to read the PDF file' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
