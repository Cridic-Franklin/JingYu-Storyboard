import { ShotReference } from './components/ShotReference';
import { ComingSoonDialog, type FutureModule } from './components/ComingSoonDialog';
import { ViewportTools } from './components/ViewportTools';
import { WorkspacePresets } from './components/WorkspacePresets';
import { ValidationSummary } from './components/SpatialRules';
import { framePreset } from './lib/shotExports';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useStore } from './store';
import { useSettings } from './settings';
import { useT, type MessageKey } from './i18n';
import type { Overlay, Shot, TransformMode } from './types';
import { describeScene } from './lib/scene';
import { analyzeShot } from './lib/semantics';
import { createAIProvider } from './lib/ai';
import { interpretationPrompt, isLowDifference, isShotSuggestionResponse, suggestionsPrompt, type InterpretationMode, type ShotSuggestion } from './lib/sceneAI';
import { AddObjectMenu } from './components/AddObjectMenu';
import { Icon } from './components/Icon';
import { CameraPreview, SpatialEditor } from './components/Stage';
import { CameraPresets, Inspector } from './components/Inspector';
import { ResizeHandle, usePanel } from './components/Layout';
import { PlanView } from './components/PlanView';
import { ProjectMenu } from './components/ProjectMenu';
import { ExportControls, CameraAnnotationControls } from './components/ExportControls';
import { SettingsDialog } from './components/SettingsDialog';
import { CommandPalette } from './components/CommandPalette';
import { ContextMenu, type ContextAction } from './components/ContextMenu';
import { EnvironmentControls } from './components/LightControls';

let transformClipboard: Pick<import('./types').StageObject,'position'|'rotation'|'scale'>|null=null;

function ShotList({ shots, activeId }: { shots: Shot[]; activeId: string | null }) {
  const t = useT(); const panel = usePanel('shots');
  const [menu,setMenu]=useState<{x:number;y:number;shot:Shot}|null>(null);
  const actions=(shot:Shot):ContextAction[]=>[{label:t('duplicateShot'),icon:'copy',run:()=>useStore.getState().duplicateShot(shot.id)},{label:t('copyPrevious'),icon:'layers',disabled:shots.findIndex(s=>s.id===shot.id)<1,run:()=>{useStore.getState().selectShot(shot.id);useStore.getState().copyPreviousScene();}},{label:t('rename'),icon:'document',run:()=>{const title=window.prompt(t('shotTitle'),shot.title);if(title!==null)useStore.getState().updateShot({title},shot.id);}},{label:t('deleteShot',{n:shot.number}),icon:'trash',danger:true,run:()=>useStore.getState().deleteShot(shot.id)}];
  return <aside className={`shot-sidebar${panel.className}`} style={panel.style}>{panel.resize}<div className="panel-heading" {...panel.header}><Icon name="layers" /><h2>{t('shotList')}</h2>{panel.controls}<span className="count">{String(shots.length).padStart(2, '0')}</span></div>
    <details className="sequence-group" open><summary className="sequence-title">{t('sequence')} {shots[0]?.sequence??'01'} <span>{shots.length} {t('shots')}</span></summary>
    <div className="shot-cards">{shots.map(shot => <div className={`shot-card ${activeId === shot.id ? 'active' : ''}`} key={shot.id} onContextMenu={event=>{event.preventDefault();setMenu({x:event.clientX,y:event.clientY,shot});}}>
      <ShotReference shot={shot}>
      <button className="shot-select" onClick={() => useStore.getState().selectShot(shot.id)} aria-label={t('selectShot', { n: String(shot.number).padStart(3, '0') })}>
        <div className="shot-card-copy"><b>{shot.title || t('untitledShot')}</b><p>{shot.shotType}</p><span className="shot-duration">{shot.duration.toFixed(1)}s</span><span className={`status-label ${shot.status.toLowerCase()}`}>{shot.status === 'Approved' && <Icon name="check" size={10} />}{t(shot.status)}</span></div>
      </button>
      <button className="shot-delete icon-button" title={t('deleteShot', { n: shot.number })} aria-label={t('deleteShot', { n: String(shot.number).padStart(3, '0') })} onClick={() => { if (window.confirm(t('confirmDelete', { n: String(shot.number).padStart(3, '0') }))) useStore.getState().deleteShot(shot.id); }}><Icon name="trash" size={13} /></button>
    </ShotReference></div>)}<button className="new-shot" onClick={() => useStore.getState().addShot()}><Icon name="plus" />{t('newShot')}</button></div></details>
    <div className="sidebar-bottom"><Icon name="layers" size={20} /><p>{t('tagline')}</p><span>{t('versionTag')}</span></div>{menu&&<ContextMenu x={menu.x} y={menu.y} actions={actions(menu.shot)} onClose={()=>setMenu(null)}/>}
  </aside>;
}
function ContextPanel({shot,shots,activeId,onSettings,onFuture}:{shot?:Shot;shots:Shot[];activeId:string|null;onSettings:()=>void;onFuture:(module:FutureModule)=>void}){
  const t=useT(),section=useSettings(s=>s.navSection),panel=usePanel('shots');
  if(section==='shots')return <ShotList shots={shots} activeId={activeId}/>;
  const objects:import('./types').ObjectType[]=['Chair','Table','Desk','Sofa','Bed','Car','Van','Motorcycle','Box','Shelf','Monitor','Lamp','Wall','Door','Window','Stairs'];
  const create:[FutureModule,MessageKey][]=[['script','scriptFuture'],['shotPlanning','shotPlanningFuture'],['aiStoryboard','aiStoryboardFuture']];
  return <aside className={`shot-sidebar context-sidebar${panel.className}`} style={panel.style}>{panel.resize}<div className="panel-heading" {...panel.header}><Icon name={section}/><h2>{t(section)}</h2>{panel.controls}</div><div className="context-list">
    {section==='settings'&&<><p>{t('appearance')}</p><button onClick={onSettings}><Icon name="settings"/>{t('openSettings')}</button></>}
    {section==='objects'&&objects.map(type=><button key={type} onClick={()=>useStore.getState().addObject(type)}><Icon name={type}/><span>{t(type)}</span><Icon name="plus" size={12}/></button>)}
    {section==='scene'&&<><p>{t('sceneSettings')}</p>{(['Plane','DirectionalLight','PointLight','SpotLight'] as const).map(type=><button key={type} onClick={()=>useStore.getState().addObject(type)}><Icon name={type}/><span>{t(type)}</span><Icon name="plus" size={12}/></button>)}{shot&&<EnvironmentControls shot={shot}/>}</>}
    {section==='characters'&&<><button onClick={()=>useStore.getState().addObject('Character')}><Icon name="Character"/><span>{t('addCharacter')}</span><Icon name="plus" size={12}/></button>{shot?.objects.filter(object=>object.type==='Character').map(object=><button key={object.id} onClick={()=>useStore.getState().selectObject(object.id)}><Icon name="Character"/><span>{object.name}</span></button>)}</>}
    {section==='references'&&<><p>{t('referenceHelp')}</p>{shots.map(item=><button key={item.id} onClick={()=>useStore.getState().selectShot(item.id)}><Icon name="image"/><span>{String(item.number).padStart(3,'0')} · {item.references[0]?.name??t('noStoryboard')}</span></button>)}</>}
    {section==='create'&&create.map(([module,description])=><button className="future-module" key={module} onClick={()=>onFuture(module)}><Icon name={module}/><span><b>{t(module)}</b><small>{t(description)}</small></span><em>{t('comingSoon')}</em></button>)}
  </div></aside>;
}
function SpatialDescription({ shot }: { shot: Shot }) {
  const description = shot.descriptionLive ? describeScene(shot) : shot.spatialDescription;
  const t = useT(); const panel = usePanel('description');
  const settings=useSettings(); const [tab,setTab]=useState<'spatial'|'ai'|'notes'>('spatial');
  const [aiState,setAiState]=useState<'idle'|'loading'|'error'|'timeout'|'schema'>('idle'); const [aiTask,setAiTask]=useState<'interpretation'|'suggestions'>('interpretation');
  const [mode,setMode]=useState<InterpretationMode>('director'),[suggestions,setSuggestions]=useState<ShotSuggestion[]>([]),[lowDifference,setLowDifference]=useState(false);
  const [copyState, setCopyState] = useState<'copy' | 'copied' | 'manualCopy'>('copy');
  const textRef = useRef<HTMLTextAreaElement>(null),suggestionsRef=useRef<HTMLElement>(null);
  useEffect(() => { setCopyState('copy'); }, [description]);
  useEffect(()=>{if(suggestions.length)suggestionsRef.current?.scrollIntoView({block:'start'});},[suggestions]);
  const provider=()=>createAIProvider({kind:settings.aiProvider,endpoint:settings.aiEndpoint,apiKey:settings.aiKey,model:settings.aiModel});
  const fail=(error:unknown)=>setAiState(error instanceof DOMException&&error.name==='TimeoutError'?'timeout':error instanceof Error&&error.message.includes('schema')?'schema':'error');
  async function interpret(){setAiTask('interpretation');setAiState('loading');setLowDifference(false);try{const source=gradeSource();const result=await provider().generateText(interpretationPrompt(shot,settings.language,mode));useStore.getState().updateShot({aiEnhancement:result},shot.id);setLowDifference(isLowDifference(source,result));setAiState('idle');}catch(error){fail(error);}}
  async function suggest(){setAiTask('suggestions');setAiState('loading');try{const result=await provider().generateStructured(suggestionsPrompt(shot,settings.language),isShotSuggestionResponse);setSuggestions(result.suggestions);setAiState('idle');}catch(error){fail(error);}}
  function gradeSource(){return description||describeScene(shot);}
  return <section className={`description-panel${panel.className}`} style={panel.style}>{panel.resize}<div className="panel-heading" {...panel.header}><Icon name="document" /><h2>{t('spatialDescription')}</h2>{panel.controls}<span className="panel-meta">{t('sceneWords')}</span></div>
    <div className="panel-tabs"><button aria-pressed={tab==='spatial'} onClick={()=>setTab('spatial')}>{t('spatialDescription')}</button><button aria-pressed={tab==='ai'} onClick={()=>setTab('ai')}>{t('aiAssistant')}</button><button aria-pressed={tab==='notes'} onClick={()=>setTab('notes')}>{t('notes')}</button></div>
    <div className="description-body">{tab==='spatial'&&<><div className="description-toolbar"><span className="micro-label">{t('compositionNotes')}</span><button className="text-button" disabled={!description} onClick={async () => {
      try { await navigator.clipboard.writeText(description); setCopyState('copied'); }
      catch { textRef.current?.select(); setCopyState('manualCopy'); }
    }}><Icon name={copyState === 'copied' ? 'check' : 'copy'} size={13} />{t(copyState)}</button></div>
    <textarea ref={textRef} aria-label={t('generatedDescription')} className="description-output" readOnly value={description} placeholder={t('descriptionPlaceholder')} />
    <button className="generate-button" onClick={() => useStore.getState().updateShot({ spatialDescription: describeScene(shot), descriptionLive: true })}><Icon name="document" size={15} />{t('generate')}<Icon name="arrow" size={15} /></button>
    <details className="structured-data"><summary>{t('structuredData')}</summary><pre>{JSON.stringify(analyzeShot(shot),null,2)}</pre></details><div className="description-footnote">{t('generatedLocally')}</div></>}
    {tab==='ai'&&<div className={`ai-enhance${suggestions.length?' has-suggestions':''}`}><p>{t('aiEnhanceHelp')}</p><div className="ai-mode-switch" role="group" aria-label={t('directorInterpretation')}>{(['faithful','director'] as const).map(key=><button key={key} aria-pressed={mode===key} onClick={()=>setMode(key)}>{t(key==='director'?'directorMode':key)}</button>)}</div><label className="ai-result-label">{t('directorInterpretation')}<textarea aria-label={t('aiEnhancement')} readOnly value={shot.aiEnhancement} placeholder={t('aiEnhancePlaceholder')} /></label>{lowDifference&&<p className="warning-text" role="status">{t('aiLowDifference')}</p>}
    {aiState==='loading'&&<p className="ai-loading" role="status" aria-live="polite">{t('aiLoading')}</p>}{aiState!=='idle'&&aiState!=='loading'&&<p className="error-text" role="alert">{t(aiState==='timeout'?'aiTimeout':aiState==='schema'?'aiSchemaError':'aiEnhanceError')}</p>}<div className="ai-actions"><button className="generate-button" disabled={aiState==='loading'} onClick={()=>void interpret()}><Icon name="spark"/>{aiState==='loading'&&aiTask==='interpretation'?t('aiLoading'):t(shot.aiEnhancement?'retry':'generateInterpretation')}</button><button className="secondary-button" disabled={aiState==='loading'} onClick={()=>void suggest()}><Icon name="camera"/>{aiState==='loading'&&aiTask==='suggestions'?t('aiLoading'):t('generateSuggestions')}</button></div>
    <section ref={suggestionsRef} className="suggestion-section"><h3>{t('currentShotSuggestions')}</h3>{suggestions.length?suggestions.map((item,index)=><article className="suggestion-card" key={`${item.category}-${index}`}><b>{t(`suggestion${item.category[0].toUpperCase()}${item.category.slice(1)}` as MessageKey)}</b><p>{item.suggestion}</p><small><strong>{t('suggestionReason')}:</strong> {item.reason}</small></article>):<p className="suggestion-empty">{t('noSuggestions')}</p>}</section><small>{t('aiFactsLocked')}</small></div>}
    {tab==='notes'&&<textarea className="notes-editor" aria-label={t('notes')} value={shot.notes} onChange={e=>useStore.getState().updateShot({notes:e.target.value},shot.id)} placeholder={t('notesPlaceholder')} />}</div>
  </section>;
}
const overlayOptions: Overlay[] = ['thirds', 'cross', 'safe', 'spiral'];
export default function App() {
  const state = useStore(); const settings = useSettings(); const t = useT();
  const stagePanel = usePanel('stage'), previewPanel = usePanel('preview');
  const shot = state.project.shots.find(s => s.id === state.project.activeShotId);
  const [addOpen, setAddOpen] = useState(false); const [settingsOpen,setSettingsOpen]=useState(false),[commandsOpen,setCommandsOpen]=useState(false); const [futureModule,setFutureModule]=useState<FutureModule|null>(null); const [objectMenu,setObjectMenu]=useState<{x:number;y:number;id:string}|null>(null); const addRef = useRef<HTMLDivElement>(null);
  useEffect(() => { void useStore.getState().hydrate(); }, []);
  useEffect(() => { document.documentElement.lang = settings.language === 'zh' ? 'zh-CN' : 'en'; document.documentElement.dataset.theme=settings.theme;document.documentElement.dataset.textSize=settings.textSize; document.title = t('fullBrand'); document.querySelector('meta[name=theme-color]')?.setAttribute('content',settings.theme==='dark'?'#0B0F12':'#F4F6F7'); }, [settings.language,settings.theme,settings.textSize, t]);
  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (document.querySelector('[role=dialog], dialog[open]')) return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable || event.altKey) return;
      const current = useStore.getState();
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); if (event.shiftKey) current.redo(); else current.undo(); return; }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setCommandsOpen(true); return; }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') { event.preventDefault(); if (current.selectedId) current.duplicateObject(current.selectedId); return; }
      if (event.ctrlKey || event.metaKey) return;
      const modes: Record<string, TransformMode> = { q: 'select', w: 'translate', e: 'rotate', r: 'scale' };
      if (modes[event.key.toLowerCase()]) { event.preventDefault(); current.setMode(modes[event.key.toLowerCase()]); useSettings.setState({ planTool: 'select' }); }
      if (event.key.toLowerCase() === 'h') { event.preventDefault(); current.setMode('select'); useSettings.setState({ planTool: 'pan' }); }
      if (event.key.toLowerCase() === 'm') { event.preventDefault(); settings.setWorkspace('plan'); useSettings.setState({ planTool: 'measure' }); }
      if (event.key.toLowerCase() === 'f') { event.preventDefault(); useSettings.getState().frameSelected(); }
      if (event.key === 'Escape') { current.selectObject(null); useSettings.setState({ maximized: null, focusTool: null, selectedPathId:null, selectedPathPointId:null }); setAddOpen(false); }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const ui=useSettings.getState(),active=current.project.shots.find(item=>item.id===current.project.activeShotId),path=active?.motionPaths.find(item=>item.id===ui.selectedPathId);
        if(path&&ui.selectedPathPointId&&path.points.length>2){event.preventDefault();current.updateShot({motionPaths:active!.motionPaths.map(item=>item.id===path.id?{...item,points:item.points.filter(point=>point.id!==ui.selectedPathPointId).map((point,order)=>({...point,order}))}:item)});useSettings.setState({selectedPathPointId:null});return;}
        if(current.selectedId){event.preventDefault();current.deleteObject(current.selectedId);}
      }
    }
    function clickOutside(e: PointerEvent) { if (!addRef.current?.contains(e.target as Node) && !(e.target as Element).closest('.add-menu')) setAddOpen(false); }
    window.addEventListener('keydown', keydown); window.addEventListener('pointerdown', clickOutside);
    return () => { window.removeEventListener('keydown', keydown); window.removeEventListener('pointerdown', clickOutside); };
  }, []);
  if (!state.ready) return <div className="loading">{t('loading')}</div>;
  const absent = (panel: 'shots'|'stage'|'preview'|'description'|'inspector') => settings.panels[panel].hidden || settings.panels[panel].floating;
  const style = { '--shot-width': `${absent('shots') ? 0 : settings.layout.left}px`, '--inspector-width': `${absent('inspector') ? 0 : settings.layout.right}px`, '--bottom-height': `${absent('preview') && absent('description') ? 0 : Math.min(settings.layout.bottom, Math.max(180,window.innerHeight * .3))}px`, '--preview-fraction': `${settings.layout.preview}fr`, '--description-fraction': `${1 - settings.layout.preview}fr` } as CSSProperties;
  const menuObject=shot?.objects.find(object=>object.id===objectMenu?.id);
  return <div className="app-shell" style={style} onFocusCapture={e => { if (((e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) && !e.target.readOnly) || e.target instanceof HTMLSelectElement) state.beginTransaction(); }} onBlurCapture={() => state.endTransaction('field')}>
    <a className="skip-link" href="#main-workspace">{t('skipWorkspace')}</a><header className="app-header"><picture className="brand-logo"><img width="640" height="160" src={settings.theme==='dark'?'/brand/sceneaxis-logo-horizontal-dark.svg':'/brand/sceneaxis-logo-horizontal-light.svg'} alt={t('fullBrand')} /></picture><div className="header-divider" /><ProjectMenu /><span className="local-badge">{t('localProject')}</span>
      <div className="history-actions"><button className="icon-button" aria-label={t('undo')} title={`${t('undo')} (Ctrl+Z)`} disabled={!state.past.length && !state.transaction} onClick={state.undo}><Icon name="undo" /></button><button className="icon-button" aria-label={t('redo')} title={`${t('redo')} (Ctrl+Shift+Z)`} disabled={!state.future.length} onClick={state.redo}><Icon name="redo" /></button></div>
      <div className="save-status" role="status"><span className={`live-dot ${state.saveStatus === 'error' ? 'error' : ''}`} />{t(state.saveStatus === 'saved' ? 'saved' : state.saveStatus === 'saving' ? 'saving' : 'storageUnavailable')}</div>
      <select className="language-select" aria-label={t('language')} value={settings.language} onChange={e => settings.setLanguage(e.target.value as 'en' | 'zh')}><option value="en">{t('english')}</option><option value="zh">{t('chinese')}</option></select>
      <button className="icon-button" aria-label={t(settings.theme==='dark'?'themeLight':'themeDark')} title={t(settings.theme==='dark'?'themeLight':'themeDark')} onClick={()=>useSettings.setState({theme:settings.theme==='dark'?'light':'dark'})}><Icon name={settings.theme==='dark'?'themeLight':'themeDark'} /></button><button className="icon-button" aria-label={t('commandPalette')} title={`${t('commandPalette')} (Ctrl+K)`} onClick={()=>setCommandsOpen(true)}><Icon name="search" /></button><button className="icon-button" aria-label={t('settings')} title={t('settings')} onClick={()=>setSettingsOpen(true)}><Icon name="settings" /></button>
      {settings.maximized && <button className="layout-action" onClick={() => useSettings.setState({ maximized: null })}>{t('restorePanel')}</button>}<button className="layout-action" onClick={settings.resetLayout}>{t('resetLayout')}</button><button className="header-new" onClick={state.addShot}><Icon name="plus" size={14} />{t('newShot')}</button>
    </header>
    {state.error && <div className="error-banner" role="alert">{t('storageError', { detail: state.error })}{state.recovery && <span>{t('recoveryHelp')}</span>}<button onClick={state.retrySave}>{t('retrySave')}</button></div>}
    <div className="workspace"><nav className="global-nav" aria-label={t('globalNavigation')}><img className="nav-glyph" width="256" height="256" src={settings.theme==='dark'?'/brand/sceneaxis-glyph-dark.svg':'/brand/sceneaxis-glyph-light.svg'} alt="" />{(['shots','objects','scene','characters','references','create','settings'] as const).map(section=><button key={section} aria-label={t(section)} aria-current={settings.navSection===section?'page':undefined} onClick={()=>{useSettings.setState({navSection:section});if(section==='settings')setSettingsOpen(true);}}><Icon name={section}/><span>{t(section)}</span></button>)}</nav><ContextPanel shot={shot} shots={state.project.shots} activeId={state.project.activeShotId} onSettings={()=>setSettingsOpen(true)} onFuture={setFutureModule}/><ResizeHandle dimension="left" panel="shots" />
      <main id="main-workspace" tabIndex={-1} className="main-workspace">{shot ? <>
        <div className="shot-heading"><div><span className="eyebrow">{t('shot', { n: String(shot.number).padStart(3, '0') })}</span><span className="heading-slash">/</span><h1>{shot.title || t('untitledShot')}</h1><span className={`status-label ${shot.status.toLowerCase()}`}>{t(shot.status)}</span></div><div className="shot-actions"><button aria-label={t('duplicateShot')} title={t('duplicateShot')} onClick={() => state.duplicateShot(shot.id)}><Icon name="copy" size={13} /><span>{t('duplicateShot')}</span></button><button aria-label={t('copyPrevious')} title={t('copyPrevious')} disabled={state.project.shots.findIndex(s => s.id === shot.id) < 1} onClick={() => { if (window.confirm(t('confirmCopy'))) state.copyPreviousScene(); }}><Icon name="layers" size={13} /><span>{t('copyPrevious')}</span></button></div></div>
        <div className="workspace-tabs">{(['spatial', 'plan', 'camera'] as const).map(view => <button key={view} aria-pressed={settings.workspaceView === view} onClick={() => settings.setWorkspace(view)}>{t(view)}</button>)}<WorkspacePresets /><ExportControls shot={shot} /></div>
        <section className={`stage-panel${stagePanel.className}`} style={stagePanel.style}>{stagePanel.resize}<div className="stage-toolbar" {...stagePanel.header}><span className="stage-title"><Icon name="Cube" />{settings.workspaceView === 'spatial' ? t('spatialEditor') : t(settings.workspaceView)}</span>
          {stagePanel.controls}<div className="add-object-wrap" ref={addRef}><button className="add-object" aria-expanded={addOpen} onClick={() => setAddOpen(v => !v)}><Icon name="plus" size={14} />{t('addObject')}<span>⌄</span></button>{addOpen && <AddObjectMenu onClose={() => setAddOpen(false)} />}</div>
        </div><div className="stage-content">{settings.workspaceView === 'spatial' && <ViewportTools />}{settings.workspaceView === 'aiReview' ? <div className="ai-review-grid"><div className="review-camera"><CameraPreview shot={shot} annotations={framePreset(shot,'aiReference').annotations} /></div><div className="review-plan"><PlanView key={shot.id} shot={shot} /></div></div> : settings.workspaceView === 'plan' ? <PlanView key={shot.id} shot={shot} /> : settings.workspaceView === 'camera' ? <CameraPreview shot={shot} /> : <SpatialEditor shot={shot} />}{settings.workspaceView === 'spatial' && <><div className="scene-list"><div className="micro-label">{t('scene')}<span>{shot.objects.length}</span></div>{shot.objects.map(object => <div className={`scene-row ${state.selectedId === object.id ? 'active' : ''}`} key={object.id} onContextMenu={event=>{event.preventDefault();setObjectMenu({x:event.clientX,y:event.clientY,id:object.id});}}><button className={`scene-select ${state.selectedId === object.id ? 'active' : ''}`} onClick={() => state.selectObject(object.id)}><Icon name={object.type} size={13} /><span>{object.name || t(object.type)}</span></button><button className="scene-flag" aria-label={t(object.visible ? 'hideObject' : 'showObject', { name: object.name })} title={t(object.visible ? 'visible' : 'hidden')} onClick={() => state.updateObject(object.id, { visible: !object.visible })}><Icon name={object.visible ? 'eye' : 'eyeOff'} size={12} /></button><button className="scene-flag" aria-label={t(object.locked ? 'unlockObject' : 'lockObject', { name: object.name })} title={t(object.locked ? 'locked' : 'unlocked')} onClick={() => state.updateObject(object.id, { locked: !object.locked })}><Icon name={object.locked ? 'lock' : 'unlock'} size={12} /></button></div>)}</div>
          <div className="viewport-options"><button aria-pressed={settings.showLabels} onClick={settings.toggleLabels}><Icon name="label" size={12} />{t('showLabels')}</button><button aria-label={t('frameSelected')} title={`${t('frameSelected')} (F)`} disabled={!state.selectedId} onClick={settings.frameSelected}><Icon name="frame" size={13} /></button></div></>}
        </div><CameraPresets shot={shot} /></section>
        <ResizeHandle dimension="bottom" panel="stage" />
        <div className="bottom-panels" style={{gridTemplateColumns: absent('preview') ? '1fr' : absent('description') ? '1fr' : undefined}}><section className={`preview-panel${previewPanel.className}`} style={previewPanel.style}>{previewPanel.resize}<div className="panel-heading" {...previewPanel.header}><Icon name="camera" /><h2>{t('cameraPreview')}</h2>{previewPanel.controls}<span className="preview-live"><span className="live-dot" />{t('live')}</span></div>{settings.workspaceView === 'aiReview' ? <div className="review-validation"><h3>{t('spatialValidation')}</h3><ValidationSummary shot={shot} /></div> : <CameraPreview shot={shot} />}<CameraAnnotationControls shot={shot} /><div className="overlays"><span>{t('guides')}</span>{overlayOptions.map(key => <button aria-pressed={shot.overlays.includes(key)} className={shot.overlays.includes(key) ? 'active' : ''} key={key} onClick={() => state.toggleOverlay(key)}><span className="check-box">{shot.overlays.includes(key) && <Icon name="check" size={9} />}</span>{t(key)}</button>)}</div></section><ResizeHandle dimension="preview" panel="preview" /><SpatialDescription key={shot.id} shot={shot} /></div>

      </> : <div className="empty-workspace"><Icon name="camera" size={48} /><h1>{t('emptyHeading')}</h1><p>{t('emptyHelp')}</p><button className="generate-button" onClick={state.addShot}><Icon name="plus" />{t('createShot')}</button></div>}</main>
      <ResizeHandle dimension="right" panel="inspector" /><Inspector shot={shot} />
    </div><footer className="app-footer"><span><span className="live-dot" />{shot ? t('objectCount', { n: shot.objects.length }) : t('noShot')}</span><span>{t('shortcuts')}</span><span>{t('fullBrand')}<b>0.98</b></span></footer><SettingsDialog open={settingsOpen} onClose={()=>setSettingsOpen(false)}/><ComingSoonDialog module={futureModule} onClose={()=>setFutureModule(null)}/><CommandPalette open={commandsOpen} onClose={()=>setCommandsOpen(false)} onImport={()=>{useSettings.setState({navSection:'shots'});requestAnimationFrame(()=>document.querySelector<HTMLInputElement>('.shot-card.active input[type=file]')?.click());}} onSettings={()=>setSettingsOpen(true)}/>{objectMenu&&menuObject&&<ContextMenu x={objectMenu.x} y={objectMenu.y} onClose={()=>setObjectMenu(null)} actions={[{label:t('duplicateObject'),icon:'copy',disabled:menuObject.type==='Camera',run:()=>state.duplicateObject(menuObject.id)},{label:t('frameSelected'),icon:'frame',run:()=>{state.selectObject(menuObject.id);settings.frameSelected();}},{label:t('moveToGround'),icon:'ground',disabled:menuObject.locked,run:()=>state.updateObject(menuObject.id,{position:[menuObject.position[0],0,menuObject.position[2]]})},{label:t('copyTransform'),icon:'copy',run:()=>{transformClipboard=structuredClone({position:menuObject.position,rotation:menuObject.rotation,scale:menuObject.scale});}},{label:t('pasteTransform'),icon:'paste',disabled:!transformClipboard||menuObject.locked,run:()=>{if(transformClipboard)state.updateObject(menuObject.id,structuredClone(transformClipboard));}},{label:t('deleteObject'),icon:'trash',danger:true,disabled:menuObject.locked,run:()=>state.deleteObject(menuObject.id)}]}/>}
  </div>;
}
