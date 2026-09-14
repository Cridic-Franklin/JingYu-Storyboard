import { createPortal } from 'react-dom';
import { useEffect, useRef } from 'react';
import { Icon } from './Icon';
import { useT, type MessageKey } from '../i18n';

export type FutureModule = 'script' | 'shotPlanning' | 'aiStoryboard';

export function ComingSoonDialog({ module, onClose }: { module: FutureModule | null; onClose: () => void }) {
  const t = useT(), close = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (module) requestAnimationFrame(() => close.current?.focus()); }, [module]);
  if (!module) return null;
  const descriptions: Record<FutureModule, MessageKey> = { script: 'scriptFuture', shotPlanning: 'shotPlanningFuture', aiStoryboard: 'aiStoryboardFuture' };
  return createPortal(<div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="coming-soon-dialog" role="dialog" aria-modal="true" aria-labelledby="coming-soon-title" onKeyDown={event => { if (event.key === 'Escape') onClose(); }}>
      <header><span className="future-status">{t('comingSoon')}</span><button ref={close} aria-label={t('closePreview')} onClick={onClose}><Icon name="close" /></button></header>
      <Icon name={module} size={34} /><h2 id="coming-soon-title">{t(module)}</h2><p>{t(descriptions[module])}</p>
      <small>{t('aiFactsLocked')}</small>
    </section>
  </div>, document.body);
}
