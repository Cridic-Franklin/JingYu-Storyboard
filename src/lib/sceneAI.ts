import type { Language } from '../settings';
import type { Shot } from '../types';
import { analyzeShot } from './semantics';
import { describeScene } from './scene';

export type InterpretationMode = 'faithful' | 'director';
export type SuggestionCategory = 'camera' | 'composition' | 'blocking' | 'lens' | 'subject' | 'depth';
export interface ShotSuggestion { category: SuggestionCategory; suggestion: string; reason: string }
export interface ShotSuggestionResponse { suggestions: ShotSuggestion[] }

const categories = new Set<SuggestionCategory>(['camera', 'composition', 'blocking', 'lens', 'subject', 'depth']);
export function isShotSuggestionResponse(value: unknown): value is ShotSuggestionResponse {
  if (!value || typeof value !== 'object') return false;
  const suggestions = (value as { suggestions?: unknown }).suggestions;
  return Array.isArray(suggestions) && suggestions.length > 0 && suggestions.length <= 6 && suggestions.every(item => {
    if (!item || typeof item !== 'object') return false;
    const v = item as Record<string, unknown>;
    return categories.has(v.category as SuggestionCategory) && typeof v.suggestion === 'string' && v.suggestion.trim().length > 0 && v.suggestion.length <= 500 && typeof v.reason === 'string' && v.reason.trim().length > 0 && v.reason.length <= 500;
  });
}

function languageRule(language: Language) {
  return language === 'zh'
    ? 'Write all prose, reasons, technical explanations and approximation notes in natural Simplified Chinese. Do not copy English enum identifiers (for example notFacing), raw field names, or the English approximation appendix into prose; translate their meaning. Only user-defined object names must remain exactly unchanged. JSON schema keys and category enum values must remain as specified.'
    : 'Use English for the response. Preserve user-defined object names exactly; do not translate them. Preserve approximation qualifiers: full-body classification and proxy bounds are approximate, not exact visibility or occlusion analysis.';
}

function promptFacts(shot: Shot) {
  const data=analyzeShot(shot),name=(id:string)=>shot.objects.find(o=>o.id===id)?.name??id;
  return {...data,relationships:data.relationships.map(({objectId,referenceId,...relation})=>({subject:name(objectId),reference:name(referenceId),meaning:'Every direction describes SUBJECT relative to REFERENCE. Never reverse these roles.',...relation})),depthOrder:data.depthOrder.map(name)};
}
export function interpretationPrompt(shot: Shot, language: Language, mode: InterpretationMode) {
  const facts = promptFacts(shot), deterministic = describeScene(shot);
  const modeRule = mode === 'faithful'
    ? 'Rewrite the shorthand bullets into complete, flowing natural-language sentences in 2–3 short paragraphs. Keep the source order (camera, subjects, relationships, environment). Merely changing punctuation or copying the bullet list is not an acceptable rewrite. Preserve every source fact and approximation qualifier.'
    : 'Reorganize into 3 short director-facing paragraphs: first subject and screen arrangement, then camera and depth, then environment. Use only supported observations. Preserve every source fact and approximation qualifier. Do not invent narrative intent, movement, emotional meaning or physical interactions. For each relation, identify the named subject and reference before describing its direction. Do not reverse subject/reference roles.';
  return `You are the SceneAxis AI Semantic & Creative Assistance Layer. AI interprets intent and language; SceneAxis owns spatial truth.\n${languageRule(language)}\n${modeRule}\nDo not add, remove, infer, round differently, or modify positions, rotations, distances, facing, camera parameters, visibility, screen position, depth order, object identity, or any structured spatial fact. Do not translate object names incorrectly. Return prose only.\n\nSTRUCTURED SPATIAL FACTS (immutable):\n${JSON.stringify(facts)}\n\nDETERMINISTIC DESCRIPTION (authoritative):\n${deterministic}`;
}

export function suggestionsPrompt(shot: Shot, language: Language) {
  const facts = promptFacts(shot), deterministic = describeScene(shot);
  return `You are the SceneAxis AI Semantic & Creative Assistance Layer. AI interprets intent and language; SceneAxis owns spatial truth.\n${languageRule(language)}\nAnalyze only the current shot. Offer 3 to 6 optional suggestions. Never modify the Scene Graph and never claim a suggestion is already applied. Base every reason on the supplied data. You may suggest camera, composition, blocking, lens, subject placement, or foreground/depth changes, but do not invent objects or facts. Do not translate object names incorrectly.\nReturn exactly one JSON object: {"suggestions":[{"category":"camera|composition|blocking|lens|subject|depth","suggestion":"...","reason":"..."}]}.\n\nSHOT DATA:\n${JSON.stringify({ title: shot.title, shotType: shot.shotType, duration: shot.duration, facts })}\n\nDETERMINISTIC DESCRIPTION:\n${deterministic}`;
}

export function isLowDifference(source: string, result: string) {
  const tokens = (value: string) => value.toLocaleLowerCase().replace(/[^\p{L}\p{N}.]+/gu, ' ').trim().split(/\s+/).filter(Boolean);
  const a = new Set(tokens(source)), b = new Set(tokens(result));
  if (!a.size || !b.size) return false;
  let common = 0; for (const token of a) if (b.has(token)) common++;
  return common / new Set([...a, ...b]).size >= .86;
}
