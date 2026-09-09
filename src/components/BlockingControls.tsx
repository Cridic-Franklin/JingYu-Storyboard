import type { Shot, StageObject, Vec3 } from '../types';
import { useStore } from '../store';
import { useSettings } from '../settings';
import { useT } from '../i18n';
import { joints, makePose, posePresets, type Joint, type PosePreset } from '../lib/pose';
import { defaultSpiral, type SpiralGuide } from '../lib/spiral';
import { NumericField } from './NumericField';

export function BlockingControls({object,shot}:{object:StageObject;shot:Shot}) {
  const t=useT(),settings=useSettings(),pose=object.pose??makePose();
  const update=(patch:Partial<StageObject>)=>useStore.getState().updateObject(object.id,patch);
  return <>
    <section className="inspector-section"><h3>{t('displayColor')}</h3><input type="color" aria-label={t('displayColor')} value={object.displayColor??(object.type==='Character'?'#a0b6af':'#8c969c')} onChange={e=>update({displayColor:e.target.value})}/><div className="color-presets">{['#a0b6af','#e4ad6d','#769dcc','#bf858c','#c7c6bd','#8174ab'].map(color=><button key={color} aria-label={`${t('displayColor')} ${color}`} style={{background:color}} onClick={()=>update({displayColor:color})}/>)}<button onClick={()=>update({displayColor:undefined})}>{t('resetColor')}</button></div><p className="hint">{t('editorColorHint')}</p><label className="editor-colors-option"><input type="checkbox" checked={shot.useEditorColors} onChange={e=>useStore.getState().updateShot({useEditorColors:e.target.checked})}/>{t('cameraEditorColors')}</label></section>
    {object.type==='Character'&&<fieldset className="inspector-section" disabled={object.locked}><h3>{t('characterPose')}</h3>
      <label className="field-label">{t('posePreset')}<select aria-label={t('posePreset')} value={pose.preset} onChange={e=>update({pose:makePose(e.target.value as PosePreset)})}>{posePresets.map(k=><option key={k} value={k}>{t(k)}</option>)}{pose.preset==='customPose'&&<option value="customPose">{t('customPose')}</option>}</select></label>
      <button className="blocking-action" aria-pressed={settings.poseMode} onClick={()=>{settings.setWorkspace('spatial');useSettings.setState({poseMode:!settings.poseMode});}}>{t('poseMode')}</button><p className="hint">{t('poseHint')}</p>
      <label className="field-label">{t('joint')}<select aria-label={t('joint')} value={settings.poseJoint} onChange={e=>useSettings.setState({poseJoint:e.target.value as Joint})}>{joints.map(k=><option key={k} value={k}>{t(k)}</option>)}</select></label>
      <div className="vector-inputs">{pose.joints[settings.poseJoint].map((value,i)=><label key={i}><span>{['X','Y','Z'][i]}</span><NumericField label={`${t('joint')} ${['X','Y','Z'][i]}`} value={value} min={-360} max={360} onCommit={n=>{const rotation=[...pose.joints[settings.poseJoint]] as Vec3;rotation[i]=n;update({pose:{...pose,basePreset:pose.preset==='customPose'?pose.basePreset:pose.preset,preset:'customPose',joints:{...pose.joints,[settings.poseJoint]:rotation}}});}}/></label>)}</div>
      <label className="field-label">{t('hipHeight')}<NumericField label={t('hipHeight')} value={pose.hipHeight} min={0} max={10} onCommit={hipHeight=>update({pose:{...pose,basePreset:pose.preset==='customPose'?pose.basePreset:pose.preset,preset:'customPose',hipHeight}})}/></label>
    </fieldset>}
  </>;
}
export function SpiralControls({shot}:{shot:Shot}) {
  const t=useT(),g=shot.spiral;
  const update=(patch:Partial<SpiralGuide>)=>useStore.getState().updateShot({spiral:{...g,...patch}});
  return <section className="inspector-section"><h3>{t('spiral')}</h3><label className="field-label">{t('spiralCorner')}<select aria-label={t('spiralCorner')} value={g.corner} onChange={e=>update({corner:e.target.value as SpiralGuide['corner']})}>{(['topLeft','topRight','bottomLeft','bottomRight'] as const).map(k=><option value={k} key={k}>{t(k)}</option>)}</select></label>
    <label><input type="checkbox" checked={g.mirror} onChange={e=>update({mirror:e.target.checked})}/>{t('mirrorSpiral')}</label>
    {(['x','y','scale'] as const).map(k=><label className="field-label" key={k}>{t(k==='scale'?'guideScale':k==='x'?'guideOffsetX':'guideOffsetY')}<NumericField label={t(k==='scale'?'guideScale':k==='x'?'guideOffsetX':'guideOffsetY')} value={g[k]*100} min={k==='scale'?10:-100} max={k==='scale'?300:100} onCommit={value=>update({[k]:value/100})}/></label>)}
    <button className="blocking-action" onClick={()=>useStore.getState().updateShot({spiral:defaultSpiral()})}>{t('resetSpiral')}</button>
    
  </section>;
}
