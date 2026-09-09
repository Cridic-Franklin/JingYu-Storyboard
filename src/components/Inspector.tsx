import { BlockingControls, SpiralControls } from './BlockingControls';
import { SubjectControls, SpatialRules } from './SpatialRules';
import { FocusControls } from './FocusControls';
import { LightControls, EnvironmentControls } from './LightControls';
import { isLight } from '../types';
import { ShotCameraSettings } from './ShotCameraSettings';
import { applyCameraPreset, shotSizes, cameraAngles, lensToFov, fovToLens, type ShotSize, type CameraAngle } from '../lib/camera';
import { NumericField } from './NumericField';
import { useStore } from '../store';
import type { Shot, StageObject, Vec3 } from '../types';
import { framePosition } from '../lib/scene';
import { Icon } from './Icon';
import { useT } from '../i18n';
import { usePanel } from './Layout';
import { worldFacing, screenFacing } from '../lib/spatial';

function VectorInput({ kind, value, onChange }: { kind: 'position' | 'rotation' | 'scale'; value: Vec3; onChange: (v: Vec3) => void }) {
  const t = useT();
  return <div className="vector-field"><div className="field-label">{t(kind)}<span>{kind === 'rotation' ? '°' : kind === 'position' ? 'm' : ''}</span></div><div className="vector-inputs">{value.map((v, i) => <label key={i}><span className={`coordinate coordinate-${i}`}>{['X', 'Y', 'Z'][i]}</span><NumericField label={`${t(kind)} ${['X', 'Y', 'Z'][i]}`} value={v} min={kind === 'scale' ? .01 : undefined} onCommit={n => { const next = [...value] as Vec3; next[i] = n; onChange(next); }} /></label>)}</div></div>;
}
function ObjectFields({ object, shot }: { object: StageObject; shot: Shot }) {
  const t = useT();
  const update = (patch: Partial<StageObject>) => useStore.getState().updateObject(object.id, patch);
  const frame = framePosition(object, shot.objects.find(o => o.type === 'Camera'), shot.aspectRatio);
  return <>
    <section className="inspector-section"><div className="object-heading"><span className="object-symbol"><Icon name={object.type} size={21} /></span><div><b>{object.name}</b><small>{object.type === 'Camera' ? t('activeCamera') : t('proxy', { type: t(object.type) })}</small></div></div>
      <label className="field-label">{t('displayName')}<input aria-label={t('objectName')} value={object.name} onChange={e => update({ name: e.target.value })} /></label>
      <div className="type-row"><span>{t('objectType')}</span><span>{t(object.type)}</span></div>
      <div className="internal-id" title={object.id}><span>{t('internalId')}</span><code data-testid="object-id">{object.id}</code></div>
      <div className="object-flags"><button aria-pressed={object.visible} onClick={() => update({ visible: !object.visible })}><Icon name={object.visible ? 'eye' : 'eyeOff'} size={13} />{t(object.visible ? 'visible' : 'hidden')}</button><button aria-pressed={object.locked} onClick={() => update({ locked: !object.locked })}><Icon name={object.locked ? 'lock' : 'unlock'} size={13} />{t(object.locked ? 'locked' : 'unlocked')}</button></div>
      {object.locked && <p className="hint">{t('lockHint')}</p>}
      {object.type === 'Camera' && !object.visible && <p className="hint">{t('cameraVisibility')}</p>}
    </section>
    {object.type !== 'Camera' && !isLight(object) && <BlockingControls object={object} shot={shot} />}
    {isLight(object) && object.light && <LightControls object={object} />}
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
    {object.type === 'Prop' && <fieldset disabled={object.locked} className="inspector-section"><h3>{t('semanticFront')}</h3><label className="field-label">{t('frontLabel')}<input aria-label={t('frontLabel')} value={object.frontLabel} onChange={e => update({ frontLabel: e.target.value })} /></label><label className="field-label">{t('frontOffset')}<NumericField label={t('frontOffset')} value={object.frontYaw} onCommit={frontYaw => update({ frontYaw })} /></label></fieldset>}
    {object.type !== 'Camera' && <section className="inspector-section"><div className="type-row"><span>{t('worldFacing')}</span><span>{Math.round(worldFacing(object))}°</span></div>{shot.objects.find(o => o.type === 'Camera') && <div className="type-row"><span>{t('screenFacing')}</span><span>{t(screenFacing(object, shot.objects.find(o => o.type === 'Camera')!))}</span></div>}</section>}
    {object.type === 'Prop' && <section className="inspector-section"><h3>{t('Prop')}</h3><label className="field-label">{t('semanticName')}<input aria-label={t('semanticName')} placeholder={t('semanticPlaceholder')} value={object.semanticName} onChange={e => update({ semanticName: e.target.value })} /></label><p className="hint">{t('semanticHint')}</p></section>}
    {object.type === 'Camera' && <fieldset className="inspector-section" disabled={object.locked}><h3>{t('lens')}</h3><label className="field-label">{t('verticalFov')}<div className="fov-field"><input aria-label={t('cameraFov')} type="range" min="1" max="179" value={object.fov} onChange={e => update({ fov: Number(e.target.value) })} /><NumericField label={t('cameraFovDegrees')} value={object.fov} min={1} max={179} onCommit={fov => update({ fov })} /><span>°</span></div></label><label className="field-label">{t('focalLength')}<NumericField label={t('focalLength')} value={Number(fovToLens(object.fov).toFixed(2))} min={1} max={1000} onCommit={mm => update({ fov: lensToFov(mm) })} /></label><p className="hint">{t('lensGate')}</p></fieldset>}
    <div className="inspector-delete"><button className="text-button danger" disabled={object.locked} onClick={() => useStore.getState().deleteObject(object.id)}><Icon name="trash" />{t('deleteObject')}</button></div>
  </>;
}
export function Inspector({ shot }: { shot: Shot | undefined }) {
  const t = useT(); const panel = usePanel('inspector');
  const selectedId = useStore(s => s.selectedId);
  const object = shot?.objects.find(o => o.id === selectedId);
  return <aside className={`inspector${panel.className}`} style={panel.style}>{panel.resize}<div className="panel-heading" {...panel.header}><Icon name="scale" /><h2>{t('inspector')}</h2>{panel.controls}<span className="panel-meta">{t('object')}</span></div>
    <div className="inspector-scroll">{object && shot ? <ObjectFields key={object.id} object={object} shot={shot} /> : <div className="inspector-empty"><Icon name="translate" size={30} /><p>{t('selectObject')}</p><small>{t('selectHelp')}</small></div>}
      {shot && <><ShotCameraSettings shot={shot} /><SpiralControls shot={shot} /><SubjectControls shot={shot} /><FocusControls shot={shot} /><SpatialRules shot={shot} /><EnvironmentControls shot={shot} /></>}{shot && <section className="inspector-section shot-details"><h3>{t('shotDetails')}</h3><label className="field-label">{t('constraints')}<textarea aria-label={t('constraints')} value={shot.constraints} rows={3} onChange={e => useStore.getState().updateShot({ constraints: e.target.value })} /></label><label className="field-label">{t('negativeConstraints')}<textarea aria-label={t('negativeConstraints')} value={shot.negativeConstraints} rows={3} onChange={e => useStore.getState().updateShot({ negativeConstraints: e.target.value })} /></label><label className="field-label">{t('shotTitle')}<input aria-label={t('shotTitle')} value={shot.title} onChange={e => useStore.getState().updateShot({ title: e.target.value })} /></label><label className="field-label">{t('shortDescription')}<textarea aria-label={t('shotDescription')} rows={3} placeholder={t('shotPlaceholder')} value={shot.description} onChange={e => useStore.getState().updateShot({ description: e.target.value })} /></label><label className="field-label">{t('status')}<select aria-label={t('shotStatus')} value={shot.status} onChange={e => useStore.getState().updateShot({ status: e.target.value as Shot['status'] })}><option value="Draft">{t('Draft')}</option><option value="Approved">{t('Approved')}</option></select></label></section>}
    </div><div className="inspector-footer"><span className="live-dot" />{t('localWorkspace')}</div>
  </aside>;
}
export function CameraPresets({ shot }: { shot: Shot }) {
 const t = useT(), camera = shot.objects.find(o => o.type === 'Camera');
 const apply = (size?: ShotSize, angle?: CameraAngle) => { if (camera) { useStore.getState().updateObject(camera.id, applyCameraPreset(shot, camera, size, angle)); useStore.getState().selectObject(camera.id); } };
 return <div className="camera-presets"><span>{t('Camera')}</span>
 <select aria-label={t('shotSize')} disabled={!camera || camera.locked} value="" onChange={e => apply(e.target.value as ShotSize)}><option value="" disabled>{t('shotSize')}</option>{shotSizes.map(k => <option key={k} value={k}>{t(k)}</option>)}</select>
 <select aria-label={t('cameraAngle')} disabled={!camera || camera.locked} value="" onChange={e => apply(undefined, e.target.value as CameraAngle)}><option value="" disabled>{t('cameraAngle')}</option>{cameraAngles.map(k => <option key={k} value={k}>{t(k)}</option>)}</select>
 <select aria-label={t('lensPreset')} disabled={!camera || camera.locked} value="" onChange={e => camera && useStore.getState().updateObject(camera.id, { fov: lensToFov(Number(e.target.value)) })}><option value="" disabled>{t('lensPreset')}</option>{[18,24,35,50,85,135].map(mm => <option key={mm} value={mm}>{mm} mm</option>)}</select>
 </div>;
}
