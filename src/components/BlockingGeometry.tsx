import { createPortal, useThree } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import { BufferGeometry, Float32BufferAttribute, Group, MathUtils } from 'three';
import { Html, TransformControls } from '@react-three/drei';
import type { StageObject, Vec3 } from '../types';
import { joints, skeleton, makePose, type Joint } from '../lib/pose';
import { useSettings } from '../settings';
import { useStore } from '../store';
import { t } from '../i18n';

function PoseJoint({joint,object,material,editing}:{joint:Joint;object:StageObject;material:ReactNode;editing:boolean}) {
  const scene=useThree(s=>s.scene);
  const pose=object.pose??makePose(),d=skeleton[joint],ref=useRef<Group>(null!),dragging=useRef(false);
  const selected=useSettings(s=>s.poseJoint===joint),navigating=useSettings(s=>s.navigating);
  const update=()=>{if(!dragging.current)return;const current=useStore.getState().project.shots.find(s=>s.id===useStore.getState().project.activeShotId)?.objects.find(o=>o.id===object.id)?.pose??pose;useStore.getState().updateObject(object.id,{pose:{...current,basePreset:current.preset==='customPose'?current.basePreset:current.preset,preset:'customPose',joints:{...current.joints,[joint]:[ref.current.rotation.x,ref.current.rotation.y,ref.current.rotation.z].map(MathUtils.radToDeg) as Vec3}}});};
  useLayoutEffect(()=>{if(!dragging.current)ref.current.rotation.set(...pose.joints[joint].map(MathUtils.degToRad) as Vec3);},[pose.joints,joint]);
  return <><group ref={ref} name={`joint:${joint}`} position={d.offset}>
    <mesh position={d.center} castShadow receiveShadow>{d.shape==='sphere'?<sphereGeometry args={[d.size[0]/2,16,12]}/>:<capsuleGeometry args={[d.size[0]/2,d.size[1]-d.size[0],6,12]}/>}{material}</mesh>
    {joint.endsWith('Knee')&&<mesh position={[0,-.44,.08]} castShadow><boxGeometry args={[.18,.12,.3]}/>{material}</mesh>}
    {joint==='head'&&<mesh position={[0,0,.145]}><boxGeometry args={[.12,.055,.04]}/><meshStandardMaterial color="#374840"/></mesh>}
    {editing&&<mesh onClick={e=>{if(e.altKey||e.delta>3)return;e.stopPropagation();useSettings.setState({poseJoint:joint});}}><sphereGeometry args={[.07,10,8]}/><meshBasicMaterial color={selected?'#fff0be':'#e6a850'} depthTest={false}/></mesh>}
    {editing&&selected&&<Html center position={[.12,.08,0]} style={{pointerEvents:'none'}}><span className="object-label">{t(joint)}</span></Html>}
    {joints.filter(k=>skeleton[k].parent===joint).map(k=><PoseJoint key={k} joint={k} object={object} material={material} editing={editing}/>)}
  </group>{editing&&selected&&createPortal(<TransformControls object={ref} mode="rotate" space="local" size={.65} enabled={!navigating} onMouseDown={()=>{useStore.getState().beginTransaction('transform');dragging.current=true;}} onObjectChange={update} onMouseUp={()=>{update();dragging.current=false;useStore.getState().endTransaction('transform');}}/>,scene)}</>;
}
export function CharacterGeometry({object,material,editing=false}:{object:StageObject;material:ReactNode;editing?:boolean}) {
  return <group position={[0,(object.pose??makePose()).hipHeight,0]}>{joints.filter(k=>!skeleton[k].parent).map(k=><PoseJoint key={k} joint={k} object={object} material={material} editing={editing}/>)}</group>;
}
export function ObjGeometry({object,material}:{object:StageObject;material:ReactNode}) {
  const geometry=useMemo(()=>{const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(object.asset!.positions,3));g.computeVertexNormals();return g;},[object.asset]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  return <mesh geometry={geometry} castShadow receiveShadow>{material}</mesh>;
}
