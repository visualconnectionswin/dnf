const express = require('express');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

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

    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1920,1080',
                '--hide-scrollbars'
            ],
            executablePath: '/usr/bin/google-chrome-stable'
        });

        const page = await browser.newPage();
        
        // Configuraciones anti-detección
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        await page.setViewport({ width: 1366, height: 768 });

        try {
            await page.goto('https://eldni.com/pe/buscar-por-dni', { 
                waitUntil: 'networkidle0',
                timeout: 60000 
            });
        } catch (navError) {
            console.error('Error de navegación:', navError);
            return res.status(500).json({ error: 'No se pudo cargar la página' });
        }

        // Esperar y llenar input de DNI
        await page.waitForSelector('#dni', { timeout: 10000 });
        await page.type('#dni', doc);

        // Hacer click en botón buscar
        await page.click('#btn-buscar-por-dni');
        await page.waitForTimeout(2000);

        // Click en pestaña de datos completos
        await page.click('#completos');
        await page.waitForTimeout(2000);

        // Obtener contenido HTML
        const html = await page.content();
        
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
        res.status(500).json({ 
            error: 'Error en el proceso de scraping', 
            details: error.message 
        });
    } finally {
        if (browser) await browser.close();
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
