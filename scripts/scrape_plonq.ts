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

    // Puffs (We extract this from page, but good to have as check or category if needed, 
    // but schema uses number. Let's skip mapping puffs to categories for now unless requested as tags)
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
    categories?: string[];
}

async function scrape() {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Map: Product URL -> Partial<Product> attributes
    const productAttributes = new Map<string, Partial<Product>>();

    // Step 1: Visit filtered URLs to collect attributes
    console.log('Step 1: Collecting attributes from filtered pages...');
    for (const { url, attr } of ATTRIBUTE_URLS) {
        console.log(`Scanning ${url}...`);
        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
            await autoScroll(page);

            const urls = await page.evaluate(() => {
                const links = document.querySelectorAll('a[href^="/catalog/"]');
                return Array.from(links).map(link => (link as HTMLAnchorElement).href);
            });

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

        } catch (e) {
            console.error(`Failed to scan ${url}:`, e);
        }
    }

    // Also scan the main catalog to ensure we get ALL products, even those without specific filters
    console.log('Scanning main catalog for all products...');
    const allProductUrls = new Set<string>(productAttributes.keys());
    try {
        await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await autoScroll(page);
        const urls = await page.evaluate(() => {
            const links = document.querySelectorAll('a[href^="/catalog/"]');
            return Array.from(links).map(link => (link as HTMLAnchorElement).href);
        });
        urls.forEach(u => allProductUrls.add(u));
    } catch (e) {
        console.error('Failed to scan main catalog:', e);
    }

    console.log(`Total unique products to scrape: ${allProductUrls.size}`);
    const allProducts: Product[] = [];
    let processedCount = 0;

    // Step 2: Visit each product page
    for (const url of allProductUrls) {
        processedCount++;
        console.log(`[${processedCount}/${allProductUrls.size}] Scraping product: ${url}`);

        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

            // Wait for a bit to ensure dynamic content loads
            await new Promise(r => setTimeout(r, 1000));

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

                // Attributes (Coldness, Sweetness, Sourness)
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
                        if (match && match[1]) {
                            const val = parseInt(match[1]);
                            coldness = Math.min(val, 2); // Normalize to 0-2
                        }
                    } else if (label === 'Сладость' || label === 'Sweetness') {
                        const match = src.match(/cat_sweet-lvl-(\d+)/);
                        if (match && match[1]) {
                            const val = parseInt(match[1]);
                            sweetness = Math.min(val, 2); // Normalize to 0-2
                        }
                    } else if (label === 'Кислый' || label === 'Sourness') {
                        const match = src.match(/cat_sour-lvl-(\d+)/);
                        if (match && match[1]) {
                            const val = parseInt(match[1]);
                            sourness = val > 0; // Boolean
                        }
                    }
                });

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
                const reviews: Review[] = [];
                const reviewItems = document.querySelectorAll('.catalog_reviews-item');
                reviewItems.forEach(item => {
                    const author = (item.querySelector('.catalog_reviews-item_heading .meta_small-paragraph.n-txt-medium') as HTMLElement)?.innerText?.trim() || 'Anonymous';
                    const date = (item.querySelector('.hide[fs-list-field="date"]') as HTMLElement)?.innerText?.trim() || '';
                    const ratingText = (item.querySelector('.hide[fs-list-field="rating"]') as HTMLElement)?.innerText?.trim();
                    const rating = ratingText ? parseFloat(ratingText) : 5; // Default to 5 if missing
                    const text = (item.querySelector('.catalog_text-content') as HTMLElement)?.innerText?.trim() || '';

                    if (text) {
                        reviews.push({ author, date, rating, text });
                    }
                });

                return {
                    name,
                    flavor,
                    puffs,
                    description,
                    imageUrl: mainImage,
                    images,
                    url: productUrl,
                    coldness,
                    sweetness,
                    sourness,
                    features,
                    reviews
                };
            }, url);

            if (productData.name !== 'Unknown Product') {
                // Merge with pre-collected attributes
                const attributes = productAttributes.get(url) || {};
                allProducts.push({
                    ...productData,
                    ...attributes
                });
            }

        } catch (e) {
            console.error(`Failed to scrape product ${url}:`, e);
        }
    }

    console.log(`Successfully scraped ${allProducts.length} products.`);
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(allProducts, null, 2));
    console.log(`Saved to ${OUTPUT_FILE}`);

    await browser.close();
}

async function autoScroll(page: any) {
    await page.evaluate(async () => {
        await new Promise<void>((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight - window.innerHeight) {
                    if ((document.body.scrollHeight - scrollHeight) < 50 && totalHeight > 20000) {
                        clearInterval(timer);
                        resolve();
                    }
                }
            }, 100);

            setTimeout(() => {
                clearInterval(timer);
                resolve();
            }, 60000);
        });
    });
}

scrape().catch(console.error);
