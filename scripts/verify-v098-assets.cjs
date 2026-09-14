const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});const page=await browser.newPage({viewport:{width:1366,height:768}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
 await page.goto(process.env.APP_URL||'http://127.0.0.1:5173');await page.locator('.stage-panel').waitFor();
 await page.evaluate(async()=>{const module=async path=>import(performance.getEntriesByType('resource').find(e=>e.name.includes(path))?.name??path);window.audit={store:(await module('/src/store.ts')).useStore,settings:(await module('/src/settings.ts')).useSettings,scene:await module('/src/lib/scene.ts'),fiber:await module('@react-three_fiber'),three:await module('/deps/three.js')};await audit.store.getState().newProject('Asset audit');audit.settings.setState({language:'en',showLabels:false});audit.settings.getState().maximize('stage');});
 const types=['Character','Car','Van','Motorcycle','Chair','Table','Desk','Sofa','Bed','Shelf','Monitor','Lamp','Wall','Door','Window','Stairs','Box','Prop','Cube','Sphere','Cylinder','Capsule','Cone','Plane'];
 fs.mkdirSync('output/playwright',{recursive:true});let images=[];
 for(const type of types){
  await page.evaluate(type=>{const {store,settings,scene}=audit,o={...scene.makeObject(type),position:[0,0,0]};const b=scene.localBounds(o),target=b.getCenter(new audit.three.Vector3()),radius=Math.max(.7,b.getSize(new audit.three.Vector3()).length()/2),pos=[target.x+radius*1.8,target.y+radius*1.1,target.z+radius*2.8];const cam={...scene.makeObject('Camera'),position:pos,rotation:scene.cameraRotation(pos,target.toArray())};store.getState().updateShot({objects:[cam,o],motionPaths:[],primaryCharacterId:null,primarySubjectId:null});store.getState().selectObject(o.id);store.getState().setMode('select');settings.getState().setWorkspace('spatial');settings.getState().maximize('stage');settings.getState().frameSelected();audit.object=o;},type);
  await page.waitForTimeout(220);await page.evaluate(()=>audit.settings.getState().frameSelected());await page.waitForTimeout(100);
  for(const view of ['spatial','plan','camera']){
   if(view!=='spatial')await page.evaluate(view=>{audit.settings.getState().setWorkspace(view);audit.settings.getState().maximize('stage');const b=audit.scene.localBounds(audit.object);audit.store.getState().updatePlan({view:{x:0,z:0,width:Math.max(4,(b.max.z-b.min.z)*2.3,(b.max.x-b.min.x)*2.3)}});},view);
   await page.waitForTimeout(160);const selector=view==='spatial'?'.editor-canvas':view==='plan'?'.plan-svg':'.stage-content .preview-frame';const buffer=await page.locator(selector).screenshot();images.push({type,view,data:buffer.toString('base64')});
  }
  console.log(`PASS render ${type}: Spatial / Plan / Camera`);
 }
 for(let offset=0;offset<images.length;offset+=18){const gallery=await browser.newPage({viewport:{width:1200,height:1300}});await gallery.setContent(`<style>body{margin:0;background:#18232a;color:#eee;font:14px sans-serif}main{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}figure{margin:0}img{width:100%;height:185px;object-fit:contain}figcaption{padding:5px}</style><main>${images.slice(offset,offset+18).map(x=>`<figure><figcaption>${x.type} — ${x.view}</figcaption><img src="data:image/png;base64,${x.data}"></figure>`).join('')}</main>`);await gallery.screenshot({path:`output/playwright/rc-assets-${offset/18+1}.png`,fullPage:true});await gallery.close();}
 assert.deepEqual(errors,[]);console.log('PASS complete built-in asset rendering; no page errors');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
