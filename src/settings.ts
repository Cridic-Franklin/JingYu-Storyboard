import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Joint } from './lib/pose';
export type Language = 'en' | 'zh';
export const panels = ['shots','stage','preview','description','inspector'] as const;
export type Panel = typeof panels[number];
export interface Layout { left: number; right: number; bottom: number; preview: number }
export const defaultLayout: Layout = { left:213,right:251,bottom:290,preview:.54 };
export type WorkspaceView = 'spatial'|'plan'|'camera'|'aiReview';
export type PlanTool = 'select'|'measure'|'pen'|'marker'|'eraser'|'arrow'|'text';
export interface PanelState { floating:boolean; hidden:boolean; x:number; y:number; width:number; height:number }
export type PanelStates = Record<Panel,PanelState>;
interface WorkspaceLayout { layout:Layout; panels:PanelStates }
export function workspaceDefaults(view:WorkspaceView): WorkspaceLayout {
  return {layout:{...defaultLayout,bottom:view==='aiReview'?250:view==='camera'?210:view==='plan'?230:290,preview:view==='aiReview'?.4:.54},panels:Object.fromEntries(panels.map((p,i)=>[p,{floating:false,hidden:false,x:80+i*35,y:100+i*25,width:p==='stage'?760:420,height:480}])) as PanelStates};
}
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
export function validLayout(value:Partial<Layout>,view:WorkspaceView):Layout {
  const d=workspaceDefaults(view).layout, n=(k:keyof Layout)=>Number.isFinite(value[k])?value[k]!:d[k];
  return {left:clamp(n('left'),160,440),right:clamp(n('right'),160,440),bottom:clamp(n('bottom'),180,600),preview:clamp(n('preview'),.3,.7)};
}
export function validRect(p:PanelState):PanelState {
  const w=typeof window==='undefined'?1440:window.innerWidth,h=typeof window==='undefined'?900:window.innerHeight;
  const width=clamp(p.width,280,Math.max(280,w-16)),height=clamp(p.height,200,Math.max(200,h-100));
  return {...p,width,height,x:clamp(p.x,8,Math.max(8,w-width-8)),y:clamp(p.y,64,Math.max(64,h-height-30))};
}
interface Settings {
  focusTool:'point'|'rectangle'|'ellipse'|null;planTool:PlanTool;poseMode:boolean;poseJoint:Joint;
  workspaceView:WorkspaceView;positionSnap:number;rotationSnap:number;
  language:Language;showLabels:boolean;layout:Layout;panels:PanelStates;workspaces:Partial<Record<WorkspaceView,WorkspaceLayout>>;maximized:Panel|null;
  frameRequest:number;navigating:boolean;
  setWorkspace:(view:WorkspaceView)=>void;setPanel:(panel:Panel,patch:Partial<PanelState>)=>void;
  setLanguage:(language:Language)=>void;toggleLabels:()=>void;resize:(patch:Partial<Layout>)=>void;maximize:(panel:Panel)=>void;resetLayout:()=>void;frameSelected:()=>void;setNavigating:(v:boolean)=>void;
}
export const useSettings=create<Settings>()(persist((set)=>({
  focusTool:null,planTool:'select',poseMode:false,poseJoint:'torso',workspaceView:'spatial',positionSnap:0,rotationSnap:0,language:'en',showLabels:false,...workspaceDefaults('spatial'),workspaces:{},maximized:null,frameRequest:0,navigating:false,
  setWorkspace:view=>set(s=>{if(view===s.workspaceView)return {};const target=s.workspaces[view]??workspaceDefaults(view);return {...target,layout:validLayout(target.layout,view),workspaceView:view,maximized:null,focusTool:null,workspaces:{...s.workspaces,[s.workspaceView]:{layout:s.layout,panels:s.panels}}};}),
  setPanel:(panel,patch)=>set(s=>({panels:{...s.panels,[panel]:validRect({...s.panels[panel],...patch})},maximized:('hidden' in patch || 'floating' in patch)?null:s.maximized})),
  setLanguage:language=>set({language}),toggleLabels:()=>set(s=>({showLabels:!s.showLabels})),
  resize:patch=>set(s=>({layout:validLayout({...s.layout,...patch},s.workspaceView)})),
  maximize:panel=>set(s=>({maximized:s.maximized===panel?null:panel})),
  resetLayout:()=>set(s=>({...workspaceDefaults(s.workspaceView),maximized:null,workspaces:{...s.workspaces,[s.workspaceView]:workspaceDefaults(s.workspaceView)}})),
  frameSelected:()=>set(s=>({frameRequest:s.frameRequest+1})),setNavigating:navigating=>set({navigating}),
}),{name:'ssd-preferences-v02',partialize:s=>({workspaceView:s.workspaceView,positionSnap:s.positionSnap,rotationSnap:s.rotationSnap,language:s.language,showLabels:s.showLabels,layout:s.layout,panels:s.panels,workspaces:s.workspaces}),
  merge:(saved,current)=>{
    const p=(saved??{}) as Partial<Settings>,views:WorkspaceView[]=['spatial','plan','camera','aiReview'];
    const view=views.includes(p.workspaceView!)?p.workspaceView!:'spatial';
    const safe=(v:WorkspaceView,layout?:Partial<Layout>,states?:Partial<PanelStates>):WorkspaceLayout=>({layout:validLayout(layout??{},v),panels:Object.fromEntries(panels.map(k=>{const def=workspaceDefaults(v).panels[k],s=states?.[k];return [k,s&&['x','y','width','height'].every(n=>Number.isFinite(s[n as keyof PanelState]))&&typeof s.hidden==='boolean'&&typeof s.floating==='boolean'?validRect(s):def];})) as PanelStates});
    const workspaces=Object.fromEntries(views.filter(v=>p.workspaces?.[v]).map(v=>[v,safe(v,p.workspaces![v]!.layout,p.workspaces![v]!.panels)]));
    return {...current,language:p.language==='zh'?'zh':'en',showLabels:p.showLabels===true,positionSnap:[0,.1,.5,1].includes(p.positionSnap!)?p.positionSnap!:0,rotationSnap:[0,5,15,45].includes(p.rotationSnap!)?p.rotationSnap!:0,workspaceView:view,...safe(view,p.layout,p.panels),workspaces};
  },
}));
