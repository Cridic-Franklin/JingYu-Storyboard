const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
(async()=>{
 await fs.mkdir('.verification',{recursive:true});
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
 try {
 const page=await browser.newPage({viewport:{width:1500,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.showOpenFilePicker=undefined;window.showSaveFilePicker=undefined;});
 await page.goto(process.env.APP_URL||'http://127.0.0.1:5173/');await page.getByRole('status').filter({hasText:'All changes saved'}).waitFor();
 const bind=()=>page.evaluate(async()=>{
   const module=async path=>import(performance.getEntriesByType('resource').find(e=>e.name.includes(path))?.name??path);
   window.v095={store:(await module('/src/store.ts')).useStore,settings:(await module('/src/settings.ts')).useSettings,scene:await module('/src/lib/scene.ts'),storage:await module('/src/storage/ProjectStorage.ts'),exports:await module('/src/lib/export.tsx'),semantics:await module('/src/lib/semantics.ts'),types:await module('/src/types.ts'),fiber:await module('@react-three_fiber'),pose:await module('/src/lib/pose.ts')};
 });
 await bind();
 const shot=()=>page.evaluate(()=>v095.store.getState().project.shots[0]);
 await page.getByRole('button',{name:/Add object/}).click();await page.locator('.add-menu').getByRole('button',{name:'Character',exact:false}).click();
 const character=(await shot()).objects.find(o=>o.type==='Character').id;
 const heights=await page.evaluate(()=>{const o=v095.store.getState().project.shots[0].objects.find(o=>o.type==='Character');return ['standing','walking','crouching','singleKnee','doubleKnee','sitting','leaning'].map(p=>{const b=v095.scene.localBounds({...o,pose:v095.pose.makePose(p)});return {p,height:b.max.y-b.min.y,depth:b.max.z-b.min.z};});});
 assert(heights.find(p=>p.p==='singleKnee').height<heights[0].height);assert(new Set(heights.map(p=>p.height+','+p.depth)).size>=5);
 await page.getByLabel('Pose Preset',{exact:true}).selectOption('singleKnee');
 await page.getByRole('button',{name:'Pose Mode',exact:true}).click();await page.getByLabel('Joint',{exact:true}).selectOption('leftElbow');
 await page.getByRole('textbox',{name:'Joint X',exact:true}).fill('45');await page.getByRole('textbox',{name:'Joint X',exact:true}).press('Enter');
 assert.equal((await shot()).objects.find(o=>o.id===character).pose.joints.leftElbow[0],45);
 // Use actual R3F state to locate rotation rings, then manipulate them with pointer input.
 await page.evaluate(()=>v095.settings.getState().frameSelected());await page.waitForTimeout(120);
 const center=await page.evaluate(()=>{const canvas=document.querySelector('.editor-canvas canvas'),r=v095.fiber._roots.get(canvas).store.getState();let control;r.scene.traverse(o=>{if(o.isTransformControls&&o.object?.name==='joint:leftElbow')control=o;});if(!control)throw new Error('Pose rotation gizmo missing');const p=control.object.getWorldPosition(control.position.clone()).project(r.camera),b=canvas.getBoundingClientRect();return {x:b.x+(p.x+1)*b.width/2,y:b.y+(1-p.y)*b.height/2};});
 let ring;
 for(const radius of [24,35,48,60]){for(let i=0;i<12;i++){const a=i*Math.PI/6,x=center.x+Math.cos(a)*radius,y=center.y+Math.sin(a)*radius;await page.mouse.move(x,y);const axis=await page.evaluate(()=>{const canvas=document.querySelector('.editor-canvas canvas'),r=v095.fiber._roots.get(canvas).store.getState();let axis;r.scene.traverse(o=>{if(o.isTransformControls&&o.object?.name==='joint:leftElbow')axis=o.axis;});return axis;});if(axis&&axis!=='E'){ring={x,y};break;}}if(ring)break;}
 assert(ring,'Could not pick a joint rotation ring');const beforeDrag=JSON.stringify((await shot()).objects.find(o=>o.id===character).pose);
 await page.mouse.move(ring.x,ring.y);await page.mouse.down();await page.mouse.move(ring.x+28,ring.y+20,{steps:8});await page.mouse.up();
 assert.notEqual(JSON.stringify((await shot()).objects.find(o=>o.id===character).pose),beforeDrag,'Direct joint rotation must update scene pose');
 await page.getByRole('button',{name:'Pose Mode',exact:true}).click();
 await page.getByLabel('Display Color',{exact:true}).fill('#769dcc');
 assert.equal((await shot()).objects.find(o=>o.id===character).displayColor,'#769dcc');
 const clean=await page.evaluate(async()=>{const s=v095.store.getState().project.shots[0];return Array.from(new Uint8Array(await (await v095.exports.cameraPNG(s,640,v095.types.defaultAnnotations(),[])).arrayBuffer()));});
 await page.getByLabel('Display Color',{exact:true}).fill('#bf858c');await page.waitForTimeout(100);
 const clean2=await page.evaluate(async()=>{const s=v095.store.getState().project.shots[0];return Array.from(new Uint8Array(await (await v095.exports.cameraPNG(s,640,v095.types.defaultAnnotations(),[])).arrayBuffer()));});assert.deepEqual(clean,clean2,'Default camera export ignores editor colors');
 await page.getByLabel('Use editor colors in Camera / exports',{exact:true}).check();await page.waitForTimeout(100);
 const colored=await page.evaluate(async()=>{const s=v095.store.getState().project.shots[0];return Array.from(new Uint8Array(await (await v095.exports.cameraPNG(s,640,v095.types.defaultAnnotations(),[])).arrayBuffer()));});assert.notDeepEqual(clean,colored);
 await page.getByLabel('Use editor colors in Camera / exports',{exact:true}).uncheck();
 console.log('PASS pose presets, manual angles, direct joint gizmo, editor colors and camera export opt-in');

 await page.getByRole('button',{name:/Add object/}).click();
 await page.getByLabel('Import OBJ…',{exact:true}).setInputFiles({name:'Beacon Tower.obj',mimeType:'text/plain',buffer:Buffer.from('v -0.5 0 -0.5\nv 0.5 0 -0.5\nv 0.5 0 0.5\nv -0.5 0 0.5\nv 0 1.5 0\nf 1 5 2\nf 2 5 3\nf 3 5 4\nf 4 5 1\nf -5 -4 -3 -2\n')});
 await page.getByLabel('Object name',{exact:true}).fill('Tower');
 const obj=(await shot()).objects.find(o=>o.type==='OBJ').id;
 for(const [field,value] of [['Position X','2'],['Rotation Y','25'],['Scale Y','1.2']]){await page.getByRole('textbox',{name:field,exact:true}).fill(value);await page.getByRole('textbox',{name:field,exact:true}).press('Enter');}
 await page.getByLabel('Display Color',{exact:true}).fill('#e4ad6d');
 assert.equal((await shot()).objects.find(o=>o.id===obj).asset.positions.length,54);
 await page.getByRole('button',{name:'Unlocked',exact:true}).click();const locked=(await shot()).objects.find(o=>o.id===obj);
 await page.evaluate(id=>v095.store.getState().updateObject(id,{position:[99,99,99]}),obj);assert.deepEqual((await shot()).objects.find(o=>o.id===obj).position,locked.position);
 await page.getByRole('button',{name:'Locked',exact:true}).click();
 const sceneProof=await page.evaluate(id=>{const canvas=document.querySelector('.editor-canvas canvas'),r=v095.fiber._roots.get(canvas).store.getState(),g=r.scene.getObjectByName(id);return {x:g.position.x,mesh:g.children[0].isMesh,vertices:g.children[0].geometry.attributes.position.count};},obj);assert.equal(sceneProof.x,2);assert.equal(sceneProof.vertices,18);
 await page.getByRole('button',{name:'Plan View',exact:true}).click();await page.locator(`[data-plan-object="${obj}"]`).waitFor();assert.equal(await page.locator(`[data-pose-footprint="${character}"]`).count(),1);
 const planObj=page.locator(`[data-plan-object="${obj}"]`);assert((await planObj.getAttribute('transform')).includes('2 '));
 const pbox=await planObj.boundingBox();await page.mouse.move(pbox.x+pbox.width/2,pbox.y+pbox.height/2);await page.mouse.down();await page.mouse.move(pbox.x+pbox.width/2+25,pbox.y+pbox.height/2+10,{steps:5});await page.mouse.up();
 assert.notEqual((await shot()).objects.find(o=>o.id===obj).position[0],2,'Plan drag changes shared transform');
 await page.getByRole('button',{name:'Spatial 3D',exact:true}).click();await page.waitForTimeout(100);
 const synced=await page.evaluate(id=>{const canvas=document.querySelector('.editor-canvas canvas'),r=v095.fiber._roots.get(canvas).store.getState();return r.scene.getObjectByName(id).position.x;},obj);assert.equal(synced,(await shot()).objects.find(o=>o.id===obj).position[0]);
 await page.evaluate(id=>v095.store.getState().selectObject(id),obj);
 await page.getByRole('button',{name:'Visible',exact:true}).click();assert.equal((await shot()).objects.find(o=>o.id===obj).visible,false);await page.getByRole('button',{name:'Hidden',exact:true}).click();
 await page.evaluate(id=>v095.store.getState().duplicateObject(id),obj);const copy=(await shot()).objects.at(-1);assert.notEqual(copy.id,obj);assert.deepEqual(copy.asset,(await shot()).objects.find(o=>o.id===obj).asset);await page.evaluate(id=>v095.store.getState().deleteObject(id),copy.id);
 await page.evaluate(id=>v095.store.getState().selectObject(id),obj);
 const sem=await page.evaluate(()=>{const s=v095.store.getState().project.shots[0];return {json:v095.semantics.analyzeShot(s),text:v095.semantics.semanticDescription(s)};});assert(sem.text.includes('Tower'));assert(sem.text.includes('kneeling'));assert.equal(sem.json.objects.find(o=>o.id===obj).asset.format,'obj');assert(sem.json.objects.find(o=>o.id===character).pose);assert(!JSON.stringify(sem.json).includes('displayColor'));
 console.log('PASS embedded OBJ import/transform/lock/visibility/duplicate/delete, shared views, pose and asset semantics');

 await page.getByRole('button',{name:'Camera View',exact:true}).click();await page.getByRole('button',{name:'Golden Spiral',exact:true}).click();
 const paths=new Set();
 for(const ratio of ['16:9','2.39:1','4:3','9:16']) {
  await page.getByLabel('Aspect Ratio',{exact:true}).selectOption(ratio);
  for(const corner of ['topLeft','topRight','bottomLeft','bottomRight']){await page.getByLabel('Spiral orientation',{exact:true}).selectOption(corner);const d=await page.locator('.stage-content [data-overlay="spiral"]').getAttribute('d');assert(!d.includes('NaN'));paths.add(d);const preview=await page.locator('.preview-panel [data-overlay="spiral"]').getAttribute('d');assert.equal(d,preview);}
 }
 assert.equal(paths.size,16);
 await page.getByLabel('Mirror spiral',{exact:true}).check();await page.getByRole('textbox',{name:'Guide X offset (%)',exact:true}).fill('12');await page.getByRole('textbox',{name:'Guide X offset (%)',exact:true}).press('Enter');await page.getByRole('textbox',{name:'Guide scale (%)',exact:true}).fill('80');await page.getByRole('textbox',{name:'Guide scale (%)',exact:true}).press('Enter');
 const guide=(await shot()).spiral;
 await page.getByRole('button',{name:'Reset Spiral',exact:true}).click();assert.equal((await shot()).spiral.scale,1);await page.evaluate(g=>v095.store.getState().updateShot({spiral:g}),guide);
 const exportProof=await page.evaluate(async()=>{const s=v095.store.getState().project.shots[0],plan=await import(performance.getEntriesByType('resource').find(e=>e.name.includes('/src/components/PlanView.tsx')).name);const camera=await v095.exports.cameraPNG(s,640,s.annotations,s.overlays),p=await v095.exports.planPNG(s,plan.defaultPlanOptions,800);const a=await createImageBitmap(camera),b=await createImageBitmap(p);return {camera:[a.width,a.height],plan:[b.width,b.height],bytes:[Array.from(new Uint8Array(await camera.arrayBuffer())),Array.from(new Uint8Array(await p.arrayBuffer()))]};});
 assert.deepEqual(exportProof.camera,[640,1138]);assert.deepEqual(exportProof.plan,[800,480]);await fs.writeFile('.verification/v095-camera.png',Buffer.from(exportProof.bytes[0]));await fs.writeFile('.verification/v095-plan.png',Buffer.from(exportProof.bytes[1]));
 console.log('PASS sixteen aspect/orientation combinations, mirror/offset/scale/reset and Camera/Plan PNG');

 const savedShot=JSON.parse(JSON.stringify(await shot()));const downloading=page.waitForEvent('download');await page.evaluate(()=>v095.store.getState().saveProject());const download=await downloading;const bytes=await fs.readFile(await download.path());const envelope=JSON.parse(bytes.toString());assert.equal(envelope.project.schemaVersion,5);
 await page.evaluate(async data=>{const project=await v095.storage.projectStorage.importFile(new File([data],'roundtrip.jyproject'));await v095.store.getState().openProject(project);},bytes.toString());assert.deepEqual((await shot()).objects,savedShot.objects);assert.deepEqual((await shot()).spiral,guide);
 const migration=await page.evaluate(()=>{
  const p=structuredClone(v095.store.getState().project);p.schemaVersion=4;for(const s of p.shots){s.objects=s.objects.filter(o=>o.type!=='OBJ');delete s.spiral;delete s.useEditorColors;for(const o of s.objects){delete o.pose;delete o.displayColor;}}
  const original=JSON.stringify(p),m=v095.storage.migrateProject(p),old=m.shots[0].objects.find(o=>o.type==='Character');let rejected=0;
  for(const change of [p=>p.schemaVersion=6,p=>p.shots[0].spiral.scale=-1,p=>p.shots[0].objects.find(o=>o.type==='Character').pose.joints.head=[NaN,0,0],p=>p.shots[0].objects[0].displayColor='url(bad)',p=>p.shots[0].objects.find(o=>o.type==='OBJ').asset.positions=[0,0,0]]){const test=structuredClone(v095.store.getState().project);change(test);try{v095.storage.migrateProject(test);}catch{rejected++;}}
  return {unchanged:JSON.stringify(p)===original,schema:m.schemaVersion,pose:old.pose.preset,colors:m.shots[0].useEditorColors,spiral:m.shots[0].spiral.scale,rejected};
 });assert.deepEqual(migration,{unchanged:true,schema:5,pose:'standing',colors:false,spiral:1,rejected:5});
 await page.reload();await page.getByRole('status').filter({hasText:'All changes saved'}).waitFor();await bind();assert.deepEqual((await shot()).objects,savedShot.objects);assert.deepEqual((await shot()).spiral,guide);
 console.log('PASS portable download/open, IndexedDB reload, V0.9 defaults and rejection of malformed/newer data');

 await page.getByRole('button',{name:'Reset Layout',exact:true}).click();
 await page.getByRole('button',{name:'Spatial 3D',exact:true}).click();await page.evaluate(()=>v095.settings.getState().resize({left:270,bottom:260,preview:.62}));
 await page.getByRole('button',{name:'Plan View',exact:true}).click();assert.equal(await page.evaluate(()=>v095.settings.getState().layout.bottom),230);
 await page.evaluate(()=>v095.settings.getState().resize({left:240,bottom:210}));await page.getByRole('button',{name:'Spatial 3D',exact:true}).click();assert.equal(await page.evaluate(()=>v095.settings.getState().layout.left),270);
 await page.getByRole('button',{name:'Plan View',exact:true}).click();assert.equal(await page.evaluate(()=>v095.settings.getState().layout.left),240);
 await page.getByRole('button',{name:'Reset Layout',exact:true}).click();assert.equal(await page.evaluate(()=>v095.settings.getState().layout.left),213);
 for(const [name,selector] of [['Shot list','.shot-sidebar'],['Spatial editor','.stage-panel'],['Camera preview','.preview-panel'],['Spatial description','.description-panel'],['Inspector','.inspector']]){
  const region=page.locator(selector);
  await page.getByRole('button',{name:`Maximize · ${name}`,exact:true}).click();assert((await region.getAttribute('class')).includes('panel-maximized'));
  await page.getByRole('button',{name:`Restore Panel · ${name}`,exact:true}).click();
  await page.getByRole('button',{name:`Float · ${name}`,exact:true}).click();assert((await region.getAttribute('class')).includes('panel-floating'));
  const before=await region.boundingBox();await page.mouse.move(before.x+75,before.y+15);await page.mouse.down();await page.mouse.move(before.x+115,before.y+40,{steps:5});await page.mouse.up();const moved=await region.boundingBox();assert(moved.x>before.x+20,'Floating header moves panel');
  const grip=await region.locator('.float-resize').boundingBox();await page.mouse.move(grip.x+9,grip.y+9);await page.mouse.down();await page.mouse.move(grip.x+60,grip.y+40,{steps:5});await page.mouse.up();assert((await region.boundingBox()).width>moved.width+30,'Floating grip resizes panel');
  await page.getByRole('button',{name:`Dock · ${name}`,exact:true}).click();assert(!(await region.getAttribute('class')).includes('panel-floating'));
  await page.getByRole('button',{name:`Hide panel · ${name}`,exact:true}).click();assert(!(await region.isVisible()));
  if(name==='Camera preview'){const size=await page.evaluate(async()=>{const s=v095.store.getState().project.shots[0];return (await v095.exports.cameraPNG(s,640,s.annotations,s.overlays)).size;});assert(size>1000);}
  await page.getByRole('button',{name:'Reset Layout',exact:true}).click();assert(await region.isVisible());
 }
 await page.getByLabel('Workspace',{exact:true}).selectOption('aiReview');await page.locator('.ai-review-grid').waitFor();assert.equal(await page.evaluate(()=>v095.settings.getState().layout.bottom),250);
 await page.getByRole('button',{name:'Float · Inspector',exact:true}).click();const floating=await page.evaluate(()=>v095.settings.getState().panels.inspector);
 await page.reload();await page.getByRole('status').filter({hasText:'All changes saved'}).waitFor();await bind();assert.deepEqual(await page.evaluate(()=>v095.settings.getState().panels.inspector),floating);
 await page.getByRole('button',{name:'Reset Layout',exact:true}).click();await page.screenshot({path:'.verification/v095-workspace.png'});
 assert.deepEqual(errors,[]);console.log('PASS workspace isolation/reload, all five panel maximize/float/move/resize/dock/hide/reset, hidden Camera export; no runtime exceptions');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
