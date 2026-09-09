import { useT } from '../i18n';
import { useStore } from '../store';
import type { Shot, StageObject } from '../types';
import { NumericField } from './NumericField';
export function LightControls({ object }: { object: StageObject }) {
  const t = useT(), light = object.light!;
  const update = (p: Partial<typeof light>) => useStore.getState().updateObject(object.id, { light: { ...light, ...p } });
  return <fieldset disabled={object.locked} className="inspector-section"><h3>{t('lighting')}</h3><label className="field-label">{t('lightIntensity')}<NumericField label={t('lightIntensity')} value={light.intensity} min={0} max={10000} onCommit={intensity => update({ intensity })} /></label><label className="field-label">{t('lightColor')}<input type="color" aria-label={t('lightColor')} value={light.color} onChange={e => update({ color: e.target.value })} /></label>
  {object.type !== 'DirectionalLight' && <label className="field-label">{t('lightRange')}<NumericField label={t('lightRange')} value={light.range} min={0} max={1000} onCommit={range => update({ range })} /></label>}
  {object.type === 'SpotLight' && <label className="field-label">{t('coneAngle')}<NumericField label={t('coneAngle')} value={light.coneAngle} min={1} max={170} onCommit={coneAngle => update({ coneAngle })} /></label>}
  <label className="check-field"><input type="checkbox" checked={light.castShadow} onChange={e => update({ castShadow: e.target.checked })} />{t('castShadow')}</label></fieldset>;
}
export function EnvironmentControls({ shot }: { shot: Shot }) {
  const t = useT(), environment = shot.environment; const update = (p: Partial<typeof environment>) => useStore.getState().updateShot({ environment: { ...environment, ...p } });
  return <section className="inspector-section"><h3>{t('environmentLight')}</h3><label className="field-label">{t('environmentIntensity')}<NumericField label={t('environmentIntensity')} value={environment.intensity} min={0} max={20} onCommit={intensity => update({ intensity })} /></label><label className="field-label">{t('environmentColor')}<input type="color" aria-label={t('environmentColor')} value={environment.color} onChange={e => update({ color: e.target.value })} /></label><label className="check-field"><input type="checkbox" checked={environment.defaultRig} onChange={e => update({ defaultRig: e.target.checked })} />{t('defaultLightRig')}</label></section>;
}
