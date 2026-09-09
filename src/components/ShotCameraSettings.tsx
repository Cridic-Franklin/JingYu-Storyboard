import { useState } from 'react';
import { useT } from '../i18n';
import { useStore } from '../store';
import type { Shot } from '../types';
import { aspectPresets, parseRatio, ratioLabel } from '../lib/camera';
import { NumericField } from './NumericField';

export function ShotCameraSettings({ shot }: { shot: Shot }) {
  const t = useT(); const [custom, setCustom] = useState(false); const current = aspectPresets.find(p => Math.abs(parseRatio(p) - shot.aspectRatio) < .00001);
  return <section className="inspector-section"><h3>{t('shotFormat')}</h3>
    <label className="field-label">{t('aspectRatio')}<select aria-label={t('aspectRatio')} value={custom ? 'custom' : current ?? 'custom'} onChange={e => { setCustom(e.target.value === 'custom'); if (e.target.value !== 'custom') useStore.getState().updateShot({ aspectRatio: parseRatio(e.target.value) }); }}>
      <optgroup label={t('filmRatios')}>{aspectPresets.slice(0, 7).map(p => <option key={p}>{p}</option>)}</optgroup><optgroup label={t('socialRatios')}>{aspectPresets.slice(7).map(p => <option key={p}>{p}</option>)}</optgroup><option value="custom">{t('custom')}</option>
    </select></label><label className="field-label">{t('customRatio')}<NumericField label={t('customRatio')} value={shot.aspectRatio} min={.1} max={10} onCommit={aspectRatio => useStore.getState().updateShot({ aspectRatio })} /></label><p className="hint">{ratioLabel(shot.aspectRatio)}</p>
  </section>;
}
