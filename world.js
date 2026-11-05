'use strict';
const places=[{name:'海滨小镇',x:170,y:200},{name:'学校',x:980,y:260},{name:'加油站',x:1820,y:480},{name:'松林',x:300,y:1000},{name:'中央农场',x:1090,y:1100},{name:'东港集装箱',x:1850,y:1110},{name:'西跨海大桥',x:500,y:1600},{name:'东跨海大桥',x:1820,y:1600},{name:'机场',x:930,y:2040}];
let trees=[],containers=[];
function legacyterrainBlocked(x,y,r=12){x/=MAP_SCALE;y/=MAP_SCALE;r/=MAP_SCALE;if(x-r<100||x+r>2300||y-r<100||y+r>2300)return true;return y+r>1550&&y-r<1700&&!((x-r>480&&x+r<620)||(x-r>1770&&x+r<1910))}
function legacybuildWorld(){trees=[];containers=[];
const layout=[[180,210,235,215,'海滨民居'],[480,250,230,205,'海滨民居'],[940,210,390,280,'学校教学楼'],[1370,240,245,245,'学校宿舍'],[1830,260,280,215,'加油站便利店'],[1850,700,260,225,'东港仓库'],[1000,800,270,235,'农场住宅'],[1380,850,235,215,'农场粮仓'],[180,1220,250,220,'林间小屋'],[710,1200,270,245,'农场住宅'],[1120,1250,270,245,'农场住宅'],[1960,1250,250,245,'港口仓库'],[240,1860,270,245,'机场机库'],[660,1830,270,245,'机场机库'],[1670,1860,310,245,'航站楼'],[2040,1910,210,235,'塔台']];
layout.forEach(([x,y,w,h,label],i)=>{buildings.push({x,y,w,h,label});walls.push({x,y,w,h:13},{x,y,w:13,h},{x:x+w-13,y,w:13,h},{x,y:y+h-13,w:w/2-35,h:13},{x:x+w/2+35,y:y+h-13,w:w/2-35,h:13});let name=Object.keys(guns)[i%7];loot.push({x:x+45,y:y+h-65,name,kind:'gun',count:1},{x:x+100,y:y+h-65,name:guns[name].ammo,kind:'ammo',count:45},{x:x+155,y:y+h-65,name:['绷带','急救包','能量饮料','止痛药','医疗箱'][i%5],kind:'med',count:2},{x:x+w-45,y:y+h-45,...armorItem(i%2?'vest':'helmet',i%3+1)});});
for(let i=0;i<75;i++){let x=170+(i*113)%650,y=650+(i*197)%530;if(!buildings.some(b=>rectHit(x,y,35,b))){trees.push({x,y,r:22+i%16});walls.push({x:x-8,y:y-8,w:16,h:16})}}
for(let i=0;i<12;i++){let c={x:1700+(i%4)*110,y:1030+Math.floor(i/4)*65,w:86,h:43,color:['#a95242','#4e7b8b','#b49c50'][i%3]};containers.push(c);walls.push(c)}
}
function legacydrawTerrain(){ctx.save();ctx.scale(MAP_SCALE,MAP_SCALE);
ctx.fillStyle=mapId===2?'#294958':'#234e62';ctx.fillRect(-WORLD,-WORLD,WORLD*3,WORLD*3);rasterSurface(3,-1000,-1000,4400,4400,150);
roundRect(90,90,2220,2220,100,mapId===1?'#a18d60':mapId===2?'#abbdbb':'#637b4e');
drawRasterGround();
ctx.fillStyle=mapId===1?'#c1b286':mapId===2?'#cedcda':'#8c9a64';ctx.fillRect(130,1515,2140,220);
ctx.fillStyle=mapId===2?'#426772':'#2d657a';ctx.fillRect(90,1550,2220,150);rasterSurface(3,90,1550,2220,150,100);
ctx.strokeStyle='#ffffff18';ctx.lineWidth=2;for(let i=0;i<25;i++){let x=120+i*87;ctx.beginPath();ctx.moveTo(x,1595+i%3*20);ctx.lineTo(x+35,1595+i%3*20);ctx.stroke()}
// 主干道连接两座桥与南部机场。
ctx.strokeStyle='#62675e';ctx.lineWidth=70;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(320,500);ctx.lineTo(1840,500);ctx.lineTo(1840,2160);ctx.lineTo(550,2160);ctx.lineTo(550,500);ctx.moveTo(550,1160);ctx.lineTo(1840,1160);ctx.stroke();
for(const road of [[285,465,1590,70],[1805,500,70,1695],[515,500,70,1695],[550,2125,1290,70],[550,1125,1290,70]])rasterSurface(4,...road,80);ctx.strokeStyle='#d2c79a';ctx.lineWidth=2;ctx.setLineDash([18,18]);ctx.stroke();ctx.setLineDash([]);
for(let x of [480,1770]){ctx.fillStyle='#7f8d8e';ctx.fillRect(x,1530,140,190);for(let dx of [0,134]){ctx.fillStyle='#b3bcc0';ctx.fillRect(x+dx,1520,6,210);for(let y=1535;y<1720;y+=36)roundRect(x+dx-5,y,16,12,2,'#505d62')}ctx.strokeStyle='#d9d0af';ctx.setLineDash([15,12]);ctx.beginPath();ctx.moveTo(x+70,1530);ctx.lineTo(x+70,1720);ctx.stroke();ctx.setLineDash([])}
// 学校操场、跑道、停机坪、加油棚和油泵。
roundRect(1020,540,510,170,65,'#a56a4e');roundRect(1040,558,470,134,50,'#6e884e');ctx.strokeStyle='#e7dbc1';ctx.lineWidth=2;ctx.strokeRect(1100,570,350,110);ctx.beginPath();ctx.moveTo(1275,570);ctx.lineTo(1275,680);ctx.stroke();
roundRect(990,1810,550,420,10,'#555f62');ctx.fillStyle='#d4d6cd';ctx.fillRect(1255,1840,20,55);ctx.fillRect(1255,2140,20,55);for(let y=1920;y<2140;y+=70)ctx.fillRect(1261,y,8,35);ctx.font='bold 34px system-ui';ctx.textAlign='center';ctx.fillText('09',1265,2220);
for(let y of [1950,2080]){ctx.fillStyle='#b9c6c8';ctx.beginPath();ctx.moveTo(1070,y-45);ctx.lineTo(1080,y);ctx.lineTo(1130,y+20);ctx.lineTo(1080,y+10);ctx.lineTo(1070,y+45);ctx.lineTo(1060,y+10);ctx.lineTo(1010,y+20);ctx.lineTo(1060,y);ctx.closePath();ctx.fill()}
roundRect(1930,530,240,110,3,'#a8a9a1');ctx.fillStyle='#ac4f3d';ctx.fillRect(1920,520,260,18);for(let x=1960;x<2160;x+=65){roundRect(x,550,22,35,3,'#dfd5b8');ctx.fillStyle='#45575c';ctx.fillRect(x+4,555,14,10)}
if(assetReady('world'))atlasSprite('world',3,1900,490,290,170);ctx.restore();for(const c of containers){if(atlasSprite('world',15,c.x-8,c.y-45/PROJECTION,c.w+16,c.h+55/PROJECTION))continue;roundRect(c.x+4,c.y+5,c.w,c.h,2,'#0004');roundRect(c.x,c.y,c.w,c.h,2,c.color);ctx.strokeStyle='#ffffff22';for(let x=c.x+8;x<c.x+c.w;x+=12){ctx.beginPath();ctx.moveTo(x,c.y+3);ctx.lineTo(x,c.y+c.h-3);ctx.stroke()}}

}
function drawPlaceLabels(){ctx.textAlign='center';for(const a of places){ctx.font='bold 19px system-ui';ctx.fillStyle='#0006';ctx.fillText(a.name,a.x+2,a.y-35+2);ctx.fillStyle='#f4e7b9bb';ctx.fillText(a.name,a.x,a.y-35)}for(const b of buildings){ctx.font='10px system-ui';ctx.fillStyle='#f2e7cb';ctx.fillText(b.label,b.x+b.w/2,b.y+27)}}
function legacydrawMiniTerrain(mx,my,s){s*=MAP_SCALE;ctx.fillStyle='#28576b';ctx.fillRect(mx,my,WORLD*s,WORLD*s);ctx.fillStyle=maps[mapId][3];ctx.fillRect(mx+100*s,my+100*s,2200*s,2200*s);ctx.fillStyle='#39788b';ctx.fillRect(mx+90*s,my+1550*s,2220*s,150*s);ctx.fillStyle='#b4b7a0';for(let x of [480,1770])ctx.fillRect(mx+x*s,my+1530*s,140*s,190*s);ctx.fillStyle='#415746';ctx.fillRect(mx+170*s,my+650*s,650*s,530*s);ctx.fillStyle='#757e7b';ctx.fillRect(mx+990*s,my+1810*s,550*s,420*s);ctx.font='9px system-ui';ctx.fillStyle='#fff0c7';ctx.textAlign='center';for(const a of places.filter(a=>['学校','机场','加油站','松林'].includes(a.name)))ctx.fillText(a.name,mx+a.x*s/MAP_SCALE,my+a.y*s/MAP_SCALE);}

