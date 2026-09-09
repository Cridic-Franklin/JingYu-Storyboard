import { WorkspacePresets } from './components/WorkspacePresets';
import { ValidationSummary } from './components/SpatialRules';
import { framePreset } from './lib/shotExports';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useStore } from './store';
import { useSettings } from './settings';
import { useT, type MessageKey } from './i18n';
import type { Overlay, Shot, TransformMode } from './types';
import { describeScene } from './lib/scene';
import { AddObjectMenu } from './components/AddObjectMenu';
import { Icon } from './components/Icon';
import { CameraPreview, SpatialEditor } from './components/Stage';
import { CameraPresets, Inspector } from './components/Inspector';
import { ResizeHandle, usePanel } from './components/Layout';
import { PlanView } from './components/PlanView';
import { ProjectMenu } from './components/ProjectMenu';
import { ExportControls, CameraAnnotationControls } from './components/ExportControls';

function ShotList({ shots, activeId }: { shots: Shot[]; activeId: string | null }) {
  const t = useT(); const panel = usePanel('shots');
  return <aside className={`shot-sidebar${panel.className}`} style={panel.style}>{panel.resize}<div className="panel-heading" {...panel.header}><Icon name="layers" /><h2>{t('shotList')}</h2>{panel.controls}<span className="count">{String(shots.length).padStart(2, '0')}</span></div>
    <div className="sequence-title">{t('sequence')} <span>{t('local')}</span></div>
    <div className="shot-cards">{shots.map(shot => <div className={`shot-card ${activeId === shot.id ? 'active' : ''}`} key={shot.id}>
      <button className="shot-select" onClick={() => useStore.getState().selectShot(shot.id)} aria-label={t('selectShot', { n: String(shot.number).padStart(3, '0') })}>
        <div className="shot-image">{shot.image ? <img src={shot.image} alt={t('storyboardFor', { name: shot.title })} /> : <div className="storyboard-placeholder"><Icon name="image" size={27} /><span>{t('noStoryboard')}</span><div className="placeholder-corner tl" /><div className="placeholder-corner br" /></div>}<span className="shot-number">{t('shot', { n: String(shot.number).padStart(3, '0') })}</span><span className={`status-dot ${shot.status.toLowerCase()}`} title={t(shot.status)} /></div>
        <div className="shot-card-copy"><b>{shot.title || t('untitledShot')}</b><p>{shot.description || t('addMoment')}</p><span className={`status-label ${shot.status.toLowerCase()}`}>{shot.status === 'Approved' && <Icon name="check" size={10} />}{t(shot.status)}</span></div>
      </button>
      <button className="shot-delete icon-button" title={t('deleteShot', { n: shot.number })} aria-label={t('deleteShot', { n: String(shot.number).padStart(3, '0') })} onClick={() => { if (window.confirm(t('confirmDelete', { n: String(shot.number).padStart(3, '0') }))) useStore.getState().deleteShot(shot.id); }}><Icon name="trash" size={13} /></button>
    </div>)}<button className="new-shot" onClick={() => useStore.getState().addShot()}><Icon name="plus" />{t('newShot')}</button></div>
    <div className="sidebar-bottom"><Icon name="layers" size={20} /><p>{t('tagline')}</p><span>{t('versionTag')}</span></div>
  </aside>;
}
function StoryboardImage({ shot }: { shot: Shot }) {
  const t = useT(); const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<MessageKey | null>(null);
  return <div className="reference-panel"><div className="section-heading"><span><Icon name="image" />{t('reference')}</span>{shot.image && <button className="icon-button" aria-label={t('removeImage')} title={t('removeImage')} onClick={() => useStore.getState().updateShot({ image: null })}><Icon name="trash" size={13} /></button>}</div>
    <button className={`import-image ${shot.image ? 'has-image' : ''}`} onClick={() => fileRef.current?.click()}>
      {shot.image ? <><img src={shot.image} alt={t('reference')} /><span>{t('replaceImage')}</span></> : <><Icon name="image" size={22} /><span>{t('importImage')}<small>{t('imageFormats')}</small></span><Icon name="plus" /></>}
    </button>
    <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" aria-label={t('importImage')} hidden onChange={async e => {
      const file = e.target.files?.[0]; e.target.value = ''; if (!file) return;
      setError(null);
      if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) { setError('imageTypeError'); return; }
      if (file.size > 10 * 1024 * 1024) { setError('imageSizeError'); return; }
      try {
        const data = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });
        await new Promise<void>((resolve, reject) => { const image = new Image(); image.onload = () => resolve(); image.onerror = reject; image.src = data; });
        useStore.getState().updateShot({ image: data }, shot.id);
      } catch { setError('imageReadError'); }
    }} />{error && <p role="alert" className="error-text">{t(error)}</p>}
  </div>;
}
function SpatialDescription({ shot }: { shot: Shot }) {
  const description = shot.descriptionLive ? describeScene(shot) : shot.spatialDescription;
  const t = useT(); const panel = usePanel('description');
  const [copyState, setCopyState] = useState<'copy' | 'copied' | 'manualCopy'>('copy');
  const textRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { setCopyState('copy'); }, [description]);
  return <section className={`description-panel${panel.className}`} style={panel.style}>{panel.resize}<div className="panel-heading" {...panel.header}><Icon name="document" /><h2>{t('spatialDescription')}</h2>{panel.controls}<span className="panel-meta">{t('sceneWords')}</span></div>
    <div className="description-body"><div className="description-toolbar"><span className="micro-label">{t('compositionNotes')}</span><button className="text-button" disabled={!description} onClick={async () => {
      try { await navigator.clipboard.writeText(description); setCopyState('copied'); }
      catch { textRef.current?.select(); setCopyState('manualCopy'); }
    }}><Icon name={copyState === 'copied' ? 'check' : 'copy'} size={13} />{t(copyState)}</button></div>
    <textarea ref={textRef} aria-label={t('generatedDescription')} className="description-output" readOnly value={description} placeholder={t('descriptionPlaceholder')} />
    <button className="generate-button" onClick={() => useStore.getState().updateShot({ spatialDescription: describeScene(shot), descriptionLive: true })}><Icon name="document" size={15} />{t('generate')}<Icon name="arrow" size={15} /></button>
    <div className="description-footnote">{t('generatedLocally')}</div></div>
  </section>;
}
const overlayOptions: Overlay[] = ['thirds', 'cross', 'safe', 'spiral'];
export default function App() {
  const state = useStore(); const settings = useSettings(); const t = useT();
  const stagePanel = usePanel('stage'), previewPanel = usePanel('preview');
  const shot = state.project.shots.find(s => s.id === state.project.activeShotId);
  const [addOpen, setAddOpen] = useState(false); const addRef = useRef<HTMLDivElement>(null);
  useEffect(() => { void useStore.getState().hydrate(); }, []);
  useEffect(() => { document.documentElement.lang = settings.language === 'zh' ? 'zh-CN' : 'en'; document.title = t('fullBrand'); }, [settings.language, t]);
  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (document.querySelector('[role=dialog]')) return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable || event.altKey) return;
      const current = useStore.getState();
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); if (event.shiftKey) current.redo(); else current.undo(); return; }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') { event.preventDefault(); if (current.selectedId) current.duplicateObject(current.selectedId); return; }
      if (event.ctrlKey || event.metaKey) return;
      const modes: Record<string, TransformMode> = { q: 'select', w: 'translate', e: 'rotate', r: 'scale' };
      if (modes[event.key.toLowerCase()]) { event.preventDefault(); current.setMode(modes[event.key.toLowerCase()]); useSettings.setState({ planTool: 'select' }); }
      if (event.key.toLowerCase() === 'f') { event.preventDefault(); useSettings.getState().frameSelected(); }
      if (event.key === 'Escape') { current.selectObject(null); useSettings.setState({ maximized: null, focusTool: null }); setAddOpen(false); }
      if ((event.key === 'Delete' || event.key === 'Backspace') && current.selectedId) { event.preventDefault(); current.deleteObject(current.selectedId); }
    }
    function clickOutside(e: PointerEvent) { if (!addRef.current?.contains(e.target as Node) && !(e.target as Element).closest('.add-menu')) setAddOpen(false); }
    window.addEventListener('keydown', keydown); window.addEventListener('pointerdown', clickOutside);
    return () => { window.removeEventListener('keydown', keydown); window.removeEventListener('pointerdown', clickOutside); };
  }, []);
  if (!state.ready) return <div className="loading">{t('loading')}</div>;
  const absent = (panel: 'shots'|'stage'|'preview'|'description'|'inspector') => settings.panels[panel].hidden || settings.panels[panel].floating;
  const style = { '--shot-width': `${absent('shots') ? 0 : settings.layout.left}px`, '--inspector-width': `${absent('inspector') ? 0 : settings.layout.right}px`, '--bottom-height': `${absent('preview') && absent('description') ? 0 : Math.min(settings.layout.bottom, Math.max(180,window.innerHeight-480))}px`, '--preview-fraction': `${settings.layout.preview}fr`, '--description-fraction': `${1 - settings.layout.preview}fr` } as CSSProperties;
  return <div className="app-shell" style={style} onFocusCapture={e => { if (((e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) && !e.target.readOnly) || e.target instanceof HTMLSelectElement) state.beginTransaction(); }} onBlurCapture={() => state.endTransaction('field')}>
    <header className="app-header"><div className="brand-mark"><Icon name="camera" size={22} /></div><div className="brand">{t('brand')}<span>{t('director')}</span></div><div className="header-divider" /><ProjectMenu /><span className="local-badge">{t('localProject')}</span>
      <div className="history-actions"><button className="icon-button" aria-label={t('undo')} title={`${t('undo')} (Ctrl+Z)`} disabled={!state.past.length && !state.transaction} onClick={state.undo}><Icon name="undo" /></button><button className="icon-button" aria-label={t('redo')} title={`${t('redo')} (Ctrl+Shift+Z)`} disabled={!state.future.length} onClick={state.redo}><Icon name="redo" /></button></div>
      <div className="save-status" role="status"><span className={`live-dot ${state.saveStatus === 'error' ? 'error' : ''}`} />{t(state.saveStatus === 'saved' ? 'saved' : state.saveStatus === 'saving' ? 'saving' : 'storageUnavailable')}</div>
      <select className="language-select" aria-label={t('language')} value={settings.language} onChange={e => settings.setLanguage(e.target.value as 'en' | 'zh')}><option value="en">{t('english')}</option><option value="zh">{t('chinese')}</option></select>
      {settings.maximized && <button className="layout-action" onClick={() => useSettings.setState({ maximized: null })}>{t('restorePanel')}</button>}<button className="layout-action" onClick={settings.resetLayout}>{t('resetLayout')}</button><button className="header-new" onClick={state.addShot}><Icon name="plus" size={14} />{t('newShot')}</button>
    </header>
    {state.error && <div className="error-banner" role="alert">{t('storageError', { detail: state.error })}{state.recovery && <span>{t('recoveryHelp')}</span>}<button onClick={state.retrySave}>{t('retrySave')}</button></div>}
    <div className="workspace"><ShotList shots={state.project.shots} activeId={state.project.activeShotId} /><ResizeHandle dimension="left" panel="shots" />
      <main className="main-workspace">{shot ? <>
        <div className="shot-heading"><div><span className="eyebrow">{t('shot', { n: String(shot.number).padStart(3, '0') })}</span><span className="heading-slash">/</span><h1>{shot.title || t('untitledShot')}</h1><span className={`status-label ${shot.status.toLowerCase()}`}>{t(shot.status)}</span></div><div className="shot-actions"><button title={t('duplicateShot')} onClick={() => state.duplicateShot(shot.id)}><Icon name="copy" size={13} /><span>{t('duplicateShot')}</span></button><button title={t('copyPrevious')} disabled={state.project.shots.findIndex(s => s.id === shot.id) < 1} onClick={() => { if (window.confirm(t('confirmCopy'))) state.copyPreviousScene(); }}><Icon name="layers" size={13} /><span>{t('copyPrevious')}</span></button></div></div>
        <div className="workspace-tabs">{(['spatial', 'plan', 'camera'] as const).map(view => <button key={view} aria-pressed={settings.workspaceView === view} onClick={() => settings.setWorkspace(view)}>{t(view)}</button>)}<WorkspacePresets /><ExportControls shot={shot} /></div>
        <section className={`stage-panel${stagePanel.className}`} style={stagePanel.style}>{stagePanel.resize}<div className="stage-toolbar" {...stagePanel.header}><span className="stage-title"><Icon name="Cube" />{settings.workspaceView === 'spatial' ? t('spatialEditor') : t(settings.workspaceView)}</span><div className="transform-modes">{(['select', 'translate', 'rotate', 'scale'] as const).map((mode, i) => <button aria-label={t(mode)} aria-pressed={state.mode === mode} title={`${t(mode)} (${['Q', 'W', 'E', 'R'][i]})`} key={mode} className={state.mode === mode ? 'selected' : ''} onClick={() => { state.setMode(mode); useSettings.setState({ planTool: 'select' }); }}><Icon name={mode} size={14} /><span>{t(mode)}</span><kbd>{['Q', 'W', 'E', 'R'][i]}</kbd></button>)}</div>
          {stagePanel.controls}<div className="add-object-wrap" ref={addRef}><button className="add-object" aria-expanded={addOpen} onClick={() => setAddOpen(v => !v)}><Icon name="plus" size={14} />{t('addObject')}<span>⌄</span></button>{addOpen && <AddObjectMenu onClose={() => setAddOpen(false)} />}</div>
        </div><div className="stage-content">{settings.workspaceView === 'aiReview' ? <div className="ai-review-grid"><div className="review-camera"><CameraPreview shot={shot} annotations={framePreset(shot,'aiReference').annotations} /></div><div className="review-plan"><PlanView key={shot.id} shot={shot} /></div></div> : settings.workspaceView === 'plan' ? <PlanView key={shot.id} shot={shot} /> : settings.workspaceView === 'camera' ? <CameraPreview shot={shot} /> : <SpatialEditor shot={shot} />}{settings.workspaceView === 'spatial' && <><div className="scene-list"><div className="micro-label">{t('scene')}<span>{shot.objects.length}</span></div>{shot.objects.map(object => <div className={`scene-row ${state.selectedId === object.id ? 'active' : ''}`} key={object.id}><button className={`scene-select ${state.selectedId === object.id ? 'active' : ''}`} onClick={() => state.selectObject(object.id)}><Icon name={object.type} size={13} /><span>{object.name || t(object.type)}</span></button><button className="scene-flag" aria-label={t(object.visible ? 'hideObject' : 'showObject', { name: object.name })} title={t(object.visible ? 'visible' : 'hidden')} onClick={() => state.updateObject(object.id, { visible: !object.visible })}><Icon name={object.visible ? 'eye' : 'eyeOff'} size={12} /></button><button className="scene-flag" aria-label={t(object.locked ? 'unlockObject' : 'lockObject', { name: object.name })} title={t(object.locked ? 'locked' : 'unlocked')} onClick={() => state.updateObject(object.id, { locked: !object.locked })}><Icon name={object.locked ? 'lock' : 'unlock'} size={12} /></button></div>)}</div>
          <div className="viewport-options"><button aria-pressed={settings.showLabels} onClick={settings.toggleLabels}><Icon name="label" size={12} />{t('showLabels')}</button><button aria-label={t('frameSelected')} title={`${t('frameSelected')} (F)`} disabled={!state.selectedId} onClick={settings.frameSelected}><Icon name="frame" size={13} /></button></div></>}
        </div><CameraPresets shot={shot} /></section>
        <ResizeHandle dimension="bottom" panel="stage" />
        <div className="bottom-panels" style={{gridTemplateColumns: absent('preview') ? '1fr' : absent('description') ? '1fr' : undefined}}><section className={`preview-panel${previewPanel.className}`} style={previewPanel.style}>{previewPanel.resize}<div className="panel-heading" {...previewPanel.header}><Icon name="camera" /><h2>{t('cameraPreview')}</h2>{previewPanel.controls}<span className="preview-live"><span className="live-dot" />{t('live')}</span></div>{settings.workspaceView === 'aiReview' ? <div className="review-validation"><h3>{t('spatialValidation')}</h3><ValidationSummary shot={shot} /></div> : <CameraPreview shot={shot} />}<CameraAnnotationControls shot={shot} /><div className="overlays"><span>{t('guides')}</span>{overlayOptions.map(key => <button aria-pressed={shot.overlays.includes(key)} className={shot.overlays.includes(key) ? 'active' : ''} key={key} onClick={() => state.toggleOverlay(key)}><span className="check-box">{shot.overlays.includes(key) && <Icon name="check" size={9} />}</span>{t(key)}</button>)}</div></section><ResizeHandle dimension="preview" panel="preview" /><SpatialDescription key={shot.id} shot={shot} /></div>
        <StoryboardImage key={shot.id} shot={shot} />
      </> : <div className="empty-workspace"><Icon name="camera" size={48} /><h1>{t('emptyHeading')}</h1><p>{t('emptyHelp')}</p><button className="generate-button" onClick={state.addShot}><Icon name="plus" />{t('createShot')}</button></div>}</main>
      <ResizeHandle dimension="right" panel="inspector" /><Inspector shot={shot} />
    </div><footer className="app-footer"><span><span className="live-dot" />{shot ? t('objectCount', { n: shot.objects.length }) : t('noShot')}</span><span>{t('shortcuts')}</span><span>{t('fullBrand')}<b>0.95</b></span></footer>
  </div>;
}
