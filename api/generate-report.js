import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import PDFDocument from 'pdfkit';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Yalnızca POST metodu destekleniyor.' });
  }

  const { domain } = req.body;
  if (!domain) {
    return res.status(400).json({ error: 'Domain belirtilmedi.' });
  }

  try {
    const apiKey = 'de1c590d-9d97-455c-bf9d-75b86018407e'; // test API key
    const response = await fetch(`https://api.builtwith.com/free1/api.json?KEY=${apiKey}&LOOKUP=${domain}`);
    const data = await response.json();

    if (!data.Results || data.Results.length === 0) {
      return res.status(500).json({ error: 'Teknoloji verisi alınamadı.' });
    }

    const doc = new PDFDocument();
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${domain.replace(/\./g, '_')}.pdf`);
      res.send(pdfBuffer);
    });

    doc.fontSize(20).text(`Teknoloji Raporu: ${domain}`, { align: 'center' });
    doc.moveDown();

    const techs = data.Results[0].ResultPaths.flatMap(p => p.Technologies.map(t => t.Name));
    techs.forEach((tech, i) => doc.fontSize(12).text(`${i + 1}. ${tech}`));

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}
