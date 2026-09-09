import { isLight } from '../types';
import { FocusDrawing, FocusInteraction } from './FocusOverlay';
import { ratioLabel } from '../lib/camera';
import { Component, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Grid, Html, TransformControls } from '@react-three/drei';
import { Group, MathUtils, PerspectiveCamera, Vector2, Object3D } from 'three';
import { localBounds, toRadians } from '../lib/scene';
import { useSettings } from '../settings';
import { t, useT } from '../i18n';
import { ViewportNavigation } from './ViewportNavigation';
import { useStore } from '../store';
import type { Shot, StageObject, Vec3, CameraAnnotations } from '../types';
import { Icon } from './Icon';
import { registerCapture } from '../lib/export';
import { CameraOverlayContent } from './CameraOverlay';

class ViewErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div className="empty-state">{t('webglError')}</div> : this.props.children; }
}

function Geometry({ object, selected = false }: { object: StageObject; selected?: boolean }) {
  const color = selected ? '#e5b574' : object.type === 'Character' ? '#a0b6af' : object.type === 'Prop' ? '#ca8b58' : '#8c969c';
  const material = <meshStandardMaterial color={color} roughness={0.75} emissive={selected ? '#503714' : '#000000'} emissiveIntensity={0.25} />;
  if (isLight(object)) return <group><mesh><sphereGeometry args={[.17,12,8]} /><meshBasicMaterial color={object.light?.color ?? '#ffe5a0'} /></mesh>{object.type !== 'PointLight' && <group rotation={[Math.PI/2,0,0]}><mesh position={[0,.55,0]}><cylinderGeometry args={[.025,.025,1,8]} /><meshBasicMaterial color="#e9cf85" /></mesh><mesh position={[0,1.1,0]}><coneGeometry args={[.12,.25,8]} /><meshBasicMaterial color="#e9cf85" /></mesh></group>}</group>;
  if (object.type === 'Character') return <group>
    <mesh position={[0, 1.62, 0]} castShadow><sphereGeometry args={[0.15, 20, 16]} />{material}</mesh>
    <mesh position={[0, 1.63, 0.145]}><boxGeometry args={[0.13, 0.045, 0.045]} /><meshStandardMaterial color="#374840" /></mesh>
    <mesh position={[0, 1.24, 0]} castShadow><capsuleGeometry args={[0.19, 0.34, 8, 16]} />{material}</mesh>
    {[-1, 1].map(side => <group key={side}>
      <mesh position={[side * 0.28, 1.12, 0]} rotation={[0, 0, side * 0.13]} castShadow><capsuleGeometry args={[0.068, 0.46, 6, 12]} />{material}</mesh>
      <mesh position={[side * 0.105, 0.46, 0]} castShadow><capsuleGeometry args={[0.088, 0.66, 6, 12]} />{material}</mesh>
      <mesh position={[side * 0.105, 0.075, 0.07]} castShadow><boxGeometry args={[0.18, 0.15, 0.32]} />{material}</mesh>
    </group>)}
  </group>;
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
    <mesh castShadow><boxGeometry args={[0.55, 0.38, 0.34]} /><meshStandardMaterial color={selected ? '#e5b574' : '#c4c9cb'} /></mesh>
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
  const showLabels = useSettings(s => s.showLabels);
  const navigating = useSettings(s => s.navigating);
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
    <group ref={group} visible={object.visible} onClick={event => { if (event.altKey || event.delta > 3) return; event.stopPropagation(); useStore.getState().selectObject(object.id); }}>
      <Geometry object={object} selected={selected} />
      {showLabels && object.visible && <Html position={[0, localBounds(object).max.y + 0.25, 0]} center style={{ pointerEvents: 'none' }} zIndexRange={[5, 0]}><span className="object-label">{object.name}</span></Html>}
      {selected && object.type !== 'Camera' && <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.45, 0.48, 48]} /><meshBasicMaterial color="#e5b574" depthWrite={false} /></mesh>}
    </group>
    {selected && object.visible && !object.locked && mode !== 'select' && <TransformControls object={group} enabled={!navigating} mode={mode} size={0.85} onMouseDown={() => { useStore.getState().beginTransaction('transform'); dragging.current = true; }} onObjectChange={update} onMouseUp={() => { update(); dragging.current = false; useStore.getState().endTransaction('transform'); }} />}
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
      {shot.objects.filter(o => o.type !== 'Camera' && !isLight(o) && o.visible).map(o => <group key={o.id} position={o.position} rotation={toRadians(o.rotation)} scale={o.scale}><Geometry object={o} /></group>)}
    </Canvas></ViewErrorBoundary> : <div className="empty-state">{t('missingCamera')}</div>}
    {camera && <svg className="composition-overlay" viewBox={`0 0 1600 ${1600 / shot.aspectRatio}`} preserveAspectRatio="none" aria-label={t('compositionGuides')}>
      <CameraOverlayContent labelScale={Math.max(1, Math.min(2,1600 / Math.max(1,frameWidth) * 10 / 22))} shot={shot} annotations={annotations} />{!annotations && <FocusDrawing shot={shot} />}
    </svg>}
    <FocusInteraction shot={shot} /><span className="frame-shot">{String(shot.number).padStart(3, '0')}</span><span className="frame-ratio">{ratioLabel(shot.aspectRatio)}</span>
  </div></div>;
}
