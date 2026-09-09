import { useSettings } from '../settings';
import { useT } from '../i18n';
export function WorkspacePresets() {
  const t=useT();
  return <select className="workspace-presets" aria-label={t('workspacePreset')} value="" onChange={e=>{
    const preset=e.target.value;useSettings.setState({maximized:null,workspaceView:preset==='blocking'?'spatial':preset==='composition'?'camera':preset==='aiReview'?'aiReview':'plan',layout:{left:185,right:270,bottom:preset==='aiReview'?330:230,preview:preset==='aiReview'?.25:.54}});
  }}><option value="" disabled>{t('workspacePreset')}</option>{(['blocking','plan','composition','aiReview'] as const).map(k=><option key={k} value={k}>{t(k)}</option>)}</select>;
}
