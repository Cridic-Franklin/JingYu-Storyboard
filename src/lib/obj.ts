import { Box3, Vector3 } from 'three';
export interface ObjAsset { format: 'obj'; filename: string; positions: number[] }
export const maxObjVertices = 300000;
export function validateObj(value: unknown): ObjAsset {
  const a=value as ObjAsset;
  if (!a || a.format!=='obj' || typeof a.filename!=='string' || !Array.isArray(a.positions) || a.positions.length<9 || a.positions.length%9 || a.positions.length>maxObjVertices*3 || a.positions.some(n=>!Number.isFinite(n)||Math.abs(n)>=1e6)) throw new Error('Invalid embedded OBJ geometry. Original project was retained.');
  return a;
}
// Portable triangle soup: no file paths, network requests, textures or executable data.
export function parseObj(source: string, filename: string): ObjAsset {
  if (source.length>20*1024*1024) throw new Error('OBJ exceeds 20 MB.');
  const vertices: number[][]=[], positions: number[]=[];
  for (const line of source.split(/\r?\n/)) {
    const [kind,...values]=line.split('#')[0].trim().split(/\s+/);
    if (kind==='v') {
      const v=values.slice(0,3).map(Number);
      if(v.length!==3 || v.some(n=>!Number.isFinite(n)||Math.abs(n)>=1e6)) throw new Error('Invalid OBJ vertex.');
      vertices.push(v);
    }
    if (kind==='f') {
      if(values.length<3) throw new Error('Invalid OBJ face.');
      const face=values.map(v=>{ const i=Number(v.split('/')[0]); const point=vertices[i<0?vertices.length+i:i-1]; if(!Number.isInteger(i)||i===0||!point) throw new Error('Invalid OBJ index.'); return point; });
      for(let i=1;i<face.length-1;i++) { positions.push(...face[0],...face[i],...face[i+1]); if(positions.length>maxObjVertices*3) throw new Error('OBJ exceeds 100,000 triangles.'); }
    }
  }
  return validateObj({format:'obj',filename:filename.split(/[\\/]/).at(-1)??'asset.obj',positions});
}
const cachedBounds=new WeakMap<ObjAsset,Box3>();
export function objBounds(asset: ObjAsset) {
  const cached=cachedBounds.get(asset); if(cached) return cached.clone();
  const b=new Box3(); for(let i=0;i<asset.positions.length;i+=3) b.expandByPoint(new Vector3(...asset.positions.slice(i,i+3) as [number,number,number])); cachedBounds.set(asset,b); return b.clone();
}
