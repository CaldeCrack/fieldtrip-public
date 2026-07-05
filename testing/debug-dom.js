const { chromium } = require('playwright');
(async()=>{
  const browser = await chromium.launch({headless:true});
  const page = await browser.newPage();
  page.on('console', msg => console.log('console:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('pageerror:', err.message));
  await page.goto('http://127.0.0.1:8000/login', {waitUntil:'domcontentloaded'});
  await page.waitForTimeout(4000);
  const inputs = await page.locator('input, textarea, [role="textbox"]').evaluateAll((els)=>els.map(el=>({
    tag: el.tagName,
    role: el.getAttribute('role'),
    ariaLabel: el.getAttribute('aria-label'),
    placeholder: el.getAttribute('placeholder'),
    name: el.getAttribute('name'),
    id: el.getAttribute('id'),
    type: el.getAttribute('type'),
    value: el.value,
    outerHTML: el.outerHTML.slice(0,1200)
  })));
  console.log(JSON.stringify(inputs, null, 2));
  await browser.close();
})();
