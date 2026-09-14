const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(process.env.APP_URL || 'http://127.0.0.1:5173/');
    await page.getByRole('status').filter({ hasText: 'All changes saved' }).waitFor();
    const bind = () => page.evaluate(async () => {
      const module = async path => import(performance.getEntriesByType('resource').find(entry => entry.name.includes(path))?.name ?? path);
      window.v098 = { store: (await module('/src/store.ts')).useStore, settings: (await module('/src/settings.ts')).useSettings, storage: await module('/src/storage/ProjectStorage.ts'), semantics: await module('/src/lib/semantics.ts'), scene: await module('/src/lib/scene.ts'), ai: await module('/src/lib/ai.ts') };
    });
    await bind();

    const foundation = await page.evaluate(() => {
      const store = v098.store.getState(), shot = store.project.shots[0];
      store.addObject('Character');
      const current = v098.store.getState().project.shots[0], character = current.objects.find(object => object.type === 'Character');
      store.updateShot({ motionPaths: [{ id: crypto.randomUUID(), objectId: character.id, name: 'Walk', visible: true, smooth: true, points: [{ id: crypto.randomUUID(), position: [0, 0, 0], order: 0 }, { id: crypto.randomUUID(), position: [1, 0, 1], order: 1 }, { id: crypto.randomUUID(), position: [2, 0, 0], order: 2 }] }] });
      const migrated = v098.storage.migrateProject({ id: 'legacy', name: 'Legacy', schemaVersion: 5, activeShotId: 's1', nextShotNumber: 2, shots: [{ id: 's1', number: 1, title: 'Old', status: 'Draft', image: null, objects: [{ id: 'cam', type: 'Camera', name: 'Cam', position: [0, 2, 8], rotation: [0, 0, 0], scale: [1, 1, 1], fov: 45, visible: true, locked: false }], overlays: ['thirds'] }] });
      let futureRejected = false; try { v098.storage.migrateProject({ id: 'future', schemaVersion: 99, shots: [] }); } catch { futureRejected = true; }
      const active = v098.store.getState().project.shots[0], facts = v098.semantics.analyzeShot(active), description = v098.scene.describeScene(active);
      return { schema: shot ? store.project.schemaVersion : 0, objectTypes: active.objects.map(object => object.type), pathPoints: active.motionPaths[0].points.length, factsVersion: facts.version, hasCharacter: description.includes('Character'), migratedSchema: migrated.schemaVersion, migratedDuration: migrated.shots[0].duration, futureRejected };
    });
    assert.deepEqual(foundation, { schema: 6, objectTypes: ['Camera', 'Character'], pathPoints: 3, factsVersion: 3, hasCharacter: true, migratedSchema: 6, migratedDuration: 5, futureRejected: true });

    const fixture = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 320; c.height = 180; const x = c.getContext('2d'); x.fillStyle = '#727f87'; x.fillRect(0, 0, 320, 180); x.strokeStyle = '#aeb8be'; x.strokeRect(30, 25, 260, 130); return c.toDataURL().split(',')[1]; });
    await page.locator('.shot-card.active input[type=file]').setInputFiles({ name: 'reference.png', mimeType: 'image/png', buffer: Buffer.from(fixture, 'base64') });
    await page.getByRole('button', { name: /Replace image/ }).waitFor();
    await page.getByRole('button', { name: 'New shot' }).last().click();
    await page.getByRole('button', { name: 'Undo' }).click();
    assert.equal(await page.locator('.shot-card').count(), 1);
    await page.getByRole('button', { name: 'Redo' }).click();
    assert.equal(await page.locator('.shot-card').count(), 2);
    await page.keyboard.press('Control+k');
    await page.getByRole('dialog', { name: 'Command palette' }).waitFor();
    await page.keyboard.press('Escape');

    const security = await page.evaluate(async () => {
      v098.settings.setState({ aiKey: 'sceneaxis-test-secret', theme: 'light' });
      let missingKeyRejected = false; try { await v098.ai.createAIProvider({ kind: 'deepseek', endpoint: 'https://api.deepseek.com/v1', apiKey: '', model: 'deepseek-chat' }).generateText('test'); } catch { missingKeyRejected = true; }
      return { persistedSecret: localStorage.getItem('ssd-preferences-v02')?.includes('sceneaxis-test-secret') ?? false, missingKeyRejected, theme: document.documentElement.dataset.theme };
    });
    assert.deepEqual(security, { persistedSecret: false, missingKeyRejected: true, theme: 'light' });
    await page.reload();
    await page.getByRole('status').filter({ hasText: 'All changes saved' }).waitFor();
    await bind();
    assert.equal(await page.evaluate(() => v098.settings.getState().aiKey), '');
    assert.equal(await page.evaluate(() => v098.store.getState().project.shots[0].references.length), 1);
    assert.deepEqual(errors, []);
    console.log('PASS V0.98: schema/migration, Character + motion path, Spatial Description v3, reference persistence, shot undo/redo, command palette, theme and session-only AI key.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
