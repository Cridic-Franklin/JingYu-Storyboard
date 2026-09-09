import type { MouseEvent, ReactNode } from 'react';
import { useSettings, type Layout, type Panel } from '../settings';
import { useT, type MessageKey } from '../i18n';

const names: Record<Panel, MessageKey> = { shots: 'shotList', stage: 'spatialEditor', preview: 'cameraPreview', description: 'spatialDescription', inspector: 'inspector' };
export function usePanel(panel: Panel) {
  const maximized = useSettings(s => s.maximized === panel);
  const t = useT();
  return { className: maximized ? ' panel-maximized' : '', header: {
    title: t('maximizeHint'), onDoubleClick: (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest('button,input,select')) useSettings.getState().maximize(panel);
    },
  } };
}
export function ResizeHandle({ dimension, panel, children }: { dimension: keyof Layout; panel: Panel; children?: ReactNode }) {
  const t = useT();
  const layout = useSettings(s => s.layout);
  const vertical = dimension !== 'bottom';
  function adjust(start: Layout, delta: number, element: HTMLElement) {
    let value = start[dimension] + delta;
    if (dimension === 'left' || dimension === 'right') {
      value = Math.max(160, Math.min(value, 440, window.innerWidth - (dimension === 'left' ? start.right : start.left) - 560));
    } else if (dimension === 'bottom') value = Math.max(180, Math.min(value, Math.max(200, window.innerHeight - 450)));
    else value = Math.max(0.3, Math.min(0.7, start.preview + delta / (element.parentElement?.clientWidth || 800)));
    useSettings.getState().resize({ [dimension]: value });
  }
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
