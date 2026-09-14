import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ObjectType } from '../types';
import { useStore } from '../store';
import { useSettings } from '../settings';
import { useT } from '../i18n';
import { describeScene } from '../lib/scene';
import { Icon } from './Icon';

export function CommandPalette({ open, onClose, onImport, onSettings }: { open:boolean; onClose:()=>void; onImport:()=>void; onSettings:()=>void }) {
  const t=useT(),input=useRef<HTMLInputElement>(null),[query,setQuery]=useState('');
  useEffect(()=>{if(open){setQuery('');requestAnimationFrame(()=>input.current?.focus());}},[open]);
  const commands=useMemo(()=>{
    const add=(type:ObjectType)=>()=>{useStore.getState().addObject(type);onClose();};
    return [
      {label:t('addCharacter'),icon:'Character',run:add('Character')},{label:t('addCamera'),icon:'Camera',run:add('Camera')},{label:t('addChair'),icon:'Chair',run:add('Chair')},{label:t('addTable'),icon:'Table',run:add('Table')},
      {label:t('importReference'),icon:'image',run:()=>{onImport();onClose();}},{label:t('generate'),icon:'document',run:()=>{const s=useStore.getState(),shot=s.project.shots.find(v=>v.id===s.project.activeShotId);if(shot){s.updateShot({spatialDescription:describeScene(shot),descriptionLive:true},shot.id);onClose();}}},
      {label:t('plan'),icon:'plan',run:()=>{useSettings.getState().setWorkspace('plan');onClose();}},{label:t('spatial'),icon:'Cube',run:()=>{useSettings.getState().setWorkspace('spatial');onClose();}},{label:t('camera'),icon:'camera',run:()=>{useSettings.getState().setWorkspace('camera');onClose();}},
      {label:t('toggleTheme'),icon:useSettings.getState().theme==='dark'?'themeLight':'themeDark',run:()=>{useSettings.setState(s=>({theme:s.theme==='dark'?'light':'dark'}));onClose();}},{label:t('openSettings'),icon:'settings',run:()=>{onSettings();onClose();}},
    ];
  },[t,onClose,onImport,onSettings]);
  if(!open)return null;const filtered=commands.filter(command=>command.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  return createPortal(<div className="modal-backdrop command-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)onClose();}}><section className="command-palette" role="dialog" aria-modal="true" aria-label={t('commandPalette')} onKeyDown={event=>{if(event.key==='Escape')onClose();if(event.key==='Enter'&&filtered[0])filtered[0].run();}}><div className="command-search"><Icon name="search"/><input ref={input} name="command-search" autoComplete="off" aria-label={t('searchCommands')} value={query} onChange={e=>setQuery(e.target.value)} placeholder={`${t('searchCommands')}…`} /></div><div className="command-results">{filtered.map(command=><button key={command.label} onClick={command.run}><Icon name={command.icon}/><span>{command.label}</span></button>)}{!filtered.length&&<p>{t('noCommands')}</p>}</div><footer><kbd>Enter</kbd> {t('runCommand')} <kbd>Esc</kbd> {t('close')}</footer></section></div>,document.body);
}
