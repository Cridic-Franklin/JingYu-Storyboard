import { useSettings } from '../settings';
import { useT } from '../i18n';
export function WorkspacePresets() {
  const t=useT();
  return <select className="workspace-presets" aria-label={t('workspacePreset')} value="" onChange={e=>{
    const preset=e.target.value;useSettings.getState().setWorkspace(preset==='blocking'?'spatial':preset==='composition'?'camera':preset==='aiReview'?'aiReview':'plan');
  }}><option value="" disabled>{t('workspacePreset')}</option>{(['blocking','plan','composition','aiReview'] as const).map(k=><option key={k} value={k}>{t(k)}</option>)}</select>;
}
