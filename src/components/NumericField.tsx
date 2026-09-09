import { useT } from '../i18n';
import { useEffect, useRef, useState } from 'react';

/** Keep editing text separate from scene values, including incomplete negative/decimal input. */
export function NumericField({ value, onCommit, label, min, max, step = .1, disabled }: {
  value: number; onCommit: (value: number) => void; label: string; min?: number; max?: number; step?: number; disabled?: boolean;
}) {
  const t = useT();
  const [draft, setDraft] = useState(String(value));
  const editing = useRef(false), canceled = useRef(false);
  useEffect(() => { if (!editing.current) setDraft(String(value)); }, [value]);
  function commit(text: string) {
    const parsed = text.trim() === '' ? NaN : Number(text);
    if (!Number.isFinite(parsed)) { setDraft(String(value)); return; }
    const next = Math.max(min ?? -Infinity, Math.min(max ?? Infinity, parsed));
    setDraft(String(next)); if (next !== value) onCommit(next);
  }
  return <input className="numeric-field" title={t('numericHelp')} type="text" inputMode="decimal" aria-label={label} disabled={disabled}
    value={draft} onChange={e => setDraft(e.target.value)}
    onFocus={() => { editing.current = true; canceled.current = false; }}
    onBlur={() => { editing.current = false; if (!canceled.current) commit(draft); canceled.current = false; }}
    onKeyDown={e => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); canceled.current = true; setDraft(String(value)); e.currentTarget.blur(); }
      if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); }
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault(); const n = draft.trim() !== '' && Number.isFinite(Number(draft)) ? Number(draft) : value;
        const delta = step * (e.shiftKey ? 10 : e.ctrlKey || e.metaKey ? .1 : 1) * (e.key === 'ArrowUp' ? 1 : -1);
        commit(String(Number((n + delta).toFixed(8))));
      }
    }} />;
}
