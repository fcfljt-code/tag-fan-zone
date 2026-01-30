const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generatePDF() {
    console.log('Starte PDF-Generierung...');

    const browser = await puppeteer.launch({
        headless: 'new'
    });

    const page = await browser.newPage();

    // HTML-Datei laden
    const htmlPath = path.join(__dirname, 'ANLEITUNG.html');
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

    // PDF generieren
    await page.pdf({
        path: 'TSG_Fan-Zone_Anleitung.pdf',
        format: 'A4',
        printBackground: true,
        margin: {
            top: '20mm',
            bottom: '20mm',
            left: '15mm',
            right: '15mm'
        }
    });

    await browser.close();
    console.log('PDF wurde erstellt: TSG_Fan-Zone_Anleitung.pdf');
}

generatePDF().catch(console.error);
