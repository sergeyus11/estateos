// @ts-nocheck
/**
 * Generates PWA icons + favicon.ico + OG image from public/logo.svg
 * by rendering HTML pages via the chrome-cdp container (per CLAUDE.md).
 *
 * Run:  node scripts/generate-icons.mjs
 */
import { chromium } from '/mnt/apps/villa/node_modules/playwright-core/index.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = resolve(__dirname, '..', 'apps', 'web', 'public');
const LOGO = readFileSync(resolve(PUBLIC, 'logo.svg'), 'utf8');

function pageHtml({ width, height, css = '', body }) {
  return `<!doctype html><html><head><style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:${width}px;height:${height}px;background:transparent;overflow:hidden}
    body{display:flex;align-items:center;justify-content:center}
    ${css}
  </style></head><body>${body}</body></html>`;
}

function iconHtml(size, { maskable = false } = {}) {
  const safe = maskable ? size * 0.8 : size;
  const offset = (size - safe) / 2;
  return pageHtml({
    width: size,
    height: size,
    css: maskable
      ? `body{background:linear-gradient(135deg,#D89A82 0%,#C4836A 55%,#9A6048 100%)}`
      : `body{background:transparent}`,
    body: maskable
      ? `<svg width="${safe * 0.62}" height="${safe * 0.62}" viewBox="0 0 32 32" style="position:absolute;left:${offset + safe * 0.19}px;top:${offset + safe * 0.19}px">
           <g fill="#FFFDF9">
             <rect x="6" y="13" width="2.6" height="6" rx="1.3"/>
             <rect x="10.5" y="10" width="2.6" height="12" rx="1.3"/>
             <rect x="15" y="7" width="2.6" height="18" rx="1.3"/>
             <rect x="19.5" y="11" width="2.6" height="10" rx="1.3"/>
             <rect x="24" y="14" width="2.6" height="4" rx="1.3"/>
           </g>
         </svg>`
      : LOGO.replace('<svg ', `<svg width="${size}" height="${size}" `),
  });
}

function ogHtml() {
  return `<!doctype html><html><head><style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:1200px;height:630px;font-family:'DM Sans',-apple-system,system-ui,sans-serif}
    body{
      background:
        radial-gradient(900px 500px at 80% 30%, rgba(196,131,106,.30), transparent 60%),
        radial-gradient(700px 400px at 15% 80%, rgba(232,184,160,.28), transparent 60%),
        #FAF8F5;
      padding:80px 90px;
      display:grid;grid-template-columns:1fr 380px;column-gap:40px;
      align-items:center;
      color:#2C2520;
      position:relative;
    }
    .copy{display:flex;flex-direction:column;justify-content:space-between;height:470px;align-self:center}
    .brand{display:flex;align-items:center;gap:16px}
    .brand-name{font-size:28px;font-weight:600;letter-spacing:-0.01em}
    .title{font-size:72px;font-weight:500;letter-spacing:-0.035em;line-height:1.0}
    .title em{font-style:normal;background:linear-gradient(135deg,#C4836A 10%,#9A6048 60%,#7A4A2E 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
    .meta{display:flex;align-items:center;gap:14px;font-size:18px;color:#7A6E63}
    .meta-dot{width:8px;height:8px;border-radius:50%;background:#7A9E6B;box-shadow:0 0 0 5px rgba(122,158,107,.22)}
    .orb-wrap{position:relative;width:380px;height:380px;justify-self:end}
    .orb{position:absolute;inset:0;border-radius:50%;
      background:radial-gradient(circle at 35% 30%,#F5C9B0 0%,#DC957A 35%,#B0704F 68%,#7E4A2E 92%,#5A3220 100%);
      box-shadow:0 60px 120px -40px rgba(154,96,72,.5);
    }
    .orb::after{content:"";position:absolute;inset:8%;border-radius:50%;
      background:radial-gradient(circle at 30% 25%,rgba(255,255,255,.55) 0%,rgba(255,232,213,.18) 30%,transparent 60%);}
  </style></head><body>
    <div class="copy">
      <div class="brand">
        ${LOGO.replace('<svg ', '<svg width="60" height="60" ')}
        <span class="brand-name">EstateOS</span>
      </div>
      <div class="title">Операционная<br/>система для<br/><em>агентств&nbsp;недвижимости.</em></div>
      <div class="meta"><span class="meta-dot"></span>estateos.ru · работает в&nbsp;продакшене</div>
    </div>
    <div class="orb-wrap"><div class="orb"></div></div>
  </body></html>`;
}

async function main() {
  const ver = await fetch('http://127.0.0.1:9222/json/version').then((r) => r.json());
  const browser = await chromium.connectOverCDP(ver.webSocketDebuggerUrl);
  const context = browser.contexts()[0] ?? (await browser.newContext());

  const jobs = [
    { name: 'icon-192.png',         size: 192, body: iconHtml(192, { maskable: true }) },
    { name: 'icon-512.png',         size: 512, body: iconHtml(512, { maskable: true }) },
    { name: 'apple-touch-icon.png', size: 180, body: iconHtml(180, { maskable: true }) },
    { name: 'favicon-32.png',       size: 32,  body: iconHtml(32) },
    { name: 'favicon-16.png',       size: 16,  body: iconHtml(16) },
  ];

  for (const j of jobs) {
    const page = await context.newPage();
    await page.setViewportSize({ width: j.size, height: j.size });
    await page.setContent(j.body, { waitUntil: 'load' });
    await page.waitForTimeout(80);
    const buf = await page.screenshot({ type: 'png', omitBackground: true, clip: { x: 0, y: 0, width: j.size, height: j.size } });
    writeFileSync(resolve(PUBLIC, j.name), buf);
    await page.close();
    console.log(`✓ ${j.name} (${j.size}×${j.size})`);
  }

  // OG image
  {
    const page = await context.newPage();
    await page.setViewportSize({ width: 1200, height: 630 });
    await page.setContent(ogHtml(), { waitUntil: 'load' });
    await page.waitForTimeout(120);
    const buf = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1200, height: 630 } });
    writeFileSync(resolve(PUBLIC, 'og-image.png'), buf);
    await page.close();
    console.log('✓ og-image.png (1200×630)');
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
