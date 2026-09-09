import { useState } from 'react';
import { useT } from '../i18n';
import type { Shot } from '../types';
import { useExportValidation } from './SpatialRules';
import { projectStorage } from '../storage/ProjectStorage';
import { referenceBoard, shotPacket } from '../lib/shotExports';

export function ShotPackageExport({ shot }: { shot: Shot }) {
  const t=useT(),validation=useExportValidation(shot),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const run=async(board:boolean)=>{setBusy(true);setError('');try{const snapshot=structuredClone(shot);const data=board?await referenceBoard(snapshot):await shotPacket(snapshot);projectStorage.download(data,`SHOT_${String(snapshot.number).padStart(3,'0')}_${board?'AI_REFERENCE.png':'AI.zip'}`);}catch(e){setError(String(e));}finally{setBusy(false);}};
  return <><button disabled={busy||!shot.objects.some(o=>o.type==='Camera')} onClick={()=>validation.request(()=>void run(false))}>{t('exportPacket')}</button><button disabled={busy||!shot.objects.some(o=>o.type==='Camera')} onClick={()=>validation.request(()=>void run(true))}>{t('exportBoard')}</button>{busy&&<div className="modal-backdrop"><section className="compact-dialog" role="dialog" aria-label={t('exportBusy')}><p role="status">{t('exportBusy')}</p></section></div>}{error&&<div className="modal-backdrop"><section className="compact-dialog" role="dialog"><p role="alert">{error}</p><button onClick={()=>setError('')}>{t('close')}</button></section></div>}{validation.dialog}</>;
}
