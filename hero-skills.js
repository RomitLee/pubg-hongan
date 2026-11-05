'use strict';
const heroSkills=[{name:'闪现',cd:3,duration:0},{name:'旋风腿',cd:14,duration:2.5},{name:'坚盾',cd:18,duration:5},{name:'飞钩',cd:10,duration:0},{name:'警犬出击',cd:26,duration:14},{name:'隐身',cd:22,duration:8}];
let skill={cd:0,left:0,active:null},dogs=[],hook=null;
function resetSkill(){skill={cd:0,left:0,active:null};dogs=[];hook=null}
function skillHud(){const s=heroSkills[selected];return '[ 空格 ] '+s.name+' · '+(skill.left>0?'持续 '+skill.left.toFixed(1)+'s':skill.cd>0?'冷却 '+Math.ceil(skill.cd)+'s':'准备就绪')}
function breakStealth(){if(skill.active==='stealth'){skill.left=0;skill.active=null;toast('主动攻击，隐身解除')}}
function useSkill(){if(state!=='playing'||bag||p.vehicle)return;if(skill.cd>0){toast('技能冷却中：'+Math.ceil(skill.cd)+'秒');return}const s=heroSkills[selected],angle=aimAngle();
if(selected===0){let target=null;for(let d=8;d<=720;d+=8){let x=p.x+Math.cos(angle)*d,y=p.y+Math.sin(angle)*d;if(blocked(x,y,14))break;target={x,y}}if(!target){toast('前方被阻挡，无法闪现');return}effects.push({x:p.x,y:p.y,r:33,color:'#c1f5a7',life:.3});p.x=target.x;p.y=target.y;p.blinkUntil=time+.6;effects.push({x:p.x,y:p.y,r:36,color:'#d5ffbd',life:.3})}
if(selected===1){skill.active='spin';skill.left=s.duration;breakStealth()}
if(selected===2){skill.active='shield';skill.left=s.duration}
if(selected===3){const targets=enemies.filter(e=>e.hp>0&&dist(e,p)<550&&Math.cos(Math.atan2(e.y-p.y,e.x-p.x)-angle)>.86&&lineClear(e,p)).sort((a,b)=>dist(a,p)-dist(b,p));let e=targets[0];if(e){hook={target:e,left:.5};e.stunned=.65}else{hook={x:p.x+Math.cos(angle)*500,y:p.y+Math.sin(angle)*500,left:.35};toast('飞钩未命中')}}
if(selected===4){dogs=[];for(let i=0;i<4;i++){let a=i*Math.PI/2,o={x:p.x,y:p.y,life:s.duration,attack:0,angle:a};move(o,Math.cos(a)*32,Math.sin(a)*32,8);dogs.push(o)}skill.active='dogs';skill.left=s.duration}
if(selected===5){skill.active='stealth';skill.left=s.duration;noise=null;enemies.forEach(e=>e.memory=null)}
skill.cd=s.cd;toast(s.name+' 已释放');updateHud()}
function updateSkill(dt){skill.cd=Math.max(0,skill.cd-dt);if(skill.left>0){skill.left=Math.max(0,skill.left-dt);if(!skill.left)skill.active=null}
if(skill.active==='spin')for(const e of enemies)if(e.hp>0&&dist(e,p)<125&&lineClear(e,p)){e.hp-=90*dt;e.playerHit=true;e.memory={x:p.x,y:p.y,until:time+3}}
if(hook){hook.left-=dt;if(hook.target&&hook.target.hp>0){let e=hook.target,d=dist(e,p),a=Math.atan2(p.y-e.y,p.x-e.x);if(d>52)move(e,Math.cos(a)*Math.min(d-52,1250*dt),Math.sin(a)*Math.min(d-52,1250*dt),13);e.stunned=Math.max(e.stunned||0,.2)}if(hook.left<=0)hook=null}
for(const dog of dogs){dog.life-=dt;dog.attack-=dt;let target=enemies.filter(e=>e.hp>0&&dist(e,dog)<650&&lineClear(dog,e)).sort((a,b)=>dist(a,dog)-dist(b,dog))[0],goal=target||p;dog.angle=Math.atan2(goal.y-dog.y,goal.x-dog.x);let d=dist(dog,goal);if(d>(target?30:70))move(dog,Math.cos(dog.angle)*310*dt,Math.sin(dog.angle)*310*dt,8);if(target&&d<48&&dog.attack<=0&&lineClear(dog,target)){target.hp-=22;target.playerHit=true;dog.attack=.65;effects.push({x:target.x,y:target.y,r:17,color:'#ffcb80',life:.1})}}
dogs=dogs.filter(d=>d.life>0);
}
function drawSkill(){if(skill.active==='shield')effectSprite(5,p.x,p.y-35,130,180);if(skill.active==='spin')effectSprite(6,p.x,p.y,250,250,time*7);if(hook){let e=hook.target||hook,dx=e.x-p.x,dy=e.y-p.y,a=Math.atan2(dy,dx),length=Math.hypot(dx,dy);ctx.save();ctx.translate(p.x,p.y-22);ctx.rotate(a);artTile('effects',8,0,-5,length,10);artTile('effects',7,length-22,-22,44,44);ctx.restore()}for(const d of dogs){if(!sceneVisible(d,140))continue;ctx.save();ctx.translate(d.x,d.y);ctx.scale(Math.cos(d.angle)<0?-1:1,1/PROJECTION);effectSprite(9,0,8,90,24);const frame=dist(d,p)>70||enemies.some(e=>dist(e,d)<650)?13+Math.floor(time*9)%2:12;artTile('infrastructure',frame,-55,-65+Math.sin(time*12)*2,110,80);ctx.restore()}}
function expandWorld(){wallIndex=null;
// Spread destinations 3x farther apart, retain established building and room dimensions.
const sizeScale=Math.min(MAP_SCALE,5.2),base=buildings.map(b=>({b,x:b.x,y:b.y,w:b.w,h:b.h})),seen=new Set();
for(const o of [...walls,...loot,...trees,...containers]){if(seen.has(o))continue;seen.add(o);const owner=base.find(b=>o.x>=b.x&&o.x<=b.x+b.w&&o.y>=b.y&&o.y<=b.y+b.h);o.x=owner?owner.x*MAP_SCALE+(o.x-owner.x)*sizeScale:o.x*MAP_SCALE;o.y=owner?owner.y*MAP_SCALE+(o.y-owner.y)*sizeScale:o.y*MAP_SCALE;for(const k of ['w','h','r'])if(typeof o[k]==='number')o[k]*=owner?sizeScale:Math.min(MAP_SCALE,3.2);}
for(const a of base){const b=a.b;for(const r of b.rooms){r.x=a.x*MAP_SCALE+(r.x-a.x)*sizeScale;r.y=a.y*MAP_SCALE+(r.y-a.y)*sizeScale;r.w*=sizeScale;r.h*=sizeScale;}b.x*=MAP_SCALE;b.y*=MAP_SCALE;b.w*=sizeScale;b.h*=sizeScale;}
for(const a of places){a.baseX??=a.x;a.baseY??=a.y;a.x=a.baseX*MAP_SCALE;a.y=a.baseY*MAP_SCALE;}
for(const b of buildings){for(const r of b.rooms){const x=r.x+r.w*.65,y=r.y+r.h*.62;for(const item of [{x,y,kind:'ammo',name:'5.56毫米',count:40},{x:x+35,y,kind:'smoke',name:'烟雾弹',count:2}])if(!blocked(item.x,item.y,5))loot.push(item)}}
}

let wallIndex=null;
function rebuildWallIndex(){wallIndex=new Map();for(const w of walls)for(let x=Math.floor(w.x/256);x<=Math.floor((w.x+w.w)/256);x++)for(let y=Math.floor(w.y/256);y<=Math.floor((w.y+w.h)/256);y++){const k=x+','+y;if(!wallIndex.has(k))wallIndex.set(k,[]);wallIndex.get(k).push(w)}}
function wallCandidates(x,y,r){if(!wallIndex)return walls;const found=new Set();for(let xx=Math.floor((x-r)/256);xx<=Math.floor((x+r)/256);xx++)for(let yy=Math.floor((y-r)/256);yy<=Math.floor((y+r)/256);yy++)for(const w of wallIndex.get(xx+','+yy)||[])found.add(w);return [...found]}
function addWildSupplies(){for(let i=0;i<100;i++){let o,tries=0;do{o={x:rand(100,WORLD-100),y:rand(100,WORLD-100)}}while(++tries<100&&(blocked(o.x,o.y,20)||insideBuilding(o)));if(tries>=100)continue;loot.push({...o,kind:'ammo',name:'5.56毫米',count:60},{x:o.x+25,y:o.y,kind:'med',name:'急救包',count:1});if(i%3===0)loot.push({x:o.x,y:o.y+25,kind:'gun',name:i%2?'AKM':'M416',count:1});}}
