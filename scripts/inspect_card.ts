
import puppeteer from 'puppeteer';

async function inspect() {
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    console.log('Navigating...');
    await page.goto('https://plonq.ru/catalog', { waitUntil: 'networkidle2', timeout: 60000 });

    const html = await page.evaluate(() => {
        // Try to find a container that looks like a product card
        // Based on "w-dyn-item" hint from previous attempt
        const item = document.querySelector('.w-dyn-item');
        if (item) return item.outerHTML;

        // Fallback: find the link we were using and go up
        const link = document.querySelector('a[href^="/catalog/"]');
        if (link && link.parentElement && link.parentElement.parentElement) {
            return link.parentElement.parentElement.outerHTML;
        }

        return "No card found";
    });

    console.log(html);
    await browser.close();
}

inspect().catch(console.error);
