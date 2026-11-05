'use strict';
// A single skinned hero owns every grounded action; never substitute the enemy atlas.
async function prepareMaipiModel(scene){
 battle3D.hero=null;
 if(selected!==0)return;
 const result=await BABYLON.SceneLoader.ImportMeshAsync('', 'assets/models/', 'maipi-rigged-v1.glb',scene);
 const root=new BABYLON.TransformNode('maipi-game-root',scene);
 result.meshes.filter(m=>!m.parent).forEach(m=>m.parent=root);
 root.scaling.setAll(61.2);
 const groups=new Map(result.animationGroups.map(g=>[g.name,g]));
 result.animationGroups.forEach(g=>g.stop());
 const body=result.meshes.find(m=>m.skeleton),skeleton=result.skeletons[0];
 const h=battle3D.hero={root,groups,body,skeleton,action:null,paused:false,lastX:null,lastY:null,facing:0,gear:null,gearKey:null};
 if(!body||!skeleton||!groups.has('Run'))throw Error('麦皮骨骼模型不完整，请重新加载。');
 root.setEnabled(false);
}
function maipiGear(h,w){
 const key=w?w.name:(p.melee||'拳头');if(key===h.gearKey)return;h.gearKey=key;
 if(h.gear)h.gear.dispose();h.gear=null;if(key==='拳头')return;
 const bone=h.skeleton.bones.find(b=>b.name==='weapon_socket.R');if(!bone)return;
 const holder=new BABYLON.TransformNode('maipi-held-equipment',battle3D.scene);holder.attachToBone(bone,h.body);h.gear=holder;
 const mat=b3Material('maipi-gun-metal','#303c43');
 function part(name,w,height,d,x,y,z){const m=BABYLON.MeshBuilder.CreateBox(name,{width:w,height,depth:d},battle3D.scene);m.parent=holder;m.position.set(x,y,z);m.material=mat;m.isPickable=false;return m}
 if(w){part('receiver',.07,.09,.32,0,0,-.12);part('barrel',.025,.025,key.includes('98')||key==='AWM'?.5:.25,0,.02,-.38);part('grip',.05,.12,.06,0,-.08,-.03);part('stock',.06,.07,.18,0,0,.1);part('magazine',.055,.14,.09,0,-.1,-.16)}
 else if(key==='平底锅'){const m=BABYLON.MeshBuilder.CreateCylinder('pan',{diameter:.3,height:.025,tessellation:20},battle3D.scene);m.parent=holder;m.position.z=-.24;m.material=mat;part('pan-handle',.035,.035,.2,0,0,-.04)}
 else part('melee-blade',.055,.015,key==='匕首'?.22:.45,0,0,-.18);
}
function syncMaipiModel(visible){
 const h=battle3D.hero;if(!h)return;
 h.root.setEnabled(visible);if(!visible)return;
 h.root.position.set(p.x,2,p.y);
 const w=weapon(),moving=p.movedUntil>time,dx=h.lastX===null?0:p.x-h.lastX,dy=h.lastY===null?0:p.y-h.lastY;
 if(w||p.meleeUntil>time)h.facing=aimAngle();else if(Math.hypot(dx,dy)>.01)h.facing=Math.atan2(dy,dx);
 h.lastX=p.x;h.lastY=p.y;h.root.rotation.y=Math.PI/2-h.facing;
 maipiGear(h,w);
 let action=p.blinkUntil>time?'Blink':p.meleeUntil>time?(p.melee?'Melee':'Punch'):reloading>0?'Reload':moving?((keys.Shift||keys.shift)?'Walk':'Run'):w?'RifleIdle':'Idle';
 if(action!==h.action){if(h.action)h.groups.get(h.action)?.stop();const group=h.groups.get(action)||h.groups.get('Idle');group.start(['Idle','RifleIdle','Run','Walk'].includes(action),action==='Punch'?1.8:1);h.action=action;h.paused=false;}
 const group=h.groups.get(h.action),paused=state!=='playing';
 if(paused&&!h.paused)group?.pause();else if(!paused&&h.paused)group?.play(['Idle','RifleIdle','Run','Walk'].includes(h.action));h.paused=paused;
}
