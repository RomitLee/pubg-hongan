'use strict';
let vehicles=[],damageFlash=0,damageAngle=0,lastDamageAngle=0,noise=null;
function aimAngle(){return Math.atan2((mouse.y-(H/2-48))/PROJECTION,mouse.x-W/2)}
function insideBuilding(o){return buildings.find(b=>rectHit(o.x,o.y,0,b))}
const meleeStats={'拳头':{damage:24,range:82,rate:.48,row:0},'平底锅':{damage:58,range:100,rate:.75,row:1},'匕首':{damage:38,range:90,rate:.32,row:2},'砍刀':{damage:65,range:120,rate:.7,row:3}};
function projectileHits(b,o){const boss=o.bossId!==undefined,h=boss?158:100,w=boss?48:23,dy=(b.y-o.y)*PROJECTION-48+h*.5;return ((b.x-o.x)/w)**2+(dy/(h*.5))**2<=1}
function punch(){if(shotTimer>0||heal)return;breakStealth();const m=meleeStats[p.melee||'拳头'];shotTimer=m.rate;p.meleeUntil=time+.32;p.meleeAngle=aimAngle();effects.push({x:p.x+Math.cos(p.meleeAngle)*45,y:p.y+Math.sin(p.meleeAngle)*45-40/PROJECTION,r:24,color:'#f7dfaa',life:.18});for(const e of enemies.filter(e=>e.hp>0&&dist(e,p)<m.range&&Math.cos(Math.atan2(e.y-p.y,e.x-p.x)-p.meleeAngle)>.25&&lineClear(p,e))){e.hp-=m.damage;e.playerHit=true;e.memory={x:p.x,y:p.y,until:time+3}}}
function rebalanceGroundLoot(){let gunIndex=0,gearIndex=0;loot=loot.filter(i=>{if(i.kind==='gun')return ++gunIndex%4===0;if((i.kind==='helmet'||i.kind==='vest')&&i.level===3)return ++gearIndex%12===0;return true});const anchors=loot.filter(i=>i.kind==='ammo');for(let i=0;i<anchors.length;i+=9){const o=anchors[i];loot.push({x:o.x+24,y:o.y,kind:'melee',name:['平底锅','匕首','砍刀'][Math.floor(i/9)%3],count:1})}}
function updateEnemy(e,dt){
if(e.bossId!==undefined){updateBoss(e,dt);return}
if(e.hp<=0)return;if(e.stunned>0){e.stunned-=dt;return}e.cd-=dt;e.wander-=dt;e.walking=false;
const d=dist(e,p),angle=Math.atan2(p.y-e.y,p.x-e.x),delta=Math.atan2(Math.sin(angle-e.angle),Math.cos(angle-e.angle));
const room=insideBuilding(p),sameHouse=room===insideBuilding(e);
// 屋外不能隔墙锁定屋内玩家；门口必须具有真实视线，并且距离足够近。
const hidden=skill.active==='stealth'&&skill.left>0||inSmoke(p)||smokeOccludes(e,p);if(hidden&&inSmoke(p))e.memory=null;
const visible=!hidden&&d<(keys.shift?300:440)&&Math.abs(delta)<1.05&&lineClear(e,p)&&(!room||sameHouse||d<110);
const close=!hidden&&d<65&&lineClear(e,p)&&(!room||sameHouse);
if(visible||close){e.memory={x:p.x,y:p.y,until:time+3};e.angle=angle;
if(d>(e.type===2?330:190)){move(e,Math.cos(angle)*75*dt,Math.sin(angle)*75*dt,13);e.walking=true}
if(e.cd<=0){let g=guns[e.gun.name];if(e.gun.rounds>0){e.gun.rounds--;e.cd=Math.max(.85,g.rate*4);let a=angle+rand(-.16,.16);bullets.push({x:e.x+Math.cos(a)*22,y:e.y+Math.sin(a)*22,vx:Math.cos(a)*480,vy:Math.sin(a)*480,life:1.4,damage:g.damage*.42,enemy:true})}else if(e.reserve>0){let n=Math.min(g.cap,e.reserve);e.gun.rounds=n;e.reserve-=n;e.cd=g.reload}}
}else{
if(!hidden&&noise&&noise.until>time&&dist(e,noise)<480)e.memory={x:noise.x,y:noise.y,until:time+3};
if(!hidden&&p.vehicle&&d<380)e.memory={x:p.x,y:p.y,until:time+2};
if(!hidden&&e.memory&&e.memory.until>time&&dist(e,e.memory)>24){e.angle=Math.atan2(e.memory.y-e.y,e.memory.x-e.x);move(e,Math.cos(e.angle)*65*dt,Math.sin(e.angle)*65*dt,13);e.walking=true}
else{if(e.wander<=0){e.wander=rand(2,5);e.angle=rand(0,Math.PI*2)}move(e,Math.cos(e.angle)*30*dt,Math.sin(e.angle)*30*dt,13);e.walking=true}
}}
function initVehicles(){vehicles=[{x:550,y:1000,type:'car',name:'汽车',speed:430,angle:-Math.PI/2},{x:1640,y:580,type:'bike',name:'摩托车',speed:510,angle:0},{x:1000,y:1618,type:'boat',name:'游艇',speed:370,angle:0}];if(mapId===0){vehicles[0].x=950;vehicles[0].y=1345;vehicles[1].x=1200;vehicles[1].y=1035;vehicles[2].x=1200;vehicles[2].y=1540}vehicles.forEach(v=>{v.x*=MAP_SCALE;v.y*=MAP_SCALE});for(let i=0;i<places.length;i+=2){let a=places[i],x=a.x+450,y=a.y+450;if(!blocked(x,y,24))vehicles.push({x,y,type:i%4?'bike':'car',name:i%4?'摩托车':'汽车',speed:i%4?510:430,angle:0})}p.vehicle=null}
function nearVehicle(){return vehicles.find(v=>dist(v,p)<85)}
function toggleVehicle(){if(bag)return;if(p.vehicle){const v=p.vehicle;for(let r of [55,75,100,125,200,300,400])for(let a=0;a<Math.PI*2;a+=Math.PI/8){const x=v.x+Math.cos(a)*r,y=v.y+Math.sin(a)*r;if(!blocked(x,y,14)){p.x=x;p.y=y;p.vehicle=null;toast('已离开'+v.name);return}}toast('这里无法安全下船，请靠近河岸');return}let v=nearVehicle();if(v){p.vehicle=v;p.x=v.x;p.y=v.y;heal=reloading=0;toast('驾驶'+v.name+' · 方向键移动 · F 离开')}}
function driveVehicle(dx,dy,dt){if(bag||(!dx&&!dy))return;let v=p.vehicle,d=Math.hypot(dx,dy),nx=v.x+dx/d*v.speed*dt,ny=v.y+dy/d*v.speed*dt;v.angle=Math.atan2(dy,dx);if(v.type==='boat'){const valid=mapId===0?(nx>30*MAP_SCALE&&nx<2370*MAP_SCALE&&ny>30*MAP_SCALE&&ny<2370*MAP_SCALE&&!erangelLand(nx/MAP_SCALE,ny/MAP_SCALE)):nx>120*MAP_SCALE&&nx<2280*MAP_SCALE&&ny>1572*MAP_SCALE&&ny<1678*MAP_SCALE&&!((nx>460*MAP_SCALE&&nx<640*MAP_SCALE)||(nx>1750*MAP_SCALE&&nx<1930*MAP_SCALE));if(valid){v.x=nx;v.y=ny}}else if(!blocked(nx,ny,v.type==='car'?24:15)){v.x=nx;v.y=ny}p.x=v.x;p.y=v.y}
function drawVehicles(){for(const v of vehicles){if(drawRasterVehicle(v))continue;ctx.save();ctx.translate(v.x,v.y);ctx.rotate(v.angle);ctx.fillStyle='#0005';ctx.fillRect(-35,-15,75,36);if(v.type==='bike'){roundRect(-25,-6,50,12,5,'#1c2429');roundRect(-13,-11,28,22,6,'#d99849');ctx.fillStyle='#d6e2e5';ctx.fillRect(14,-15,4,30)}else if(v.type==='boat'){ctx.fillStyle='#e5e8de';ctx.beginPath();ctx.moveTo(48,0);ctx.lineTo(15,-23);ctx.lineTo(-43,-22);ctx.lineTo(-43,22);ctx.lineTo(15,23);ctx.closePath();ctx.fill();roundRect(-17,-15,35,30,3,'#557f91');roundRect(-31,-15,12,30,2,'#d3bda0')}else{for(let x of [-23,20])for(let y of [-23,17])roundRect(x,y,14,8,2,'#1e252b');roundRect(-39,-19,78,38,8,'#a66e43');roundRect(-16,-16,35,32,5,'#354e61');ctx.fillStyle='#f9ecc3';ctx.fillRect(32,-15,5,8);ctx.fillRect(32,7,5,8)}if(p.vehicle===v){ctx.fillStyle='#e9cf88';ctx.beginPath();ctx.arc(0,0,7,0,7);ctx.fill()}ctx.restore()}}
function buildInteriors(){for(const [i,b] of buildings.entries()){
// Three distinct residential plans; other buildings have purpose-specific rooms.
const wallStart=walls.length;const home=/民居|住宅|小屋|宿舍/.test(b.label),n=home?(b.w<150?2:i%2?3:2):b.label.includes('教学')?3:b.label.includes('航站')?2:1;
b.rooms=[];const split=b.y+b.h*.47,roomW=(b.w-26)/n;
for(let j=0;j<n;j++){const x=b.x+13+j*roomW;const label=home?'卧室 '+(j+1):b.label.includes('教学')?'教室 '+(j+1):b.label.includes('便利')?'货架区':'作业区';b.rooms.push({x,y:b.y+13,w:roomW,h:split-b.y-13,label});
const door=Math.min(42,roomW*.7);walls.push({x,y:split,w:Math.max(4,(roomW-door)/2),h:10},{x:x+(roomW+door)/2,y:split,w:Math.max(4,(roomW-door)/2),h:10});if(j)walls.push({x,y:b.y+13,w:9,h:split-b.y-13});}
b.rooms.push({x:b.x+13,y:split+10,w:b.w-26,h:b.y+b.h-split-23,label:home?'客厅 / 餐厅':'大厅 / 补给区'});
b.plan=home?n+'室一厅':b.label;b.label+=' · '+(home?b.plan:'功能分区');
for(let k=wallStart;k<walls.length;k++)walls[k].structure=true;
// Furnish upper rooms, leaving doorways and downstairs loot accessible.
for(let j=0;j<n;j++){let x=b.x+25+j*roomW;walls.push({x,y:b.y+25,w:Math.max(6,Math.min(35,roomW-24)),h:34,furniture:true})}
}}
function drawRooms(){for(const b of buildings){if(!sceneVisible(b,800))continue;for(const [i,r] of b.rooms.entries()){ctx.fillStyle=['#b1a086','#899b99','#aaa28a','#a5917e'][i%4];ctx.fillRect(r.x,r.y,r.w,r.h);drawRasterFloor(r,i);if(rectHit(p.x,p.y,0,b)){ctx.fillStyle='#293b3b';ctx.font='11px system-ui';ctx.textAlign='center';ctx.fillText(r.label,r.x+r.w/2,r.y+r.h*.72)}}// sofa, rug and table in the living room
let r=b.rooms[b.rooms.length-1];if(assetReady('world')){atlasSprite('world',12,r.x+12,r.y+10,125,110/PROJECTION);atlasSprite('world',13,r.x+r.w-160,r.y+15,140,120/PROJECTION);for(let room of b.rooms.slice(0,-1))atlasSprite('world',14,room.x+35,room.y+35,95,110/PROJECTION);continue}roundRect(r.x+12,r.y+13,45,15,3,'#617378');roundRect(r.x+r.w-50,r.y+12,33,22,3,'#8b654d');}}
function drawDamage(){if(damageFlash<=0)return;ctx.save();ctx.globalAlpha=Math.min(.9,damageFlash);artTile('effects',15,0,0,W,H);ctx.translate(W/2,H/2);ctx.rotate(Math.atan2(Math.sin(damageAngle)*PROJECTION,Math.cos(damageAngle)));artTile('effects',11,75,-35,70,70);ctx.restore()}
