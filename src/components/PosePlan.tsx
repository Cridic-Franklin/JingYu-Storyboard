import { Vector3 } from 'three';
import type { StageObject } from '../types';
import { jointMatrices, joints, skeleton, makePose } from '../lib/pose';
import { objectMatrix, localBounds } from '../lib/scene';

export function ProjectedBounds({object}:{object:StageObject}) {
  const b=localBounds(object),m=objectMatrix(object),points:number[][]=[];
  for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){
    const p=new Vector3(x,y,z).applyMatrix4(m);points.push([p.x-object.position[0],p.z-object.position[2]]);
  }
  points.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  const cross=(a:number[],b:number[],c:number[])=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  const half=(input:number[][])=>{const h:number[][]=[];for(const p of input){while(h.length>=2&&cross(h.at(-2)!,h.at(-1)!,p)<=0)h.pop();h.push(p);}return h.slice(0,-1);};
  return <polygon data-asset-footprint={object.id} points={[...half(points),...half([...points].reverse())].map(p=>p.join(',')).join(' ')}/>;
}

// Top projections of the same articulated segments, expressed relative to object origin.
export function PosePlan({object}:{object:StageObject}) {
  const matrices=jointMatrices(object.pose??makePose()),world=objectMatrix(object);
  return <g data-pose-footprint={object.id}>{joints.map(k=>{
    const d=skeleton[k],m=world.clone().multiply(matrices[k]);
    const p=(y:number)=>new Vector3(d.center[0],y,d.center[2]).applyMatrix4(m).sub(new Vector3(...object.position));
    const a=p(d.center[1]-(d.size[1]-d.size[0])/2),b=p(d.center[1]+(d.size[1]-d.size[0])/2),r=d.size[0]*Math.max(Math.abs(object.scale[0]),Math.abs(object.scale[2]));
    return <g key={k}><path d={`M${a.x},${a.z}L${b.x},${b.z}`} stroke="currentColor" strokeWidth={r} strokeLinecap="round"/><circle cx={b.x} cy={b.z} r={r/2}/></g>;
  })}</g>;
}
