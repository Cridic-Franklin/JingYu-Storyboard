import { createPortal } from 'react-dom';
import { useEffect, useRef } from 'react';
import { Icon } from './Icon';

export interface ContextAction { label:string; icon:string; disabled?:boolean; danger?:boolean; run:()=>void }
export function ContextMenu({x,y,actions,onClose}:{x:number;y:number;actions:ContextAction[];onClose:()=>void}){
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{const close=()=>onClose();window.addEventListener('pointerdown',close);window.addEventListener('blur',close);requestAnimationFrame(()=>ref.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus());return()=>{window.removeEventListener('pointerdown',close);window.removeEventListener('blur',close);};},[onClose]);
  return createPortal(<div ref={ref} role="menu" className="context-menu" style={{left:Math.min(x,window.innerWidth-220),top:Math.min(y,window.innerHeight-actions.length*38-12)}} onPointerDown={event=>event.stopPropagation()} onKeyDown={event=>{if(event.key==='Escape')onClose();}}>{actions.map(action=><button role="menuitem" key={action.label} className={action.danger?'danger':''} disabled={action.disabled} onClick={()=>{action.run();onClose();}}><Icon name={action.icon}/>{action.label}</button>)}</div>,document.body);
}
