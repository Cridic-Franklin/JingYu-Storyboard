const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
 const page=await browser.newPage({viewport:{width:1920,height:1080}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 try{
 await page.goto(process.env.APP_URL||'http://127.0.0.1:5173');await page.locator('.stage-panel').waitFor();
 await page.evaluate(async()=>{
  const module=async path=>import(performance.getEntriesByType('resource').find(e=>e.name.includes(path))?.name??path);
  window.rc={store:(await module('/src/store.ts')).useStore,settings:(await module('/src/settings.ts')).useSettings,scene:await module('/src/lib/scene.ts'),storage:(await module('/src/storage/ProjectStorage.ts')).projectStorage,fiber:await module('@react-three_fiber'),three:await module('/deps/three.js')};
  rc.shot=()=>rc.store.getState().project.shots.find(s=>s.id===rc.store.getState().project.activeShotId);
  rc.controls=()=>{const found=[];rc.root().scene.traverse(x=>{if(x.isTransformControls)found.push(x);});return found;};
  rc.root=()=>rc.fiber._roots.get(document.querySelector('.editor-canvas canvas')).store.getState();
  await rc.store.getState().newProject('RC fixes verification');rc.settings.setState({language:'en',workspaceView:'spatial',poseMode:false,planTool:'select'});
  rc.store.getState().addObject('Character');rc.store.getState().addObject('Cube');
  rc.store.getState().updateObject(rc.store.getState().selectedId,{position:[0,0,0]});rc.store.getState().setMode('translate');
 });
 await page.waitForTimeout(700);
 const dragGizmo=async()=>{
  const p=await page.evaluate(()=>{const r=rc.root(),c=rc.controls()[0],box=r.gl.domElement.getBoundingClientRect();if(!c)throw new Error('missing transform gizmo');const origin=c.object.getWorldPosition(new rc.three.Vector3()).project(r.camera);const x=box.x+(origin.x+1)*box.width/2,y=box.y+(1-origin.y)*box.height/2;
   for(let dy=-75;dy<=75;dy+=4)for(let dx=-75;dx<=75;dx+=4){if(Math.hypot(dx,dy)<20)continue;const px=x+dx,py=y+dy;c.raycaster.setFromCamera(new rc.three.Vector2((px-box.x)/box.width*2-1,1-(py-box.y)/box.height*2),r.camera);const hits=c.raycaster.intersectObjects(c.gizmo.picker[c.mode].children,true).filter(h=>h.object.visible);if(hits[0]?.object.name==='X')return {x:px,y:py};}throw new Error('no X handle found');});
  await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+32,p.y-23,{steps:10});await page.mouse.up();await page.waitForTimeout(150);
 };
 for(const type of ['Camera','Character','Cube'])for(const mode of ['translate','rotate','scale']){
  const before=await page.evaluate(({type,mode})=>{const o=rc.shot().objects.find(o=>o.type===type);rc.store.getState().selectObject(o.id);rc.store.getState().updateObject(o.id,{position:[0,0,0],rotation:[0,0,0],scale:[1,1,1]});rc.store.getState().setMode(mode);return JSON.stringify(rc.shot().objects.find(x=>x.id===o.id));},{type,mode});
  await page.locator('.viewport-tool-rail > button').nth({translate:2,rotate:3,scale:4}[mode]).click();
  await page.waitForFunction(()=>rc.controls().length>0,null,{timeout:5000});await dragGizmo();
  const after=await page.evaluate(()=>JSON.stringify(rc.shot().objects.find(x=>x.id===rc.store.getState().selectedId)));assert.notEqual(after,before,`${type} ${mode} changes scene data by mouse drag`);assert.equal(await page.evaluate(()=>rc.store.getState().transaction),null);console.log(`PASS Spatial ${type} ${mode}`);
 }
 for(const type of ['Camera','Character','Cube']){
  const baseline=await page.evaluate(type=>{const o=rc.shot().objects.find(o=>o.type===type);rc.store.getState().selectObject(o.id);rc.store.getState().setMode('translate');rc.store.getState().updateShot({motionPaths:[{id:'test-path',objectId:o.id,visible:true,smooth:false,name:'Test',points:[{id:'p0',position:[0,0,0],order:0},{id:'p1',position:[0,0,3],order:1},{id:'p2',position:[2,0,5],order:2}]}]});rc.settings.setState({selectedPathId:'test-path',selectedPathPointId:'p0'});return JSON.stringify(rc.shot().objects);},type);
  await page.waitForTimeout(180);await dragGizmo();
  assert.equal(await page.evaluate(()=>JSON.stringify(rc.shot().objects)),baseline,'point drag cannot change owner');assert.notDeepEqual(await page.evaluate(()=>rc.shot().motionPaths[0].points[0].position),[0,0,0]);
  await page.evaluate(()=>rc.store.getState().selectObject(rc.store.getState().selectedId));await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>rc.settings.getState().selectedPathPointId),null);const pathBefore=await page.evaluate(()=>JSON.stringify(rc.shot().motionPaths));await dragGizmo();assert.equal(await page.evaluate(()=>JSON.stringify(rc.shot().motionPaths)),pathBefore,'object drag cannot change path');
  await page.locator('.motion-controls select').selectOption('smooth');assert.equal(await page.evaluate(()=>rc.shot().motionPaths[0].smooth),true);
  await page.locator('.motion-actions button').first().click();assert.equal(await page.locator('.path-point').count(),4);await page.locator('.path-point-delete').last().click();assert.equal(await page.locator('.path-point').count(),3);
  await page.locator('.motion-controls .object-flags button').click();assert.equal(await page.evaluate(()=>rc.shot().motionPaths[0].visible),false);await page.locator('.motion-controls .object-flags button').click();
  console.log(`PASS ${type} path drag isolation, smooth, add/delete, visibility`);
 }
 await page.evaluate(()=>{rc.store.getState().updateShot({motionPaths:[]});rc.settings.getState().setWorkspace('plan');rc.store.getState().selectObject(rc.shot().objects.find(o=>o.type==='Cube').id);rc.store.getState().setMode('translate');rc.settings.getState().frameSelected();});await page.waitForTimeout(250);
 const id=await page.evaluate(()=>rc.store.getState().selectedId),planObject=page.locator(`[data-plan-object="${id}"]`);const bounds=await planObject.locator('rect').first().boundingBox();const position=await page.evaluate(()=>rc.shot().objects.find(o=>o.id===rc.store.getState().selectedId).position);await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);await page.mouse.down();await page.mouse.move(bounds.x+bounds.width/2+35,bounds.y+bounds.height/2+15,{steps:8});await page.mouse.up();assert.notDeepEqual(await page.evaluate(id=>rc.shot().objects.find(o=>o.id===id).position,id),position);console.log('PASS Plan object drag');
 await page.evaluate(()=>{rc.settings.getState().setWorkspace('spatial');rc.store.getState().updateShot({aiEnhancement:'Readable spatial description. '.repeat(120)});});await page.getByRole('button',{name:'AI Assistant',exact:true}).click();
 fs.mkdirSync('output/playwright',{recursive:true});
 for(const [width,height] of [[1366,768],[1920,1080]])for(const theme of ['dark','light']){
  await page.setViewportSize({width,height});await page.evaluate(theme=>rc.settings.setState({theme}),theme);await page.waitForTimeout(180);
  const panel=page.locator('.description-panel'),text=page.locator('.ai-result-label textarea');await text.scrollIntoViewIfNeeded();
  assert.ok((await text.boundingBox()).height>=140);assert.equal(await text.evaluate(e=>getComputedStyle(e).resize),'vertical');assert.ok(await text.evaluate(e=>e.scrollHeight>e.clientHeight));
  const visible=await text.evaluate(e=>{const b=e.getBoundingClientRect();return document.elementFromPoint(b.x+b.width/2,b.y+Math.min(25,b.height/2))===e;});assert.ok(visible,'toolbar cannot cover AI reading area');
  const beforeHeight=(await panel.boundingBox()).height;await page.locator('[data-dimension=bottom]').focus();await page.keyboard.press('ArrowUp');await page.keyboard.press('ArrowUp');await page.waitForTimeout(80);assert.ok((await panel.boundingBox()).height>=beforeHeight,'keyboard panel resize');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight));
  const rail=await page.locator('.viewport-tool-rail').evaluate(e=>{const b=e.getBoundingClientRect(),p=e.closest('.stage-content').getBoundingClientRect();return {bottom:b.bottom,top:b.top,parentBottom:p.bottom,parentTop:p.top,heights:[...e.querySelectorAll('button')].map(b=>b.getBoundingClientRect().height)};});assert.ok(rail.bottom<=rail.parentBottom&&rail.top>=rail.parentTop,`whole tool rail remains in viewport: ${JSON.stringify(rail)}`);
  await page.screenshot({path:`output/playwright/rc-fixes-${theme}-${width}.png`});
 }
 console.log('PASS AI reading/resize/overlap, dark/light, both target resolutions');
 await page.locator('.description-panel .panel-controls button').first().click();const reading=page.locator('.ai-result-label textarea');await reading.scrollIntoViewIfNeeded();const grip=await reading.boundingBox();await page.mouse.move(grip.x+grip.width-3,grip.y+grip.height-3);await page.mouse.down();await page.mouse.move(grip.x+grip.width-3,grip.y+grip.height+47,{steps:8});await page.mouse.up();assert.ok((await reading.boundingBox()).height>grip.height+20,'native text resize works');await page.locator('.description-panel .panel-controls button').first().click();console.log('PASS native AI textarea resize');
 await page.evaluate(()=>rc.settings.setState({navSection:'shots'}));await page.locator('.shot-workflow summary').click();assert.equal(await page.locator('.inspector .shot-details').count(),0);assert.equal(await page.locator('.shot-sidebar .shot-details').count(),1);await page.locator('.shot-workflow > button').click();assert.equal(await page.evaluate(()=>rc.shot().objects.find(o=>o.id===rc.store.getState().selectedId).type),'Camera');console.log('PASS left workflows / selected-object Inspector');
 const first=await page.evaluate(async()=>{await rc.store.getState().newProject('Remove fixture');const id=rc.store.getState().project.id;await rc.store.getState().newProject('Delete fixture');return id;});
 await page.locator('.project-menu-button').click();let row=page.locator('.recent-project-row').filter({hasText:'Remove fixture'});await row.getByRole('button',{name:'Remove from Recent',exact:true}).click();await page.getByRole('button',{name:'Cancel',exact:true}).click();assert.equal(await row.count(),1);await row.getByRole('button',{name:'Remove from Recent',exact:true}).click();await page.getByRole('button',{name:'Confirm',exact:true}).click();await page.waitForTimeout(100);assert.equal(await row.count(),0);assert.ok(await page.evaluate(id=>rc.storage.load(id),first),'remove retains local project');await page.getByRole('button',{name:'Close',exact:true}).click();
 const second=await page.evaluate(async()=>{const id=rc.store.getState().project.id;await rc.store.getState().openRecent(rc.store.getState().project.id);await rc.store.getState().newProject('Active fixture');return id;});
 await page.locator('.project-menu-button').click();row=page.locator('.recent-project-row').filter({hasText:'Delete fixture'});await row.getByRole('button',{name:'Delete local project',exact:true}).click();await page.getByRole('button',{name:'Confirm',exact:true}).click();await page.waitForTimeout(100);assert.equal(await row.count(),0);assert.equal(await page.evaluate(id=>rc.storage.load(id),second),undefined);assert.equal(await page.locator('.recent-project-row').filter({hasText:'Active fixture'}).getByRole('button',{name:'Delete local project',exact:true}).isDisabled(),true);console.log('PASS recent remove/cancel, local delete, active-project protection');
 await page.reload();await page.locator('.stage-panel').waitFor();await page.locator('.project-menu-button').click();await page.locator('.recent-project-row').filter({hasText:'Active fixture'}).waitFor();assert.equal(await page.locator('.recent-project-row').filter({hasText:'Remove fixture'}).count(),0);assert.equal(await page.locator('.recent-project-row').filter({hasText:'Delete fixture'}).count(),0);assert.equal(await page.locator('.recent-project-row').filter({hasText:'Active fixture'}).count(),1);console.log('PASS project list persistence after reload');
 assert.deepEqual(errors,[]);console.log('PASS final RC fixes; no browser page/console errors');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
