import { useEffect, type MouseEvent, type PointerEvent as ReactPointerEvent, type CSSProperties, type ReactNode } from 'react';
import { useSettings, type Layout, type Panel } from '../settings';
import { useT, type MessageKey } from '../i18n';
import { Icon } from './Icon';

const names: Record<Panel, MessageKey> = { shots: 'shotList', stage: 'spatialEditor', preview: 'cameraPreview', description: 'spatialDescription', inspector: 'inspector' };
export function usePanel(panel: Panel) {
  const maximized = useSettings(s => s.maximized === panel);
  const state = useSettings(s => s.panels[panel]);
  const t = useT();
  useEffect(()=>{const fit=()=>useSettings.getState().setPanel(panel,{});window.addEventListener('resize',fit);return()=>window.removeEventListener('resize',fit);},[panel]);
  return { className: maximized ? ' panel-maximized' : state.hidden ? ' panel-hidden' : state.floating ? ' panel-floating' : '', style: (state.floating && !maximized ? {left:state.x,top:state.y,width:state.width,height:state.height} : {}) as CSSProperties, controls:<PanelControls panel={panel}/>, resize: state.floating&&!maximized?<div className="float-resize" role="separator" aria-label={t('resize',{panel:t(names[panel])})} onPointerDown={e=>panelGesture(e,panel,true)}/>:null, header: {
    onPointerDown: (event: ReactPointerEvent<HTMLElement>)=>{if(state.floating&&!maximized&&!(event.target as HTMLElement).closest('button,input,select'))panelGesture(event,panel,false);},
    title: t('maximizeHint'), onDoubleClick: (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest('button,input,select')) useSettings.getState().maximize(panel);
    },
  } };
}
function panelGesture(event:ReactPointerEvent<HTMLElement>,panel:Panel,resize:boolean) {
  if(event.button!==0)return;event.preventDefault();const target=event.currentTarget;target.setPointerCapture(event.pointerId);
  const start=useSettings.getState().panels[panel],x=event.clientX,y=event.clientY;
  const move=(e:PointerEvent)=>useSettings.getState().setPanel(panel,resize?{width:start.width+e.clientX-x,height:start.height+e.clientY-y}:{x:start.x+e.clientX-x,y:start.y+e.clientY-y});
  const finish=()=>{target.removeEventListener('pointermove',move);target.removeEventListener('pointerup',finish);target.removeEventListener('pointercancel',finish);};
  target.addEventListener('pointermove',move);target.addEventListener('pointerup',finish);target.addEventListener('pointercancel',finish);
}
function PanelControls({panel}:{panel:Panel}) {
  const t=useT(),s=useSettings(),floating=s.panels[panel].floating;
  return <span className="panel-controls">
    <button aria-label={`${t(s.maximized===panel?'restorePanel':'maximizePanel')} · ${t(names[panel])}`} title={t(s.maximized===panel?'restorePanel':'maximizePanel')} onClick={()=>s.maximize(panel)}><Icon name={s.maximized===panel?'restore':'maximize'} size={12}/></button>
    <button aria-label={`${t(floating?'dockPanel':'floatPanel')} · ${t(names[panel])}`} title={t(floating?'dockPanel':'floatPanel')} onClick={()=>s.setPanel(panel,{floating:!floating})}><Icon name={floating?'dock':'float'} size={12}/></button>
    <button aria-label={`${t('hidePanel')} · ${t(names[panel])}`} title={t('hidePanel')} onClick={()=>s.setPanel(panel,{hidden:true})}><Icon name="minimize" size={12}/></button>
  </span>;
}
export function ResizeHandle({ dimension, panel, children }: { dimension: keyof Layout; panel: Panel; children?: ReactNode }) {
  const t = useT();
  const layout = useSettings(s => s.layout);
  const states = useSettings(s => s.panels);
  const vertical = dimension !== 'bottom';
  function adjust(start: Layout, delta: number, element: HTMLElement) {
    let value = start[dimension] + delta;
    if (dimension === 'left' || dimension === 'right') {
      value = Math.max(160, Math.min(value, 440, window.innerWidth - (dimension === 'left' ? start.right : start.left) - 560));
    } else if (dimension === 'bottom') value = Math.max(180, Math.min(value, Math.max(200, window.innerHeight - 450)));
    else value = Math.max(0.3, Math.min(0.7, start.preview + delta / (element.parentElement?.clientWidth || 800)));
    useSettings.getState().resize({ [dimension]: value });
  }
  const absent=(p:Panel)=>states[p].floating||states[p].hidden;
  if ((dimension==='left'&&absent('shots'))||(dimension==='right'&&absent('inspector'))||(dimension==='preview'&&(absent('preview')||absent('description')))||(dimension==='bottom'&&(absent('stage')||(absent('preview')&&absent('description')))))return null;
  return <div role="separator" tabIndex={0} aria-label={t('resize', { panel: t(names[panel]) })} aria-orientation={vertical ? 'vertical' : 'horizontal'} aria-valuenow={Math.round(layout[dimension] * (dimension === 'preview' ? 100 : 1))} className={`resize-handle ${vertical ? 'vertical' : 'horizontal'}`} data-dimension={dimension}
    onPointerDown={event => {
      event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId);
      const target = event.currentTarget;
      const start = useSettings.getState().layout;
      const coordinate = vertical ? event.clientX : event.clientY;
      const move = (e: PointerEvent) => adjust(start, ((vertical ? e.clientX : e.clientY) - coordinate) * (dimension === 'right' || dimension === 'bottom' ? -1 : 1), target);
      const finish = () => { target.removeEventListener('pointermove', move); target.removeEventListener('pointerup', finish); target.removeEventListener('pointercancel', finish); };
      target.addEventListener('pointermove', move); target.addEventListener('pointerup', finish); target.addEventListener('pointercancel', finish);
    }} onKeyDown={event => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault(); adjust(layout, (['ArrowRight', 'ArrowDown'].includes(event.key) ? 10 : -10) * (dimension === 'right' || dimension === 'bottom' ? -1 : 1), event.currentTarget);
    }}>{children}</div>;
}
