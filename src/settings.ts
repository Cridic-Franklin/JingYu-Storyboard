import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'en' | 'zh';
export type Panel = 'shots' | 'stage' | 'preview' | 'description' | 'inspector';
export interface Layout { left: number; right: number; bottom: number; preview: number }
export const defaultLayout: Layout = { left: 213, right: 251, bottom: 290, preview: 0.54 };
export type WorkspaceView = 'spatial' | 'plan' | 'camera' | 'aiReview';
export type PlanTool = 'select' | 'measure' | 'pen' | 'marker' | 'eraser' | 'arrow' | 'text';
interface Settings {
  focusTool: 'point' | 'rectangle' | 'ellipse' | null;
  planTool: PlanTool;
  workspaceView: WorkspaceView; positionSnap: number; rotationSnap: number;
  language: Language; showLabels: boolean; layout: Layout; maximized: Panel | null;
  frameRequest: number; navigating: boolean;
  setLanguage: (language: Language) => void; toggleLabels: () => void;
  resize: (patch: Partial<Layout>) => void; maximize: (panel: Panel) => void;
  resetLayout: () => void; frameSelected: () => void; setNavigating: (v: boolean) => void;
}
export const useSettings = create<Settings>()(persist((set) => ({
  focusTool: null, planTool: 'select', workspaceView: 'spatial', positionSnap: 0, rotationSnap: 0, language: 'en', showLabels: false, layout: defaultLayout, maximized: null, frameRequest: 0, navigating: false,
  setLanguage: language => set({ language }), toggleLabels: () => set(s => ({ showLabels: !s.showLabels })),
  resize: patch => set(s => ({ layout: { ...s.layout, ...patch } })),
  maximize: panel => set(s => ({ maximized: s.maximized === panel ? null : panel })),
  resetLayout: () => set({ layout: defaultLayout, maximized: null }),
  frameSelected: () => set(s => ({ frameRequest: s.frameRequest + 1 })), setNavigating: navigating => set({ navigating }),
}), { name: 'ssd-preferences-v02', partialize: s => ({ workspaceView: s.workspaceView, positionSnap: s.positionSnap, rotationSnap: s.rotationSnap, language: s.language, showLabels: s.showLabels, layout: s.layout }) }));
