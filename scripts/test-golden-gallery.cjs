const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium, webkit } = require('playwright');
const { install } = require('./fixtures/isolated-browser.cjs');
const products = require('./catalog-lib').loadCatalog().catalogApi.getAllProducts();
const media = require('../golden-media');
const renderer = require('../storefront-renderer');
(async () => {
  for (const product of products) {
    assert.equal(media[product.id]?.views, 4, product.id);
    assert.ok(fs.existsSync('.' + media[product.id].atlas), product.id);
    const html = renderer.renderProductPage(require('./catalog-lib').loadCatalog().catalogApi, product);
    assert.ok(html.includes('golden-view-3'), product.id);
    assert.ok(html.includes('original photo 1'), product.id);
  }
  for (const [name, engine] of [['chromium',chromium],['webkit',webkit]]) {
    const browser = await engine.launch();
    const context = await browser.newContext({reducedMotion:'reduce'});
    await install(context);
    const page = await context.newPage();
    for (const width of [320,390,768,1440]) {
      await page.setViewportSize({width,height:900});
      await page.goto('http://localhost:4176/products/bow-love-earrings');
      await page.locator('#pdp-gallery > .golden-frame').first().waitFor();
      await page.waitForFunction(() => document.querySelector('#pdp-gallery img')?.naturalWidth > 0);
      const dimensions = await page.evaluate(() => {
        const g = document.querySelector('#pdp-gallery');
        const s = g.firstElementChild;
        return {overflow:document.documentElement.scrollWidth > innerWidth,slides:g.children.length,width:g.clientWidth,frame:s.clientWidth,image:s.querySelector('img').clientWidth};
      });
      assert.equal(dimensions.overflow,false);
      assert.ok(dimensions.slides >= 5);
      assert.equal(dimensions.width,dimensions.frame);
      assert.ok(Math.abs(dimensions.image - dimensions.frame * 2) <= 2);
      await page.locator('[data-pdp-direction="1"]').click();
      await page.waitForFunction(() => document.querySelector('[data-pdp-gallery-count]').textContent.startsWith('2 /'));
      await page.locator('#pdp-gallery').focus();
      await page.keyboard.press('ArrowLeft');
      await page.waitForFunction(() => document.querySelector('[data-pdp-gallery-count]').textContent.startsWith('1 /'));
      await page.locator('[data-pdp-direction="-1"]').click();
      await page.waitForFunction(() => {const g=document.querySelector('#pdp-gallery');return Math.round(g.scrollLeft/g.clientWidth)===g.children.length-1;});
      if (width===390) {
        await page.locator('[data-pdp-direction="1"]').click();
        await page.screenshot({path:`artifacts/golden-gallery/${name}-mobile.png`});
      }
      console.log(name,width,JSON.stringify(dimensions));
    }
    await page.goto('http://localhost:4176/collections/all');
    await page.locator('[data-product-card] .golden-frame').first().waitFor();
    assert.equal(await page.locator('[data-product-card] .stable-card__image--primary').count(),0);
    await browser.close();
  }
  console.log(`Golden gallery coverage: ${products.length} products, ${products.length * 4} styled views`);
})();
