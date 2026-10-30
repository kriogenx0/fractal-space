// MIT License — Copyright (c) 2026 Alex Vaos. See LICENSE.txt.
// Original geometric survival game; all coordinates are normalized arena units.
export const TAU = Math.PI * 2, ORBIT = .34, PLAYER_RADIUS = .023, PLAYER_MARKER_RADIUS = .05, WALL_THICKNESS = .075, TICK = 1 / 240;
export const difficulties = { gentle: { speed: .28, maximum: .62, interval: 1.4, minimumInterval: 1.1, turn: 3.8, gap: 2 }, normal: { speed: .4, maximum: .85, interval: 1.15, minimumInterval: .85, turn: 4.3, gap: 2 }, expert: { speed: .52, maximum: 1, interval: 1.05, minimumInterval: .8, turn: 4.8, gap: 1 } };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export function wrap(angle) { return ((angle % TAU) + TAU) % TAU; }
export function angularDistance(a, b) { return Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b))); }
export function wallPolygon(wall, sector, sides) {
  const a = -Math.PI / 2 + sector * TAU / sides, b = a + TAU / sides, r = wall.radius, R = r + WALL_THICKNESS;
  return [[r*Math.cos(a),r*Math.sin(a)],[R*Math.cos(a),R*Math.sin(a)],[R*Math.cos(b),R*Math.sin(b)],[r*Math.cos(b),r*Math.sin(b)]];
}
export function circleHitsPolygon(x, y, radius, polygon) {
  let positive = false, negative = false;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i], b = polygon[(i+1)%polygon.length], dx = b[0]-a[0], dy = b[1]-a[1], cross = dx*(y-a[1])-dy*(x-a[0]);
    positive ||= cross > 1e-12; negative ||= cross < -1e-12;
    const t = clamp(((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy || 1),0,1);
    if (Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy) <= radius) return true;
  }
  return !(positive && negative);
}
export function isGap(wall, sector, sides) { return ((sector - wall.gap + sides) % sides) < wall.open; }
export function gapCenter(wall, sides) { return wrap(-Math.PI / 2 + (wall.gap + wall.open / 2) * TAU / sides); }
export function collides(angle, wall, sides) {
  if (wall.radius > (ORBIT + PLAYER_RADIUS) / Math.cos(Math.PI / sides) || wall.radius + WALL_THICKNESS < ORBIT - PLAYER_RADIUS) return false;
  const x = Math.cos(angle)*ORBIT,y = Math.sin(angle)*ORBIT;
  for (let sector = 0; sector < sides; sector++) if (!isGap(wall,sector,sides) && circleHitsPolygon(x,y,PLAYER_RADIUS,wallPolygon(wall,sector,sides))) return true;
  return false;
}
export function createOrbitGame({ seed = 1, sides = 6, difficulty = 'normal' } = {}) {
  sides = [5,6,8].includes(sides) ? sides : 6; difficulty = Object.hasOwn(difficulties,difficulty) ? difficulty : 'normal';
  const rules = difficulties[difficulty]; let randomState, accumulator = 0, ticks = 0, nextWall = 0, gap = 0, wallId = 0;
  const game = { sides, difficulty, seed: seed >>> 0, status: 'ready', angle: 0, time: 0, score: 0, walls: [], speed: rules.speed, stage: 1 };
  const random = () => ((randomState=(Math.imul(randomState,1664525)+1013904223)>>>0)/4294967296);
  function spawn(radius = 1.4, first = false) {
    if (!first) { const moves = [-2,-1,1,2]; gap = (gap + moves[Math.floor(random()*moves.length)] + sides) % sides; }
    const wall = { id: wallId++, radius, gap, open: rules.gap, scored: false }; game.walls.push(wall); return wall;
  }
  function reset(preview) {
    randomState = game.seed; ticks=0;nextWall=0;wallId=0;accumulator=0;game.time=0;game.score=0;game.speed=rules.speed;game.stage=1;game.walls=[];
    gap=Math.floor(random()*sides); const first=spawn(preview ? .57 : 1.4,true);game.angle=gapCenter(first,sides);
    if(preview){spawn(.95);spawn(1.34);}nextWall=rules.interval;
  }
  function start() { reset(false);game.status='playing'; }
  function pause() { if(game.status==='playing'){game.status='paused';accumulator=0;} }
  function resume() { if(game.status==='paused'){game.status='playing';accumulator=0;} }
  function advance(seconds, direction=0) {
    if(game.status!=='playing')return false;accumulator+=clamp(Number.isFinite(seconds)?seconds:0,0,.25);direction=clamp(direction,-1,1);
    while(accumulator+1e-12>=TICK && game.status==='playing') {
      accumulator-=TICK;ticks++;game.time=ticks*TICK;game.stage=1+Math.floor(game.time/15);game.speed=Math.min(rules.maximum,rules.speed+game.time*.006);
      game.angle=wrap(game.angle+direction*rules.turn*TICK);
      for(const wall of game.walls){wall.radius-=game.speed*TICK;if(collides(game.angle,wall,sides)){game.status='dead';accumulator=0;return true;}if(!wall.scored&&wall.radius+WALL_THICKNESS<ORBIT-PLAYER_RADIUS){wall.scored=true;game.score++;}}
      game.walls=game.walls.filter(w=>w.radius+WALL_THICKNESS>.13);
      if(game.time+1e-12>=nextWall){if(game.walls.length<12)spawn();nextWall+=Math.max(rules.minimumInterval,rules.interval-game.time*.003);}
    }
    return true;
  }
  reset(true);return { game, start, pause, resume, advance };
}
export function createOrbitView(canvas) {
  const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw new Error('Canvas 2D unavailable');
  function draw(game,{motion=true}={}) {
    const W=canvas.width,H=canvas.height,scale=Math.min(W,H)*.42,cx=W*.5,cy=H*.5,rotation=motion ? game.time*.1 : 0,c=Math.cos(rotation),s=Math.sin(rotation);
    const point=(x,y)=>[cx+(x*c-y*s)*scale,cy+(x*s+y*c)*scale];
    const path=points=>{ctx.beginPath();points.forEach(([x,y],i)=>{const p=point(x,y);if(!i)ctx.moveTo(...p);else ctx.lineTo(...p);});ctx.closePath();};
    ctx.fillStyle='#080f1c';ctx.fillRect(0,0,W,H);
    for(let i=0;i<game.sides;i++){const a=-Math.PI/2+i*TAU/game.sides,b=a+TAU/game.sides;path([[0,0],[Math.cos(a)*4,Math.sin(a)*4],[Math.cos(b)*4,Math.sin(b)*4]]);ctx.fillStyle=i%2?'#0d1d30':'#10253a';ctx.fill();}
    for(const radius of [.34,.7,1.05]){ctx.beginPath();ctx.arc(cx,cy,radius*scale,0,TAU);ctx.strokeStyle=radius===.34?'#50667a':'#ffffff0c';ctx.lineWidth=radius===.34?1.5:1;ctx.stroke();}
    for(const wall of [...game.walls].reverse())for(let i=0;i<game.sides;i++)if(!isGap(wall,i,game.sides)){path(wallPolygon(wall,i,game.sides));ctx.fillStyle=wall.id%2?'#94e6d3':'#eaad88';ctx.fill();ctx.strokeStyle='#080f1c';ctx.lineWidth=1;ctx.stroke();}
    const vertices=Array.from({length:game.sides},(_,i)=>{const a=-Math.PI/2+i*TAU/game.sides;return[Math.cos(a)*.145,Math.sin(a)*.145];});path(vertices);ctx.fillStyle='#080f1c';ctx.fill();ctx.strokeStyle='#94e6d3';ctx.lineWidth=2;ctx.stroke();
    const px=Math.cos(game.angle)*ORBIT,py=Math.sin(game.angle)*ORBIT;
    path([0,1,2].map(i=>{const a=game.angle+Math.PI/2+i*TAU/3;return[px+Math.cos(a)*PLAYER_MARKER_RADIUS,py+Math.sin(a)*PLAYER_MARKER_RADIUS];}));ctx.fillStyle=game.status==='dead'?'#ff977e':'#ffffff';ctx.fill();
    const p=point(px,py);ctx.beginPath();ctx.arc(p[0],p[1],PLAYER_RADIUS*scale*.5,0,TAU);ctx.fillStyle='#08202b';ctx.fill();
    const density=W/(canvas.clientWidth||W);ctx.font=`${Math.max(10,Math.min(14,W/density/75))*density}px monospace`;ctx.fillStyle='#c3d7e3';ctx.fillText('ORBIT BREACH',W*.045,H*.07);ctx.fillText(game.time.toFixed(2)+' s',W*.76,H*.07);
  }
  return {draw};
}
