import { Vector3 } from 'three';
import { useStore } from '../store';
import { useSettings } from '../settings';
import { useT } from '../i18n';
import { isLight, type Shot, type Vec3 } from '../types';
import { focusPosition } from '../lib/focus';
import { NumericField } from './NumericField';

export function FocusControls({ shot }: { shot: Shot }) {
  const t = useT(), f = shot.focus, camera = shot.objects.find(o => o.type === 'Camera');
  const update = (patch: Partial<typeof f>) => useStore.getState().updateShot({ focus: { ...f, ...patch } });
  const p = focusPosition(shot), distance = camera && p ? p.distanceTo(new Vector3(...camera.position)) : null;
  const pick = (focusTool: 'point' | 'rectangle' | 'ellipse') => useSettings.setState({ workspaceView: 'camera', focusTool });
  return <section className="inspector-section"><h3>{t('focusSystem')}</h3><h4>{t('opticalFocus')}</h4>
    <label className="field-label">{t('focusTarget')}<select aria-label={t('focusTarget')} value={f.targetId ?? ''} onChange={e => update({ targetId: e.target.value || null, point: null })}><option value="">{t('none')}</option>{shot.objects.filter(o => o.type !== 'Camera' && !isLight(o)).map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
    {distance !== null && <p className="hint" data-testid="focus-distance">{t('focusDistance')}: {distance.toFixed(2)} m</p>}
    <label className="field-label">{t('pickDepth')}<NumericField label={t('pickDepth')} value={f.pickDistance} min={.1} max={1000} onCommit={pickDistance => update({ pickDistance })} /></label>
    <button className="field-action" disabled={!camera} onClick={() => pick('point')}>{t('pickFocusPoint')}</button>
    <button className="field-action" onClick={() => update({ targetId: null, point: [0, 1.6, 0] })}>{t('worldFocusPoint')}</button>
    {f.point && <div className="vector-inputs">{f.point.map((v, i) => <NumericField key={i} label={`${t('focusPoint')} ${['X', 'Y', 'Z'][i]}`} value={v} onCommit={n => { const point = [...f.point!] as Vec3; point[i] = n; update({ point, targetId: null }); }} />)}</div>}
    <h4>{t('visualFocus')}</h4><p className="hint">{t('focusHelp')}</p>
    <div className="field-actions">{(['rectangle', 'ellipse'] as const).map(k => <button className="field-action" key={k} disabled={!camera} onClick={() => pick(k)}>{t(k)}</button>)}</div>
    {f.region && <label className="field-label">{t('focusRegionLabel')}<input aria-label={t('focusRegionLabel')} value={f.region.label} onChange={e => update({ region: { ...f.region!, label: e.target.value } })} /></label>}
    <label className="check-field"><input type="checkbox" checked={f.showPoint} onChange={e => update({ showPoint: e.target.checked })} />{t('showFocusPoint')}</label>
    <label className="check-field"><input type="checkbox" checked={f.showRegion} onChange={e => update({ showRegion: e.target.checked })} />{t('showFocusRegion')}</label>
    <button className="field-action" onClick={() => update({ targetId: null, point: null, region: null })}>{t('clearFocus')}</button>
  </section>;
}
