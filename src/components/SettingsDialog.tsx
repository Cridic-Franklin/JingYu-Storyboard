import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { createAIProvider } from '../lib/ai';
import { useSettings, type AIProviderKind, type TextSize, type Theme } from '../settings';
import { useT } from '../i18n';
import { Icon } from './Icon';

export function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const settings = useSettings(); const t = useT(); const closeRef = useRef<HTMLButtonElement>(null);
  const [testing,setTesting]=useState(false),[result,setResult]=useState<'idle'|'ok'|'error'>('idle');
  useEffect(()=>{ if(open) requestAnimationFrame(()=>closeRef.current?.focus()); },[open]);
  if(!open)return null;
  async function test() { setTesting(true);setResult('idle');try{await createAIProvider({kind:settings.aiProvider,endpoint:settings.aiEndpoint,apiKey:settings.aiKey,model:settings.aiModel}).generateText('Reply with OK only.',{timeoutMs:15000});setResult('ok');}catch{setResult('error');}finally{setTesting(false);} }
  return createPortal(<div className="modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)onClose();}}><section className="settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title" onKeyDown={event=>{if(event.key==='Escape')onClose();}}>
    <header><h2 id="settings-title">{t('settings')}</h2><button ref={closeRef} className="icon-button" aria-label={t('close')} onClick={onClose}><Icon name="close" /></button></header>
    <div className="settings-grid"><section><h3>{t('appearance')}</h3><label>{t('theme')}<select value={settings.theme} onChange={e=>useSettings.setState({theme:e.target.value as Theme})}><option value="dark">{t('darkTheme')}</option><option value="light">{t('lightTheme')}</option></select></label><label>{t('textSize')}<select value={settings.textSize} onChange={e=>useSettings.setState({textSize:e.target.value as TextSize})}><option value="compact">{t('compact')}</option><option value="default">{t('defaultSize')}</option><option value="large">{t('large')}</option></select></label></section>
      <section><h3>{t('aiProvider')}</h3><label>{t('provider')}<select name="ai-provider" value={settings.aiProvider} onChange={e=>useSettings.setState({aiProvider:e.target.value as AIProviderKind,aiEndpoint:e.target.value==='deepseek'?'https://api.deepseek.com/v1':settings.aiEndpoint})}><option value="deepseek">DeepSeek</option><option value="openai-compatible">OpenAI-compatible</option></select></label><label>{t('apiEndpoint')}<input type="url" name="ai-endpoint" autoComplete="off" spellCheck={false} value={settings.aiEndpoint} onChange={e=>useSettings.setState({aiEndpoint:e.target.value})} placeholder="https://api.example.com/v1" /></label><label>{t('apiKey')}<input type="password" name="ai-key" autoComplete="off" spellCheck={false} value={settings.aiKey} onChange={e=>useSettings.setState({aiKey:e.target.value})} /></label><small>{t('keySessionOnly')}</small><label>{t('model')}<input name="ai-model" autoComplete="off" spellCheck={false} value={settings.aiModel} onChange={e=>useSettings.setState({aiModel:e.target.value})} placeholder="deepseek-chat" /></label><button className="secondary-button" disabled={testing} onClick={()=>void test()}>{testing?t('testing'):t('testConnection')}</button>{result!=='idle'&&<p className={result==='ok'?'success-text':'error-text'} role="status" aria-live="polite">{t(result==='ok'?'connectionOk':'connectionError')}</p>}</section></div>
  </section></div>,document.body);
}
