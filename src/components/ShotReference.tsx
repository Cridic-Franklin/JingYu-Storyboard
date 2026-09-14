import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { ReferenceImage, Shot } from '../types';
import { useStore } from '../store';
import { useT, type MessageKey } from '../i18n';
import { Icon } from './Icon';
import { ContextMenu } from './ContextMenu';

/** Presentation adapter: references stay in the existing shot record. */
export function ShotReference({ shot, children }: { shot: Shot; children?: ReactNode }) {
  const t = useT(), input = useRef<HTMLInputElement>(null), dialog = useRef<HTMLDialogElement>(null);
  const request = useRef(0);
  const [loading, setLoading] = useState(false), [error, setError] = useState<MessageKey | null>(null);
  const [preview, setPreview] = useState(false), [dragging, setDragging] = useState(false);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const reference = shot.references.find(item => item.role === 'storyboard');
  const image = reference?.dataUrl ?? shot.image;
  useEffect(() => { if (preview) dialog.current?.showModal(); }, [preview]);
  useEffect(() => () => { request.current++; }, []);
  async function importFile(file?: File) {
    if (!file) return;
    const ticket = ++request.current;
    setError(null); setLoading(false);
    if (!['image/png', 'image/jpeg'].includes(file.type)) { setError('imageTypeError'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('imageSizeError'); return; }
    setLoading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file);
      });
      await new Promise<void>((resolve, reject) => { const img = new Image(); img.onload = () => resolve(); img.onerror = reject; img.src = dataUrl; });
      if (ticket !== request.current) return;
      const current = useStore.getState().project.shots.find(s => s.id === shot.id);
      if (!current) return;
      const previous = current.references.find(item => item.role === 'storyboard');
      const next: ReferenceImage = { id: previous?.id ?? crypto.randomUUID(), role: 'storyboard', name: file.name, mimeType: file.type as ReferenceImage['mimeType'], dataUrl, fit: previous?.fit ?? 'fit', createdAt: previous?.createdAt ?? new Date().toISOString(), metadata: { source: 'local-import' } };
      useStore.getState().updateShot({ image: dataUrl, references: [...current.references.filter(item => item.role !== 'storyboard'), next] }, shot.id);
    } catch { if (ticket === request.current) setError('imageReadError'); }
    finally { if (ticket === request.current) setLoading(false); }
  }
  function remove() {
    request.current++; setLoading(false); setError(null);
    useStore.getState().updateShot({ image: null, references: shot.references.filter(item => item.role !== 'storyboard') }, shot.id);
  }
  function fit(value: 'fit' | 'fill') {
    if (reference) useStore.getState().updateShot({ references: shot.references.map(item => item.id === reference.id ? { ...item, fit: value } : item) }, shot.id);
  }
  return <div className={`shot-reference${dragging ? ' dragging' : ''}`} data-reference-state={loading ? 'loading' : error ? 'failed' : image ? 'valid' : 'empty'}
    onDragOver={event => { event.preventDefault(); setDragging(true); event.dataTransfer.dropEffect = 'copy'; }}
    onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); void importFile(event.dataTransfer.files[0]); }}
    onContextMenu={event => { if (!(event.target as Element).closest('.shot-select, .shot-delete')) { event.preventDefault(); event.stopPropagation(); setMenu({ x: event.clientX, y: event.clientY }); } }}>
    <button className="shot-image" aria-label={image ? t('previewReference') : t('importImage')} onClick={() => image ? setPreview(true) : input.current?.click()}>
      {image ? <img src={image} width="160" height="90" className={`reference-${reference?.fit ?? 'fit'}`} alt={t('storyboardFor', { name: shot.title })} onError={() => setError('imageReadError')} /> : <span className="storyboard-placeholder"><Icon name="image" size={22} /><span>{t('noStoryboard')}</span><small>{t('importImage')} · PNG / JPEG</small></span>}
      <span className="shot-number">{String(shot.number).padStart(3, '0')}</span>
    </button>
    <div className="thumbnail-actions"><button aria-label={image ? t('replaceImage') : t('importImage')} title={image ? t('replaceImage') : t('importImage')} onClick={() => input.current?.click()}><Icon name="image" size={14} /></button>{image && <button aria-label={t('previewReference')} title={t('previewReference')} onClick={() => setPreview(true)}><Icon name="maximize" size={14} /></button>}<button aria-label={t('referenceOptions')} title={t('referenceOptions')} onClick={event => { const rect = event.currentTarget.getBoundingClientRect(); setMenu({ x: rect.left, y: rect.bottom }); }}><Icon name="settings" size={14} /></button></div>
    {children}
    {loading && <span className="reference-feedback" role="status">{t('loading')}</span>}
    {error && <span className="reference-feedback error-text" role="alert">{t(error)}</span>}
    <input ref={input} type="file" accept="image/png,image/jpeg" aria-label={t('importImage')} hidden onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; void importFile(file); }} />
    {menu && <ContextMenu {...menu} onClose={() => setMenu(null)} actions={[
      { label: image ? t('replaceImage') : t('importImage'), icon: 'image', run: () => input.current?.click() },
      { label: t('previewReference'), icon: 'maximize', disabled: !image, run: () => setPreview(true) },
      { label: t('fit'), icon: 'frame', disabled: !reference, run: () => fit('fit') },
      { label: t('fill'), icon: 'image', disabled: !reference, run: () => fit('fill') },
      { label: t('removeImage'), icon: 'trash', disabled: !image, danger: true, run: remove },
    ]} />}
    {preview && image && createPortal(<dialog ref={dialog} className="reference-preview-dialog" aria-label={t('previewReference')} onClose={() => setPreview(false)} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}><header><span>{reference?.name ?? shot.title}</span><button autoFocus aria-label={t('close')} onClick={() => dialog.current?.close()}><Icon name="close" /></button></header><img src={image} alt={t('storyboardFor', { name: shot.title })} /></dialog>, document.body)}
  </div>;
}
