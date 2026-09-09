import { useEffect, useRef, type ComponentRef } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { MOUSE, PerspectiveCamera, Vector3 } from 'three';
import { useSettings } from '../settings';
import { useStore } from '../store';
import { worldBounds } from '../lib/scene';

export function ViewportNavigation() {
  const ref = useRef<ComponentRef<typeof OrbitControls>>(null!);
  const { camera, gl, scene } = useThree();
  const request = useSettings(s => s.frameRequest);
  useEffect(() => {
    const canvas = gl.domElement;
    ref.current.mouseButtons = { LEFT: undefined, MIDDLE: undefined, RIGHT: undefined };
    let navigating = false;
    let dollying = false;
    let lastX = 0, lastY = 0;
    const disabled: { enabled: boolean }[] = [];
    const press = (event: PointerEvent) => {
      if (!ref.current) return;
      navigating = event.altKey;
      dollying = navigating && event.button === 2;
      lastX = event.clientX; lastY = event.clientY;
      ref.current.mouseButtons = event.altKey ? { LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.PAN, RIGHT: undefined } : { LEFT: undefined, MIDDLE: undefined, RIGHT: undefined };
      if (dollying) canvas.setPointerCapture(event.pointerId);
      if (navigating) {
        useSettings.getState().setNavigating(true);
        scene.traverse(o => {
          const controls = o as unknown as { type: string; enabled: boolean };
          if (controls.type === 'TransformControls' && controls.enabled) { controls.enabled = false; disabled.push(controls); }
        });
      }
    };
    const move = (event: PointerEvent) => {
      if (!dollying) return;
      const delta = (event.clientX - lastX) + (event.clientY - lastY);
      lastX = event.clientX; lastY = event.clientY;
      const controls = ref.current;
      const offset = camera.position.clone().sub(controls.target);
      const distance = Math.max(0.001, offset.length());
      const nextDistance = Math.max(controls.minDistance, Math.min(controls.maxDistance, distance * Math.exp(delta * 0.008)));
      camera.position.copy(controls.target).addScaledVector(offset, nextDistance / distance);
      controls.update();
    };
    const release = () => {
      if (!navigating) return;
      disabled.splice(0).forEach(c => { c.enabled = true; });
      navigating = false; dollying = false; useSettings.getState().setNavigating(false);
    };
    canvas.addEventListener('pointerdown', press, true);
    canvas.addEventListener('pointermove', move, true);
    window.addEventListener('pointerup', release); window.addEventListener('pointercancel', release); window.addEventListener('blur', release);
    return () => { canvas.removeEventListener('pointerdown', press, true); canvas.removeEventListener('pointermove', move, true); window.removeEventListener('pointerup', release); window.removeEventListener('pointercancel', release); window.removeEventListener('blur', release); release(); };
  }, [gl, scene, camera]);
  useEffect(() => {
    if (!request || !ref.current) return;
    const state = useStore.getState();
    const object = state.project.shots.find(s => s.id === state.project.activeShotId)?.objects.find(o => o.id === state.selectedId);
    if (!object || !object.visible) return;
    const box = worldBounds(object); const target = box.getCenter(new Vector3());
    const radius = Math.max(0.3, box.getSize(new Vector3()).length() / 2);
    const cam = camera as PerspectiveCamera;
    const vertical = cam.fov * Math.PI / 180;
    const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * cam.aspect);
    const distance = Math.min(150, radius / Math.sin(Math.min(vertical, horizontal) / 2) * 1.25);
    const direction = camera.position.clone().sub(ref.current.target).normalize();
    camera.position.copy(target).addScaledVector(direction, distance);
    ref.current.target.copy(target); ref.current.update();
  }, [request, camera]);
  return <OrbitControls ref={ref} makeDefault target={[0, 0.8, 0]} minDistance={0.2} maxDistance={180} maxPolarAngle={Math.PI - 0.02} enableDamping={false} />;
}
