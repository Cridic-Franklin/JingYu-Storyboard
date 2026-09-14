import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useStore } from '../store';
import { useSettings } from '../settings';
import { useT } from '../i18n';
import { Icon } from './Icon';

export function ViewportTools({ annotationControls }: { annotationControls?: ReactNode }) {
  const t = useT(), mode = useStore(s => s.mode), tool = useSettings(s => s.planTool);
  const [open, setOpen] = useState(false), root = useRef<HTMLDivElement>(null);
  const annotating = ['pen', 'marker', 'eraser', 'arrow', 'text'].includes(tool);
  useEffect(() => {
    function outside(event: PointerEvent) { if (!root.current?.contains(event.target as Node)) setOpen(false); }
    function escape(event: KeyboardEvent) { if (event.key === 'Escape') setOpen(false); }
    window.addEventListener('pointerdown', outside); window.addEventListener('keydown', escape);
    return () => { window.removeEventListener('pointerdown', outside); window.removeEventListener('keydown', escape); };
  }, []);
  function activate(next: 'select' | 'pan' | 'translate' | 'rotate' | 'scale' | 'measure') {
    if (next === 'measure' && !annotationControls) useSettings.getState().setWorkspace('plan');
    useStore.getState().setMode(next === 'pan' || next === 'measure' ? 'select' : next);
    useSettings.setState({ planTool: next === 'pan' || next === 'measure' ? next : 'select', poseMode: false });
    setOpen(false);
  }
  return <div className="viewport-tool-rail" ref={root} role="toolbar" aria-label={t('spatialEditor')}>
    {(['select', 'pan', 'translate', 'rotate', 'scale'] as const).map((item, i) => <button key={item} aria-label={t(item)} data-tooltip={`${t(item)} (${['Q', 'H', 'W', 'E', 'R'][i]})`} aria-pressed={item === 'pan' ? tool === 'pan' : tool === 'select' && mode === item} onClick={() => activate(item)}><Icon name={item} size={19} /></button>)}
    <span className="tool-divider" />
    <button aria-label={t('measure')} data-tooltip={`${t('measure')} (M)`} aria-pressed={tool === 'measure'} onClick={() => activate('measure')}><Icon name="measure" size={19} /></button>
    <button aria-label={t('annotate')} data-tooltip={t('annotate')} aria-expanded={open} aria-pressed={annotating} onClick={() => { if (!annotationControls) { useSettings.getState().setWorkspace('plan'); useSettings.setState({ planTool: 'pen' }); } else setOpen(!open); }}><Icon name="pen" size={19} /><span className="flyout-caret">›</span></button>
    {open && <div className="annotation-flyout" role="group" aria-label={t('annotate')}><div className="annotation-tools">{(['pen', 'marker', 'eraser', 'arrow', 'text'] as const).map(item => <button key={item} aria-label={t(item)} data-tooltip={t(item)} aria-pressed={tool === item} onClick={() => useSettings.setState({ planTool: item })}><Icon name={item} size={18} /></button>)}</div>{annotationControls}</div>}
  </div>;
}
