export const HEROES=[{name:'이승우',number:10,skill:'공중에서 낮은 보조 점프',speed:300,jumps:2,color:'#c5fc7d'},{name:'이동준',number:7,skill:'빠른 달리기 · 긴 도약',speed:325,jumps:1,color:'#80e8ee'},{name:'티아고',number:9,skill:'관통 파워 슛 · 추가 체력',speed:300,jumps:1,color:'#ffd989'}];
export const WORLDS=['초록빛 들판','바람의 능선','구름다리','노을의 성벽','전주성'];
export const STAGES=20;
export const HERO_VISUAL={size:106,left:53,top:103,bottom:3};
export const NAMES=Array.from({length:STAGES},(_,i)=>`${WORLDS[Math.floor(i/4)]} ${i%4+1}`);
export class Game{
 constructor(){this.state='menu';}
 start(hero=0){this.hero=HEROES[hero];this.score=0;this.lives=5;this.level=1;this.coins=0;this.kills=0;this.time=0;this.load();}
 load(){this.state='play';this.platforms=[];this.orbs=[];this.enemies=[];this.spikes=[];this.balls=[];this.fx=[];this.clock=150;this.checkpoint={x:100,y:480};this.checkIndex=0;let x=0;
  const world=Math.floor((this.level-1)/4),round=(this.level-1)%4,count=10+world*2+round,gap=95+Math.min(35,(this.level-1)*2);
  this.world=world;this.route=round;this.clock=120+count*3;
  for(let i=0;i<count;i++){
   const profiles=[[520,498,476,498],[520,500,480,460,480,500],[520,480,520,490],[520,490,460,490]];
   const widths=[[400,340,460],[380,380,340],[440,320,420],[360,440,380]];
   const y=profiles[round][i%profiles[round].length],w=i===0?660:widths[round][i%3];
   this.platforms.push({x,y,w,h:210,id:i});
   for(let j=1;j<5;j++)this.orbs.push({x:x+70+j*(w-140)/4,y:y-43,taken:false});
   if(i>0){this.enemies.push({x:x+w*.65,y:y-19,min:x+50,max:x+w-40,v:60+this.level*5,alive:true});
    if(world>=2&&i%3===2)this.enemies.push({x:x+w*.3,y:y-19,min:x+35,max:x+w-35,v:-(55+this.level*5),alive:true});}
   if(i>1&&(i%3===1||(world>=3&&i%3===0)))this.spikes.push({x:x+w*.35,y:y-20,w:40,h:20});
   if(i>0&&i%2===0){const upperX=x+60;this.platforms.push({x:upperX,y:y-100,w:160,h:28,id:-1,moving:world>=1&&round===2,base:upperX});this.orbs.push({x:upperX+80,y:y-143,taken:false});
    if(round===3){this.platforms.push({x:x+240,y:y-165,w:120,h:28,id:-1});this.orbs.push({x:x+295,y:y-208,taken:false});}}
   x+=w+gap;
  }
  this.end=x-gap;this.goal={x:this.end-100,y:this.platforms.findLast(p=>p.id>=0).y};this.respawn();this.notice=NAMES[this.level-1]+' · '+['초록 산책길','언덕 오르기','징검다리','하늘 보너스 길'][round];this.noticeTime=2;
 }
 respawn(){this.p={x:this.checkpoint.x,y:this.checkpoint.y-38,vx:0,vy:0,w:30,h:48,face:1,ground:false,coyote:0,jumps:0,hp:this.hero.number===9?4:3,inv:2,shot:0,stun:0};this.balls=[];this.jumpBuffer=0;}
 jump(){if(this.state==='play')this.jumpBuffer=.14;}
 shoot(){if(this.state!=='play'||(this.p.shot>0||this.p.stun>0))return;const p=this.p;p.shot=.32;this.balls.push({x:p.x+p.face*22,y:p.y-24,v:p.face*650,t:.38,hits:new Set()});}
 die(){if(this.state!=='play')return;this.lives--;if(!this.lives){this.state='over';return;}this.clock=Math.max(80,this.clock);this.respawn();this.notice='다시 도전!';this.noticeTime=1.2;}
 hurt(sourceX=this.p.x+this.p.face){const p=this.p;if(p.inv>0)return;p.hp--;p.inv=1.5;p.stun=.28;p.vx=(p.x<sourceX?-1:p.x>sourceX?1:-p.face)*220;p.vy=-360;p.ground=false;p.coyote=0;p.jumps=1;this.jumpBuffer=0;this.fx.push({x:p.x,y:p.y-110,t:.6,text:'앗!'});if(p.hp<=0)this.die();}
 update(dt,input={}){if(this.state!=='play')return;dt=Math.min(.025,dt);this.time+=dt;this.clock-=dt;if(this.clock<=0){this.die();return;}this.noticeTime=Math.max(0,this.noticeTime-dt);const p=this.p;const previousY=p.y;p.inv=Math.max(0,p.inv-dt);p.shot=Math.max(0,p.shot-dt);p.stun=Math.max(0,p.stun-dt);this.jumpBuffer=Math.max(0,this.jumpBuffer-dt);p.coyote=p.ground?.1:Math.max(0,p.coyote-dt);
  let dir=(input.right?1:0)-(input.left?1:0);if(!dir&&input.axis)dir=Math.sign(input.axis);if(p.stun<=0){p.vx=dir*this.hero.speed;if(dir)p.face=dir;}
  if(p.stun<=0&&this.jumpBuffer>0&&(p.coyote>0||p.jumps<this.hero.jumps&&p.jumps>0)){p.vy=p.jumps>0&&p.coyote<=0?-360:-690;p.ground=false;p.coyote=0;p.jumps++;this.jumpBuffer=0;}
  p.x=Math.max(18,Math.min(this.end,p.x+p.vx*dt));p.vy+=1750*dt;p.y+=p.vy*dt;p.ground=false;
  for(const platform of this.platforms){const old=platform.x;if(platform.moving)platform.x=platform.base+Math.sin(this.time*1.3)*35;
   if(p.vy>=0&&previousY<=platform.y+3&&p.y>=platform.y&&p.x+p.w/2>platform.x&&p.x-p.w/2<platform.x+platform.w){p.y=platform.y;p.vy=0;p.ground=true;p.jumps=0;p.x+=platform.x-old;if(platform.id>this.checkIndex&&platform.id%3===0){this.checkIndex=platform.id;this.checkpoint={x:platform.x+30,y:platform.y};this.notice='체크포인트 ✓';this.noticeTime=1.5;}}
  }
  if(p.y>850){this.die();return;}
  if(input.shoot)this.shoot();
  for(const o of this.orbs)if(!o.taken&&o.x+11>=p.x-HERO_VISUAL.left&&o.x-11<=p.x+HERO_VISUAL.left&&o.y+17>=p.y-HERO_VISUAL.top&&o.y-17<=p.y+HERO_VISUAL.bottom){o.taken=true;this.coins++;this.score+=100;this.fx.push({x:o.x,y:o.y,t:.6,text:'+100'});}
  for(const e of this.enemies){if(!e.alive)continue;e.x+=e.v*dt;if(e.x<e.min||e.x>e.max)e.v*=-1;if(Math.abs(p.x-e.x)<34&&Math.abs(p.y-25-e.y)<38){if(p.vy>100&&previousY<=e.y-5){e.alive=false;this.score+=250;this.kills++;p.vy=-460;this.fx.push({x:e.x,y:e.y,t:.6,text:'+250'});}else this.hurt(e.x);if(this.p!==p||this.state!=='play')return;}}
  for(const s of this.spikes)if(p.x+13>s.x&&p.x-13<s.x+s.w&&p.y>s.y&&p.y-p.h<s.y+s.h){this.hurt(s.x+s.w/2);if(this.p!==p||this.state!=='play')return;}
  for(const b of this.balls){const travel=Math.min(dt,b.t);b.x+=b.v*travel;b.t-=dt;for(const e of this.enemies)if(e.alive&&!b.hits.has(e)&&Math.hypot(b.x-e.x,b.y-e.y)<31){e.alive=false;b.hits.add(e);this.score+=200;this.kills++;if(this.hero.number!==9)b.t=0;break;}
   if(this.goal.x-b.x<35&&b.x-this.goal.x<95&&Math.abs(b.y-(this.goal.y-35))<80&&b.v>0&&p.x>this.goal.x-450){this.score+=1000+Math.ceil(this.clock)*10;this.state='clear';this.notice='GOOOAL!';return;}}
  this.balls=this.balls.filter(b=>b.t>0);for(const f of this.fx){f.t-=dt;f.y-=dt*35;}this.fx=this.fx.filter(f=>f.t>0);
 }
 next(){if(this.state!=='clear')return;if(this.level===STAGES){this.state='win';return;}this.level++;this.load();}
 record(){return `⚽ 전북 점프!\n${this.hero.name} · ${this.score.toLocaleString('ko-KR')}점\n스테이지 ${this.level}/${STAGES} · 응원 구슬 ${this.coins}개 · 처치 ${this.kills}마리`;}
}
