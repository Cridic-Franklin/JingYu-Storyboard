import { CharacterGeometry, ObjGeometry } from './BlockingGeometry';
import { isLight } from '../types';
import { FocusDrawing, FocusInteraction } from './FocusOverlay';
import { fovToLens, ratioLabel } from '../lib/camera';
import { Component, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Grid, Html, Line, TransformControls } from '@react-three/drei';
import { CatmullRomCurve3, Group, MathUtils, PerspectiveCamera, Vector2, Vector3, Object3D } from 'three';
import { localBounds, toRadians } from '../lib/scene';
import { useSettings } from '../settings';
import { t, useT } from '../i18n';
import { ViewportNavigation } from './ViewportNavigation';
import { useStore } from '../store';
import type { Shot, StageObject, Vec3, CameraAnnotations, MotionPath, PathPoint } from '../types';
import { Icon } from './Icon';
import { registerCapture } from '../lib/export';
import { CameraOverlayContent } from './CameraOverlay';

class ViewErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div className="empty-state">{t('webglError')}</div> : this.props.children; }
}

function StoryboardPrimitive({ object, material }: { object: StageObject; material: ReactNode }) {
  const box=(key:string,p:Vec3,s:Vec3)=><mesh key={key} position={p} castShadow receiveShadow><boxGeometry args={s}/>{material}</mesh>;
  let parts:ReactNode[]=[];
  if(object.type==='Chair')parts=[box('seat',[0,.48,0],[.85,.12,.85]),box('back',[0,.78,-.38],[.85,.65,.12]),...[-.34,.34].flatMap((x,i)=>[-.34,.34].map((z,j)=>box(`l${i}${j}`,[x,.23,z],[.1,.46,.1])))];
  if(['Table','Desk'].includes(object.type))parts=[box('top',[0,.73,0],[object.type==='Desk'?2.2:2,.14,1.3]),...[-.82,.82].flatMap((x,i)=>[-.48,.48].map((z,j)=>box(`l${i}${j}`,[x,.34,z],[.12,.68,.12])))];
  if(object.type==='Sofa')parts=[box('base',[0,.3,0],[2.4,.6,1]),box('back',[0,.7,-.43],[2.4,.8,.16]),box('left',[-1.08,.55,0],[.24,.5,1]),box('right',[1.08,.55,0],[.24,.5,1])];
  if(object.type==='Bed')parts=[box('base',[0,.28,0],[2,.56,4]),box('head',[0,.75,-1.9],[2,1.5,.18]),box('pillow',[0,.62,-1.35],[1.4,.14,.55])];
  if(object.type==='Wall')parts=[box('wall',[0,1.4,0],[4,2.8,.2])];
  if(object.type==='Door')parts=[box('door',[0,1.05,0],[1,2.1,.16]),<mesh key="handle" position={[.34,1.05,.12]}><sphereGeometry args={[.06,8,6]}/><meshStandardMaterial color="#D6A84F"/></mesh>];
  if(object.type==='Window')parts=[box('top',[0,1.95,0],[1.6,.1,.16]),box('bottom',[0,.85,0],[1.6,.1,.16]),box('left',[-.75,1.4,0],[.1,1,.16]),box('right',[.75,1.4,0],[.1,1,.16]),box('mid',[0,1.4,0],[.08,1,.16])];
  if(object.type==='Stairs')parts=Array.from({length:6},(_,i)=>box(`s${i}`,[0,(i+1)*.125,-1.25+i*.5],[2,(i+1)*.25,.5]));
  if(['Car','Van'].includes(object.type)){const van=object.type==='Van';parts=[box('body',[0,.58,0],[2,van?1.15:.72,4.2]),box('cab',[0,van?1.42:.98,van ? .55 : .25],[1.76,van?1.5:.72,van?2.35:1.75]),box('hood',[0,.84,1.55],[1.78,.32,.75]),box('rear',[0,.79,-1.72],[1.84,.35,.5]),...[-.9,.9].flatMap((x,i)=>[-1.42,1.42].map((z,j)=><mesh key={`w${i}${j}`} position={[x,.38,z]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.35,.35,.2,12]}/><meshStandardMaterial color="#20272b"/></mesh>))];}
  if(object.type==='Motorcycle')parts=[
    ...[-.82,.82].map((z,i)=><mesh key={`wheel${i}`} position={[0,.42,z]} rotation={[0,0,Math.PI/2]}><torusGeometry args={[.36,.075,6,14]}/><meshStandardMaterial color="#20272b"/></mesh>),
    <mesh key="frame" position={[0,.63,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.48,.055,5,3]}/>{material}</mesh>,
    box('seat',[0,.88,-.28],[.38,.12,.62]),box('tank',[0,.85,.18],[.45,.32,.5]),box('fork',[0,.67,.68],[.08,.75,.08]),
    box('handlebar',[0,.99,.58],[.75,.06,.06]),box('headlamp',[0,.82,.7],[.24,.24,.16]),box('tail',[0,.77,-.72],[.3,.12,.2])
  ];
  if(object.type==='Box')parts=[box('box',[0,.5,0],[1,1,1])];
  if(object.type==='Shelf')parts=[box('left',[-.55,1,0],[.1,2,.45]),box('right',[.55,1,0],[.1,2,.45]),...[.05,.65,1.25,1.9].map((y,i)=>box(`sh${i}`,[0,y,0],[1.2,.1,.45]))];
  if(object.type==='Monitor')parts=[box('screen',[0,1,0],[1.25,.75,.12]),box('stem',[0,.48,0],[.12,.55,.12]),box('foot',[0,.18,0],[.65,.08,.4])];
  if(object.type==='Lamp')parts=[<mesh key="shade" position={[0,1.35,0]}><coneGeometry args={[.42,.6,12,1,true]}/>{material}</mesh>,box('stem',[0,.7,0],[.08,1.1,.08]),<mesh key="base" position={[0,.12,0]}><cylinderGeometry args={[.35,.35,.12,16]}/>{material}</mesh>];
  return <group>{parts}<mesh position={[0,.08,localBounds(object).max.z+.03]}><boxGeometry args={[.24,.05,.05]}/><meshBasicMaterial color="#41C6CE"/></mesh></group>;
}

function Geometry({ object, selected = false, editorColors = true, editing = false }: { object: StageObject; selected?: boolean; editorColors?: boolean; editing?: boolean }) {
  const selectedColor=object.type==='Camera'?'#D6A84F':'#41C6CE';
  const color = editorColors && object.displayColor ? object.displayColor : selected ? selectedColor : object.type === 'Character' ? '#a0b6af' : object.type === 'Prop' ? '#ca8b58' : '#8c969c';
  const material = <meshStandardMaterial color={color} roughness={0.75} emissive={selected ? '#503714' : '#000000'} emissiveIntensity={0.25} />;
  if (isLight(object)) return <group><mesh><sphereGeometry args={[.17,12,8]} /><meshBasicMaterial color={object.light?.color ?? '#ffe5a0'} /></mesh>{object.type !== 'PointLight' && <group rotation={[Math.PI/2,0,0]}><mesh position={[0,.55,0]}><cylinderGeometry args={[.025,.025,1,8]} /><meshBasicMaterial color="#e9cf85" /></mesh><mesh position={[0,1.1,0]}><coneGeometry args={[.12,.25,8]} /><meshBasicMaterial color="#e9cf85" /></mesh></group>}</group>;
  if (object.type === 'Character') return <CharacterGeometry object={object} material={material} editing={editing} />;
  if (object.type === 'OBJ' && object.asset) return <ObjGeometry object={object} material={material} />;
  if (['Chair','Table','Desk','Sofa','Bed','Wall','Door','Window','Stairs','Car','Van','Motorcycle','Box','Shelf','Monitor','Lamp'].includes(object.type)) return <StoryboardPrimitive object={object} material={material} />;
  if (object.type === 'Prop') return <group>
    <mesh position={[0, 0.19, 0]} castShadow><cylinderGeometry args={[0.22, 0.3, 0.38, 24]} />{material}</mesh>
    <mesh position={[0, 0.56, 0]} castShadow><cylinderGeometry args={[0.18, 0.22, 0.36, 24]} /><meshStandardMaterial color={selected ? '#ffd399' : '#e4ad6d'} emissive="#c17428" emissiveIntensity={0.25} /></mesh>
    <mesh position={[0, 0.78, 0]} castShadow><sphereGeometry args={[0.18, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />{material}</mesh>
    <group rotation={[0, (object.frontYaw || 0) * Math.PI / 180, 0]}><mesh position={[0, 0.23, 0.255]}><boxGeometry args={[0.12, 0.12, 0.035]} /><meshStandardMaterial color="#292d2c" /></mesh></group>
  </group>;
  if (object.type === 'Plane') return <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow><planeGeometry args={[3, 3]} /><meshStandardMaterial color={color} side={2} /></mesh>;
  if (object.type === 'Sphere') return <mesh position={[0, 0.5, 0]} castShadow receiveShadow><sphereGeometry args={[0.5, 24, 16]} />{material}</mesh>;
  if (object.type === 'Cylinder') return <mesh position={[0, 0.5, 0]} castShadow receiveShadow><cylinderGeometry args={[0.5, 0.5, 1, 24]} />{material}</mesh>;
  if (object.type === 'Capsule') return <mesh position={[0, 0.75, 0]} castShadow receiveShadow><capsuleGeometry args={[0.3, 0.9, 8, 16]} />{material}</mesh>;
  if (object.type === 'Cone') return <mesh position={[0, 0.5, 0]} castShadow receiveShadow><coneGeometry args={[0.5, 1, 24]} />{material}</mesh>;
  if (object.type === 'Camera') return <group>
    <mesh castShadow><boxGeometry args={[0.55, 0.38, 0.34]} /><meshStandardMaterial color={selected ? '#D6A84F' : '#c4c9cb'} /></mesh>
    <mesh position={[0, 0, -0.3]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.2, 0.13, 0.3, 20]} />{material}</mesh>
    <mesh position={[0, 0.29, 0]}><boxGeometry args={[0.24, 0.16, 0.2]} />{material}</mesh>
  </group>;
  return <mesh position={[0, 0.5, 0]} castShadow receiveShadow><boxGeometry args={[1, 1, 1]} />{material}</mesh>;
}

function EditableObject({ object }: { object: StageObject }) {
  const group = useRef<Group>(null!);
  const dragging = useRef(false);
  const selected = useStore(s => s.selectedId === object.id);
  const mode = useStore(s => s.mode);
  const poseMode = useSettings(s => s.poseMode);
  const showLabels = useSettings(s => s.showLabels);
  const navigating = useSettings(s => s.navigating);
  const editingPathPoint = useSettings(s => Boolean(s.selectedPathPointId));
  const update = () => {
    if (!group.current || !dragging.current) return;
    const g = group.current;
    useStore.getState().updateObject(object.id, {
      position: g.position.toArray() as Vec3,
      rotation: [g.rotation.x, g.rotation.y, g.rotation.z].map(MathUtils.radToDeg) as Vec3,
      scale: g.scale.toArray() as Vec3,
    });
  };
  useLayoutEffect(() => {
    if (dragging.current) return;
    group.current.position.fromArray(object.position);
    group.current.rotation.set(...toRadians(object.rotation));
    group.current.scale.fromArray(object.scale);
  }, [object.position, object.rotation, object.scale]);
  return <>
    <group ref={group} name={object.id} visible={object.visible} onClick={event => { if (event.altKey || event.delta > 3) return; event.stopPropagation(); useStore.getState().selectObject(object.id); }}>
      <Geometry object={object} selected={selected} editing={selected && poseMode && !object.locked && object.visible} />
      {showLabels && object.visible && <Html position={[0, localBounds(object).max.y + 0.25, 0]} center style={{ pointerEvents: 'none' }} zIndexRange={[5, 0]}><span className="object-label">{object.name}</span></Html>}
      {selected && object.type !== 'Camera' && <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.45, 0.48, 48]} /><meshBasicMaterial color="#41C6CE" depthWrite={false} /></mesh>}
    </group>
    {selected && !editingPathPoint && !(poseMode && object.type === 'Character') && object.visible && !object.locked && mode !== 'select' && <TransformControls object={group} enabled={!navigating} mode={mode} size={0.85} onMouseDown={() => { useStore.getState().beginTransaction('transform'); dragging.current = true; }} onObjectChange={update} onMouseUp={() => { update(); dragging.current = false; useStore.getState().endTransaction('transform'); }} />}
  </>;
}

function SceneLight({ object }: { object: StageObject }) {
  const target = useMemo(() => new Object3D(), []), light = object.light!;
  return <group position={object.position} rotation={toRadians(object.rotation)}><primitive object={target} position={[0,0,1]} />
  {object.type === 'DirectionalLight' ? <directionalLight target={target} intensity={light.intensity} color={light.color} castShadow={light.castShadow} shadow-mapSize={[1024,1024]} shadow-camera-left={-15} shadow-camera-right={15} shadow-camera-top={15} shadow-camera-bottom={-15} shadow-bias={-.001} /> : object.type === 'SpotLight' ? <spotLight target={target} intensity={light.intensity} color={light.color} distance={light.range} angle={light.coneAngle*Math.PI/360} castShadow={light.castShadow} /> : <pointLight intensity={light.intensity} color={light.color} distance={light.range} castShadow={light.castShadow} />}</group>;
}
function Lighting({ shot }: { shot: Shot }) {
  return <><ambientLight intensity={shot.environment.intensity} color={shot.environment.color} />{shot.environment.defaultRig && <DefaultRig />}{shot.objects.filter(o => o.visible && isLight(o) && o.light).map(o => <SceneLight key={o.id} object={o} />)}</>;
}
function DefaultRig() {
  return <><hemisphereLight args={['#d6e5ed', '#494239', 1.5]} /><directionalLight position={[4, 9, 6]} intensity={2.5} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-15} shadow-camera-right={15} shadow-camera-top={15} shadow-camera-bottom={-15} shadow-bias={-0.001} /></>;
}
function Ground({ editor = false }: { editor?: boolean }) {
  return <><mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, 0]} receiveShadow><planeGeometry args={[200, 200]} /><meshStandardMaterial color={editor ? '#303538' : '#535b5b'} roughness={1} /></mesh>
    {editor && <Grid infiniteGrid cellSize={1} sectionSize={5} cellThickness={0.55} sectionThickness={0.9} cellColor="#555e61" sectionColor="#768078" fadeDistance={40} fadeStrength={1.5} position={[0, 0.002, 0]} />}</>;
}
function PathPointHandle({path,point,color}:{path:MotionPath;point:PathPoint;color:string}){
  const ref=useRef<Group>(null!),dragging=useRef(false),selected=useSettings(s=>s.selectedPathPointId===point.id),navigating=useSettings(s=>s.navigating);
  useLayoutEffect(()=>{if(!dragging.current)ref.current.position.fromArray(point.position);},[point.position]);
  const update=()=>{if(!dragging.current)return;const state=useStore.getState(),shot=state.project.shots.find(item=>item.id===state.project.activeShotId);if(!shot)return;state.updateShot({motionPaths:shot.motionPaths.map(item=>item.id===path.id?{...item,points:item.points.map(p=>p.id===point.id?{...p,position:ref.current.position.toArray() as Vec3}:p)}:item)});};
  return <><group ref={ref} position={point.position}><mesh data-path-point={point.id} onClick={event=>{event.stopPropagation();useStore.getState().selectObject(path.objectId);useStore.getState().setMode('select');useSettings.setState({selectedPathId:path.id,selectedPathPointId:point.id});}}><sphereGeometry args={[selected ? .16 : .11,12,8]}/><meshBasicMaterial color={selected?'#F1F5F7':color}/></mesh>{selected&&<mesh rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.2,.23,24]}/><meshBasicMaterial color={color} depthTest={false}/></mesh>}</group>{selected&&<TransformControls object={ref} enabled={!navigating} mode="translate" size={.65} onMouseDown={()=>{useStore.getState().beginTransaction('transform');dragging.current=true;}} onObjectChange={update} onMouseUp={()=>{update();dragging.current=false;useStore.getState().endTransaction('transform');}}/>}</>;
}
function MotionPaths3D({shot}:{shot:Shot}){
  const selectedPath=useSettings(s=>s.selectedPathId);
  return <>{shot.motionPaths.filter(path=>path.visible&&path.points.length>1).map(path=>{const object=shot.objects.find(o=>o.id===path.objectId),color=object?.type==='Camera'?'#D6A84F':'#41C6CE',selected=selectedPath===path.id;const raw=path.points.map(point=>new Vector3(...point.position));const points=path.smooth&&raw.length>2?new CatmullRomCurve3(raw).getPoints(Math.max(24,raw.length*12)):raw;return <group key={path.id}><Line points={points} color={color} lineWidth={selected?3:1.35} transparent opacity={selected?1:.48} onClick={event=>{event.stopPropagation();useStore.getState().selectObject(path.objectId);useSettings.setState({selectedPathId:path.id,selectedPathPointId:null});}}/>{path.points.map(point=><PathPointHandle key={point.id} path={path} point={point} color={color}/>)}</group>;})}</>;
}
function PreviewCamera({ cameraObject, aspect }: { cameraObject: StageObject; aspect: number }) {
  const { camera } = useThree();
  useLayoutEffect(() => {
    const cam = camera as PerspectiveCamera;
    cam.position.fromArray(cameraObject.position); cam.rotation.set(...toRadians(cameraObject.rotation));
    cam.aspect = aspect; cam.fov = cameraObject.fov; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  }, [camera, cameraObject, aspect]);
  return null;
}
function CaptureBridge({ shotId }: { shotId: string }) {
  const { gl, scene, camera } = useThree();
  useLayoutEffect(() => registerCapture(shotId, (width, height) => {
    if (width > gl.capabilities.maxTextureSize || height > gl.capabilities.maxTextureSize) throw new Error('Requested resolution exceeds this device limit.');
    const size = gl.getSize(new Vector2()), ratio = gl.getPixelRatio();
    try {
      gl.setPixelRatio(1); gl.setSize(width, height, false); gl.render(scene, camera);
      const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
      canvas.getContext('2d')!.drawImage(gl.domElement, 0, 0); return canvas;
    } finally { gl.setPixelRatio(ratio); gl.setSize(size.x, size.y, false); gl.render(scene, camera); }
  }), [gl, scene, camera, shotId]);
  return null;
}
export function SpatialEditor({ shot }: { shot: Shot }) {
  const t = useT();
  const [viewKey, resetView] = useState(0);
  return <div className="editor-canvas">
    <ViewErrorBoundary><Canvas key={`${shot.id}-${viewKey}`} shadows dpr={[1, 1.6]} camera={{ position: [8, 6, 10], fov: 48, near: 0.1, far: 200 }} onPointerMissed={event => { if (event.type === 'click' && !event.altKey) useStore.getState().selectObject(null); }}>
      <color attach="background" args={['#303538']} /><fog attach="fog" args={['#303538', 30, 75]} />
      <Lighting shot={shot} /><Ground editor />
      {shot.objects.map(o => <EditableObject key={o.id} object={o} />)}
      <MotionPaths3D shot={shot}/>
      <ViewportNavigation />
    </Canvas></ViewErrorBoundary>
    <div className="viewport-label"><span className="live-dot" /> {t('perspective')} <span className="muted">/</span> {t('meters')}</div>
    <button className="reset-view icon-button" title={t('resetView')} aria-label={t('resetView')} onClick={() => resetView(v => v + 1)}><Icon name="reset" /></button>
    <div className="axis-guide"><span className="axis-y">Y</span><span className="axis-z">Z</span><span className="axis-x">X</span><i /></div>
    <div className="viewport-help">{t('navigation')}</div>
    <div className="viewport-scale">{t('unit')}</div>
  </div>;
}
export function CameraPreview({ shot, annotations }: { shot: Shot; annotations?: CameraAnnotations }) {
  const t = useT(); const frameRef = useRef<HTMLDivElement>(null); const [frameWidth,setFrameWidth]=useState(1600);
  useLayoutEffect(()=>{const observer=new ResizeObserver(entries=>setFrameWidth(entries[0].contentRect.width));if(frameRef.current)observer.observe(frameRef.current);return()=>observer.disconnect();},[]);
  const camera = shot.objects.find(o => o.type === 'Camera');
  return <div className="preview-surround"><div ref={frameRef} className="preview-frame" data-testid="camera-preview" style={{ '--shot-aspect': shot.aspectRatio } as CSSProperties}>
    {camera ? <ViewErrorBoundary><Canvas shadows gl={{ preserveDrawingBuffer: true }} dpr={[1, 1.6]} camera={{ fov: camera.fov, near: 0.1, far: 200 }}>
      <color attach="background" args={['#747e7e']} /><fog attach="fog" args={['#747e7e', 25, 90]} /><Lighting shot={shot} /><Ground />
      <PreviewCamera aspect={shot.aspectRatio} cameraObject={camera} /><CaptureBridge shotId={shot.id} />
      {shot.objects.filter(o => o.type !== 'Camera' && !isLight(o) && o.visible).map(o => <group key={o.id} position={o.position} rotation={toRadians(o.rotation)} scale={o.scale}><Geometry object={o} editorColors={shot.useEditorColors} /></group>)}
    </Canvas></ViewErrorBoundary> : <div className="empty-state">{t('missingCamera')}</div>}
    {camera && <svg className="composition-overlay" viewBox={`0 0 1600 ${1600 / shot.aspectRatio}`} preserveAspectRatio="none" aria-label={t('compositionGuides')}>
      <CameraOverlayContent labelScale={Math.max(1, Math.min(2,1600 / Math.max(1,frameWidth) * 10 / 22))} shot={shot} annotations={annotations} />{!annotations && <FocusDrawing shot={shot} />}
    </svg>}
    <FocusInteraction shot={shot} /><span className="frame-shot">{String(shot.number).padStart(3, '0')}</span>{camera&&<span className="frame-lens">{fovToLens(camera.fov).toFixed(0)} mm</span>}<span className="frame-ratio">{ratioLabel(shot.aspectRatio)}</span>
  </div></div>;
}
