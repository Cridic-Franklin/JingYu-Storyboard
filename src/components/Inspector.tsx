import { useStore } from '../store';
import type { Shot, StageObject, Vec3 } from '../types';
import { framePosition, presetCamera, presets } from '../lib/scene';
import { Icon } from './Icon';
import { useT } from '../i18n';
import { usePanel } from './Layout';
import { worldFacing, screenFacing } from '../lib/spatial';

function VectorInput({ kind, value, onChange }: { kind: 'position' | 'rotation' | 'scale'; value: Vec3; onChange: (v: Vec3) => void }) {
  const t = useT();
  return <div className="vector-field"><div className="field-label">{t(kind)}<span>{kind === 'rotation' ? '°' : kind === 'position' ? 'm' : ''}</span></div><div className="vector-inputs">{value.map((v, i) => <label key={i}><span className={`coordinate coordinate-${i}`}>{['X', 'Y', 'Z'][i]}</span><input type="number" aria-label={`${t(kind)} ${['X', 'Y', 'Z'][i]}`} value={Number(v.toFixed(3))} step={kind === 'rotation' ? 5 : 0.1} min={kind === 'scale' ? 0.01 : undefined} onChange={e => {
    if (e.target.value === '') return;
    const n = Number(e.target.value); if (!Number.isFinite(n)) return;
    const next = [...value] as Vec3; next[i] = kind === 'scale' ? Math.max(0.01, n) : n; onChange(next);
  }} /></label>)}</div></div>;
}
function ObjectFields({ object, shot }: { object: StageObject; shot: Shot }) {
  const t = useT();
  const update = (patch: Partial<StageObject>) => useStore.getState().updateObject(object.id, patch);
  const frame = framePosition(object, shot.objects.find(o => o.type === 'Camera'));
  return <>
    <section className="inspector-section"><div className="object-heading"><span className="object-symbol"><Icon name={object.type} size={21} /></span><div><b>{object.name}</b><small>{object.type === 'Camera' ? t('activeCamera') : t('proxy', { type: t(object.type) })}</small></div></div>
      <label className="field-label">{t('displayName')}<input aria-label={t('objectName')} value={object.name} onChange={e => update({ name: e.target.value })} /></label>
      <div className="type-row"><span>{t('objectType')}</span><span>{t(object.type)}</span></div>
      <div className="internal-id" title={object.id}><span>{t('internalId')}</span><code data-testid="object-id">{object.id}</code></div>
      <div className="object-flags"><button aria-pressed={object.visible} onClick={() => update({ visible: !object.visible })}><Icon name={object.visible ? 'eye' : 'eyeOff'} size={13} />{t(object.visible ? 'visible' : 'hidden')}</button><button aria-pressed={object.locked} onClick={() => update({ locked: !object.locked })}><Icon name={object.locked ? 'lock' : 'unlock'} size={13} />{t(object.locked ? 'locked' : 'unlocked')}</button></div>
      {object.locked && <p className="hint">{t('lockHint')}</p>}
      {object.type === 'Camera' && !object.visible && <p className="hint">{t('cameraVisibility')}</p>}
    </section>
    <fieldset className="inspector-section" disabled={object.locked}><h3>{t('transform')} <span>{t('worldSpace')}</span></h3>
      <VectorInput kind="position" value={object.position} onChange={position => update({ position })} />
      <VectorInput kind="rotation" value={object.rotation} onChange={rotation => update({ rotation })} />
      <VectorInput kind="scale" value={object.scale} onChange={scale => update({ scale })} />
    </fieldset>
    {object.type !== 'Camera' && <section className="inspector-section frame-position"><h3>{t('framePosition')}</h3>{frame.status === 'visible' ? <div className="frame-values">{(['screenX', 'screenY', 'width', 'height'] as const).map((key, i) => <div key={key}><span>{t(key)}</span><b data-testid={key}>{Math.round([frame.x, frame.y, frame.width, frame.height][i]!)}%</b></div>)}</div> : <p className="hint" data-testid="frame-status">{t(frame.status)}</p>}<p className="hint">{t('frameHint')}</p></section>}
    {object.type === 'Character' && <fieldset className="inspector-section" disabled={object.locked}><h3>{t('Character')}</h3><label className="field-label">{t('facingYaw')}<select aria-label={t('facing')} value={String(((object.rotation[1] % 360) + 360) % 360)} onChange={e => update({ rotation: [object.rotation[0], Number(e.target.value), object.rotation[2]] })}>
      <option value="0">{t('forward')}</option><option value="90">{t('right')}</option><option value="180">{t('backward')}</option><option value="270">{t('left')}</option>
      {![0, 90, 180, 270].includes(((object.rotation[1] % 360) + 360) % 360) && <option value={String(((object.rotation[1] % 360) + 360) % 360)}>{t('customAngle', { n: object.rotation[1].toFixed(1) })}</option>}
    </select></label><p className="hint">{t('facingHint')}</p></fieldset>}
    {object.type === 'Prop' && <fieldset disabled={object.locked} className="inspector-section"><h3>{t('semanticFront')}</h3><label className="field-label">{t('frontLabel')}<input aria-label={t('frontLabel')} value={object.frontLabel} onChange={e => update({ frontLabel: e.target.value })} /></label><label className="field-label">{t('frontOffset')}<input aria-label={t('frontOffset')} type="number" step="15" value={object.frontYaw} onChange={e => { if (e.target.value) update({ frontYaw: Number(e.target.value) }); }} /></label></fieldset>}
    {object.type !== 'Camera' && <section className="inspector-section"><div className="type-row"><span>{t('worldFacing')}</span><span>{Math.round(worldFacing(object))}°</span></div>{shot.objects.find(o => o.type === 'Camera') && <div className="type-row"><span>{t('screenFacing')}</span><span>{t(screenFacing(object, shot.objects.find(o => o.type === 'Camera')!))}</span></div>}</section>}
    {object.type === 'Prop' && <section className="inspector-section"><h3>{t('Prop')}</h3><label className="field-label">{t('semanticName')}<input aria-label={t('semanticName')} placeholder={t('semanticPlaceholder')} value={object.semanticName} onChange={e => update({ semanticName: e.target.value })} /></label><p className="hint">{t('semanticHint')}</p></section>}
    {object.type === 'Camera' && <fieldset className="inspector-section" disabled={object.locked}><h3>{t('lens')}</h3><label className="field-label">{t('verticalFov')}<div className="fov-field"><input aria-label={t('cameraFov')} type="range" min="15" max="100" value={object.fov} onChange={e => update({ fov: Number(e.target.value) })} /><input aria-label={t('cameraFovDegrees')} type="number" min="15" max="100" value={object.fov} onChange={e => { if (e.target.value) update({ fov: Math.max(15, Math.min(100, Number(e.target.value))) }); }} /><span>°</span></div></label><p className="hint">{t('cameraHint')}</p></fieldset>}
    <div className="inspector-delete"><button className="text-button danger" disabled={object.locked} onClick={() => useStore.getState().deleteObject(object.id)}><Icon name="trash" />{t('deleteObject')}</button></div>
  </>;
}
export function Inspector({ shot }: { shot: Shot | undefined }) {
  const t = useT(); const panel = usePanel('inspector');
  const selectedId = useStore(s => s.selectedId);
  const object = shot?.objects.find(o => o.id === selectedId);
  return <aside className={`inspector${panel.className}`}><div className="panel-heading" {...panel.header}><Icon name="scale" /><h2>{t('inspector')}</h2><span className="panel-meta">{t('object')}</span></div>
    <div className="inspector-scroll">{object && shot ? <ObjectFields key={object.id} object={object} shot={shot} /> : <div className="inspector-empty"><Icon name="translate" size={30} /><p>{t('selectObject')}</p><small>{t('selectHelp')}</small></div>}
      {shot && <section className="inspector-section shot-details"><h3>{t('shotDetails')}</h3><label className="field-label">{t('primarySubject')}<select aria-label={t('primarySubject')} value={shot.primarySubjectId ?? ''} onChange={e => useStore.getState().updateShot({ primarySubjectId: e.target.value || null })}><option value="">{t('none')}</option>{shot.objects.filter(o => o.type !== 'Camera').map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></label><label className="field-label">{t('constraints')}<textarea aria-label={t('constraints')} value={shot.constraints} rows={3} onChange={e => useStore.getState().updateShot({ constraints: e.target.value })} /></label><label className="field-label">{t('negativeConstraints')}<textarea aria-label={t('negativeConstraints')} value={shot.negativeConstraints} rows={3} onChange={e => useStore.getState().updateShot({ negativeConstraints: e.target.value })} /></label><label className="field-label">{t('shotTitle')}<input aria-label={t('shotTitle')} value={shot.title} onChange={e => useStore.getState().updateShot({ title: e.target.value })} /></label><label className="field-label">{t('shortDescription')}<textarea aria-label={t('shotDescription')} rows={3} placeholder={t('shotPlaceholder')} value={shot.description} onChange={e => useStore.getState().updateShot({ description: e.target.value })} /></label><label className="field-label">{t('status')}<select aria-label={t('shotStatus')} value={shot.status} onChange={e => useStore.getState().updateShot({ status: e.target.value as Shot['status'] })}><option value="Draft">{t('Draft')}</option><option value="Approved">{t('Approved')}</option></select></label></section>}
    </div><div className="inspector-footer"><span className="live-dot" />{t('localWorkspace')}</div>
  </aside>;
}
export function CameraPresets({ shot }: { shot: Shot }) {
  const t = useT();
  const camera = shot.objects.find(o => o.type === 'Camera');
  return <div className="camera-presets"><span>{t('Camera')}</span>{presets.map(name => <button key={name} disabled={!camera || camera.locked} onClick={() => {
    if (!camera) return;
    const character = shot.objects.find(o => o.type === 'Character' && o.visible);
    useStore.getState().updateObject(camera.id, presetCamera(name, character?.position ?? [0, 0, 0]));
    useStore.getState().selectObject(camera.id);
  }}>{t(name)}</button>)}</div>;
}
