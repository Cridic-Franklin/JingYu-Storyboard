const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const bind = () => page.evaluate(async () => {
    const module = async path => import(performance.getEntriesByType('resource').find(entry => entry.name.includes(path))?.name ?? path);
    window.polish = { store: (await module('/src/store.ts')).useStore, settings: (await module('/src/settings.ts')).useSettings, ai: await module('/src/lib/ai.ts'), sceneAI: await module('/src/lib/sceneAI.ts') };
  });
  const activeShot = () => page.evaluate(() => { const state=polish.store.getState(); return state.project.shots.find(shot=>shot.id===state.project.activeShotId); });
  try {
    await page.goto(process.env.APP_URL || 'http://127.0.0.1:5173/');
    await page.locator('.stage-panel').waitFor(); await bind();
    await page.evaluate(async () => { await polish.store.getState().newProject('Final polish verification'); polish.settings.setState({language:'en',theme:'dark',navSection:'shots',workspaceView:'spatial'}); });

    const navLabels=['Shots','Objects','Scene','Characters','References','Create','Settings'];
    for(const label of navLabels) assert.equal(await page.getByRole('navigation').getByRole('button',{name:label,exact:true}).count(),1,`navigation exposes ${label}`);
    await page.getByRole('navigation').getByRole('button',{name:'Create',exact:true}).click();
    for(const label of ['Script','Shot Planning','AI Storyboard']) assert.equal(await page.getByRole('button',{name:new RegExp(label)}).count(),1);
    await page.getByRole('button',{name:/Script/}).click();
    await page.getByRole('dialog').waitFor();
    assert.match(await page.getByRole('dialog').innerText(),/Coming Soon/);
    assert.equal(await page.getByRole('dialog').getByRole('button').count(),1,'future preview has no fake action');
    await page.keyboard.press('Escape');

    const divider=await page.evaluate(()=>{const root=getComputedStyle(document.documentElement);return {key:root.getPropertyValue('--sa-divider-key'),soft:root.getPropertyValue('--sa-divider-soft'),surface:root.getPropertyValue('--sa-surface-tonal')};});
    assert.match(divider.key,/gradient/);assert.match(divider.key,/cyan|rgb|#/i);assert.match(divider.soft,/gradient/);assert.match(divider.surface,/gradient/);
    await page.evaluate(()=>polish.settings.setState({theme:'light'}));
    await page.waitForFunction(()=>document.documentElement.dataset.theme==='light');
    assert.notEqual((await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--sa-surface-tonal'))),divider.surface);

    await page.evaluate(()=>{polish.settings.setState({theme:'dark',navSection:'characters'});polish.store.getState().addObject('Character');});
    await page.waitForFunction(()=>polish.store.getState().project.shots[0].objects.some(object=>object.type==='Character'));
    await page.evaluate(()=>{for(const type of ['Car','Van','Motorcycle'])polish.store.getState().addObject(type);});
    const types=(await activeShot()).objects.map(object=>object.type);
    for(const type of ['Character','Car','Van','Motorcycle'])assert.ok(types.includes(type));
    const blocking=fs.readFileSync('src/components/BlockingGeometry.tsx','utf8'),stage=fs.readFileSync('src/components/Stage.tsx','utf8'),plan=fs.readFileSync('src/components/PlanView.tsx','utf8');
    assert.match(blocking,/endsWith\('Knee'\)[\s\S]*boxGeometry/);assert.match(blocking,/joint==='torso'\?\s*<cylinderGeometry/);assert.match(stage,/torusGeometry/);assert.match(stage,/PathPointHandle/);assert.match(stage,/TransformControls object=\{ref\}/);assert.match(plan,/data-path-point/);assert.match(plan,/g\.kind === 'path'/);

    await page.evaluate(()=>{
      const state=polish.store.getState(),shot=state.project.shots[0],character=shot.objects.find(object=>object.type==='Character');
      state.updateShot({motionPaths:[{id:'verify-path',objectId:character.id,name:'Blocking path',visible:true,smooth:false,points:[{id:'point-a',position:[0,0,0],order:0},{id:'point-b',position:[2,0,1],order:1},{id:'point-c',position:[4,0,0],order:2}]}]});
      polish.settings.setState({workspaceView:'plan',planTool:'select',selectedPathId:'verify-path',selectedPathPointId:null,positionSnap:0});
    });
    const point=page.locator('[data-path-point="point-b"]');await point.waitFor();
    const before=(await activeShot()).motionPaths[0].points[1].position;
    const box=await point.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+34,box.y+22,{steps:5});await page.mouse.up();
    const after=(await activeShot()).motionPaths[0].points[1].position;assert.notDeepEqual(after,before,'Plan drag updates shared motion-path point');
    await page.keyboard.press('Delete');assert.equal((await activeShot()).motionPaths[0].points.length,2,'Delete removes selected path point');
    const pathSource=fs.readFileSync('src/components/MotionPathControls.tsx','utf8');assert.match(pathSource,/value=\{path\.smooth\?'smooth':'linear'\}/);assert.match(pathSource,/addPoint/);assert.match(pathSource,/deletePoint/);
    const motionCoverage=await page.evaluate(()=>{
      const state=polish.store.getState(),shot=state.project.shots[0],owners=['Camera','Character','Car'].map(type=>shot.objects.find(object=>object.type===type));
      const paths=owners.map((object,index)=>({id:`path-${index}`,objectId:object.id,name:`${object.type} path`,visible:true,smooth:index===2,points:[{id:`${index}-a`,position:[object.position[0],0,0],order:0},{id:`${index}-b`,position:[object.position[0]+1,0,1],order:1},{id:`${index}-c`,position:[object.position[0]+2,0,0],order:2}]}));
      state.updateShot({motionPaths:paths});return {owners:paths.map(path=>shot.objects.find(object=>object.id===path.objectId).type),smooth:paths.map(path=>path.smooth),visible:paths.map(path=>path.visible)};
    });
    assert.deepEqual(motionCoverage,{owners:['Camera','Character','Car'],smooth:[false,false,true],visible:[true,true,true]});
    await page.waitForFunction(()=>document.querySelectorAll('[data-motion-path]').length===3);
    await page.evaluate(()=>{const state=polish.store.getState(),shot=state.project.shots[0];state.updateShot({motionPaths:shot.motionPaths.map((path,index)=>index===2?{...path,visible:false}:path)});});
    await page.waitForFunction(()=>document.querySelectorAll('[data-motion-path]').length===2);

    const promptCheck=await page.evaluate(()=>{
      const shot=polish.store.getState().project.shots[0];shot.objects.find(object=>object.type==='Character').name='Hero_CN';
      return {zh:polish.sceneAI.interpretationPrompt(shot,'zh','faithful'),en:polish.sceneAI.interpretationPrompt(shot,'en','director'),valid:polish.sceneAI.isShotSuggestionResponse({suggestions:[{category:'camera',suggestion:'Lower camera',reason:'Current camera is high'}]}),invalid:polish.sceneAI.isShotSuggestionResponse({suggestions:[{category:'unknown',suggestion:'x',reason:'y'}]}),low:polish.sceneAI.isLowDifference('Camera at 35 mm faces Hero_CN','Camera at 35 mm faces Hero_CN')};
    });
    assert.match(promptCheck.zh,/Simplified Chinese/);assert.match(promptCheck.zh,/Hero_CN/);assert.match(promptCheck.en,/English/);assert.match(promptCheck.en,/SceneAxis owns spatial truth/);assert.equal(promptCheck.valid,true);assert.equal(promptCheck.invalid,false);assert.equal(promptCheck.low,true);

    await page.evaluate(()=>polish.settings.setState({workspaceView:'spatial',aiProvider:'openai-compatible',aiEndpoint:'https://mock.sceneaxis/v1',aiModel:'mock-model',aiKey:'session-secret'}));
    await page.route('https://mock.sceneaxis/v1/chat/completions',async route=>{
      const request=route.request().postDataJSON();const structured=Boolean(request.response_format);
      await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({choices:[{message:{content:structured?JSON.stringify({suggestions:[{category:'composition',suggestion:'Keep Hero_CN on the existing left third.','reason':'The current spatial facts place the subject left of frame.'}]}):'Hero_CN remains left of frame while the existing depth layers read clearly.'}}]})});
    });
    await page.getByRole('button',{name:'AI Assistant',exact:true}).click();
    await page.getByRole('button',{name:'Faithful',exact:true}).click();
    await page.getByRole('button',{name:'Generate Interpretation',exact:true}).click();
    await page.waitForFunction(()=>polish.store.getState().project.shots[0].aiEnhancement.includes('Hero_CN'));
    await page.getByRole('button',{name:'Generate Suggestions',exact:true}).click();
    await page.getByText('Keep Hero_CN on the existing left third.').waitFor();
    assert.equal((await activeShot()).objects.find(object=>object.name==='Hero_CN').position.length,3,'AI does not mutate scene facts');
    const provider=await page.evaluate(async()=>{
      let timeout=false,schema=false;
      const oldFetch=window.fetch;window.fetch=()=>new Promise((_,reject)=>setTimeout(()=>reject(new DOMException('timed out','TimeoutError')),5));
      try{await polish.ai.createAIProvider({kind:'openai-compatible',endpoint:'https://timeout.test/v1',apiKey:'x',model:'x'}).generateText('x',{timeoutMs:20});}catch(error){timeout=error.name==='TimeoutError';}
      window.fetch=async()=>new Response(JSON.stringify({choices:[{message:{content:'{"suggestions":[]}'}}]}),{status:200,headers:{'Content-Type':'application/json'}});
      try{await polish.ai.createAIProvider({kind:'openai-compatible',endpoint:'https://schema.test/v1',apiKey:'x',model:'x'}).generateStructured('x',polish.sceneAI.isShotSuggestionResponse);}catch(error){schema=String(error).includes('schema');}
      window.fetch=oldFetch;return {timeout,schema,persisted:localStorage.getItem('ssd-preferences-v02')?.includes('session-secret')??false};
    });
    assert.deepEqual(provider,{timeout:true,schema:true,persisted:false});

    await page.screenshot({path:'output/playwright/final-polish-1366-dark.png',fullPage:true});
    await page.evaluate(()=>{
      const state=polish.store.getState(),shot=state.project.shots[0],layout={Character:[-3,0,0],Car:[-1.25,0,0],Van:[1.05,0,0],Motorcycle:[3.15,0,0]};
      for(const object of shot.objects)if(layout[object.type])state.updateObject(object.id,{position:layout[object.type],rotation:[0,0,0],scale:object.type==='Character'?[1,1,1]:[.45,.45,.45]});
      polish.settings.setState({workspaceView:'spatial',selectedPathId:null,selectedPathPointId:null});
    });
    await page.waitForTimeout(250);await page.locator('.stage-panel').screenshot({path:'output/playwright/final-polish-objects-spatial.png'});
    await page.getByRole('button',{name:'Plan View',exact:true}).click();await page.locator('[data-testid=plan-view]').waitFor();
    assert.equal(await page.locator('[data-plan-object]').count(),5);await page.locator('.stage-panel').screenshot({path:'output/playwright/final-polish-objects-plan.png'});
    await page.getByRole('button',{name:'Camera View',exact:true}).click();await page.locator('.stage-panel .preview-frame').waitFor();await page.locator('.stage-panel').screenshot({path:'output/playwright/final-polish-objects-camera.png'});
    for(const textSize of ['compact','default','large']){
      await page.evaluate(size=>polish.settings.setState({textSize:size}),textSize);
      for(const viewport of [{width:1920,height:1080},{width:1440,height:900},{width:1366,height:768},{width:1024,height:768}]){
        await page.setViewportSize(viewport);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),true,`${textSize} has no page overflow at ${viewport.width}x${viewport.height}`);
      }
    }
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),true,'no horizontal page overflow');
    assert.deepEqual(errors,[]);
    console.log('PASS V0.98 final polish: IA, honest future states, divider tiers/themes, Character/vehicle semantics, 2D+3D motion-path implementation, direct point drag/delete, AI language/modes/suggestions/schema/timeout/provider isolation, session-only key, and 1366x768 layout.');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exit(1);});
