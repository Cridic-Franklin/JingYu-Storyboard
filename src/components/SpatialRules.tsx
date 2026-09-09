import { useState } from 'react';
import { useStore } from '../store';
import { useSettings } from '../settings';
import { useT, type MessageKey } from '../i18n';
import { isLight, type Shot, type RelationSpace } from '../types';
import { validateConstraints, relationChoices, constraintText } from '../lib/semantics';

export function SubjectControls({ shot }: { shot: Shot }) {
  const t=useT();return <section className="inspector-section"><h3>{t('subjects')}</h3>{([['primaryCharacterId','primaryCharacter'],['primarySubjectId','primaryVisualSubject'],['secondarySubjectId','secondarySubject'],['backgroundAnchorId','backgroundAnchor']] as const).map(([key,label])=><label key={key} className="field-label">{t(label)}<select aria-label={t(label)} value={shot[key]??''} onChange={e=>useStore.getState().updateShot({[key]:e.target.value||null})}><option value="">{t('none')}</option>{shot.objects.filter(o=>!isLight(o)&&o.type!=='Camera'&&(key!=='primaryCharacterId'||o.type==='Character')).map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></label>)}</section>;
}
export function ValidationSummary({ shot }: { shot: Shot }) {
  const t=useT(), language=useSettings(s=>s.language), result=validateConstraints(shot);
  return <div data-testid="validation-summary"><p role="status">{t(result.conflicts.length?'spatialConflict':'validationPass')}</p>{result.conflicts.map(c=><p className="error-text" key={c.id}>{constraintText(shot,c,language)}<br />{t('actualRelation')}: {t((c.actual??'unresolved') as MessageKey)}</p>)}{result.manualText&&<p className="hint">{t('manualConstraintHint')}</p>}</div>;
}
export function SpatialRules({ shot }: { shot: Shot }) {
  const t=useT(), language=useSettings(s=>s.language),[a,setA]=useState(''),[b,setB]=useState(''),[space,setSpace]=useState<RelationSpace>('subject'),[expected,setExpected]=useState('frontRight'),[editingId,setEditingId]=useState<string|null>(null);
  const objects=shot.objects.filter(o=>!isLight(o));
  return <section className="inspector-section" id="spatial-rules"><h3>{t('hardConstraints')}</h3><p className="hint">{t('ruleHelp')}</p>
    <label className="field-label">{t('ruleObject')}<select aria-label={t('ruleObject')} value={a} onChange={e=>setA(e.target.value)}><option value="">{t('none')}</option>{objects.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
    <label className="field-label">{t('relationSpace')}<select aria-label={t('relationSpace')} value={space} onChange={e=>{const value=e.target.value as RelationSpace;setSpace(value);setExpected(relationChoices[value][0]);}}>{(['subject','screen','depth','orientation'] as const).map(k=><option key={k} value={k}>{t(k==='subject'?'subjectSpace':k==='screen'?'screenSpace':k==='depth'?'depthSpace':'orientationSpace')}</option>)}</select></label>
    <label className="field-label">{t('expectedRelation')}<select aria-label={t('expectedRelation')} value={expected} onChange={e=>setExpected(e.target.value)}>{relationChoices[space].map(k=><option key={k} value={k}>{t(k as MessageKey)}</option>)}</select></label>
    <label className="field-label">{t('referenceObject')}<select aria-label={t('referenceObject')} value={b} onChange={e=>setB(e.target.value)}><option value="">{t('none')}</option>{objects.filter(o=>o.id!==a).map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
    <button className="field-action" disabled={!a||!b||a===b||!objects.some(o=>o.id===a)||!objects.some(o=>o.id===b)} onClick={()=>{useStore.getState().updateShot({hardConstraints:editingId ? shot.hardConstraints.map(c=>c.id===editingId?{...c,objectId:a,referenceId:b,space,relation:expected}:c) : [...shot.hardConstraints,{id:crypto.randomUUID(),objectId:a,referenceId:b,space,relation:expected}]});setEditingId(null);}}>{t(editingId?'saveConstraint':'addConstraint')}</button>
    {shot.hardConstraints.map(c=><div className="rule-row" key={c.id}><p>{constraintText(shot,c,language)}</p><button title={t('editConstraint')} onClick={()=>{setA(c.objectId);setB(c.referenceId);setSpace(c.space);setExpected(c.relation);setEditingId(c.id);}}>{t('editConstraint')}</button><button onClick={()=>useStore.getState().updateShot({hardConstraints:shot.hardConstraints.filter(r=>r.id!==c.id)})}>{t('removeConstraint')}</button></div>)}
    <ValidationSummary shot={shot} />
    <label className="check-field"><input type="checkbox" checked={shot.includeTechnical} onChange={e=>useStore.getState().updateShot({includeTechnical:e.target.checked})} />{t('includeTechnical')}</label>
  </section>;
}
export function useExportValidation(shot: Shot) {
  const [pending,setPending]=useState<(()=>void)|null>(null),t=useT();
  const request=(action:()=>void)=>{if(validateConstraints(shot).conflicts.length||shot.constraints.trim())setPending(()=>action);else action();};
  const dialog=pending&&<div className="modal-backdrop"><section className="compact-dialog" role="dialog" aria-modal="true" aria-label={t('spatialValidation')}><header><h2>{t('spatialValidation')}</h2><button onClick={()=>setPending(null)}>{t('cancel')}</button></header><ValidationSummary shot={shot} /><div className="dialog-actions"><button onClick={()=>{setPending(null);useSettings.setState({maximized:'inspector'});setTimeout(()=>document.getElementById('spatial-rules')?.scrollIntoView(),0);}}>{t('editConstraint')}</button><button className="generate-button" onClick={()=>{setPending(null);pending();}}>{t('ignoreContinue')}</button></div></section></div>;
  return {request,dialog};
}
