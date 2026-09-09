import { jointMatrices, makePose } from './pose';
import { Vector3 } from 'three';
import { isLight, type Shot, type StageObject, type SpatialConstraint, type RelationSpace } from '../types';
import { framePosition, storyboardCamera, objectMatrix, worldBounds, type FramePosition } from './scene';
import { semanticForward, shotSpatialData, worldFacing } from './spatial';
import { fovToLens, ratioLabel } from './camera';
import { translate, type MessageKey } from '../i18n';
import { useSettings, type Language } from '../settings';

export const relationChoices: Record<RelationSpace, string[]> = {
  subject: ['front', 'frontRight', 'relativeRight', 'backRight', 'back', 'backLeft', 'relativeLeft', 'frontLeft'],
  screen: ['screenLeft', 'screenRight', 'screenAbove', 'screenBelow'], depth: ['nearer', 'farther'], orientation: ['faces'],
};
export function relation(shot: Shot, object: StageObject, reference: StageObject, space: RelationSpace): string | null {
  const delta = new Vector3(...object.position).sub(new Vector3(...reference.position));
  const camera = shot.objects.find(o => o.type === 'Camera');
  if (space === 'subject') {
    if (Math.hypot(delta.x, delta.z) < .05) return 'overlapping';
    delta.applyAxisAngle(new Vector3(0,1,0), -worldFacing(reference)*Math.PI/180);
    return relationChoices.subject[(Math.round(Math.atan2(delta.x,delta.z)/(Math.PI/4))+8)%8];
  }
  if (space === 'orientation') return semanticForward(object).dot(delta.negate().normalize()) > .8 ? 'faces' : 'notFacing';
  if (!camera || !object.visible || !reference.visible) return null;
  const cam = storyboardCamera(camera, shot.aspectRatio);
  if (space === 'depth') { const a = worldBounds(object).getCenter(new Vector3()).applyMatrix4(cam.matrixWorldInverse), b = worldBounds(reference).getCenter(new Vector3()).applyMatrix4(cam.matrixWorldInverse); return Math.abs(a.z-b.z)<.05 ? 'sameDepth' : a.z>b.z ? 'nearer' : 'farther'; }
  const a = framePosition(object, camera, shot.aspectRatio), b = framePosition(reference, camera, shot.aspectRatio);
  if (a.x === undefined || b.x === undefined) return null;
  const dx = a.x-b.x, dy=a.y!-b.y!;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 1) return 'overlapping';
  return Math.abs(dx) >= Math.abs(dy) ? dx<0 ? 'screenLeft' : 'screenRight' : dy<0 ? 'screenAbove' : 'screenBelow';
}
export function screenRegion(s: FramePosition): MessageKey {
  if (s.x === undefined || s.y === undefined) return 'positionUnknown';
  const col = s.x < 33.33 ? 0 : s.x > 66.67 ? 2 : 1, row = s.y < 33.33 ? 0 : s.y > 66.67 ? 2 : 1;
  return (['upperLeft','upperCenter','upperRight','middleLeft','frameCenter','middleRight','lowerLeft','lowerCenter','lowerRight'] as const)[row*3+col];
}
export function visibility(s: FramePosition) {
  if (s.x === undefined || s.left === undefined) return { state: s.status as string, crops: [] as MessageKey[], visibleFraction: 0 };
  const left = s.left!, right=s.right!, top=s.top!, bottom=s.bottom!;
  const fraction=Math.max(0,Math.min(100,right)-Math.max(0,left))*Math.max(0,Math.min(100,bottom)-Math.max(0,top))/Math.max(.00001,(right-left)*(bottom-top));
  const crops: MessageKey[]=[];if(top<0)crops.push('topCropped');if(bottom>100)crops.push('bottomCropped');if(left<0)crops.push('leftCropped');if(right>100)crops.push('rightCropped');
  return { state: fraction === 0 ? 'outsideFrame' : !crops.length ? 'fullyVisible' : fraction < .25 ? 'mostlyOutside' : 'partiallyVisible', crops, visibleFraction: fraction };
}
function characterRegion(o: StageObject, shot: Shot): MessageKey | null {
  const cam=shot.objects.find(o=>o.type==='Camera'); if(!cam||!o.visible)return null;
  const camera=storyboardCamera(cam,shot.aspectRatio);
  // Sample proxy-local body centers. These are approximate body bands, never image recognition.
  const matrices=jointMatrices(o.pose ?? makePose());
  const visible=[new Vector3(0,-.2,0).applyMatrix4(matrices.leftKnee),new Vector3(0,.27,0).applyMatrix4(matrices.torso),new Vector3().applyMatrix4(matrices.head)].map(local=>{
    const p=local.applyMatrix4(objectMatrix(o));
    if(p.clone().applyMatrix4(camera.matrixWorldInverse).z>=-.1)return false;p.project(camera);return Math.abs(p.x)<=1&&Math.abs(p.y)<=1;
  });
  return visible.every(Boolean)?'fullBody':visible[2]&&visible[1]?'headTorso':visible[0]&&!visible[2]?'lowerBody':visible[1]||visible[2]?'upperBody':null;
}
export function validateConstraints(shot: Shot) {
  const checks=shot.hardConstraints.map(rule=>{
    const a=shot.objects.find(o=>o.id===rule.objectId),b=shot.objects.find(o=>o.id===rule.referenceId);
    let actual=a&&b?relation(shot,a,b,rule.space):null;
    // Left/right and above/below constraints compare their own axis, not only the dominant screen direction.
    if(a&&b&&rule.space==='screen') { const cam=shot.objects.find(o=>o.type==='Camera'),sa=framePosition(a,cam,shot.aspectRatio),sb=framePosition(b,cam,shot.aspectRatio);if(sa.x!==undefined&&sb.x!==undefined)actual=['screenLeft','screenRight'].includes(rule.relation)?Math.abs(sa.x-sb.x)<1?'overlapping':sa.x<sb.x?'screenLeft':'screenRight':Math.abs(sa.y!-sb.y!)<1?'overlapping':sa.y!<sb.y!?'screenAbove':'screenBelow'; }
    return { ...rule, actual, status: actual===null?'unresolved':actual===rule.relation?'pass':'conflict' };
  });
  return { checks, conflicts: checks.filter(c=>c.status!=='pass'), manualText: shot.constraints.trim().length>0 };
}
export function constraintText(shot: Shot, rule: SpatialConstraint, language: Language) {
  const tr=(k: MessageKey)=>translate(language,k),name=(id:string)=>shot.objects.find(o=>o.id===id)?.name??tr('missingObject');
  return `${tr(rule.space==='subject'?'subjectSpace':rule.space==='screen'?'screenSpace':rule.space==='depth'?'depthSpace':'orientationSpace')}: ${name(rule.objectId)} — ${tr(rule.relation as MessageKey)} — ${name(rule.referenceId)}`;
}
export function analyzeShot(shot: Shot) {
  const data=shotSpatialData(shot), depths=data.objects.filter(o=>o.screen.status==='visible').map(o=>o.depthMeters!);const min=Math.min(...depths),max=Math.max(...depths);
  const reference=shot.objects.find(o=>o.id===shot.primaryCharacterId);
  const primaryDepth=data.objects.find(o=>o.id===shot.primaryCharacterId)?.depthMeters;
  const objects=data.objects.map(info=>{
    const object=shot.objects.find(o=>o.id===info.id)!;
    const depthLayer: MessageKey=info.depthMeters===null||info.depthMeters<=0?'positionUnknown':primaryDepth && primaryDepth>0 ? info.depthMeters<primaryDepth*.9?'foreground':info.depthMeters>primaryDepth*1.1?'background':'midground':max-min<.1?'midground':info.depthMeters<=min+(max-min)/3?'foreground':info.depthMeters>=min+2*(max-min)/3?'background':'midground';
    return {...info, ...(object.type==='Character'?{pose:object.pose??makePose()}:{}), ...(object.asset?{asset:{format:object.asset.format,filename:object.asset.filename}}:{}),visibility:visibility(info.screen),screenRegion:screenRegion(info.screen),depthLayer,characterRegion:object.type==='Character'?characterRegion(object,shot):null,
      relations:reference&&reference.id!==object.id?{subject:{space:'subject',referenceId:reference.id,direction:relation(shot,object,reference,'subject')},screen:{space:'screen',referenceId:reference.id,direction:relation(shot,object,reference,'screen')},distanceMeters:new Vector3(...object.position).distanceTo(new Vector3(...reference.position))}:null};
  });
  return {...data,version:2,shot:{...data.shot,primaryCharacterId:shot.primaryCharacterId,primaryVisualSubjectId:shot.primarySubjectId,secondarySubjectId:shot.secondarySubjectId,backgroundAnchorId:shot.backgroundAnchorId},camera:data.camera?{...data.camera,lensMm:fovToLens(data.camera.verticalFovDegrees),verticalGateMm:24}:null,objects,hardConstraints:shot.hardConstraints,validation:validateConstraints(shot)};
}
export function semanticDescription(shot: Shot, language: Language=useSettings.getState().language): string {
  const tr=(k: MessageKey,v?:Record<string,string|number>)=>translate(language,k,v),data=analyzeShot(shot),cam=shot.objects.find(o=>o.type==='Camera');
  const lines=[`${tr('shot',{n:String(shot.number).padStart(3,'0')})} — ${shot.title}`];
  if(!cam)return lines.concat(tr('missingCamera')).join('\n');
  const subject=shot.objects.find(o=>o.id===shot.primaryCharacterId);
  const forward=semanticForward(cam); const angle=forward.y>.15?'lowAngle':forward.y<-.15?'highAngle':'eyeLevelAngle';
  lines.push(`${tr('Camera')}: ${tr(angle)} · ${ratioLabel(shot.aspectRatio)} · ${fovToLens(cam.fov).toFixed(0)} mm`);
  if(subject)lines.push(`${tr('subjectSpace')}: ${cam.name} — ${tr(relation(shot,cam,subject,'subject') as MessageKey)} — ${subject.name} · ${new Vector3(...cam.position).distanceTo(new Vector3(...subject.position)).toFixed(1)} m`);
  for(const [id,key] of [[shot.primaryCharacterId,'primaryCharacter'],[shot.primarySubjectId,'primaryVisualSubject'],[shot.secondarySubjectId,'secondarySubject'],[shot.backgroundAnchorId,'backgroundAnchor']] as const){const o=shot.objects.find(o=>o.id===id);if(o)lines.push(`${tr(key)}: ${o.name}`);}
  lines.push(`\n${tr('frameComposition')}`);
  for(const o of data.objects.filter(o=>o.visible)){
    const parts=[o.name+':',tr(o.screenRegion),tr(o.visibility.state as MessageKey)];
    if(o.pose) parts.push(o.pose.basePreset ? `${tr(o.pose.basePreset)} · ${tr('customPose')}` : tr(o.pose.preset));
    if(o.screen.status==='visible')parts.push(tr(o.depthLayer));
    if(o.visibility.crops.length)parts.push(o.visibility.crops.map(trKey=>tr(trKey)).join(', '));
    if(o.characterRegion)parts.push(`${tr(o.characterRegion)} (${tr('approximate')})`);
    if(o.front.meaning)parts.push(`${o.front.meaning}: ${o.front.facesObjectId?shot.objects.find(a=>a.id===o.front.facesObjectId)?.name:tr(o.front.screenFacing??'positionUnknown')}`);
    if(shot.includeTechnical&&o.screen.x!==undefined)parts.push(`X ${o.screen.x.toFixed(1)}%, Y ${o.screen.y!.toFixed(1)}%, W ${o.screen.width!.toFixed(1)}%, H ${o.screen.height!.toFixed(1)}%`);
    lines.push(parts.join(' · '));
    if(o.relations&&subject){lines.push(`${tr('subjectSpace')}: ${o.name} — ${tr(o.relations.subject.direction as MessageKey)} — ${subject.name} · ${o.relations.distanceMeters.toFixed(1)} m`);if(o.relations.screen.direction)lines.push(`${tr('screenSpace')}: ${o.name} — ${tr(o.relations.screen.direction as MessageKey)} — ${subject.name}`);}
  }
  if(data.depthOrder.length>1)lines.push(tr('depthOrder',{names:data.depthOrder.map(id=>shot.objects.find(o=>o.id===id)!.name).join(' → ')}));
  const focus=shot.objects.find(o=>o.id===shot.focus.targetId);if(focus)lines.push(`${tr('opticalFocus')}: ${focus.name} · ${data.focus.distanceMeters?.toFixed(1)} m`);else if(shot.focus.point)lines.push(`${tr('opticalFocus')}: ${tr('focusPoint')} · ${data.focus.distanceMeters?.toFixed(1)} m`);
  const region=shot.focus.region;if(region)lines.push(`${tr('visualFocus')}: ${region.label||tr('focusRegion')} · ${tr(screenRegion({status:'visible',x:(region.x+region.width/2)*100,y:(region.y+region.height/2)*100}))}`);
  lines.push(`${tr('environmentLight')}: ${shot.environment.intensity.toFixed(1)} · ${shot.environment.color}${shot.environment.defaultRig?' · '+tr('defaultLightRig'):''}`);
  for(const light of shot.objects.filter(o=>isLight(o)&&o.visible)) { const from=light.type==='PointLight'?new Vector3(...light.position).sub(new Vector3(...(subject?.position??[0,0,0]))):semanticForward(light).negate();if(subject)from.applyAxisAngle(new Vector3(0,1,0),-worldFacing(subject)*Math.PI/180);const key=relationChoices.subject[(Math.round(Math.atan2(from.x,from.z)/(Math.PI/4))+8)%8] as MessageKey;lines.push(`${tr('lighting')}: ${light.name} · ${tr('lightFrom')} ${tr(key)}${subject?` (${tr('subjectSpace')}: ${subject.name})`:` (${tr('worldSpace')})`}`); }
  if(shot.hardConstraints.length||shot.constraints.trim())lines.push(`\n${tr('hardConstraints')}\n${shot.hardConstraints.map(c=>constraintText(shot,c,language)).join('\n')}${shot.constraints.trim()?'\n'+shot.constraints.trim():''}`);
  if(shot.negativeConstraints.trim())lines.push(`\n${tr('doNot')}\n${shot.negativeConstraints.trim()}`);
  return lines.join('\n');
}
