import { defaultAnnotations, type Shot, type CameraAnnotations } from '../types';
import { cameraPNG, planPNG } from './export';
import { defaultPlanOptions } from '../components/PlanView';
import { analyzeShot, constraintText, semanticDescription } from './semantics';
import { zipFiles } from './zip';
import { t } from '../i18n';
import { useSettings } from '../settings';

export function framePreset(shot: Shot, kind: 'clean'|'directorFrame'|'aiReference'): { annotations: CameraAnnotations; guides: Shot['overlays'] } {
  return { annotations: { ...defaultAnnotations(), ...(kind==='directorFrame'?{focusPoint:true,focusRegion:true}:kind==='aiReference'?{names:true,types:true,semantic:true,coordinates:shot.includeTechnical}:{}) }, guides: kind==='directorFrame'?[...shot.overlays]:[] };
}
export async function shotPacket(shot: Shot, width=1920): Promise<Blob> {
  const snapshot=structuredClone(shot),base=`SHOT_${String(shot.number).padStart(3,'0')}_AI/`,files:{name:string;data:Blob}[]=[];
  for(const [kind,name] of [['clean','01_camera_clean.png'],['directorFrame','02_director_frame.png'],['aiReference','03_ai_spatial_frame.png']] as const){const options=framePreset(snapshot,kind);files.push({name:base+name,data:await cameraPNG(snapshot,width,options.annotations,options.guides)});}
  files.push({name:base+'04_plan_view.png',data:await planPNG(snapshot,{...defaultPlanOptions,...snapshot.plan.layers})},{name:base+'05_spatial.txt',data:new Blob([semanticDescription(snapshot)],{type:'text/plain;charset=utf-8'})},{name:base+'06_spatial.json',data:new Blob([JSON.stringify(analyzeShot(snapshot),null,2)],{type:'application/json'})});
  return zipFiles(files);
}
function wrap(ctx: CanvasRenderingContext2D, text:string, width:number): string[] {
  return text.split('\n').flatMap(line=>{const rows:string[]=[];let row='';for(const c of line){if(ctx.measureText(row+c).width>width&&row){rows.push(row);row='';}row+=c;}rows.push(row);return rows;});
}
export async function referenceBoard(shot: Shot): Promise<Blob> {
  const options=framePreset(shot,'aiReference'),camera=await createImageBitmap(await cameraPNG(shot,1920,options.annotations,options.guides)),plan=await createImageBitmap(await planPNG(shot,{...defaultPlanOptions,...shot.plan.layers}));
  try {
    const canvas=document.createElement('canvas');canvas.width=3200;const ctx=canvas.getContext('2d')!;ctx.font='26px Segoe UI,Arial,sans-serif';
    const full=semanticDescription(shot),summary=full.split(`\n${t('hardConstraints')}`)[0].split(`\n${t('doNot')}`)[0];
    const constraints=[t('hardConstraints'),...shot.hardConstraints.map(c=>constraintText(shot,c,useSettings.getState().language)),shot.constraints,'',t('doNot'),shot.negativeConstraints].join('\n');
    const a=wrap(ctx,summary,1480),b=wrap(ctx,constraints,1480),maxLines=190;canvas.height=Math.max(2100,Math.min(8000,1150+Math.max(a.length,b.length)*34));
    ctx.fillStyle='#202a2b';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#edc992';ctx.font='bold 38px Segoe UI,Arial,sans-serif';ctx.fillText(`SHOT ${String(shot.number).padStart(3,'0')} · ${shot.title}`,50,65);
    function fit(image:ImageBitmap,x:number){const scale=Math.min(1500/image.width,850/image.height);ctx.drawImage(image,x+(1500-image.width*scale)/2,135+(850-image.height*scale)/2,image.width*scale,image.height*scale);}
    fit(camera,50);fit(plan,1650);ctx.font='bold 27px Segoe UI,Arial,sans-serif';ctx.fillText(t('aiReference'),50,115);ctx.fillText(t('plan'),1650,115);
    ctx.strokeStyle='#566560';ctx.beginPath();ctx.moveTo(1600,105);ctx.lineTo(1600,canvas.height-40);ctx.moveTo(50,1020);ctx.lineTo(3150,1020);ctx.stroke();
    ctx.font='26px Segoe UI,Arial,sans-serif';ctx.fillStyle='#e0e4da';for(const [rows,x]of [[a,50],[b,1650]] as const){rows.slice(0,maxLines).forEach((line,i)=>ctx.fillText(line,x,1080+i*34));if(rows.length>maxLines)ctx.fillText(t('boardOverflow'),x,1080+maxLines*34);}
    return await new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Reference board encoding failed.')),'image/png'));
  } finally {camera.close();plan.close();}
}
