import { PosePlan, ProjectedBounds } from './PosePlan';
import { isLight } from '../types';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import type { Point2, Shot, Sketch, MeasurePoint, StageObject } from '../types';
import { useStore } from '../store';
import { useSettings } from '../settings';
import { t, useT } from '../i18n';
import { worldBounds, localBounds } from '../lib/scene';
import { measurementPoint, worldFacing } from '../lib/spatial';
import { ViewportTools } from './ViewportTools';
import { Icon } from './Icon';

export interface PlanOptions { lightDirections: boolean; names: boolean; facing: boolean; frustum: boolean; measurements: boolean; sketch: boolean; grid: boolean; scene: boolean }
export const defaultPlanOptions: PlanOptions = { lightDirections: true, names: true, facing: true, frustum: true, measurements: true, sketch: true, grid: true, scene: true };
export function planViewBox(shot: Shot) { const v = shot.plan.view; return `${v.x - v.width / 2} ${v.z - v.width * .3} ${v.width} ${v.width * .6}`; }
function strokePath(points: Point2[]) { return points.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' '); }
function smoothPath(points: Point2[]) {
  if(points.length<3)return strokePath(points);
  const middle=(a:Point2,b:Point2):Point2=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
  let d=`M${points[0][0]},${points[0][1]}`;
  for(let i=1;i<points.length-1;i++){const m=middle(points[i],points[i+1]);d+=` Q${points[i][0]},${points[i][1]} ${m[0]},${m[1]}`;}
  const last=points.at(-1)!;const control=points.at(-2)!;return `${d} Q${control[0]},${control[1]} ${last[0]},${last[1]}`;
}
function PrimitivePlan({object,width,depth}:{object:StageObject;width:number;depth:number}){
  const rect=(x:number,z:number,w:number,d:number,rx=.04)=><rect x={x-w/2} y={z-d/2} width={w} height={d} rx={rx}/>;
  if(['Car','Van'].includes(object.type))return <>{rect(0,0,width,depth,.18)}{rect(0,depth*.23,width*.78,depth*.38,.12)}<path d={`M${-width*.32},${depth*.48}L0,${depth*.6}L${width*.32},${depth*.48}`} fill="none"/></>;
  if(object.type==='Motorcycle')return <><circle cx="0" cy={-depth*.36} r={width*.38} fill="none"/><circle cx="0" cy={depth*.36} r={width*.38} fill="none"/><path d={`M0,${-depth*.36}L${-width*.24},0L0,${depth*.36}L${width*.24},0Z`} fill="none"/><path d={`M${-width*.45},${depth*.22}H${width*.45}`} /></>;
  if(object.type==='Chair')return <>{rect(0,0,width*.82,depth*.72)}<path d={`M${-width*.42},${-depth*.42}H${width*.42}`} strokeWidth=".08"/></>;
  if(['Table','Desk'].includes(object.type))return <>{rect(0,0,width,depth,.08)}{[[-.42,-.38],[.42,-.38],[-.42,.38],[.42,.38]].map(([x,z],i)=><circle key={i} cx={x*width} cy={z*depth} r={Math.min(width,depth)*.07}/>)}</>;
  if(object.type==='Sofa')return <>{rect(0,0,width,depth,.1)}{rect(0,-depth*.38,width*.88,depth*.16)}{rect(-width*.44,0,width*.12,depth*.82)}{rect(width*.44,0,width*.12,depth*.82)}</>;
  if(object.type==='Bed')return <>{rect(0,0,width,depth,.08)}{rect(0,-depth*.38,width*.78,depth*.18)}<path d={`M${-width*.5},${-depth*.48}H${width*.5}`} strokeWidth=".08"/></>;
  if(object.type==='Shelf')return <>{rect(0,0,width,depth)}<path d={`M${-width*.3},${-depth*.5}V${depth*.5}M0,${-depth*.5}V${depth*.5}M${width*.3},${-depth*.5}V${depth*.5}`} fill="none"/></>;
  if(object.type==='Lamp')return <><circle r={width*.5}/><circle r={width*.16} fill="none"/></>;
  if(object.type==='Monitor')return <>{rect(0,0,width,depth)}<path d={`M0,${-depth*.5}V${depth*.5}`} /></>;
  if(['Wall','Door','Window'].includes(object.type))return <>{rect(0,0,width,depth,0)}{object.type!=='Wall'&&<path d={`M${-width*.42},0H${width*.42}`} strokeWidth=".08"/>}</>;
  if(object.type==='Stairs')return <>{rect(0,0,width,depth,0)}{[-.3,-.1,.1,.3].map((z,i)=><path key={i} d={`M${-width/2},${z*depth}H${width/2}`} fill="none"/>)}</>;
  return ['Sphere','Cylinder','Cone','Capsule'].includes(object.type)?<ellipse rx={width/2} ry={depth/2}/>:rect(0,0,width,depth);
}
export function SketchDrawing({ sketch }: { sketch: Sketch }) {
  const a = sketch.points[0], b = sketch.points.at(-1); if (!a || !b) return null;
  const angle = Math.atan2(b[1] - a[1], b[0] - a[0]); const arrow = Math.max(.22, sketch.size * 4);
  return <g data-sketch={sketch.id} stroke={sketch.color} fill="none" strokeWidth={sketch.size} strokeLinecap="round" strokeLinejoin="round" opacity={sketch.tool === 'marker' ? .35 : 1}>
    {sketch.tool === 'text' ? <text x={a[0]} y={a[1]} fill={sketch.color} stroke="none" fontSize={Math.max(.3, sketch.size * 6)}>{sketch.text}</text> : <path d={strokePath(sketch.points)} />}
    {sketch.tool === 'arrow' && <path d={`M${b[0] - Math.cos(angle - .5) * arrow},${b[1] - Math.sin(angle - .5) * arrow}L${b[0]},${b[1]}L${b[0] - Math.cos(angle + .5) * arrow},${b[1] - Math.sin(angle + .5) * arrow}`} />}
  </g>;
}
export function PlanDrawing({ shot, options = defaultPlanOptions, selectedId, onObjectDown, onPathPointDown, onRename, labelScale = 1, editorColors = true }: { shot: Shot; options?: PlanOptions; selectedId?: string | null; labelScale?: number; editorColors?: boolean; onObjectDown?: (event: PointerEvent<SVGGElement>, object: StageObject) => void; onPathPointDown?: (event: PointerEvent<SVGCircleElement>, pathId: string, pointId: string) => void; onRename?: (object: StageObject) => void }) {
  const view = shot.plan.view; const startX = Math.floor(view.x - view.width / 2), startZ = Math.floor(view.z - view.width * .3); const step = view.width > 60 ? 5 : 1;
  const selectedPathId=useSettings(s=>s.selectedPathId),selectedPathPointId=useSettings(s=>s.selectedPathPointId);
  const labels: {x:number;z:number;w:number}[]=[];
  return <g fontFamily="Segoe UI, Arial, sans-serif">
    {options.grid && <g stroke="#4a5657" strokeWidth=".015">{Array.from({ length: Math.ceil(view.width / step) + 2 }, (_, i) => <path key={`x${i}`} d={`M${startX + i * step},${startZ - 1}v${view.width}`} />)}{Array.from({ length: Math.ceil(view.width * .6 / step) + 2 }, (_, i) => <path key={`z${i}`} d={`M${startX - 1},${startZ + i * step}h${view.width + 2}`} />)}<path d={`M0,${startZ - 1}v${view.width}M${startX - 1},0h${view.width + 2}`} stroke="#8a8c76" strokeWidth=".025" /></g>}
    {options.scene && shot.objects.filter(o => o.visible).map(o => {
      const x = o.position[0], z = o.position[2], bounds = worldBounds(o); const sz = Math.max(.25, bounds.max.z - bounds.min.z); const local=localBounds(o),localX=(local.max.x+local.min.x)/2*o.scale[0],localZ=(local.max.z+local.min.z)/2*o.scale[2],localSx=Math.max(.25,(local.max.x-local.min.x)*Math.abs(o.scale[0])),localSz=Math.max(.25,(local.max.z-local.min.z)*Math.abs(o.scale[2])); const camera = o.type === 'Camera'; const yaw = worldFacing(o); const selected = o.id === selectedId;
      const radians = yaw * Math.PI / 180; const forward = [Math.sin(radians), Math.cos(radians)];
      const spread = Math.atan(Math.tan(o.fov * Math.PI / 360) * shot.aspectRatio);
      const labelWidth=Math.max(.5,o.name.length*.16*labelScale);let labelY=-sz/2-.2;
      for(let attempt=0;attempt<8&&labels.some(p=>Math.abs(p.x-x)<(p.w+labelWidth)/2&&Math.abs(p.z-(z+labelY))<.4*labelScale);attempt++)labelY-=.42*labelScale;
      labels.push({x,z:z+labelY,w:labelWidth});
      return <g key={o.id} data-plan-object={o.id} transform={`translate(${x} ${z})`} onPointerDown={e => onObjectDown?.(e, o)} onDoubleClick={() => onRename?.(o)} style={{ cursor: o.locked ? 'default' : 'pointer' }}>
        {camera && options.frustum && <defs><linearGradient id={`frustum-${o.id}`} x1="0" y1="0" x2={forward[0] * 6} y2={forward[1] * 6} gradientUnits="userSpaceOnUse"><stop stopColor="#bba06b" stopOpacity=".15" /><stop offset="1" stopColor="#bba06b" stopOpacity=".015" /></linearGradient></defs>}
        {camera && options.frustum && <path data-frustum={o.id} d={`M0,0L${Math.sin(radians - spread) * 6},${Math.cos(radians - spread) * 6}L${Math.sin(radians + spread) * 6},${Math.cos(radians + spread) * 6}Z`} fill={`url(#frustum-${o.id})`} stroke="var(--plan-frustum-edge, #bfa16a)" strokeWidth=".035" strokeDasharray=".12 .08" pointerEvents="none" />}
        {o.type==='Character' ? <g color={(editorColors ? o.displayColor : undefined)??'#8ba99e'} fill={(editorColors ? o.displayColor : undefined)??'#8ba99e'} stroke={selected?'#41C6CE':'#c4cbc1'} strokeWidth={selected?.06:.025}><PosePlan object={o}/></g> : o.type==='OBJ' ? <g fill={(editorColors ? o.displayColor : undefined)??'#798b91'} stroke={selected?'#41C6CE':'#c4cbc1'} strokeWidth={selected?.06:.025}><ProjectedBounds object={o}/></g> : <g transform={`rotate(${-o.rotation[1]}) translate(${localX} ${localZ})`} fill={(editorColors ? o.displayColor : undefined) ?? (selected ? (camera?'#D6A84F':'#41C6CE') : o.type === 'Prop' ? '#c68e5c' : '#798b91')} stroke={selected ? (camera?'#E7B85E':'#8CDDE1') : '#c4cbc1'} strokeWidth={selected ? '.06' : '.025'}>
          <PrimitivePlan object={o} width={localSx} depth={localSz}/>
        </g>}
        {(isLight(o) ? options.lightDirections : options.facing) && o.type !== 'PointLight' && <g stroke={camera?'#D6A84F':'#8CDDE1'} strokeWidth=".045" fill="none" pointerEvents="none"><path d={`M0,0L${forward[0] * 1.15},${forward[1] * 1.15}`} /><path d={`M${forward[0] * .9 + forward[1] * .13},${forward[1] * .9 - forward[0] * .13}L${forward[0] * 1.15},${forward[1] * 1.15}L${forward[0] * .9 - forward[1] * .13},${forward[1] * .9 + forward[0] * .13}`} /><text x={forward[0]*1.25} y={forward[1]*1.25} fontSize={.2*labelScale} fill={camera?'#D6A84F':'#8CDDE1'} stroke="none">{t(isLight(o) ? 'lightDirection' : o.type === 'Prop' ? 'frontDirection' : 'facingDirection')}</text></g>}
        {options.names && <g>{labelY < -sz/2-.3 && <path d={`M0,${-sz/2}L0,${labelY}`} stroke="#a7b8ae" strokeWidth=".02" pointerEvents="none" />}<text y={labelY} textAnchor="middle" fontSize={.28 * labelScale} fill="#ecdfc9" stroke="#293132" strokeWidth=".05" paintOrder="stroke" pointerEvents="none">{o.name}</text></g>}
        {shot.plan.showHeights && <text y={sz / 2 + .35} textAnchor="middle" fontSize={.23 * labelScale} fill="#b0c5bd" pointerEvents="none">{t('heightShort', { n: Number(o.position[1].toFixed(2)) })}</text>}
      </g>;
    })}
    {shot.plan.layers.motionPaths && shot.motionPaths.filter(path=>path.visible&&path.points.length>1).map(path=>{const object=shot.objects.find(o=>o.id===path.objectId),color=object?.type==='Camera'?'#D6A84F':'#41C6CE',points=path.points.map(point=>[point.position[0],point.position[2]] as Point2),line=path.smooth?smoothPath(points):strokePath(points),selected=path.id===selectedPathId;return <g key={path.id} data-motion-path={path.id} fill={color} stroke={color}><path d={line} fill="none" stroke="transparent" strokeWidth=".42" onPointerDown={event=>{event.stopPropagation();useSettings.setState({selectedPathId:path.id,selectedPathPointId:null});if(object)useStore.getState().selectObject(object.id);}}/><path d={line} fill="none" strokeWidth={selected?'.11':'.07'} strokeDasharray=".2 .1" opacity={selected?1:.7} pointerEvents="none"/><path d={line} fill="none" strokeWidth={selected?'.18':'.12'} opacity={selected?'.42':'.24'} pointerEvents="none"/>{path.points.map(point=>{const pointSelected=point.id===selectedPathPointId;return <circle key={point.id} data-path-point={point.id} cx={point.position[0]} cy={point.position[2]} r={pointSelected?'.21':selected?'.16':'.12'} fill={pointSelected?'#F2F6F4':color} stroke={pointSelected?color:'transparent'} strokeWidth=".08" style={{cursor:onPathPointDown?'grab':'default'}} onPointerDown={event=>onPathPointDown?.(event,path.id,point.id)}/>;})}</g>;})}
    {options.measurements && shot.plan.measurements.map(m => {
      const a = measurementPoint(m.a, shot), b = measurementPoint(m.b, shot); const degrees = (Math.atan2(b.x - a.x, b.z - a.z) * 180 / Math.PI + 360) % 360;
      return <g key={m.id} data-measurement={m.id} stroke="#a5d8d2" strokeWidth=".035" pointerEvents="none"><path d={`M${a.x},${a.z}L${b.x},${b.z}`} strokeDasharray=".1 .07" /><circle cx={a.x} cy={a.z} r=".08" fill="#a5d8d2" /><circle cx={b.x} cy={b.z} r=".08" fill="#a5d8d2" /><text x={(a.x + b.x) / 2} y={(a.z + b.z) / 2 - .15} stroke="#263031" strokeWidth=".06" paintOrder="stroke" fill="#cbf2e7" fontSize={.26 * labelScale} textAnchor="middle">{a.distanceTo(b).toFixed(2)} m · {Math.round(degrees)}°</text></g>;
    })}
    {options.sketch && shot.plan.sketches.map(s => <SketchDrawing key={s.id} sketch={s} />)}
  </g>;
}
export function PlanView({ shot }: { shot: Shot }) {
  const t = useT(); const svg = useRef<SVGSVGElement>(null); const state = useStore(); const settings = useSettings();
  const [viewportHeight, setViewportHeight] = useState(400);
  useEffect(() => { const observer = new ResizeObserver(entries => setViewportHeight(entries[0].contentRect.height)); if (svg.current) observer.observe(svg.current); return () => observer.disconnect(); }, []);
  const tool = settings.planTool;
  const [color, setColor] = useState('#e7b77b'), [size, setSize] = useState(.05), [draft, setDraft] = useState<Sketch | null>(null), [pointA, setPointA] = useState<MeasurePoint | null>(null);
  const gesture = useRef<{ kind: 'object' | 'path' | 'pan' | 'sketch'; start: Point2; object?: StageObject; pathId?: string; pointId?: string; originalView?: Shot['plan']['view']; sketch?: Sketch } | null>(null);
  useEffect(() => { setPointA(null); }, [tool]);
  const point = (event: { clientX: number; clientY: number }): Point2 => { const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(svg.current!.getScreenCTM()!.inverse()); return [p.x, p.y]; };
  const snap = (n: number, interval: number) => interval ? Math.round(n / interval) * interval : n;
  function measurePoint(p: Point2): MeasurePoint {
    const nearest = shot.objects.filter(o => o.visible).map(o => ({ o, distance: Math.hypot(o.position[0] - p[0], o.position[2] - p[1]) })).sort((a, b) => a.distance - b.distance)[0];
    return nearest && nearest.distance < shot.plan.view.width * .025 ? { objectId: nearest.o.id, position: [...nearest.o.position] } : { position: [snap(p[0], settings.positionSnap), 0, snap(p[1], settings.positionSnap)] };
  }
  function rename(o: StageObject) { const name = window.prompt(t('displayName'), o.name); if (name !== null) state.updateObject(o.id, { name }); }
  function start(event: PointerEvent<SVGSVGElement>) {
    if (event.button !== 0 && event.button !== 1) return;
    const p = point(event); svg.current!.setPointerCapture(event.pointerId);
    if (event.button === 1 || event.altKey || tool === 'pan') { event.preventDefault(); state.beginTransaction('transform'); gesture.current = { kind: 'pan', start: [event.clientX, event.clientY], originalView: shot.plan.view }; return; }
    if (tool === 'measure') { const b = measurePoint(p); if (!pointA) setPointA(b); else { state.updatePlan({ measurements: [...shot.plan.measurements, { id: crypto.randomUUID(), a: pointA, b }] }); setPointA(null); } return; }
    if (tool === 'eraser') { state.updatePlan({ sketches: shot.plan.sketches.filter(s => !s.points.some((q, i) => { const b = s.points[i + 1] ?? q; const dx = b[0] - q[0], dz = b[1] - q[1], length = dx * dx + dz * dz; const u = length ? Math.max(0, Math.min(1, ((p[0] - q[0]) * dx + (p[1] - q[1]) * dz) / length)) : 0; return Math.hypot(q[0] + u * dx - p[0], q[1] + u * dz - p[1]) < shot.plan.view.width * .025; })) }); return; }
    if (tool === 'text') { const text = window.prompt(t('noteText')); if (text) state.updatePlan({ sketches: [...shot.plan.sketches, { id: crypto.randomUUID(), tool, points: [p], color, size, text }] }); return; }
    if (['pen', 'marker', 'arrow'].includes(tool)) { const sketch: Sketch = { id: crypto.randomUUID(), tool: tool as Sketch['tool'], color, size: tool === 'marker' ? size * 4 : size, points: [p] }; gesture.current = { kind: 'sketch', start: p, sketch }; setDraft(sketch); return; }
    state.selectObject(null);
  }
  function finish() {
    const g = gesture.current;
    if (g?.sketch && g.sketch.points.length > 1) state.updatePlan({ sketches: [...useStore.getState().project.shots.find(s => s.id === shot.id)!.plan.sketches, g.sketch] });
    gesture.current = null; setDraft(null); state.endTransaction('transform');
  }
  useEffect(() => {
    if (!settings.frameRequest) return;
    const current = useStore.getState(), active = current.project.shots.find(s => s.id === current.project.activeShotId), object = active?.objects.find(o => o.id === current.selectedId);
    if (object) current.updatePlan({ view: { x: object.position[0], z: object.position[2], width: Math.max(5, 6 * Math.max(...object.scale.map(Math.abs))) } });
  }, [settings.frameRequest]);
  return <div className="plan-workspace">
    <ViewportTools annotationControls={<div className="annotation-settings"><input aria-label={t('brushColor')} type="color" value={color} onChange={e => setColor(e.target.value)} /><select aria-label={t('brushSize')} value={size} onChange={e => setSize(Number(e.target.value))}>{[.025, .05, .1].map(v => <option key={v} value={v}>{v} m</option>)}</select><button aria-label={t('clearSketch')} title={t('clearSketch')} onClick={() => state.updatePlan({ sketches: [] })}><Icon name="trash" size={15} /></button></div>} />
    <details className="view-options"><summary><Icon name="layers" size={14} />{t('viewOptions')}<span>⌄</span></summary><div className="view-options-menu">
      <label>{t('snapPosition')}<select aria-label={t('snapPosition')} value={settings.positionSnap} onChange={e => useSettings.setState({ positionSnap: Number(e.target.value) })}>{[0, .1, .5, 1].map(v => <option key={v} value={v}>{v ? `${v} m` : t('off')}</option>)}</select></label>
      <label>{t('snapRotation')}<select aria-label={t('snapRotation')} value={settings.rotationSnap} onChange={e => useSettings.setState({ rotationSnap: Number(e.target.value) })}>{[0, 5, 15, 45].map(v => <option key={v} value={v}>{v ? `${v}°` : t('off')}</option>)}</select></label>
      {(['scene', 'measurements', 'sketch', 'motionPaths'] as const).map(k => <label key={k}><input type="checkbox" checked={shot.plan.layers[k]} onChange={() => state.updatePlan({ layers: { ...shot.plan.layers, [k]: !shot.plan.layers[k] } })} />{t(k)}</label>)}
      <label><input type="checkbox" checked={shot.plan.showHeights} onChange={() => state.updatePlan({ showHeights: !shot.plan.showHeights })} />{t('showHeights')}</label>
    </div></details>
    <svg ref={svg} data-testid="plan-view" className="plan-svg" viewBox={planViewBox(shot)} onContextMenu={e => e.preventDefault()} onPointerDown={start} onPointerUp={finish} onPointerCancel={finish}
      onWheel={e => { const width = Math.max(4, Math.min(150, shot.plan.view.width * Math.exp(e.deltaY * .001))); state.updatePlan({ view: { ...shot.plan.view, width } }); }}
      onPointerMove={event => {
        const g = gesture.current; if (!g) return; const p = point(event);
        if (g.kind === 'pan') { const scale = g.originalView!.width / svg.current!.getBoundingClientRect().width; state.updatePlan({ view: { ...g.originalView!, x: g.originalView!.x - (event.clientX - g.start[0]) * scale, z: g.originalView!.z - (event.clientY - g.start[1]) * scale } }); }
        if (g.kind === 'object' && g.object) {
          const o = g.object;
          if (state.mode === 'rotate') { const startAngle = Math.atan2(g.start[0] - o.position[0], g.start[1] - o.position[2]); const angle = Math.atan2(p[0] - o.position[0], p[1] - o.position[2]); state.updateObject(o.id, { rotation: [o.rotation[0], snap(o.rotation[1] + (angle - startAngle) * 180 / Math.PI, settings.rotationSnap), o.rotation[2]] }); }
          else if (state.mode === 'scale') { const factor = Math.max(.05, 1 + (p[0] - g.start[0]) / Math.max(.5, Math.abs(o.scale[0]))); state.updateObject(o.id, { scale: o.scale.map(v => Math.max(.01, Math.abs(v) * factor) * Math.sign(v || 1)) as StageObject['scale'] }); }
          else state.updateObject(o.id, { position: [snap(o.position[0] + p[0] - g.start[0], settings.positionSnap), o.position[1], snap(o.position[2] + p[1] - g.start[1], settings.positionSnap)] });
        }
        if (g.kind === 'path' && g.pathId && g.pointId) {
          const active=useStore.getState().project.shots.find(item=>item.id===shot.id),path=active?.motionPaths.find(item=>item.id===g.pathId);
          if(path)state.updateShot({motionPaths:active!.motionPaths.map(item=>item.id===path.id?{...item,points:item.points.map(pathPoint=>pathPoint.id===g.pointId?{...pathPoint,position:[snap(p[0],settings.positionSnap),pathPoint.position[1],snap(p[1],settings.positionSnap)]}:pathPoint)}:item)});
        }
        if (g.kind === 'sketch' && g.sketch) { g.sketch = { ...g.sketch, points: g.sketch.tool === 'arrow' ? [g.start, p] : [...g.sketch.points, p] }; setDraft(g.sketch); }
      }}>
      <PlanDrawing shot={shot} options={{ ...defaultPlanOptions, ...shot.plan.layers }} selectedId={state.selectedId} labelScale={Math.max(1, shot.plan.view.width * .6 / Math.max(viewportHeight, 1) * 11 / .28)} onRename={rename} onPathPointDown={(event,pathId,pointId)=>{
        if(tool!=='select'||event.button!==0)return;event.stopPropagation();svg.current!.setPointerCapture(event.pointerId);const path=shot.motionPaths.find(item=>item.id===pathId);if(path)state.selectObject(path.objectId);state.setMode('select');useSettings.setState({selectedPathId:pathId,selectedPathPointId:pointId});state.beginTransaction('transform');gesture.current={kind:'path',start:point(event),pathId,pointId};
      }} onObjectDown={(event, o) => {
        if (tool !== 'select' || event.altKey || event.button !== 0) return;
        event.stopPropagation(); state.selectObject(o.id);
        if (o.locked || state.mode === 'select') return;
        svg.current!.setPointerCapture(event.pointerId); state.beginTransaction('transform'); gesture.current = { kind: 'object', start: point(event), object: structuredClone(o) };
      }} />
      {draft && <SketchDrawing sketch={draft} />}{pointA && <circle cx={measurementPoint(pointA, shot).x} cy={measurementPoint(pointA, shot).z} r=".15" fill="#a5d8d2" />}
    </svg><div className="plan-footer"><span>{tool === 'measure' ? t('measureHelp') : t('planHelp')}</span>{shot.plan.measurements.length > 0 && <button onClick={() => state.updatePlan({ measurements: [] })}>{t('clearMeasurements')}</button>}</div>
  </div>;
}
