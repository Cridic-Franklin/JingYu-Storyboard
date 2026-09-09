import { ShotPackageExport } from './ShotPackageExport';
import { framePreset } from '../lib/shotExports';
import { exportHeight } from '../lib/camera';
import { NumericField } from './NumericField';
import { useState } from 'react';
import type { CameraAnnotations, Overlay, Shot } from '../types';
import { defaultAnnotations } from '../types';
import { useT, type MessageKey } from '../i18n';
import { useStore } from '../store';
import { cameraPNG, planPNG, copyPNG } from '../lib/export';
import { defaultPlanOptions, type PlanOptions } from './PlanView';
import { projectStorage } from '../storage/ProjectStorage';
import { analyzeShot as shotSpatialData } from '../lib/semantics';
import { useExportValidation } from './SpatialRules';
import { describeScene } from '../lib/scene';
const annotationLabels: Record<keyof CameraAnnotations, MessageKey> = { focusPoint: 'focusPoint', focusRegion: 'focusRegion', semantic: 'semanticLabels', names: 'names', types: 'types', facing: 'facingArrows', front: 'frontArrows', coordinates: 'coordinates', bounds: 'bounds', measurements: 'measurements' };
export function CameraAnnotationControls({ shot }: { shot: Shot }) {
  const t = useT();
  return <details className="annotation-controls"><summary>{t('annotations')}</summary><div>{(Object.keys(annotationLabels) as (keyof CameraAnnotations)[]).map(k => <label key={k}><input type="checkbox" checked={shot.annotations[k]} onChange={() => useStore.getState().updateShot({ annotations: { ...shot.annotations, [k]: !shot.annotations[k] } })} />{t(annotationLabels[k])}</label>)}</div></details>;
}
export function ExportControls({ shot }: { shot: Shot }) {
  const t = useT(); const validation = useExportValidation(shot); const [target, setTarget] = useState<'camera' | 'plan' | null>(null); const [preset, setPreset] = useState<'clean' | 'directorFrame' | 'aiReference'>('clean');
  const [annotations, setAnnotations] = useState(defaultAnnotations), [guides, setGuides] = useState<Overlay[]>([]), [options, setOptions] = useState<PlanOptions>(defaultPlanOptions), [width, setWidth] = useState(1920), [resolution, setResolution] = useState('1920'), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const base = `SHOT_${String(shot.number).padStart(3, '0')}`;
  function choosePreset(value: typeof preset) { setPreset(value); const options=framePreset(shot,value);setAnnotations(options.annotations);setGuides(options.guides); }
  async function output(copy = false, approved = false) {
    if (preset === 'aiReference' && target === 'camera' && !approved) { validation.request(() => void output(copy, true)); return; }
    setBusy(true); setMessage('');
    const filename = `${base}_${target === 'plan' ? 'PLAN' : preset === 'clean' ? 'CLEAN' : preset === 'aiReference' ? 'AI' : 'DIRECTOR'}.png`;
    try {
      const blob = target === 'plan' ? planPNG(shot, options) : cameraPNG(shot, width, annotations, guides);
      if (copy) setMessage(t(await copyPNG(blob, filename) ? 'copied' : 'copyFallback'));
      else { projectStorage.download(await blob, filename); setMessage(t('exportDone')); }
    } catch (error) { setMessage(t('exportError', { detail: String(error) })); } finally { setBusy(false); }
  }
  return <><div className="export-actions"><ShotPackageExport shot={shot} /><button onClick={() => { setTarget('camera'); choosePreset('clean'); setMessage(''); }}>{t('exportCamera')}</button><button onClick={() => { setTarget('plan'); setMessage(''); }}>{t('exportPlan')}</button><button onClick={() => validation.request(() => projectStorage.download(new Blob([JSON.stringify(shotSpatialData(shot), null, 2)], { type: 'application/json' }), `${base}_spatial.json`))}>{t('exportJSON')}</button><button onClick={() => validation.request(() => projectStorage.download(new Blob([describeScene(shot)], { type: 'text/plain;charset=utf-8' }), `${base}_spatial.txt`))}>{t('exportText')}</button></div>
    {target && <div className="modal-backdrop"><section className="compact-dialog" role="dialog" aria-modal="true" aria-label={t('exportOptions')}><header><h2>{t(target === 'camera' ? 'exportCamera' : 'exportPlan')}</h2><button onClick={() => setTarget(null)} disabled={busy}>{t('close')}</button></header>
      {target === 'camera' ? <><div className="preset-buttons">{(['clean', 'directorFrame', 'aiReference'] as const).map(k => <button key={k} aria-pressed={preset === k} onClick={() => choosePreset(k)}>{t(k)}</button>)}</div><label>{t('resolution')}<select aria-label={t('resolution')} value={resolution} onChange={e => { setResolution(e.target.value); if (e.target.value !== 'custom') setWidth(Number(e.target.value)); }}>{[1920, 2560, 3840].map(w => <option value={w} key={w}>{w} × {exportHeight(w, shot.aspectRatio)}</option>)}<option value="custom">{t('custom')}</option></select></label>{resolution === 'custom' && <label>{t('exportWidth')}<NumericField label={t('exportWidth')} min={320} max={7680} value={width} onCommit={setWidth} /></label>}
      <div className="export-checkboxes">{(Object.keys(annotationLabels) as (keyof CameraAnnotations)[]).map(k => <label key={k}><input type="checkbox" checked={annotations[k]} onChange={() => setAnnotations({ ...annotations, [k]: !annotations[k] })} />{t(annotationLabels[k])}</label>)}{(['thirds', 'cross', 'safe', 'spiral'] as const).map(k => <label key={k}><input type="checkbox" checked={guides.includes(k)} onChange={() => setGuides(guides.includes(k) ? guides.filter(v => v !== k) : [...guides, k])} />{t(k)}</label>)}</div></> : <div className="export-checkboxes">{(['names', 'facing', 'lightDirections', 'frustum', 'measurements', 'sketch', 'grid'] as const).map(k => <label key={k}><input type="checkbox" checked={options[k]} onChange={() => setOptions({ ...options, [k]: !options[k] })} />{t(k === 'facing' ? 'facingArrows' : k)}</label>)}</div>}
      <div className="dialog-actions"><button className="generate-button" disabled={busy || (target === 'camera' && !shot.objects.some(o => o.type === 'Camera'))} onClick={() => void output()}>{t(busy ? 'exportBusy' : 'exportPNG')}</button>{target === 'camera' && <button disabled={busy} onClick={() => void output(true)}>{t('copyImage')}</button>}</div><p role="status">{message}</p>
    </section></div>}{validation.dialog}
  </>;
}
