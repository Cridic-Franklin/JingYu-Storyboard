// Opt-in only. Credential is injected into this process, never written to artifacts.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 let key=process.env.SCENEAXIS_RC_AI_KEY;delete process.env.SCENEAXIS_RC_AI_KEY;
 if(!key)throw new Error('Temporary provider credential required.');
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
 const page=await browser.newPage({viewport:{width:1920,height:1080}});
 const reports=[];
 try{
 await page.goto(process.env.APP_URL||'http://127.0.0.1:5173');await page.locator('.stage-panel').waitFor();
 await page.evaluate(async key=>{
  const module=async path=>import(performance.getEntriesByType('resource').find(e=>e.name.includes(path))?.name??path);
  window.realRC={store:(await module('/src/store.ts')).useStore,settings:(await module('/src/settings.ts')).useSettings,scene:await module('/src/lib/scene.ts'),semantics:await module('/src/lib/semantics.ts')};
  const {store,settings}=realRC;await store.getState().newProject('Real provider RC fixture');settings.setState({language:'en',aiProvider:'deepseek',aiEndpoint:'https://api.deepseek.com/v1',aiModel:'deepseek-chat',aiKey:key});
  store.getState().addObject('Character');const actor=store.getState().selectedId;store.getState().updateObject(actor,{name:'Actor A',position:[0,0,0]});store.getState().addObject('Chair');store.getState().updateObject(store.getState().selectedId,{name:'Chair B',position:[2,0,-1]});store.getState().updateShot({primaryCharacterId:actor,primarySubjectId:actor,title:'RC spatial study',descriptionLive:true});
 },key);key='';
 await page.getByRole('button',{name:'AI Assistant',exact:true}).click();
 for(const language of ['zh','en']){
  await page.evaluate(language=>realRC.settings.setState({language}),language);
  const facts=await page.evaluate(()=>{const s=realRC.store.getState(),shot=s.project.shots.find(x=>x.id===s.project.activeShotId);return {scene:JSON.stringify({...shot,aiEnhancement:''}),facts:realRC.semantics.analyzeShot(shot),source:realRC.scene.describeScene(shot)};});
  for(const mode of ['faithful','director','suggestions']){
   if(mode!=='suggestions')await page.locator('.ai-mode-switch button').nth(mode==='faithful'?0:1).click();
   const response=page.waitForResponse(r=>r.url()==='https://api.deepseek.com/v1/chat/completions',{timeout:45000});
   await page.locator('.ai-actions button').nth(mode==='suggestions'?1:0).click();
   const http=await response;assert.equal(http.status(),200,`DeepSeek ${language}/${mode} HTTP`);
   await page.waitForFunction(()=>!document.querySelector('.ai-loading'),null,{timeout:45000});
   assert.equal(await page.locator('.ai-enhance [role=alert]').count(),0,`${language}/${mode} no UI error`);
   const output=mode==='suggestions'?await page.locator('.suggestion-card').allTextContents():await page.locator('.ai-result-label textarea').inputValue();
   assert.ok(output.length,`${mode} has output`);
   const text=typeof output==='string'?output:output.join('\n');assert.ok(language==='zh'?/[\u4e00-\u9fff]/.test(text):!/[一-鿿]/.test(text),'UI language respected');
   if(language==='zh')assert.doesNotMatch(text,/notFacing|Proxy bounds before occlusion|cameraAngle|screenFacing/,'technical prose is localized');
   const scene=await page.evaluate(()=>{const s=realRC.store.getState();return JSON.stringify({...s.project.shots.find(x=>x.id===s.project.activeShotId),aiEnhancement:''});});assert.equal(scene,facts.scene,'AI never mutates spatial or authored shot data');
   reports.push({language,mode,http:200,source:facts.source,facts:facts.facts,output});console.log(`PASS real DeepSeek ${language}/${mode}; scene unchanged`);
  }
 }
 assert.equal(await page.evaluate(async()=>{const secret=realRC.settings.getState().aiKey;const db=await new Promise((resolve,reject)=>{const req=indexedDB.open('StoryboardSpatialDirector');req.onsuccess=()=>resolve(req.result);req.onerror=reject;});try{const rows=await new Promise((resolve,reject)=>{const req=db.transaction('projects').objectStore('projects').getAll();req.onsuccess=()=>resolve(req.result);req.onerror=reject;});return JSON.stringify(localStorage).includes(secret)||JSON.stringify(rows).includes(secret);}finally{db.close();}}),false,'credential absent from preferences and local projects');
 fs.mkdirSync('output/playwright',{recursive:true});fs.writeFileSync('output/playwright/rc-real-provider-results.json',JSON.stringify(reports,null,2));
 }finally{
  key='';await page.evaluate(()=>{if(window.realRC)realRC.settings.setState({aiKey:'',aiProvider:'deepseek',aiEndpoint:'',aiModel:'deepseek-chat'});}).catch(()=>{});
  await browser.close();console.log('Temporary provider session cleared.');
 }
})().catch(()=>{console.error('Real provider verification failed; credential and request headers withheld.');process.exitCode=1;});
