export interface SpiralGuide { corner: 'topLeft'|'topRight'|'bottomLeft'|'bottomRight'; mirror: boolean; x: number; y: number; scale: number }
export const defaultSpiral = (): SpiralGuide => ({corner:'topRight',mirror:false,x:0,y:0,scale:1});
export function spiralPath(width:number,height:number,guide:SpiralGuide=defaultSpiral()) {
  // Logarithmic golden spiral, radius grows by phi each quarter turn.
  // Uniform fit preserves its mathematics in every aspect ratio.
  const phi=(1+Math.sqrt(5))/2;
  const points=Array.from({length:241},(_,i)=>{const a=i/240*Math.PI*5,r=Math.exp(-a*Math.log(phi)/(Math.PI/2));return [Math.cos(a)*r,Math.sin(a)*r];});
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const fit=Math.min(width*.94/(maxX-minX),height*.94/(maxY-minY))*guide.scale;
  const flipX=(guide.corner.endsWith('Left')?1:-1)*(guide.mirror?-1:1),flipY=guide.corner.startsWith('bottom')?-1:1;
  return points.map(([x,y],i)=>`${i?'L':'M'}${width*(.5+guide.x)+(x-(minX+maxX)/2)*fit*flipX},${height*(.5+guide.y)+(y-(minY+maxY)/2)*fit*flipY}`).join(' ');
}
export function validateSpiral(value: unknown): SpiralGuide {
  if(value!==undefined && (!value || typeof value!=='object' || Array.isArray(value))) throw new Error('Invalid golden spiral settings.');
  const g={...defaultSpiral(),...(value as Partial<SpiralGuide>)};
  if(!['topLeft','topRight','bottomLeft','bottomRight'].includes(g.corner)||typeof g.mirror!=='boolean'||![g.x,g.y,g.scale].every(Number.isFinite)||Math.abs(g.x)>1||Math.abs(g.y)>1||g.scale<.1||g.scale>3) throw new Error('Invalid golden spiral settings.'); return g;
}
