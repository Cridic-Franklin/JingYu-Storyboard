import { exportHeight } from './camera';
import { renderToStaticMarkup } from 'react-dom/server';
import type { CameraAnnotations, Overlay, Shot } from '../types';
import { CameraOverlayContent } from '../components/CameraOverlay';
import { PlanDrawing, planViewBox, type PlanOptions } from '../components/PlanView';
import { projectStorage } from '../storage/ProjectStorage';
export type CameraCapture = (width: number, height: number) => HTMLCanvasElement;
const captures = new Map<string, Set<CameraCapture>>();
export function registerCapture(id: string, fn: CameraCapture) { const entries = captures.get(id) ?? new Set<CameraCapture>(); entries.add(fn); captures.set(id, entries); return () => { entries.delete(fn); if (!entries.size) captures.delete(id); }; }
async function drawSvg(canvas: HTMLCanvasElement, svg: string) {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  try { const image = new Image(); await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Overlay could not be rasterized.')); image.src = url; }); canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height); }
  finally { URL.revokeObjectURL(url); }
}
function png(canvas: HTMLCanvasElement) { return new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('PNG encoding failed.')), 'image/png')); }
export async function cameraPNG(shot: Shot, width: number, annotations: CameraAnnotations, guides: Overlay[]): Promise<Blob> {
  const capture = [...(captures.get(shot.id) ?? [])].at(-1); if (!capture) throw new Error('Camera preview is not ready.');
  if (!Number.isInteger(width) || width < 320 || width > 7680) throw new Error('Width must be an integer between 320 and 7680.');
  const canvas = capture(width, exportHeight(width, shot.aspectRatio));
  if (Object.values(annotations).some(Boolean) || guides.length) await drawSvg(canvas, renderToStaticMarkup(<svg xmlns="http://www.w3.org/2000/svg" width={width} height={exportHeight(width, shot.aspectRatio)} viewBox={`0 0 1600 ${1600 / shot.aspectRatio}`} preserveAspectRatio="none"><CameraOverlayContent shot={shot} annotations={annotations} guides={guides} /></svg>));
  return png(canvas);
}
export async function planPNG(shot: Shot, options: PlanOptions, width = 1920): Promise<Blob> {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = Math.round(width * .6);
  const context = canvas.getContext('2d')!; context.fillStyle = '#293234'; context.fillRect(0, 0, canvas.width, canvas.height);
  await drawSvg(canvas, renderToStaticMarkup(<svg xmlns="http://www.w3.org/2000/svg" width={canvas.width} height={canvas.height} viewBox={planViewBox(shot)}><PlanDrawing shot={shot} options={options} editorColors={shot.useEditorColors} /></svg>));
  return png(canvas);
}
export async function copyPNG(blob: Promise<Blob>, filename: string): Promise<boolean> {
  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); return true; } catch { /* Downloads remain available in browsers without image clipboard permission. */ }
  }
  projectStorage.download(await blob, filename); return false;
}
