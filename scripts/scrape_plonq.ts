import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

const BASE_URL = 'https://plonq.ru/catalog';

// Mapping of filtered URLs to the attributes they represent
const ATTRIBUTE_URLS = [
    // Strength
    { url: 'https://plonq.ru/catalog?strength=Сбалансированная', attr: { strength: 'Balanced' } },
    { url: 'https://plonq.ru/catalog?strength=Высокая', attr: { strength: 'High' } },

    // Flavor Categories
    { url: 'https://plonq.ru/catalog?flavour-type=Новые+вкусы', attr: { categories: ['New Flavors'] } },
    { url: 'https://plonq.ru/catalog?flavour-category=Фрукты', attr: { categories: ['Fruits'] } },
    { url: 'https://plonq.ru/catalog?flavour-category=Ягоды', attr: { categories: ['Berries'] } },
    { url: 'https://plonq.ru/catalog?flavour-category=Мята', attr: { categories: ['Mint'] } },
    { url: 'https://plonq.ru/catalog?flavour-category=Хвойные', attr: { categories: ['Coniferous'] } },
    { url: 'https://plonq.ru/catalog?flavour-category=Цитрусовые', attr: { categories: ['Citrus'] } },
    { url: 'https://plonq.ru/catalog?flavour-category=Напитки', attr: { categories: ['Drinks'] } },
    { url: 'https://plonq.ru/catalog?flavour-category=Другое', attr: { categories: ['Other'] } },

    // Device Type
    { url: 'https://plonq.ru/catalog?device-type=Одноразовые', attr: { deviceType: 'Disposable' } },
    { url: 'https://plonq.ru/catalog?device-type=POD-системы', attr: { deviceType: 'POD System' } },
    { url: 'https://plonq.ru/catalog?device-type=Жидкости', attr: { deviceType: 'E-Liquid' } },
];

const OUTPUT_FILE = path.join(process.cwd(), 'products.json');

interface Review {
    author: string;
    rating: number;
    text: string;
    date: string;
}

interface Product {
    name: string;
    flavor: string;
    puffs?: number;
    description?: string;
    imageUrl: string;
    images?: string[];
    url: string;
    coldness?: number;
    sweetness?: number;
    sourness?: boolean;
    features?: { name: string; value: string }[];
    reviews?: Review[];
    strength?: string;
    deviceType?: string;
    coldnessLabel?: string;
    sweetnessLabel?: string;
    categories?: string[];
}

async function scrape() {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    // Map: Product URL -> Partial<Product> attributes
    const productAttributes = new Map<string, Partial<Product>>();

    // Helper to get links from a page
    const getLinks = async (url: string) => {
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(60000);
        page.setDefaultTimeout(20000);
        // Optimize: Block resources
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'font', 'stylesheet', 'media'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

            // Wait for at least one catalog item to appear
            try {
                await page.waitForSelector('a[href^="/catalog/"]', { timeout: 15000 });
            } catch (e) {
                console.log(`No products found on ${url} (or timeout)`);
                return [];
            }

            // Auto-scroll to trigger lazy loading
            await autoScroll(page);

            const urls = await page.evaluate(() => {
                const links = document.querySelectorAll('a[href^="/catalog/"]');
                return Array.from(links).map(link => (link as HTMLAnchorElement).href);
            });
            return urls;
        } catch (e) {
            console.error(`Failed to get links from ${url}:`, e);
            return [];
        } finally {
            await page.close();
        }
    };

    // Step 1: Visit filtered URLs to collect attributes
    console.log('Step 1: Collecting attributes from filtered pages...');

    // Process filters in parallel with limited concurrency
    const FILTER_CONCURRENCY = 1;
    const filterChunks = chunk(ATTRIBUTE_URLS, FILTER_CONCURRENCY);

    for (const batch of filterChunks) {
        await Promise.all(batch.map(async ({ url, attr }) => {
            console.log(`Scanning ${url}...`);
            const urls = await getLinks(url);
            console.log(`Found ${urls.length} products for attributes:`, attr);

            for (const productUrl of urls) {
                const existing = productAttributes.get(productUrl) || {};
                // Merge attributes
                if (attr.strength) existing.strength = attr.strength;
                if (attr.deviceType) existing.deviceType = attr.deviceType;
                if (attr.categories) {
                    existing.categories = existing.categories || [];
                    for (const cat of attr.categories) {
                        if (!existing.categories.includes(cat)) {
                            existing.categories.push(cat);
                        }
                    }
                }
                productAttributes.set(productUrl, existing);
            }
        }));
    }

    // Also scan the main catalog
    console.log('Scanning main catalog for all products...');
    const allProductUrls = new Set<string>(productAttributes.keys());
    const mainCatalogUrls = await getLinks(BASE_URL);
    mainCatalogUrls.forEach(u => allProductUrls.add(u));

    console.log(`Total unique products to scrape: ${allProductUrls.size}`);
    const allProducts: Product[] = [];

    // Step 2: Visit each product page with concurrency
    const CONCURRENCY = 5; // Increased concurrency since we block resources
    const chunks = chunk(Array.from(allProductUrls), CONCURRENCY);

    for (const [i, batch] of chunks.entries()) {
        console.log(`Processing batch ${i + 1}/${chunks.length} (${batch.length} items)...`);

        await Promise.all(batch.map(async (url) => {
            const page = await browser.newPage();
            page.setDefaultNavigationTimeout(60000);
            page.setDefaultTimeout(20000);
            // Block fonts/css/media but allow images for src extraction? 
            // Actually, we can block images too, the src attribute is usually present in the DOM even if image request is blocked.
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                if (['font', 'stylesheet', 'media'].includes(req.resourceType())) {
                    req.abort();
                } else {
                    req.continue();
                }
            });

            try {
                // Wait for network idle or specific selector
                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

                // Wait for main content
                await page.waitForSelector('h1', { timeout: 10000 });

                const productData = await page.evaluate((productUrl) => {
                    const getText = (selector: string) => {
                        const el = document.querySelector(selector);
                        return el ? (el as HTMLElement).innerText.trim() : '';
                    };

                    const getSrc = (selector: string) => {
                        const el = document.querySelector(selector);
                        return el ? (el as HTMLImageElement).src : '';
                    };

                    // Basic Info
                    const flavor = getText('h1.meta_small-heading') || getText('.catalog_decription-text h1');
                    const modelElements = document.querySelectorAll('.same-flavours_rating-wrap .meta_small-paragraph');
                    let modelName = '';
                    if (modelElements.length >= 2) {
                        modelName = `${(modelElements[0] as HTMLElement).innerText} ${(modelElements[1] as HTMLElement).innerText}`;
                    }

                    const name = modelName ? `${modelName} ${flavor}` : flavor || 'Unknown Product';
                    const description = getText('.catalog_decription-text p.meta_small-paragraph') || getText('.catalog_decription-text');

                    // Images
                    const mainImage = getSrc('.catalog_main-img-wrapper .catalog_prod-img');
                    const additionalImages = Array.from(document.querySelectorAll('.catalog_grid-small-img .catalog_prod-img'))
                        .map(img => (img as HTMLImageElement).src)
                        .filter(src => src !== mainImage);

                    const images = [mainImage, ...additionalImages].filter(Boolean);

                    // Attributes
                    let coldness = 0;
                    let sweetness = 0;
                    let sourness = false;

                    const paramWrappers = document.querySelectorAll('.catalog_param-wrapper .same-flavours_rating-wrap');
                    paramWrappers.forEach(wrapper => {
                        const label = (wrapper.querySelector('.n-subtext') as HTMLElement)?.innerText?.trim();
                        const img = wrapper.querySelector('img');
                        const src = img ? img.src : '';

                        if (label === 'Холод' || label === 'Coldness') {
                            const match = src.match(/cat_cold-lvl-(\d+)/);
                            if (match && match[1]) coldness = parseInt(match[1]);
                        } else if (label === 'Сладость' || label === 'Sweetness') {
                            const match = src.match(/cat_sweet-lvl-(\d+)/);
                            if (match && match[1]) sweetness = parseInt(match[1]);
                        } else if (label === 'Кислый' || label === 'Sourness') {
                            const match = src.match(/cat_sour-lvl-(\d+)/);
                            if (match && match[1]) sourness = parseInt(match[1]) > 0;
                        }
                    });

                    const coldnessLabels = ["Отсутствует", "Умеренный", "Умеренный", "Интенсивный"];
                    const sweetnessLabels = ["Нейтральная", "Нейтральная", "Умеренная", "Насыщенная"];
                    const coldnessLabel = coldnessLabels[coldness] || "Отсутствует";
                    const sweetnessLabel = sweetnessLabels[sweetness] || "Нейтральная";

                    // Puffs and Features
                    let puffs = 0;
                    const features: { name: string; value: string }[] = [];
                    const specItems = document.querySelectorAll('.cat_spec-item');
                    specItems.forEach(item => {
                        const label = (item.children[0] as HTMLElement)?.innerText?.trim();
                        const value = (item.children[1] as HTMLElement)?.innerText?.trim();

                        if (label && value) {
                            if (label === 'Количество затяжек' || label === 'Puffs') {
                                puffs = parseInt(value.replace(/\s/g, '')) || 0;
                            }
                            features.push({ name: label, value });
                        }
                    });

                    // Reviews
                    const reviews: any[] = [];
                    const reviewItems = document.querySelectorAll('.catalog_reviews-item');
                    reviewItems.forEach(item => {
                        const author = (item.querySelector('.catalog_reviews-item_heading .meta_small-paragraph.n-txt-medium') as HTMLElement)?.innerText?.trim() || 'Anonymous';
                        const date = (item.querySelector('.hide[fs-list-field="date"]') as HTMLElement)?.innerText?.trim() || '';
                        const ratingText = (item.querySelector('.hide[fs-list-field="rating"]') as HTMLElement)?.innerText?.trim();
                        const rating = ratingText ? parseFloat(ratingText) : 5;
                        const text = (item.querySelector('.catalog_text-content') as HTMLElement)?.innerText?.trim() || '';

                        if (text) reviews.push({ author, date, rating, text });
                    });

                    return {
                        name, flavor, puffs, description, imageUrl: mainImage, images, url: productUrl,
                        coldness, sweetness, sourness, coldnessLabel, sweetnessLabel, features, reviews
                    };
                }, url);

                if (productData.name !== 'Unknown Product') {
                    const attributes = productAttributes.get(url) || {};
                    allProducts.push({ ...productData, ...attributes } as Product);
                }

            } catch (e) {
                console.error(`Failed to scrape product ${url}:`, e);
            } finally {
                await page.close();
            }
        }));
    }

    console.log(`Successfully scraped ${allProducts.length} products.`);
    if (allProducts.length === 0) {
        await browser.close();
        throw new Error('Scrape returned zero products; keeping existing products.json unchanged.');
    }

    await fs.writeFile(OUTPUT_FILE, JSON.stringify(allProducts, null, 2));
    console.log(`Saved to ${OUTPUT_FILE}`);

    await browser.close();
}

async function autoScroll(page: any) {
    await page.evaluate(async () => {
        await new Promise<void>((resolve) => {
            let totalHeight = 0;
            const distance = 200; // Increased scroll distance
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight - window.innerHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 50); // Faster scroll interval
        });
    });
}

function chunk<T>(arr: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
        arr.slice(i * size, i * size + size)
    );
}

scrape().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
