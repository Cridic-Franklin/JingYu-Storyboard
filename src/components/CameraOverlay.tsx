import type { CameraAnnotations, Overlay, Shot } from '../types';
import { localBounds, objectMatrix, storyboardCamera } from '../lib/scene';
import { measurementPoint, semanticForward, shotSpatialData } from '../lib/spatial';
import { Vector3 } from 'three';
import { t } from '../i18n';
export function CameraOverlayContent({ shot, annotations = shot.annotations, guides = shot.overlays }: { shot: Shot; annotations?: CameraAnnotations; guides?: Overlay[] }) {
  const data = shotSpatialData(shot); const camObject = shot.objects.find(o => o.type === 'Camera');
  if (!camObject) return null;
  const camera = storyboardCamera(camObject);
  const placed: { x: number; y: number }[] = [];
  return <g fill="none" stroke="#efd5a5" strokeWidth="2">
    {guides.includes('thirds') && <path data-overlay="thirds" stroke="#f4f1de88" d="M533 0v900M1067 0v900M0 300h1600M0 600h1600" />}
    {guides.includes('cross') && <path data-overlay="cross" d="M770 450h60M800 420v60" />}
    {guides.includes('safe') && <rect data-overlay="safe" x="80" y="45" width="1440" height="810" strokeDasharray="12 8" />}
    {guides.includes('spiral') && <path data-overlay="spiral" strokeWidth="3" d="M80 810C80 380 390 70 820 70S1520 330 1520 590 1340 840 1160 840 940 710 940 590 1020 440 1110 440 1220 490 1220 555 1180 635 1135 635 1080 600 1080 567 1100 527 1128 527" />}
    {data.objects.filter(o => o.screen.status === 'visible').map(info => {
      const o = shot.objects.find(o => o.id === info.id)!; const s = info.screen;
      const x = s.x! * 16, y = s.y! * 9, w = s.width! * 16, h = s.height! * 9;
      const line: string[] = []; if (annotations.names) line.push(o.name); if (annotations.types) line.push(t(o.type)); if (annotations.coordinates) line.push(`X ${Math.round(s.x!)}% · Y ${Math.round(s.y!)}%`);
      const labelWidth = Math.min(310, Math.max(0, ...line.map(l => l.length)) * 12 + 18);
      let lx = x + w / 2 + 12 + labelWidth < 1592 ? x + w / 2 + 12 : Math.max(8, x - w / 2 - labelWidth - 12), ly = Math.max(26, Math.min(810, y - h / 2));
      for (const p of placed) if (Math.abs(p.x - lx) < 280 && Math.abs(p.y - ly) < 78) ly = Math.min(810, p.y + 82);
      placed.push({ x: lx, y: ly });
      const center = localBounds(o).getCenter(new Vector3()).applyMatrix4(objectMatrix(o));
      const arrow = center.clone().addScaledVector(semanticForward(o), 0.7).project(camera);
      let dx = (arrow.x + 1) * 800 - x, dy = (1 - arrow.y) * 450 - y; const length = Math.hypot(dx, dy);
      if (length > 0.001) { dx = dx / length * 65; dy = dy / length * 65; }
      const showArrow = o.type === 'Prop' ? annotations.front : annotations.facing;
      return <g key={o.id} data-annotation-object={o.id}>
        {annotations.bounds && <rect x={x - w / 2} y={y - h / 2} width={w} height={h} strokeDasharray="7 5" />}
        {line.length > 0 && <g><path d={`M${x + w / 2},${y - h / 2}L${lx},${ly}`} strokeOpacity="0.6" /><rect x={lx - 5} y={ly - 23} width={Math.min(310, Math.max(...line.map(l => l.length)) * 12 + 18)} height={line.length * 26 + 8} rx="4" fill="#182221e8" stroke="none" />{line.map((text, i) => <text key={i} x={lx} y={ly + i * 26} fill="#ffe6b8" stroke="none" fontFamily="Segoe UI, Arial, sans-serif" fontSize="22">{text}</text>)}</g>}
        {showArrow && <g><path d={`M${x},${y}l${dx},${dy}`} strokeWidth="4" /><path d={`M${x + dx - dx * .2 + dy * .12},${y + dy - dy * .2 - dx * .12}L${x + dx},${y + dy}L${x + dx - dx * .2 - dy * .12},${y + dy - dy * .2 + dx * .12}`} strokeWidth="4" /><text x={x + 12} y={y + 30} fontFamily="Segoe UI, Arial, sans-serif" fontSize="19" fill="#ffe6b8" stroke="none">{o.type === 'Prop' ? o.frontLabel : t(info.front.screenFacing!)}</text></g>}
      </g>;
    })}
    {annotations.measurements && shot.plan.measurements.map(m => {
      const a = measurementPoint(m.a, shot), b = measurementPoint(m.b, shot); const distance = a.distanceTo(b);
      if ([a, b].some(p => p.clone().applyMatrix4(camera.matrixWorldInverse).z >= -0.1)) return null;
      a.project(camera); b.project(camera); const x1 = (a.x + 1) * 800, y1 = (1 - a.y) * 450, x2 = (b.x + 1) * 800, y2 = (1 - b.y) * 450;
      return <g key={m.id}><path d={`M${x1},${y1}L${x2},${y2}`} strokeDasharray="7 4" /><text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 10} fontSize="22" fill="#fff0ca" stroke="none">{distance.toFixed(2)} m</text></g>;
    })}
  </g>;
}
