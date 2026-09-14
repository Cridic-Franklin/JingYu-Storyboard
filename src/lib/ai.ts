import type { AIProviderKind } from '../settings';

export interface AIRequestOptions { signal?: AbortSignal; timeoutMs?: number }
export interface AIProvider {
  generateText(prompt: string, options?: AIRequestOptions): Promise<string>;
  generateStructured<T>(prompt: string, validate: (value: unknown) => value is T, options?: AIRequestOptions): Promise<T>;
  analyzeImage?: (dataUrl: string, prompt: string, options?: AIRequestOptions) => Promise<string>;
  generateImage?: (prompt: string, options?: AIRequestOptions) => Promise<Blob>;
}
export interface AIProviderConfig { kind: AIProviderKind; endpoint: string; apiKey: string; model: string }

function withTimeout(signal: AbortSignal | undefined, timeoutMs = 30000) {
  const controller = new AbortController();
  const abort = () => controller.abort(signal?.reason);
  signal?.addEventListener('abort', abort, { once: true });
  const timeout = window.setTimeout(() => controller.abort(new DOMException('The AI request timed out.', 'TimeoutError')), timeoutMs);
  return { signal: controller.signal, dispose: () => { clearTimeout(timeout); signal?.removeEventListener('abort', abort); } };
}
function jsonFromText(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ?? text;
  const start = Math.min(...['{','['].map(char => fenced.indexOf(char)).filter(index => index >= 0));
  if (!Number.isFinite(start)) throw new Error('The provider returned no JSON.');
  return JSON.parse(fenced.slice(start));
}
export function createAIProvider(config: AIProviderConfig): AIProvider {
  const endpoint = (config.endpoint.trim() || (config.kind === 'deepseek' ? 'https://api.deepseek.com/v1' : '')).replace(/\/$/, '');
  async function request(prompt: string, structured: boolean, options: AIRequestOptions = {}) {
    if (!endpoint || !config.model.trim() || !config.apiKey.trim()) throw new Error('Provider, endpoint, model, and API key are required.');
    const timed = withTimeout(options.signal, options.timeoutMs);
    try {
      const response = await fetch(`${endpoint}/chat/completions`, { method: 'POST', signal: timed.signal, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` }, body: JSON.stringify({ model: config.model, messages: [{ role: 'system', content: 'You are SceneAxis language support. Never add, remove, or alter scene facts. Return only the requested result.' }, { role: 'user', content: prompt }], temperature: .2, ...(structured ? { response_format: { type: 'json_object' } } : {}) }) });
      if (!response.ok) throw new Error(`Provider request failed (${response.status}).`);
      const payload = await response.json() as { choices?: { message?: { content?: string } }[] };
      const text = payload.choices?.[0]?.message?.content;
      if (!text || typeof text !== 'string') throw new Error('The provider returned an empty response.');
      return text;
    } finally { timed.dispose(); }
  }
  return {
    generateText: (prompt, options) => request(prompt, false, options),
    async generateStructured<T>(prompt: string, validate: (value: unknown) => value is T, options?: AIRequestOptions) {
      const parsed = jsonFromText(await request(prompt, true, options));
      if (!validate(parsed)) throw new Error('The provider returned JSON that does not match the required schema.');
      return parsed;
    },
  };
}
