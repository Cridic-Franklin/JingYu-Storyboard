import { useRef, useState } from 'react';
import { Vector3 } from 'three';
import { useSettings } from '../settings';
import { useStore } from '../store';
import { useT } from '../i18n';
import type { Shot, Vec3 } from '../types';
import { storyboardCamera } from '../lib/scene';
import { focusPosition } from '../lib/focus';

export function FocusDrawing({ shot, point = true, region = true }: { shot: Shot; point?: boolean; region?: boolean }) {
  const cam = shot.objects.find(o => o.type === 'Camera'); if (!cam) return null;
  const height = 1600 / shot.aspectRatio; const camera = storyboardCamera(cam, shot.aspectRatio), p = focusPosition(shot), r = shot.focus.region;
  const visible = p && p.clone().applyMatrix4(camera.matrixWorldInverse).z < -.1;
  p?.project(camera);
  return <g fill="none" stroke="#f0c789" strokeWidth="3">
    {point && shot.focus.showPoint && visible && <g data-focus-point="true" transform={`translate(${(p!.x + 1) * 800} ${(1 - p!.y) * height / 2})`}><circle r="12" /><path d="M-20 0h40M0 -20v40" /></g>}
    {region && shot.focus.showRegion && r && (r.shape === 'rectangle' ? <rect data-focus-region="true" x={r.x * 1600} y={r.y * height} width={r.width * 1600} height={r.height * height} strokeDasharray="10 5" /> : <ellipse data-focus-region="true" cx={(r.x + r.width / 2) * 1600} cy={(r.y + r.height / 2) * height} rx={r.width * 800} ry={r.height * height / 2} strokeDasharray="10 5" />)}
  </g>;
}
export function FocusInteraction({ shot }: { shot: Shot }) {
  const tool = useSettings(s => s.focusTool), t = useT(); const start = useRef<[number, number] | null>(null), [draft, setDraft] = useState<Shot['focus']['region']>(null);
  if (!tool) return null;
  const coordinate = (e: React.PointerEvent<SVGSVGElement>): [number, number] => { const b = e.currentTarget.getBoundingClientRect(); return [Math.max(0, Math.min(1, (e.clientX - b.x) / b.width)), Math.max(0, Math.min(1, (e.clientY - b.y) / b.height))]; };
  const finish = () => { start.current = null; setDraft(null); useSettings.setState({ focusTool: null }); };
  return <><svg className="focus-interaction" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-label={t('drawFocus')} onPointerDown={e => { if (e.button !== 0) return; e.currentTarget.setPointerCapture(e.pointerId); start.current = coordinate(e); }} onPointerMove={e => { if (!start.current || tool === 'point') return; const [x,y] = coordinate(e), [a,b] = start.current; setDraft({ shape: tool, x: Math.min(x,a), y: Math.min(y,b), width: Math.abs(x-a), height: Math.abs(y-b), label: shot.focus.region?.label ?? '' }); }} onPointerUp={e => {
    if (!start.current) return;
    if (tool === 'point') { const cam = shot.objects.find(o => o.type === 'Camera'); if (cam) { const camera = storyboardCamera(cam, shot.aspectRatio); const [x,y] = coordinate(e); const ray = new Vector3(x*2-1,1-y*2,.5).unproject(camera).sub(camera.position).normalize(); const forward = new Vector3(0,0,-1).applyQuaternion(camera.quaternion); const point = camera.position.clone().addScaledVector(ray,shot.focus.pickDistance / ray.dot(forward)).toArray() as Vec3; useStore.getState().updateShot({ focus: { ...shot.focus, point, targetId: null } }); } }
    else if (draft && draft.width > .005 && draft.height > .005) useStore.getState().updateShot({ focus: { ...shot.focus, region: draft } });
    finish();
  }} onPointerCancel={finish}>{draft && <rect x={draft.x*1600} y={draft.y*900} width={draft.width*1600} height={draft.height*900} fill="#e9c38922" stroke="#e9c389" strokeWidth="3" />}</svg><button className="focus-cancel" onClick={finish}>{t('drawFocus')} · {t('cancel')}</button></>;
}
