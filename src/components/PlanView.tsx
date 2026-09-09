import { isLight } from '../types';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import type { Point2, Shot, Sketch, MeasurePoint, StageObject } from '../types';
import { useStore } from '../store';
import { useSettings, type PlanTool } from '../settings';
import { t, useT } from '../i18n';
import { localBounds } from '../lib/scene';
import { measurementPoint, worldFacing } from '../lib/spatial';
import { Icon } from './Icon';

export interface PlanOptions { lightDirections: boolean; names: boolean; facing: boolean; frustum: boolean; measurements: boolean; sketch: boolean; grid: boolean; scene: boolean }
export const defaultPlanOptions: PlanOptions = { lightDirections: true, names: true, facing: true, frustum: true, measurements: true, sketch: true, grid: true, scene: true };
export function planViewBox(shot: Shot) { const v = shot.plan.view; return `${v.x - v.width / 2} ${v.z - v.width * .3} ${v.width} ${v.width * .6}`; }
function strokePath(points: Point2[]) { return points.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' '); }
export function SketchDrawing({ sketch }: { sketch: Sketch }) {
  const a = sketch.points[0], b = sketch.points.at(-1); if (!a || !b) return null;
  const angle = Math.atan2(b[1] - a[1], b[0] - a[0]); const arrow = Math.max(.22, sketch.size * 4);
  return <g data-sketch={sketch.id} stroke={sketch.color} fill="none" strokeWidth={sketch.size} strokeLinecap="round" strokeLinejoin="round" opacity={sketch.tool === 'marker' ? .35 : 1}>
    {sketch.tool === 'text' ? <text x={a[0]} y={a[1]} fill={sketch.color} stroke="none" fontSize={Math.max(.3, sketch.size * 6)}>{sketch.text}</text> : <path d={strokePath(sketch.points)} />}
    {sketch.tool === 'arrow' && <path d={`M${b[0] - Math.cos(angle - .5) * arrow},${b[1] - Math.sin(angle - .5) * arrow}L${b[0]},${b[1]}L${b[0] - Math.cos(angle + .5) * arrow},${b[1] - Math.sin(angle + .5) * arrow}`} />}
  </g>;
}
export function PlanDrawing({ shot, options = defaultPlanOptions, selectedId, onObjectDown, onRename, labelScale = 1 }: { shot: Shot; options?: PlanOptions; selectedId?: string | null; labelScale?: number; onObjectDown?: (event: PointerEvent<SVGGElement>, object: StageObject) => void; onRename?: (object: StageObject) => void }) {
  const view = shot.plan.view; const startX = Math.floor(view.x - view.width / 2), startZ = Math.floor(view.z - view.width * .3); const step = view.width > 60 ? 5 : 1;
  const labels: {x:number;z:number;w:number}[]=[];
  return <g fontFamily="Segoe UI, Arial, sans-serif">
    {options.grid && <g stroke="#4a5657" strokeWidth=".015">{Array.from({ length: Math.ceil(view.width / step) + 2 }, (_, i) => <path key={`x${i}`} d={`M${startX + i * step},${startZ - 1}v${view.width}`} />)}{Array.from({ length: Math.ceil(view.width * .6 / step) + 2 }, (_, i) => <path key={`z${i}`} d={`M${startX - 1},${startZ + i * step}h${view.width + 2}`} />)}<path d={`M0,${startZ - 1}v${view.width}M${startX - 1},0h${view.width + 2}`} stroke="#8a8c76" strokeWidth=".025" /></g>}
    {options.scene && shot.objects.filter(o => o.visible).map(o => {
      const x = o.position[0], z = o.position[2], bounds = localBounds(o); const sx = Math.max(.25, (bounds.max.x - bounds.min.x) * Math.abs(o.scale[0])), sz = Math.max(.25, (bounds.max.z - bounds.min.z) * Math.abs(o.scale[2])); const camera = o.type === 'Camera'; const yaw = worldFacing(o); const selected = o.id === selectedId;
      const radians = yaw * Math.PI / 180; const forward = [Math.sin(radians), Math.cos(radians)];
      const spread = Math.atan(Math.tan(o.fov * Math.PI / 360) * shot.aspectRatio);
      const labelWidth=Math.max(.5,o.name.length*.16*labelScale);let labelY=-sz/2-.2;
      for(let attempt=0;attempt<8&&labels.some(p=>Math.abs(p.x-x)<(p.w+labelWidth)/2&&Math.abs(p.z-(z+labelY))<.4*labelScale);attempt++)labelY-=.42*labelScale;
      labels.push({x,z:z+labelY,w:labelWidth});
      return <g key={o.id} data-plan-object={o.id} transform={`translate(${x} ${z})`} onPointerDown={e => onObjectDown?.(e, o)} onDoubleClick={() => onRename?.(o)} style={{ cursor: o.locked ? 'default' : 'pointer' }}>
        {camera && options.frustum && <path data-frustum={o.id} d={`M0,0L${Math.sin(radians - spread) * 6},${Math.cos(radians - spread) * 6}L${Math.sin(radians + spread) * 6},${Math.cos(radians + spread) * 6}Z`} fill="#ddb5740c" stroke="#d2b57b" strokeWidth=".035" strokeDasharray=".12 .08" pointerEvents="none" />}
        <g transform={`rotate(${-o.rotation[1]})`} fill={selected ? '#bc9259' : o.type === 'Character' ? '#8ba99e' : o.type === 'Prop' ? '#c68e5c' : '#798b91'} stroke={selected ? '#ffe0a5' : '#c4cbc1'} strokeWidth={selected ? '.06' : '.025'}>
          {['Character', 'Sphere', 'Cylinder', 'Cone', 'Capsule'].includes(o.type) ? <ellipse rx={sx / 2} ry={sz / 2} /> : <rect x={-sx / 2} y={-sz / 2} width={sx} height={sz} rx=".04" />}
        </g>
        {(isLight(o) ? options.lightDirections : options.facing) && o.type !== 'PointLight' && <g stroke="#f3d299" strokeWidth=".045" fill="none" pointerEvents="none"><path d={`M0,0L${forward[0] * 1.15},${forward[1] * 1.15}`} /><path d={`M${forward[0] * .9 + forward[1] * .13},${forward[1] * .9 - forward[0] * .13}L${forward[0] * 1.15},${forward[1] * 1.15}L${forward[0] * .9 - forward[1] * .13},${forward[1] * .9 + forward[0] * .13}`} /><text x={forward[0]*1.25} y={forward[1]*1.25} fontSize={.2*labelScale} fill="#f3d299" stroke="none">{t(isLight(o) ? 'lightDirection' : o.type === 'Prop' ? 'frontDirection' : 'facingDirection')}</text></g>}
        {options.names && <g>{labelY < -sz/2-.3 && <path d={`M0,${-sz/2}L0,${labelY}`} stroke="#a7b8ae" strokeWidth=".02" pointerEvents="none" />}<text y={labelY} textAnchor="middle" fontSize={.28 * labelScale} fill="#ecdfc9" stroke="#293132" strokeWidth=".05" paintOrder="stroke" pointerEvents="none">{o.name}</text></g>}
        {shot.plan.showHeights && <text y={sz / 2 + .35} textAnchor="middle" fontSize={.23 * labelScale} fill="#b0c5bd" pointerEvents="none">{t('heightShort', { n: Number(o.position[1].toFixed(2)) })}</text>}
      </g>;
    })}
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
  const tool = settings.planTool; const setTool = (planTool: PlanTool) => useSettings.setState({ planTool });
  const [color, setColor] = useState('#e7b77b'), [size, setSize] = useState(.05), [draft, setDraft] = useState<Sketch | null>(null), [pointA, setPointA] = useState<MeasurePoint | null>(null);
  const gesture = useRef<{ kind: 'object' | 'pan' | 'sketch'; start: Point2; object?: StageObject; originalView?: Shot['plan']['view']; sketch?: Sketch } | null>(null);
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
    if (event.button === 1 || event.altKey) { event.preventDefault(); state.beginTransaction('transform'); gesture.current = { kind: 'pan', start: [event.clientX, event.clientY], originalView: shot.plan.view }; return; }
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
  const selected = shot.objects.find(o => o.id === state.selectedId);
  return <div className="plan-workspace"><div className="plan-tools">
    {(['select', 'measure', 'pen', 'marker', 'eraser', 'arrow', 'text'] as const).map(k => <button key={k} aria-pressed={tool === k} onClick={() => { setTool(k); setPointA(null); }}>{t(k)}</button>)}
    <input aria-label={t('brushColor')} type="color" value={color} onChange={e => setColor(e.target.value)} /><select aria-label={t('brushSize')} value={size} onChange={e => setSize(Number(e.target.value))}>{[.025, .05, .1].map(v => <option key={v} value={v}>{v} m</option>)}</select>
    <button aria-label={t('duplicateObject')} title={t('duplicateObject')} disabled={!selected || selected.type === 'Camera'} onClick={() => state.duplicateObject(selected!.id)}><Icon name="copy" size={13} /></button><button disabled={!selected} onClick={() => selected && rename(selected)}>{t('rename')}</button><button title={t('clearSketch')} aria-label={t('clearSketch')} onClick={() => state.updatePlan({ sketches: [] })}><Icon name="trash" size={13} /></button>
  </div><div className="plan-options"><label>{t('snapPosition')}<select aria-label={t('snapPosition')} value={settings.positionSnap} onChange={e => useSettings.setState({ positionSnap: Number(e.target.value) })}>{[0, .1, .5, 1].map(v => <option key={v} value={v}>{v ? `${v} m` : t('off')}</option>)}</select></label><label>{t('snapRotation')}<select aria-label={t('snapRotation')} value={settings.rotationSnap} onChange={e => useSettings.setState({ rotationSnap: Number(e.target.value) })}>{[0, 5, 15, 45].map(v => <option key={v} value={v}>{v ? `${v}°` : t('off')}</option>)}</select></label>{(['scene', 'measurements', 'sketch'] as const).map(k => <label key={k}><input type="checkbox" checked={shot.plan.layers[k]} onChange={() => state.updatePlan({ layers: { ...shot.plan.layers, [k]: !shot.plan.layers[k] } })} />{t(k)}</label>)}<label><input type="checkbox" checked={shot.plan.showHeights} onChange={() => state.updatePlan({ showHeights: !shot.plan.showHeights })} />{t('showHeights')}</label></div>
    <svg ref={svg} data-testid="plan-view" className="plan-svg" viewBox={planViewBox(shot)} onContextMenu={e => e.preventDefault()} onPointerDown={start} onPointerUp={finish} onPointerCancel={finish}
      onWheel={e => { const width = Math.max(4, Math.min(150, shot.plan.view.width * Math.exp(e.deltaY * .001))); state.updatePlan({ view: { ...shot.plan.view, width } }); }}
      onPointerMove={event => {
        const g = gesture.current; if (!g) return; const p = point(event);
        if (g.kind === 'pan') { const scale = g.originalView!.width / svg.current!.getBoundingClientRect().width; state.updatePlan({ view: { ...g.originalView!, x: g.originalView!.x - (event.clientX - g.start[0]) * scale, z: g.originalView!.z - (event.clientY - g.start[1]) * scale } }); }
        if (g.kind === 'object' && g.object) {
          const o = g.object;
          if (state.mode === 'rotate') { const startAngle = Math.atan2(g.start[0] - o.position[0], g.start[1] - o.position[2]); const angle = Math.atan2(p[0] - o.position[0], p[1] - o.position[2]); state.updateObject(o.id, { rotation: [o.rotation[0], snap(o.rotation[1] + (angle - startAngle) * 180 / Math.PI, settings.rotationSnap), o.rotation[2]] }); }
          else state.updateObject(o.id, { position: [snap(o.position[0] + p[0] - g.start[0], settings.positionSnap), o.position[1], snap(o.position[2] + p[1] - g.start[1], settings.positionSnap)] });
        }
        if (g.kind === 'sketch' && g.sketch) { g.sketch = { ...g.sketch, points: g.sketch.tool === 'arrow' ? [g.start, p] : [...g.sketch.points, p] }; setDraft(g.sketch); }
      }}>
      <PlanDrawing shot={shot} options={{ ...defaultPlanOptions, ...shot.plan.layers }} selectedId={state.selectedId} labelScale={Math.max(1, shot.plan.view.width * .6 / Math.max(viewportHeight, 1) * 11 / .28)} onRename={rename} onObjectDown={(event, o) => {
        if (tool !== 'select' || event.altKey || event.button !== 0) return;
        event.stopPropagation(); state.selectObject(o.id);
        if (o.locked || state.mode === 'select' || state.mode === 'scale') return;
        svg.current!.setPointerCapture(event.pointerId); state.beginTransaction('transform'); gesture.current = { kind: 'object', start: point(event), object: structuredClone(o) };
      }} />
      {draft && <SketchDrawing sketch={draft} />}{pointA && <circle cx={measurementPoint(pointA, shot).x} cy={measurementPoint(pointA, shot).z} r=".15" fill="#a5d8d2" />}
    </svg><div className="plan-footer"><span>{tool === 'measure' ? t('measureHelp') : t('planHelp')}</span>{shot.plan.measurements.length > 0 && <button onClick={() => state.updatePlan({ measurements: [] })}>{t('clearMeasurements')}</button>}</div>
  </div>;
}
