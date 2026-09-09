import { spiralPath } from '../lib/spiral';
import type { CameraAnnotations, Overlay, Shot } from '../types';
import { storyboardCamera } from '../lib/scene';
import { measurementPoint } from '../lib/spatial';
import { analyzeShot } from '../lib/semantics';
import { FocusDrawing } from './FocusOverlay';
import { t } from '../i18n';

type Rect = { x: number; y: number; w: number; h: number };
const overlap = (a:Rect,b:Rect) => Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
function wrapLabel(text:string,limit:number) {
 const words=text.split(/\s+/u),lines:string[]=[];let line='';
 for(const word of words){if(word.length>limit){if(line){lines.push(line);line='';}for(let i=0;i<word.length;i+=limit)lines.push(word.slice(i,i+limit));}else if((line+' '+word).trim().length>limit){lines.push(line);line=word;}else line=(line+' '+word).trim();}if(line)lines.push(line);return lines;
}
export function CameraOverlayContent({ shot, annotations = shot.annotations, guides = shot.overlays, labelScale = 1 }: { shot: Shot; annotations?: CameraAnnotations; guides?: Overlay[]; labelScale?: number }) {
 const data=analyzeShot(shot),camObject=shot.objects.find(o=>o.type==='Camera');if(!camObject)return null;
 const camera=storyboardCamera(camObject,shot.aspectRatio),width=1600,height=1600/shot.aspectRatio,font=Math.min(22,height*.033)*labelScale,lineHeight=font*1.25;
 const infos=data.objects.filter(o=>o.screen.status==='visible').sort((a,b)=>Number(b.id===shot.primarySubjectId)-Number(a.id===shot.primarySubjectId));
 const rectangles=infos.map(o=>({x:o.screen.left!*16,y:o.screen.top!*height/100,w:o.screen.width!*16,h:o.screen.height!*height/100}));
 const placed:Rect[]=[];
 return <g fill="none" stroke="#efd5a5" strokeWidth="2">
 {guides.includes('thirds')&&<path data-overlay="thirds" stroke="#f4f1de88" d={`M${width/3} 0v${height}M${width*2/3} 0v${height}M0 ${height/3}h${width}M0 ${height*2/3}h${width}`} />}
 {guides.includes('cross')&&<path data-overlay="cross" d={`M${width/2-30} ${height/2}h60M${width/2} ${height/2-30}v60`} />}
 {guides.includes('safe')&&<rect data-overlay="safe" x={width*.05} y={height*.05} width={width*.9} height={height*.9} strokeDasharray="12 8" />}
 {guides.includes('spiral')&&<path data-overlay="spiral" strokeWidth="3" d={spiralPath(width,height,shot.spiral)} />}
 <FocusDrawing shot={shot} point={annotations.focusPoint} region={annotations.focusRegion} />
 {infos.map((info,index)=>{
 const s=info.screen,o=shot.objects.find(o=>o.id===info.id)!,rect=rectangles[index],x=s.x!*16,y=s.y!*height/100;
 const text:string[]=[];
 if(annotations.names)text.push(o.name);if(annotations.types)text.push(t(o.type));
 if(annotations.semantic){text.push(`${t(info.depthLayer)} · ${t(info.screenRegion)}`);text.push([t(info.visibility.state as Parameters<typeof t>[0]),...info.visibility.crops.map(k=>t(k))].join(' · '));if(o.id===shot.primarySubjectId)text.push(t('primaryVisualSubject'));}
 if(annotations.front&&o.type==='Prop')text.push(`${t('frontDirection')}: ${info.front.facesObjectId?shot.objects.find(a=>a.id===info.front.facesObjectId)?.name:t(info.front.screenFacing??'positionUnknown')}`);
 if(annotations.facing&&o.type==='Character')text.push(`${t('facingDirection')}: ${t(info.front.screenFacing??'positionUnknown')}`);
 if(annotations.coordinates)text.push(`X ${s.x!.toFixed(0)}% · Y ${s.y!.toFixed(0)}%`);
 const lines=text.flatMap(l=>wrapLabel(l,Math.max(10,Math.floor(365/(font*.65)))));
 const w=Math.min(390,Math.max(80,...lines.map(l=>Array.from(l).reduce((sum,c)=>sum+(/[\u3000-\uffff]/u.test(c)?font:font*.57),0)))+16),h=lines.length*lineHeight+12;
 const candidates=[{x:rect.x+rect.w+15,y:rect.y},{x:rect.x-w-15,y:rect.y},{x:rect.x,y:rect.y-h-15},{x:rect.x,y:rect.y+rect.h+15},...Array.from({length:8},(_,i)=>({x:i%2?width-w-8:8,y:8+Math.floor(i/2)*(height-h-16)/3}))].map(p=>({x:Math.max(8,Math.min(width-w-8,p.x)),y:Math.max(8,Math.min(height-h-8,p.y)),w,h}));
 const score=(r:Rect)=>placed.reduce((n,p)=>n+overlap(r,p)*10,0)+rectangles.reduce((n,p,i)=>n+overlap(r,p)*(infos[i].id===shot.primarySubjectId?5:1),0)+Math.hypot(r.x-x,r.y-y)*.1;
 const label=candidates.sort((a,b)=>score(a)-score(b))[0];if(lines.length)placed.push(label);
 return <g key={o.id} data-annotation-object={o.id}>
 {annotations.bounds&&<rect x={rect.x} y={rect.y} width={rect.w} height={rect.h} strokeDasharray="7 5" />}
 {lines.length>0&&<g><path d={`M${Math.max(0,Math.min(width,x))},${Math.max(0,Math.min(height,y))}L${label.x},${label.y+12}`} strokeOpacity=".5" /><rect x={label.x} y={label.y} width={w} height={h} rx="4" fill="#182221eb" stroke="none" />{lines.map((line,i)=><text key={i} x={label.x+8} y={label.y+font+4+i*lineHeight} fontSize={font} fill="#ffe6b8" stroke="none" fontFamily="Segoe UI,Arial,sans-serif">{line}</text>)}</g>}
 </g>;
 })}
 {annotations.measurements&&shot.plan.measurements.map(m=>{const a=measurementPoint(m.a,shot),b=measurementPoint(m.b,shot),distance=a.distanceTo(b);if([a,b].some(p=>p.clone().applyMatrix4(camera.matrixWorldInverse).z>=-.1))return null;a.project(camera);b.project(camera);const x1=(a.x+1)*800,y1=(1-a.y)*height/2,x2=(b.x+1)*800,y2=(1-b.y)*height/2;return <g key={m.id}><path d={`M${x1},${y1}L${x2},${y2}`} strokeDasharray="7 4" /><text x={(x1+x2)/2} y={(y1+y2)/2-10} fontSize={font} fill="#fff0ca" stroke="none">{distance.toFixed(2)} m</text></g>;})}
 </g>;
}
