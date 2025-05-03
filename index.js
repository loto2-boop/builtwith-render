const express = require('express');
const fetch = require('node-fetch');
const PDFDocument = require('pdfkit');

const app = express();
app.use(express.json());

app.post('/generate-report', async (req, res) => {
  const { domain } = req.body;
  if (!domain) {
    return res.status(400).json({ error: 'Domain eksik.' });
  }

  try {
    const apiKey = 'de1c590d-9d97-455c-bf9d-75b86018407e';
    const response = await fetch(`https://api.builtwith.com/free1/api.json?KEY=${apiKey}&LOOKUP=${domain}`);
    const data = await response.json();

    if (!data.Results || data.Results.length === 0) {
      return res.status(500).json({ error: 'Teknoloji verisi alınamadı.' });
    }

    const doc = new PDFDocument();
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${domain}.pdf"`);
      res.send(pdfBuffer);
    });

    doc.fontSize(20).text(`Teknoloji Raporu: ${domain}`, { align: 'center' }).moveDown();

    const techs = data.Results[0].ResultPaths.flatMap(p => p.Technologies.map(t => t.Name));
    techs.forEach((tech, i) => {
      doc.fontSize(12).text(`${i + 1}. ${tech}`);
    });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
