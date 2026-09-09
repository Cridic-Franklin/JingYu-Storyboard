import { parseObj } from '../lib/obj';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { translate, useT, type MessageKey } from '../i18n';
import type { ObjectType } from '../types';
import { useStore } from '../store';
import { Icon } from './Icon';

const categories: { label: MessageKey; types: ObjectType[] }[] = [
  { label: 'commonObjects', types: ['Character', 'Prop', 'Camera'] },
  { label: 'primitives', types: ['Cube', 'Sphere', 'Cylinder', 'Capsule', 'Cone', 'Plane'] },
  { label: 'lighting', types: ['DirectionalLight', 'PointLight', 'SpotLight'] },
];
export function AddObjectMenu({ onClose }: { onClose: () => void }) {
  const [error,setError]=useState('');
  const t = useT(); const [search, setSearch] = useState('');
  const query = search.trim().toLocaleLowerCase();
  const groups = categories.map(g => ({ ...g, types: g.types.filter(type => `${translate('en', type)} ${translate('zh', type)}`.toLocaleLowerCase().includes(query)) }));
  const anchor = document.querySelector('.add-object-wrap')?.getBoundingClientRect();
  return createPortal(<div className="add-menu" style={{ position: 'fixed', top: (anchor?.bottom ?? 100) + 4, right: Math.max(8, window.innerWidth - (anchor?.right ?? 400)), maxHeight: Math.max(140, window.innerHeight - (anchor?.bottom ?? 100) - 20), zIndex: 80 }} onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } }}>
    <input autoFocus type="search" aria-label={t('searchObjects')} placeholder={t('searchObjects')} value={search} onChange={e => setSearch(e.target.value)} />
    <label className="obj-import">{t('importObj')}<input aria-label={t('importObj')} type="file" accept=".obj" onChange={async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;try{if(file.size>20*1024*1024)throw new Error(t('objLimit'));useStore.getState().importObj(parseObj(await file.text(),file.name));onClose();}catch{setError(t('objError'));}}} /></label><small>{t('objLimit')}</small>{error&&<p role="alert">{error}</p>}
    <div className="add-menu-items" onWheel={e => e.stopPropagation()}>{groups.map(g => g.types.length > 0 && <section key={g.label}><h3>{t(g.label)}</h3>{g.types.map(type => <button key={type} onClick={() => { useStore.getState().addObject(type); onClose(); }}><Icon name={type} />{t(type)}<span>+</span></button>)}</section>)}{groups.every(g => !g.types.length) && <p>{t('noObjectResults')}</p>}</div>
  </div>, document.body);
}
