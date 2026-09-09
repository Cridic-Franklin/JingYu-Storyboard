const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async () => {
  fs.mkdirSync('.verification', { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const button = name => page.getByRole('button', { name, exact: true });
  const select = name => page.locator('.scene-select').filter({ hasText: name }).click();
  const add = async type => { await page.getByRole('button', { name: 'Add object' }).click(); await page.locator('.add-menu').getByRole('button', { name: type, exact: false }).click(); };
  const project = () => page.evaluate(async () => (await import(performance.getEntriesByType('resource').find(e => e.name.includes('/src/store.ts'))?.name || '/src/store.ts')).useStore.getState().project);
  const active = async () => { const p = await project(); return p.shots.find(s => s.id === p.activeShotId); };
  const settings = () => page.evaluate(async () => { const s = (await import(performance.getEntriesByType('resource').find(e => e.name.includes('/src/settings.ts'))?.name || '/src/settings.ts')).useSettings.getState(); return { language: s.language, layout: s.layout, showLabels: s.showLabels, maximized: s.maximized }; });
  const saved = () => page.getByRole('status').filter({ hasText: /All changes saved|所有更改已保存/ }).waitFor();
  const blur = () => page.getByRole('heading', { name: /Inspector|属性检查器/, exact: true }).click();
  await page.goto('http://127.0.0.1:5173'); await saved();
  await add('Character'); await page.getByLabel('Object name', { exact: true }).fill('Leo'); await blur();
  const leoId = (await active()).objects.find(o => o.name === 'Leo').id;
  await page.getByLabel('Object name', { exact: true }).fill('Captain Leo'); await blur();
  assert.equal((await active()).objects.find(o => o.name === 'Captain Leo').id, leoId);
  await page.keyboard.press('Control+z'); assert.equal((await active()).objects.find(o => o.id === leoId).name, 'Leo');
  await page.keyboard.press('Control+Shift+z'); assert.equal((await active()).objects.find(o => o.id === leoId).name, 'Captain Leo');
  await page.keyboard.press('Control+z');
  await add('Prop'); await page.getByLabel('Object name', { exact: true }).fill('Emergency Beacon'); await blur();
  await page.getByLabel('Semantic name').fill('OLD GENERIC PROP'); await blur();
  await page.getByLabel('Position X').fill('0.8'); await page.getByLabel('Position Z').fill('0.8'); await blur();
  for (const type of ['Cube', 'Sphere', 'Cylinder', 'Capsule', 'Cone', 'Plane']) { await add(type); assert.equal((await active()).objects.at(-1).type, type); }
  await select('Cube'); await page.getByLabel('Object name', { exact: true }).fill('Rock A'); await blur();
  await button('Show Object Labels').click(); await page.waitForTimeout(300);
  assert.equal(await page.locator('.object-label').count(), 9);
  await button('Unlocked').click(); assert(await page.getByLabel('Position X').isDisabled());
  assert(await button('Delete object').isDisabled());
  const lockedPosition = (await active()).objects.find(o => o.name === 'Rock A').position;
  await page.keyboard.press('Delete'); assert((await active()).objects.some(o => o.name === 'Rock A'));
  await page.evaluate(async () => { const s = (await import(performance.getEntriesByType('resource').find(e => e.name.includes('/src/store.ts'))?.name || '/src/store.ts')).useStore.getState(); const o = s.project.shots[0].objects.find(o => o.name === 'Rock A'); s.updateObject(o.id, { position: [99, 0, 0] }); });
  assert.deepEqual((await active()).objects.find(o => o.name === 'Rock A').position, lockedPosition);
  await button('Visible').click(); assert.equal((await active()).objects.find(o => o.name === 'Rock A').visible, false);
  assert.equal(await page.locator('.object-label').filter({ hasText: 'Rock A' }).count(), 0);
  assert.equal(await page.getByTestId('frame-status').textContent(), 'Hidden');

  // Exact screen center against a straight, level camera; no model inference.
  await select('Storyboard Camera');
  for (const [axis, v] of [['X', '0'], ['Y', '0.9'], ['Z', '5']]) await page.getByLabel(`Position ${axis}`).fill(v);
  for (const axis of ['X', 'Y', 'Z']) await page.getByLabel(`Rotation ${axis}`).fill('0');
  await blur(); await select('Leo');
  assert.equal(await page.getByTestId('screenX').textContent(), '50%'); assert.equal(await page.getByTestId('screenY').textContent(), '50%');
  assert(parseInt(await page.getByTestId('width').textContent()) > 0);
  const edgeCases = await page.evaluate(async () => {
    const state = (await import(performance.getEntriesByType('resource').find(e => e.name.includes('/src/store.ts'))?.name || '/src/store.ts')).useStore.getState();
    const { framePosition } = await import('/src/lib/scene.ts');
    const objects = state.project.shots[0].objects, o = objects.find(o => o.name === 'Leo'), cam = objects.find(o => o.type === 'Camera');
    return [framePosition({ ...o, visible: false }, cam).status, framePosition({ ...o, position: [100, 0, 0] }, cam).status, framePosition({ ...o, position: [0, 0, 10] }, cam).status, framePosition({ ...o, position: [0, 0, 5] }, cam).status, framePosition(o).status];
  });
  assert.deepEqual(edgeCases, ['hidden', 'outsideFrame', 'behindCamera', 'nearCamera', 'noCamera']);
  const posX = await page.getByTestId('screenX').textContent();
  await page.getByLabel('Position X').fill('-1'); await blur();
  assert.notEqual(await page.getByTestId('screenX').textContent(), posX);
  await page.getByLabel('Position X').fill('0'); await blur();
  await button('Generate Spatial Description').click();
  const description = await page.getByLabel('Generated spatial description').inputValue();
  assert.match(description, /Emergency Beacon.*front-right of Leo/); assert.match(description, /screen X 50%, Y 50%/); assert(!description.includes('OLD GENERIC PROP')); assert(!description.includes('Rock A'));

  // View navigation and selection mode leave the storyboard camera untouched.
  const view = () => page.evaluate(async () => {
    const { _roots } = await import('/node_modules/.vite/deps/@react-three_fiber.js');
    const s = _roots.get(document.querySelector('.editor-canvas canvas')).store.getState();
    return { position: s.camera.position.toArray(), target: s.controls.target.toArray(), rotation: s.camera.rotation.toArray().slice(0, 3), distance: s.camera.position.distanceTo(s.controls.target) };
  });
  const originalStoryboard = (await active()).objects.find(o => o.type === 'Camera');
  await page.keyboard.press('q'); assert.equal(await button('Select').getAttribute('aria-pressed'), 'true');
  const dragView = async (mouseButton, alt, dx = 55, dy = 30) => {
    const box = await page.locator('.editor-canvas canvas').boundingBox();
    const x = box.x + box.width * .8, y = box.y + box.height * .6;
    if (alt) await page.keyboard.down('Alt');
    await page.mouse.move(x, y); await page.mouse.down({ button: mouseButton }); await page.mouse.move(x + dx, y + dy, { steps: 12 }); await page.mouse.up({ button: mouseButton });
    if (alt) await page.keyboard.up('Alt');
    await page.waitForTimeout(100);
  };
  const idle = await view(); await dragView('left', false); assert.deepEqual(await view(), idle, 'Unmodified mouse must not orbit');
  await dragView('left', true); const orbit = await view(); assert.notDeepEqual(orbit.position, idle.position); assert.deepEqual(orbit.target, idle.target);
  await dragView('middle', true); const pan = await view(); assert.notDeepEqual(pan.target, orbit.target);
  await dragView('right', true); const dolly = await view(); assert(Math.abs(dolly.distance - pan.distance) > .01);
  await dragView('right', true, 45, 0); assert.notEqual((await view()).distance, dolly.distance, 'Horizontal Maya dolly');
  await page.mouse.wheel(0, 100); await page.waitForTimeout(100); assert.notEqual((await view()).distance, dolly.distance);
  assert.deepEqual((await active()).objects.find(o => o.type === 'Camera'), originalStoryboard);
  await select('Leo'); await page.keyboard.press('f'); await page.waitForTimeout(100);
  const framed = await view(); assert(Math.abs(framed.target[0]) < .001); assert(Math.abs(framed.target[1] - .9) < .01);
  for (const [key, name] of [['w', 'Move'], ['e', 'Rotate'], ['r', 'Scale']]) { await page.keyboard.press(key); assert.equal(await button(name).getAttribute('aria-pressed'), 'true'); }
  const beforeAltWithGizmo = await active(); await dragView('left', true); assert.deepEqual(await active(), beforeAltWithGizmo, 'Alt navigation must not transform selected objects');

  // Layout persists, and all five headers maximize and restore.
  for (const dimension of ['left', 'right', 'bottom', 'preview']) {
    const handle = page.locator(`[data-dimension=${dimension}]`); const box = await handle.boundingBox(); const before = (await settings()).layout[dimension];
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 + (dimension === 'bottom' ? 0 : 25), box.y + box.height / 2 + (dimension === 'bottom' ? -25 : 0), { steps: 5 }); await page.mouse.up();
    assert.notEqual((await settings()).layout[dimension], before, `${dimension} resize`);
  }
  for (const [selector, name] of [['.shot-sidebar', 'Shot list'], ['.stage-panel', 'Spatial editor'], ['.preview-panel', 'Camera preview'], ['.description-panel', 'Spatial description'], ['.inspector', 'Inspector']]) {
    const header = page.locator(selector).locator('.panel-heading,.stage-toolbar').first(); await header.dblclick({ position: { x: 50, y: 15 } });
    assert(await page.locator(`${selector}.panel-maximized`).isVisible(), name); assert.equal(await page.locator('.panel-maximized').count(), 1);
    await button('Restore Panel').click(); assert.equal(await page.locator('.panel-maximized').count(), 0);
  }
  const storedLayout = (await settings()).layout;
  await page.getByLabel('Language', { exact: true }).selectOption('zh');
  await page.getByRole('heading', { name: '镜头列表', exact: true }).waitFor();
  await page.getByRole('button', { name: '添加对象' }).click(); for (const name of ['角色', '道具', '球体', '圆柱体', '胶囊体', '圆锥体']) assert(await page.locator('.add-menu').getByRole('button', { name, exact: false }).isVisible());
  await page.keyboard.press('Escape'); await select('Leo');
  assert.equal(await page.getByLabel('对象名称', { exact: true }).inputValue(), 'Leo');
  await button('生成空间描述').click(); assert.match(await page.getByLabel('生成的空间描述').inputValue(), /右前方/);
  await saved(); await page.reload(); await saved(); await page.waitForTimeout(700);
  assert.equal((await settings()).language, 'zh'); assert.deepEqual((await settings()).layout, storedLayout); assert.equal((await settings()).showLabels, true);
  await page.screenshot({ path: '.verification/v02-chinese.png' });
  await page.getByLabel('语言', { exact: true }).selectOption('en');
  await button('Reset Layout').click(); assert.deepEqual((await settings()).layout, { left: 213, right: 251, bottom: 290, preview: .54 });

  // Duplicate complete spatial data with independent identities.
  const source = await active(); await button('Duplicate Shot').click(); const duplicate = await active();
  assert.notEqual(duplicate.id, source.id); assert.equal(duplicate.objects.length, source.objects.length);
  for (let i = 0; i < source.objects.length; i++) { const { id: a, ...oa } = source.objects[i], { id: b, ...ob } = duplicate.objects[i]; assert.notEqual(a, b); assert.deepEqual(oa, ob); }
  assert.deepEqual(duplicate.overlays, source.overlays);
  await select('Leo'); await page.getByLabel('Position X').fill('3'); await blur();
  assert.equal((await project()).shots[0].objects.find(o => o.id === leoId).position[0], 0);
  page.once('dialog', d => d.accept()); await button('Copy Scene From Previous Shot').click();
  assert.equal((await active()).objects.find(o => o.name === 'Leo').position[0], 0);
  await page.keyboard.press('Control+z'); assert.equal((await active()).objects.find(o => o.name === 'Leo').position[0], 3);
  await page.keyboard.press('Control+Shift+z'); assert.equal((await active()).objects.find(o => o.name === 'Leo').position[0], 0);
  await saved(); const complete = await project(); await page.reload(); await saved(); assert.deepEqual(await project(), complete);

  // Old 0.1 records acquire defaults while retaining their IDs and data.
  await page.evaluate(async () => {
    const p = (await import(performance.getEntriesByType('resource').find(e => e.name.includes('/src/store.ts'))?.name || '/src/store.ts')).useStore.getState().project;
    for (const shot of p.shots) for (const o of shot.objects) { delete o.visible; delete o.locked; }
    await new Promise((resolve, reject) => { const req = indexedDB.open('StoryboardSpatialDirector'); req.onsuccess = () => { const db = req.result; const tx = db.transaction('projects', 'readwrite'); tx.objectStore('projects').put(p); tx.oncomplete = () => { db.close(); resolve(); }; tx.onerror = reject; }; req.onerror = reject; });
  });
  await page.reload(); await saved(); const migrated = await project();
  assert.equal(migrated.shots[0].objects.find(o => o.name === 'Leo').id, leoId);
  assert(migrated.shots.every(s => s.objects.every(o => o.visible === true && o.locked === false)));
  await page.waitForTimeout(700); await page.screenshot({ path: '.verification/v02-english.png' });
  assert.deepEqual(errors, []);
  console.log('PASS v0.2: bilingual UI + persistence, all primitives, stable IDs + renaming, labels, visibility, locking, undo/redo, Maya orbit/pan/dolly/wheel, Q/W/E/R/F, resizers, five maximized panels, reset, shot duplication/copy independence, frame percentages, semantic descriptions and 0.1 migration.');
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });

