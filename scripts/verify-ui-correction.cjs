const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const bind = () => page.evaluate(async () => {
    const module = async path => import(performance.getEntriesByType('resource').find(e => e.name.includes(path))?.name ?? path);
    window.ui = { store: (await module('/src/store.ts')).useStore, settings: (await module('/src/settings.ts')).useSettings };
  });
  const active = '.shot-card.active';
  const state = () => page.evaluate(() => { const s = ui.store.getState(); return s.project.shots.find(shot => shot.id === s.project.activeShotId); });
  async function refMenu(action) {
    await page.locator(`${active} .thumbnail-actions button`).last().click();
    await page.getByRole('menuitem', { name: action, exact: true }).click();
  }
  try {
    await page.goto(process.env.APP_URL || 'http://127.0.0.1:5173/');
    await page.locator('.stage-panel').waitFor(); await bind();
    assert.equal(await page.locator('.reference-panel').count(), 0);
    assert.equal(await page.locator('[data-reference-state=empty]').count(), 1);
    const fixtures = await page.evaluate(() => {
      const c = document.createElement('canvas'); c.width = 480; c.height = 270;
      const x = c.getContext('2d'); x.fillStyle = '#738089'; x.fillRect(0, 0, 480, 270);
      x.fillStyle = '#4b5963'; x.fillRect(0, 180, 480, 90); x.strokeStyle = '#b7c1c6'; x.lineWidth = 2; x.strokeRect(38, 30, 404, 210);
      x.fillStyle = '#c0c8ca'; x.fillRect(210, 100, 35, 100); x.beginPath(); x.arc(227, 78, 20, 0, Math.PI * 2); x.fill();
      return { png: c.toDataURL('image/png').split(',')[1], jpeg: c.toDataURL('image/jpeg').split(',')[1] };
    });
    // Exercise the empty-thumbnail file picker, not an obsolete standalone panel.
    const chooser = page.waitForEvent('filechooser');
    await page.locator(`${active} .shot-image`).click();
    await (await chooser).setFiles({ name: 'blocking-reference.png', mimeType: 'image/png', buffer: Buffer.from(fixtures.png, 'base64') });
    await page.locator('[data-reference-state=valid]').waitFor();
    assert.equal((await state()).references[0].mimeType, 'image/png');
    await page.locator(`${active} .shot-image`).click();
    await page.locator('dialog[open]').waitFor(); await page.keyboard.press('Escape');
    await refMenu('Fill'); assert.equal((await state()).references[0].fit, 'fill');
    await refMenu('Fit'); assert.equal((await state()).references[0].fit, 'fit');
    await page.locator(`${active} input[type=file]`).setInputFiles({ name: 'replacement.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(fixtures.jpeg, 'base64') });
    await page.waitForFunction(() => ui.store.getState().project.shots[0].references[0]?.mimeType === 'image/jpeg');
    await page.reload(); await page.locator('.stage-panel').waitFor(); await bind();
    assert.equal((await state()).references[0].name, 'replacement.jpg');
    await refMenu('Remove storyboard image'); await page.locator('[data-reference-state=empty]').waitFor();
    // Invalid input preserves recoverable state; loading has its own visible status.
    await page.locator(`${active} input[type=file]`).setInputFiles({ name: 'bad.png', mimeType: 'image/png', buffer: Buffer.from('invalid image') });
    await page.locator('[data-reference-state=failed]').waitFor();
    await page.evaluate(() => { const read = FileReader.prototype.readAsDataURL; FileReader.prototype.readAsDataURL = function(file) { setTimeout(() => read.call(this, file), 300); }; });
    await page.locator(`${active} input[type=file]`).setInputFiles({ name: 'loading.png', mimeType: 'image/png', buffer: Buffer.from(fixtures.png, 'base64') });
    await page.locator('[data-reference-state=loading]').waitFor();
    await page.locator('[data-reference-state=valid]').waitFor();
    const transfer = await page.evaluateHandle(base64 => { const dt = new DataTransfer(); dt.items.add(new File([Uint8Array.from(atob(base64), c => c.charCodeAt(0))], 'dropped.jpg', { type: 'image/jpeg' })); return dt; }, fixtures.jpeg);
    await page.locator(`${active} .shot-select`).dispatchEvent('drop', { dataTransfer: transfer });
    await page.waitForFunction(() => ui.store.getState().project.shots[0].references[0]?.name === 'dropped.jpg');
    await page.getByRole('button', { name: 'Plan View', exact: true }).click();
    await page.evaluate(() => { ui.store.getState().addObject('Character'); ui.store.getState().updateShot({ title: 'Courtyard blocking' }); });
    const rail = page.getByRole('toolbar', { name: 'Spatial editor' });
    for (const [label, shortcut, mode] of [['Select', 'q', 'select'], ['Move', 'w', 'translate'], ['Rotate', 'e', 'rotate'], ['Scale', 'r', 'scale']]) {
      await rail.getByRole('button', { name: label, exact: true }).click();
      assert.equal(await page.evaluate(() => ui.store.getState().mode), mode);
      await page.keyboard.press(shortcut);
      assert.equal(await rail.getByRole('button', { name: label, exact: true }).getAttribute('aria-pressed'), 'true');
    }
    const svg = page.locator('[data-testid=plan-view]');
    for (const [label, field] of [['Move', 'position'], ['Rotate', 'rotation'], ['Scale', 'scale']]) {
      await rail.getByRole('button', { name: label, exact: true }).click();
      const beforeObject = (await state()).objects.find(o => o.type === 'Character');
      const point = await page.locator(`[data-plan-object="${beforeObject.id}"]`).evaluate(el => { const p = new DOMPoint(0, 0).matrixTransform(el.getScreenCTM()); return { x: p.x, y: p.y }; });
      await page.mouse.move(point.x, point.y); await page.mouse.down(); await page.mouse.move(point.x + 24, point.y + 18, { steps: 6 }); await page.mouse.up();
      assert.notDeepEqual((await state()).objects.find(o => o.id === beforeObject.id)[field], beforeObject[field], `${label} updates shared scene`);
    }
    const box = await svg.boundingBox();
    const drag = async () => { await page.mouse.move(box.x + box.width * .5, box.y + box.height * .5); await page.mouse.down(); await page.mouse.move(box.x + box.width * .6, box.y + box.height * .6, { steps: 5 }); await page.mouse.up(); };
    const before = (await state()).plan.view;
    await rail.getByRole('button', { name: 'Pan', exact: true }).click(); await drag();
    assert.notDeepEqual((await state()).plan.view, before);
    await rail.getByRole('button', { name: 'Measure', exact: true }).click();
    await page.mouse.click(box.x + box.width * .5, box.y + box.height * .5); await page.mouse.click(box.x + box.width * .6, box.y + box.height * .6);
    assert.equal((await state()).plan.measurements.length, 1);
    for (const label of ['Pen', 'Marker', 'Arrow']) {
      await rail.getByRole('button', { name: 'Annotate', exact: true }).click();
      await page.locator('.annotation-flyout').getByRole('button', { name: label, exact: true }).click(); await page.keyboard.press('Escape'); await drag();
    }
    assert.equal((await state()).plan.sketches.length, 3);
    await rail.getByRole('button', { name: 'Annotate', exact: true }).click();
    await page.locator('.annotation-flyout').getByRole('button', { name: 'Text', exact: true }).click(); await page.keyboard.press('Escape');
    page.once('dialog', dialog => dialog.accept('Entrance'));
    await page.mouse.click(box.x + box.width * .7, box.y + box.height * .5);
    assert.equal((await state()).plan.sketches.at(-1).text, 'Entrance');
    await rail.getByRole('button', { name: 'Annotate', exact: true }).click();
    await page.locator('.annotation-flyout').getByRole('button', { name: 'Eraser', exact: true }).click(); await page.keyboard.press('Escape');
    await page.mouse.click(box.x + box.width * .7, box.y + box.height * .5);
    assert.equal((await state()).plan.sketches.length, 3);
    await page.locator('.view-options summary').click();
    await page.getByRole('combobox', { name: 'Position snap', exact: true }).selectOption('0.5');
    assert.equal(await page.evaluate(() => ui.settings.getState().positionSnap), .5);
    await page.locator('.view-options summary').click();
    await rail.getByRole('button', { name: 'Select', exact: true }).hover(); await page.waitForTimeout(500);
    assert.equal(await rail.getByRole('button', { name: 'Select', exact: true }).evaluate(el => getComputedStyle(el, '::after').visibility), 'visible');
    await page.getByRole('button', { name: 'Generate Spatial Description', exact: true }).click();
    assert.ok((await state()).spatialDescription.length > 0);
    for (const name of ['Spatial 3D', 'Camera View', 'Plan View']) { await page.getByRole('button', { name, exact: true }).click(); await page.waitForTimeout(400); }
    await page.locator('.inspector-tabs').getByRole('button', { name: 'Scene', exact: true }).click();
    await page.locator('.inspector-scene-list').getByRole('button', { name: 'Character', exact: true }).click();
    assert.equal(await page.locator('.inspector input[aria-label="Object name"]').inputValue(), 'Character');
    await page.locator('.inspector-tabs').getByRole('button', { name: 'Environments', exact: true }).click();
    await page.getByRole('textbox', { name: 'Environment intensity', exact: true }).fill('1.3');
    await page.getByRole('textbox', { name: 'Environment intensity', exact: true }).press('Tab');
    assert.equal((await state()).environment.intensity, 1.3);
    await page.locator('.inspector-tabs').getByRole('button', { name: 'Inspector', exact: true }).click();
    await page.evaluate(() => { const s = ui.store.getState(); s.updatePlan({ sketches: [], measurements: [] }); s.selectObject(s.project.shots[0].objects.find(o => o.type === 'Camera').id); ui.settings.setState({ planTool: 'select' }); });
    fs.mkdirSync('output/playwright', { recursive: true });
    for (const theme of ['dark', 'light']) for (const [width, height] of [[1920,1080], [1440,900], [1366,768], [1024,768]]) {
      await page.setViewportSize({ width, height }); await page.evaluate(theme => ui.settings.setState({ theme }), theme); await page.waitForTimeout(350);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${theme} ${width} overflow`);
      const bounds = await page.locator('.viewport-tool-rail').boundingBox(), viewport = await svg.boundingBox();
      assert.ok(bounds.y + bounds.height <= viewport.y + viewport.height + 1, `${width} toolbar overlaps footer`);
      assert.equal(await page.locator('.preview-panel').isVisible(), true);
      await page.screenshot({ path: `output/playwright/correction-${theme}-${width}x${height}.png` });
    }
    await page.getByRole('combobox', { name: 'Language', exact: true }).selectOption('zh');
    await page.locator('.viewport-tool-rail').getByRole('button', { name: '批注', exact: true }).click();
    await page.screenshot({ path: 'output/playwright/correction-light-1024-zh-annotate.png' });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []);
    console.log('PASS UI correction: PNG/JPEG picker, preview, fit/fill, replace/remove/drop, failed/loading/empty states, persistence; toolbar and shortcuts, Pan, Measure, all annotation tools, options, tooltip; three views, description; eight theme/viewport screenshots, no overflow or console errors.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
