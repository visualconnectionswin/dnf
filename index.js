const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cheerio = require('cheerio');

puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
    res.json({ message: 'Hello from Node.js!' });
});

app.get('/scrape', async (req, res) => {
    const doc = req.query.doc;

    if (!doc) {
        return res.status(400).json({ error: 'No se ha proporcionado el parámetro "doc".' });
    }

    try {
        const browser = await puppeteer.launch({
            headless: 'new', // Usar nuevo modo headless
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox', 
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process'
            ]
        });

        const page = await browser.newPage();
        
        // Configuraciones anti-detección
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        await page.setViewport({ width: 851, height: 713 });

        await page.goto('https://eldni.com/pe/buscar-por-dni', { 
            waitUntil: 'networkidle0',
            timeout: 60000 
        });

        // Esperar y llenar input de DNI
        await page.waitForSelector('#dni');
        await page.type('#dni', doc);

        // Hacer click en botón buscar
        await page.click('#btn-buscar-por-dni');
        await page.waitForTimeout(2000);

        // Click en pestaña de datos completos
        await page.click('#completos');
        await page.waitForTimeout(2000);

        // Obtener contenido HTML
        const html = await page.content();
        await browser.close();

        // Parsear con Cheerio
        const $ = cheerio.load(html);
        const table = $('table.table tbody tr');

        if (table.length > 0) {
            const cells = table.first().find('td');
            
            if (cells.length >= 4) {
                const data = {
                    DNI: cells.eq(0).text().trim(),
                    Nombres: cells.eq(1).text().trim(),
                    ApellidoPaterno: cells.eq(2).text().trim(),
                    ApellidoMaterno: cells.eq(3).text().trim()
                };

                const result = `${data.DNI} ${data.Nombres} ${data.ApellidoPaterno} ${data.ApellidoMaterno}`;
                return res.json({ result });
            }
        }

        // Si no encuentra datos, devuelve HTML completo
        res.json({ result: html });

    } catch (error) {
        console.error('Error en scraping:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
