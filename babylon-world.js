'use strict';
// World coordinates remain x/y in gameplay; Babylon uses x/height/z.
// Characters are animated image planes in a genuinely perspective 3D world.
const battle3D={engine:null,scene:null,camera:null,objects:new Map(),materials:new Map(),roofGroups:[],ready:false};
function b3Material(name,color){if(battle3D.materials.has(name))return battle3D.materials.get(name);const m=new BABYLON.StandardMaterial(name,battle3D.scene);m.diffuseColor=BABYLON.Color3.FromHexString(color);m.specularColor=new BABYLON.Color3(.06,.06,.06);battle3D.materials.set(name,m);return m}
function b3Atlas(key){const id='atlas-'+key;if(battle3D.materials.has(id))return battle3D.materials.get(id);const m=b3Material(id,'#ffffff'),a=rasterAssets[key];m.diffuseTexture=new BABYLON.Texture(a.src,battle3D.scene,false,false);m.diffuseTexture.hasAlpha=true;m.useAlphaFromDiffuseTexture=true;m.backFaceCulling=false;m.transparencyMode=BABYLON.Material.MATERIAL_ALPHATEST;m.alphaCutOff=.22;m.specularColor=BABYLON.Color3.Black();return m}
function b3UV(mesh,col,row,cols,rows){const pad=.003,u0=col/cols+pad,u1=(col+1)/cols-pad,v0=1-(row+1)/rows+pad,v1=1-row/rows-pad;mesh.setVerticesData(BABYLON.VertexBuffer.UVKind,[u0,v0,u1,v0,u1,v1,u0,v1]);}
function b3Sprite(name,key,col,row,cols,rows,width,height,ground=false){const m=BABYLON.MeshBuilder.CreatePlane(name,{width,height,sideOrientation:BABYLON.Mesh.FRONTSIDE},battle3D.scene);m.material=b3Atlas(key);b3UV(m,col,row,cols,rows);if(ground)m.rotation.x=Math.PI/2;else m.billboardMode=BABYLON.Mesh.BILLBOARDMODE_Y;m.isPickable=false;return m}
function b3Box(name,x,z,w,d,h,material,y=0){const m=BABYLON.MeshBuilder.CreateBox(name,{width:w,depth:d,height:h},battle3D.scene);m.position.set(x+w/2,y+h/2,z+d/2);m.material=material;m.isPickable=false;m.receiveShadows=true;return m}
function b3Terrain(){
 const s=battle3D.scene,water=b3Material('sea','#245a70');const sea=BABYLON.MeshBuilder.CreateGround('sea',{width:WORLD*3,height:WORLD*3},s);sea.position.set(WORLD/2,-4,WORLD/2);sea.material=water;sea.isPickable=false;
 // Bake only terrain and roads. Buildings are separate meshes, so every scene
 // object responds to exactly the same camera during flight and landing.
 const tex=new BABYLON.DynamicTexture('island-surface',{width:4096,height:4096},s,false),c=tex.getContext(),q=4096/2400;
 c.fillStyle='#295368';c.fillRect(0,0,4096,4096);c.save();c.scale(q,q);
 for(const poly of [mainland,military]){c.beginPath();poly.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.save();c.clip();c.fillStyle='#74815c';c.fillRect(0,0,2400,2400);const a=rasterAssets.terrain,cw=a.naturalWidth/4,ch=a.naturalHeight/4;for(let x=0;x<2400;x+=90)for(let y=0;y<2400;y+=90)c.drawImage(a,5,5,cw-10,ch-10,x,y,90,90);c.restore();c.strokeStyle='#baa782';c.lineWidth=6;c.stroke();}
 const path=(pts,color,width)=>{c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.lineJoin='round';c.strokeStyle=color;c.lineWidth=width;c.stroke()};
 path(islandRiver,'#b5ad8c',29);path(islandRiver,'#295368',19);
 for(const road of islandRoads){path(road,'#aeac91',17);path(road,'#676e69',11);c.setLineDash([8,12]);path(road,'#d7d4b7',.8);c.setLineDash([])}
 c.fillStyle='#737e79';c.fillRect(960,1865,520,55);c.fillStyle='#ece8ca';for(let x=980;x<1460;x+=50)c.fillRect(x,1890,22,3);c.restore();tex.update();
 const ground=BABYLON.MeshBuilder.CreateGround('island',{width:WORLD,height:WORLD},s);ground.position.set(WORLD/2,0,WORLD/2);const mat=b3Material('island','#ffffff');mat.diffuseTexture=tex;ground.material=mat;ground.isPickable=false;
}
function b3Structures(){
 const wallMat=b3Material('plaster','#b7b1a1'),wood=b3Material('wood','#897359'),roofMat=b3Material('roof','#6a625b');
 for(const b of buildings){const local=walls.filter(w=>w.structure&&w.x>=b.x-1&&w.x<=b.x+b.w&&w.y>=b.y-1&&w.y<=b.y+b.h),parts=[];
  for(const w of local)parts.push(b3Box('wall',w.x,w.y,w.w,w.h,95,wallMat));
  const merged=parts.length?BABYLON.Mesh.MergeMeshes(parts,true,true,undefined,false,true):null;
  const floor=b3Box('floor',b.x,b.y,b.w,b.h,2,wood,1);
  const roof=b3Box('roof',b.x-8,b.y-8,b.w+16,b.h+16,14,roofMat,96);
  battle3D.roofGroups.push({building:b,roof,wall:merged});floor.freezeWorldMatrix();
 }
 for(const w of walls.filter(w=>w.furniture))b3Box('furniture',w.x,w.y,w.w,w.h,34,wood);
 for(const c of containers)b3Box('container',c.x,c.y,c.w,c.h,65,b3Material('steel','#657b80'));
 // Retain authored tree artwork as cutout scene assets rather than flat map paint.
 for(let i=0;i<trees.length;i++){const t=trees[i],n=i%3?5:4,h=Math.max(160,t.r*2.5),m=b3Sprite('tree','world',n%4,Math.floor(n/4),4,4,h*.75,h);m.position.set(t.x,h*.46,t.y);m.freezeWorldMatrix();}
}
async function prepareBattle3D(){
 if(!(typeof BABYLON.Engine.IsSupported==='function'?BABYLON.Engine.IsSupported():BABYLON.Engine.IsSupported))throw Error('此浏览器无法启动 WebGL，请开启硬件加速或使用新版电脑浏览器。');
 if(!battle3D.engine){const surface=document.createElement('canvas');surface.id='world3d';document.body.prepend(surface);battle3D.engine=new BABYLON.Engine(surface,true,{preserveDrawingBuffer:false,stencil:true,powerPreference:'high-performance'});battle3D.engine.setHardwareScalingLevel(Math.max(1,devicePixelRatio/1.5));addEventListener('resize',()=>battle3D.engine.resize());}
 battle3D.ready=false;if(battle3D.scene)battle3D.scene.dispose();battle3D.objects.clear();battle3D.materials.clear();battle3D.roofGroups=[];
 const s=battle3D.scene=new BABYLON.Scene(battle3D.engine);s.useRightHandedSystem=true;s.clearColor=new BABYLON.Color4(.38,.53,.61,1);s.fogMode=BABYLON.Scene.FOGMODE_EXP2;s.fogColor=new BABYLON.Color3(.38,.53,.61);s.fogDensity=.000035;
 const sky=new BABYLON.HemisphericLight('sky',new BABYLON.Vector3(0,1,0),s);sky.intensity=.85;sky.groundColor=new BABYLON.Color3(.3,.34,.28);const sun=new BABYLON.DirectionalLight('sun',new BABYLON.Vector3(-.5,-1,.4),s);sun.intensity=.65;
 battle3D.camera=new BABYLON.FreeCamera('battle-camera',new BABYLON.Vector3(0,900,-900),s);battle3D.camera.minZ=1;battle3D.camera.maxZ=WORLD*4;battle3D.camera.fov=.8;
 b3Terrain();b3Structures();
 await s.whenReadyAsync();battle3D.ready=true;b3Camera(true);
}
function b3Air(){return state==='paused'?resumeState:state}
function b3Altitude(){return b3Air()==='plane'?1500:b3Air()==='parachute'?1500*Math.pow(insertion.left/insertion.duration,1.25):0}
function b3Camera(){const h=b3Altitude(),c=battle3D.camera,target=new BABYLON.Vector3(p.x,h,p.y);c.position.set(p.x,h+950+h*.9,p.y+950+h*.9);c.setTarget(target);c.getViewMatrix(true);c.getProjectionMatrix(true);}
function b3Aim(){if(!battle3D.ready||!p)return 0;const s=battle3D.scene,ray=s.createPickingRay(mouse.x* battle3D.engine.getRenderWidth()/W,mouse.y*battle3D.engine.getRenderHeight()/H,BABYLON.Matrix.Identity(),battle3D.camera),d=ray.intersectsPlane(new BABYLON.Plane(0,1,0,-48));if(d===null)return 0;const at=ray.origin.add(ray.direction.scale(d));return Math.atan2(at.z-p.y,at.x-p.x)}
function b3Sync(id,make,update,seen){let m=battle3D.objects.get(id);if(!m){m=make();battle3D.objects.set(id,m)}seen.add(id);m.setEnabled(true);update(m);return m}
function b3Actor(o,player,seen){const boss=o.bossId!==undefined,moving=o.movedUntil>time||o.walking;let key,col,row,cols,rows;
 if(boss){key='bosses';cols=4;rows=4;col=o.bossId%4;row=Math.floor(o.bossId/4)}else if(!player){key='minions';cols=7;rows=8;row=o.visual??0;col=moving?Math.floor(o.runPhase||time*7)%7:0}else if(!weapon()){key='melee';cols=rows=4;row=meleeStats[p.melee||'拳头'].row;col=p.meleeUntil>time?Math.min(3,Math.floor((.32-p.meleeUntil+time)/.08)):0}else{key=moving?'running':'characters';cols=moving?8:4;rows=moving?8:2;row=moving?selected:Math.floor(selected/4);col=moving?Math.floor(o.runPhase||0)%8:selected%4}
 const h=boss?190:112,a=rasterAssets[key],w=h*(a.naturalWidth/cols)/(a.naturalHeight/rows);
 b3Sync(o,()=>b3Sprite('actor',key,col,row,cols,rows,w,h),m=>{m.material=b3Atlas(key);m.scaling.x=w/(m.getBoundingInfo().boundingBox.maximum.x*2);b3UV(m,col,row,cols,rows);m.position.set(o.x,h*.45+(player?b3Altitude():0),o.y);m.visibility=player&&skill.active==='stealth'?.3:1},seen);
}
function b3Project(x,y,z){return BABYLON.Vector3.Project(new BABYLON.Vector3(x,y,z),BABYLON.Matrix.Identity(),battle3D.scene.getTransformMatrix(),new BABYLON.Viewport(0,0,W,H))}
function b3Label(o,text,color,height=125){const q=b3Project(o.x,height,o.y);if(q.z<0||q.z>1||q.x<0||q.x>W||q.y<0||q.y>H)return;ctx.save();ctx.font='bold 14px system-ui';ctx.textAlign='center';ctx.lineWidth=5;ctx.strokeStyle='#09151e';ctx.strokeText(text,q.x,q.y);ctx.fillStyle=color;ctx.fillText(text,q.x,q.y);if(o.bossId!==undefined){ctx.fillStyle='#180e20dd';ctx.fillRect(q.x-100,q.y+9,200,13);ctx.fillStyle=color;ctx.fillRect(q.x-98,q.y+11,196*Math.max(0,o.hp/o.maxHp),9);ctx.font='12px system-ui';ctx.fillStyle='#fff';ctx.fillText(Math.ceil(o.hp)+' / '+o.maxHp,q.x,q.y+38)}ctx.restore()}
function drawBattle3D(){
 if(!battle3D.ready||!p)return;const surface=document.querySelector('#world3d');surface.hidden=['menu','loading'].includes(state);if(surface.hidden)return;
 b3Camera();const seen=new Set(),air=b3Air();
 for(const g of battle3D.roofGroups){const inside=rectHit(p.x,p.y,30,g.building);g.roof.setEnabled(!inside);if(g.wall)g.wall.visibility=inside?.3:1;}
 for(const e of enemies)if(dist(e,p)<5500)b3Actor(e,false,seen);
 if(!p.vehicle&&air!=='plane'&&air!=='parachute')b3Actor(p,true,seen);
 for(const v of vehicles){if(dist(v,p)>5500)continue;const n=v.type==='bike'?9:v.type==='boat'?10:8;b3Sync(v,()=>b3Sprite('vehicle','world',n%4,Math.floor(n/4),4,4,145,120),m=>m.position.set(v.x,50,v.y),seen)}
 if(air==='plane'||air==='parachute'){const n=air==='plane'?3:0,h=air==='plane'?400:210;b3Sync('air',()=>b3Sprite('air','air',n%2,Math.floor(n/2),2,2,h,h),m=>{b3UV(m,n%2,Math.floor(n/2),2,2);m.scaling.setAll(h/400);m.position.set(p.x,b3Altitude()+h*.6,p.y)},seen)}
 for(const i of [...loot,...boxes]){if(dist(i,p)>2200)continue;const box=!!i.items,n=box?8:itemAtlasIndex(i),color=box?'#ffce78':i.kind==='gun'?'#ffe59d':'#90efe0';b3Sync(i,()=>b3Sprite('loot',box?'effects':'items',n%4,Math.floor(n/4),4,4,box?72:42,box?72:42),m=>{m.position.set(i.x,24+Math.sin(time*3+i.x)*3,i.y)},seen);if(dist(i,p)<350&&!i.empty)b3Label(i,box?'◆ 战利品箱':i.name,color,65)}
 for(const b of bullets)b3Sync(b,()=>{const m=BABYLON.MeshBuilder.CreateSphere('bullet',{diameter:7,segments:4},battle3D.scene);m.material=b3Material('tracer','#ffe59d');m.material.emissiveColor=new BABYLON.Color3(1,.65,.2);return m},m=>m.position.set(b.x,48,b.y),seen);
 for(const sp of bossSpells)b3Sync(sp,()=>{let m;
 if(sp.shape==='line')m=BABYLON.MeshBuilder.CreateBox('spell',{width:sp.length,depth:sp.r*2,height:3},battle3D.scene);
 else {const vertices=[0,0,0],indices=[],ring=sp.shape==='ring',cone=sp.shape==='cone',count=64;vertices.length=0;
 for(let i=0;i<=count;i++){const a=cone?-.52+i/count*1.04:i/count*Math.PI*2,inner=ring?sp.r*.6:0;vertices.push(Math.cos(a)*inner,0,Math.sin(a)*inner,Math.cos(a)*sp.r,0,Math.sin(a)*sp.r);if(i<count){const j=i*2;indices.push(j,j+1,j+2,j+1,j+3,j+2)}}
 m=new BABYLON.Mesh('spell',battle3D.scene);const data=new BABYLON.VertexData();data.positions=vertices;data.indices=indices;data.normals=[];BABYLON.VertexData.ComputeNormals(vertices,indices,data.normals);data.applyToMesh(m)}
 const mat=b3Material('spell-'+sp.color,sp.color);mat.backFaceCulling=false;mat.emissiveColor=BABYLON.Color3.FromHexString(sp.color);mat.alpha=.48;m.material=mat;return m},m=>{m.position.set(sp.x,5,sp.y);m.rotation.y=-sp.angle;m.visibility=sp.delay>0?.35+.2*Math.sin(performance.now()*.012):.85},seen);
 for(const sm of smokes)b3Sync(sm,()=>{const m=BABYLON.MeshBuilder.CreateSphere('smoke',{diameter:sm.r*2,segments:12},battle3D.scene);const mat=b3Material('smoke','#d2dad8');mat.alpha=.72;m.material=mat;return m},m=>{const r=smokeRadius(sm)/sm.r;m.scaling.set(r,.4*r,r);m.position.set(sm.x,35,sm.y)},seen);
 for(const d of dogs)b3Sync(d,()=>b3Sprite('dog','infrastructure',1,3,4,4,90,65),m=>{const n=13+Math.floor(time*9)%2;b3UV(m,n%4,Math.floor(n/4),4,4);m.position.set(d.x,28,d.y)},seen);
 if(skill.left>0&&skill.active!=='stealth')b3Sync('skill',()=>{const m=BABYLON.MeshBuilder.CreateTorus('skill',{diameter:skill.active==='spin'?230:90,thickness:6,tessellation:40},battle3D.scene);m.material=b3Material('skill-'+selected,chars[selected][3]);return m},m=>{m.position.set(p.x,15,p.y);m.rotation.y=time*5},seen);
 for(const e of effects)b3Sync(e,()=>{const m=BABYLON.MeshBuilder.CreateTorus('impact',{diameter:(e.r||20)*2,thickness:4,tessellation:20},battle3D.scene);m.material=b3Material('impact-'+e.color,e.color||'#ffe59d');return m},m=>{m.position.set(e.x,48,e.y);m.visibility=Math.min(1,e.life*4)},seen);
 if(hook){const e=hook.target||hook;b3Sync('hook',()=>{const m=BABYLON.MeshBuilder.CreateBox('hook',{width:1,height:5,depth:5},battle3D.scene);m.material=b3Material('hook','#cb9eff');return m},m=>{m.position.set((p.x+e.x)/2,48,(p.y+e.y)/2);m.scaling.x=dist(p,e);m.rotation.y=-Math.atan2(e.y-p.y,e.x-p.x)},seen)}
 b3Sync('zone',()=>{const m=BABYLON.MeshBuilder.CreateCylinder('poison-wall',{diameter:2,height:320,tessellation:128,cap:BABYLON.Mesh.NO_CAP,sideOrientation:BABYLON.Mesh.DOUBLESIDE},battle3D.scene);const mat=b3Material('poison-wall','#a384ed');mat.alpha=.19;mat.emissiveColor=new BABYLON.Color3(.4,.2,.7);m.material=mat;return m},m=>{m.position.set(zone.x,155,zone.y);m.scaling.set(zone.r,1,zone.r)},seen);
 for(const [key,m] of battle3D.objects)if(!seen.has(key)){m.dispose();battle3D.objects.delete(key)}
 battle3D.scene.render();
 for(const e of enemies)if(e.bossId!==undefined&&dist(e,p)<1800)b3Label(e,'◆ '+bossTypes[e.bossId].name+' · '+bossTypes[e.bossId].spell,bossTypes[e.bossId].color,215);
 for(const v of vehicles)if(dist(v,p)<750)b3Label(v,(dist(v,p)<85?'[ F ] 驾驶 ':'◆ 可驾驶 · ')+v.name,'#91fff0',135);
 drawLocalMap();drawDamage();if(fullMapOpen)drawFullMap();
 if(state==='playing'&&!bag&&!fullMapOpen){ctx.strokeStyle='#fff4be';ctx.beginPath();ctx.arc(mouse.x,mouse.y,7,0,Math.PI*2);ctx.moveTo(mouse.x-13,mouse.y);ctx.lineTo(mouse.x+13,mouse.y);ctx.moveTo(mouse.x,mouse.y-13);ctx.lineTo(mouse.x,mouse.y+13);ctx.stroke()}
 hud.style.visibility=fullMapOpen?'hidden':'visible';
}
