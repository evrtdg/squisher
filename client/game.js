let speed = .3;
let kloop = 25;
let rotamt = Math.PI * .1;
let xlmt = 1200;
let ylmt = 1200;
let firstshot = true;
let firstalt = true;

let map = 'map';
let spawn = {
  map: {
    enemy: [[357, -208, 438, -122], [418, 177, 448, 295],
    [-599, 692, -254, 814], [-1163, -1037, -1006, -895]],
    player: [[-1052, -86, -975, 65], [-1082, 965, -1001, 1057],
    [1002, -87, 1063, -36]]
  }
}

let healspeed = 100;
let healdelay = 5e3;

let powerammo = false;
let pierceammo = false;
let itemmagnet = false;

/** @type {Squish} */
let player = null;
let camera = null;
let multiplayer = {};
let mp = false;

let inventory = [[null, 1]];
let holding = 0;
let points = 0;
let ammo = 0;
let score = 0;

async function initgame() {
  console.log("init", game);
  entities = {};
  loadstat = "connecting";
  mp = false;
  if (game != 'classic') {
    if (!ws || ws?.readyState != ws?.OPEN) {
      let x = await connect(game);
      if (x) {
        switchmenu('menu');
        loadstat = x;
        return false;
      }
    } else {
      joinGame(game);
    }
  }
  loadstat = "initializing";
  player = createEntity({
    class: 'squish',
    id: genid(),
    type: 'player',
    x: 0,
    y: 0,
    name: username
  });
  inventory = [];
  holding = 0;
  points = 0;
  ammo = 0;
  camera = player.id;
  xlmt = tex(map).width;
  ylmt = tex(map).height;
  if (playing) playing.pause();
  playing = null;
  if (game == 'classic') classicinit();
  if (game == 'fight') fightinit();
  loadstat = null;
  return true;
}

function tickgame() {
  Object.values(entities).reverse().forEach(x => { 
    if (!x.removed && x.OWNER == username) x.tick(); 
    if (x.tickall) x.tickall(); 
  });
  if (keys.arrowup || keys.mouseleft || keys[' '] || keys.e || GP.a || GP.zr) {
    useitem();
    firstshot = false;
  } else firstshot = true;
  if (keys.mouseright || keys.r || GP.b || GP.zl) {
    altitem();
    firstalt = false;
  } else firstalt = true;
  if (keys.arrowleft && Date.now() - keytimes.arrowleft >= kloop) {
    keytimes.arrowleft = Date.now();
    player.rotation -= rotamt;
  }
  if (keys.arrowright && Date.now() - keytimes.arrowright >= kloop) {
    keytimes.arrowright = Date.now();
    player.rotation += rotamt;
  }
  if (game == 'classic') classictick();
  if (game == 'fight') fighttick();
}

function drawgame(ingame) {
  background(255);
  push();
  let cam = (camera.constructor.name == 'String' ?
    entities[camera]?.dispos || entities[camera]?.pos : camera) || createVector();
  cam = cam.copy().mult(-1).add(createVector(windowWidth, windowHeight).mult(.5));
  translate(cam);
  drawmap(ingame);
  Object.values(entities).filter(x => x.onscreen(cam)).reverse().forEach(x => x.draw(ingame));
  if (game == 'classic') classicdraw(ingame);
  if (game == 'fight') fightdraw(ingame);
  pop();
  if (ingame) drawhud();
}

function drawmap() {
  push();
  image(tex(map), -xlmt, -ylmt, xlmt * 2, ylmt * 2);
  noFill();
  stroke(0);
  strokeWeight(4);
  rect(-xlmt, -ylmt, xlmt * 2, ylmt * 2);
  pop();
}

function drawhud() {
  push();
  fill(255);
  stroke(0);
  strokeWeight(2);
  textSize(16);
  textAlign(LEFT, TOP);
  let a = ammo.toFixed(2).split('');
  if (a.at(-1) == '0') {
    a.pop();
    if (a.at(-1) == '0') a.splice(-2, 2);
  }
  a = a.join('');
  text(`points: ${points}\nhealth: ${Math.floor(player.hp)}` +
    `\nammo: ${a}` + (mp ? '\n\n' + Object.entries(users).map(x => 
      x[0] + (x[1] && !x[1].dead ? "" : " (dead)")
    ).join('\n') : ''), 10, 10);
  pop();
  inventory.forEach((x, i) => {
    stroke(0);
    strokeWeight(holding == i ? 4 : 2);
    fill(holding == i ? 255 : 220);
    rect(innerWidth - 60, 10 + 60 * i, 50, 50);
    image(tex(x[0]), innerWidth - 55, 15 + 60 * i, 40, 40);
    if (x[1] > 1) {
      // fill(0);
      // stroke(255);
      strokeWeight(2);
      textSize(20);
      textAlign(RIGHT, BOTTOM);
      text(x[1], innerWidth - 14, 60 + 60 * i);
    }
  });
}

function makebullet(damage, spread = 0, amount = 1) {
  for (let i = 0; i < amount; i++) {
    let v = createVector(size * 1.5, 0).setHeading(player.rotation).add(player.pos);
    createEntity({
      class: 'bullet',
      id: genid(),
      damage,
      x: v.x,
      y: v.y,
      from: player.id,
      rot: player.rotation - spread * .5 + Math.random() * spread
    });
  }
}

function playerspawn() {
  inventory = [];
  player.dead = false;
  player.hp = player.maxhp;
  player.holding = null;
  player.onfire = false;
  updateEntity(player.id, {
    dead: player.dead,
    hp: player.hp,
    holding: player.holding,
    onfire: false
  });
  camera = player.id;
  updateinv();
  player.pos.set(spawnzone('player'));
  createEntity({
    class: 'item',
    id: genid(),
    type: 'pistol',
    x: player.pos.x + 50,
    y: player.pos.y
  });
  createEntity({
    class: 'item',
    id: genid(),
    type: 'ammo',
    x: player.pos.x + 50,
    y: player.pos.y,
    amount: 20
  });
}

function playerdeath() {
  player.dead = true;
  updateEntity(player.id, {
    dead: true
  });
  inventory.forEach(x => {
    if (x[0]) createEntity({
      class: 'item',
      id: genid(),
      type: x[0],
      x: player.pos.x + Math.random() * size - size * .5,
      y: player.pos.y + Math.random() * size - size * .5,
      amount: x[1]
    });
  });
  if (ammo) createEntity({
    class: 'item',
    id: genid(),
    type: 'ammo',
    x: player.pos.x + Math.random() * size - size * .5,
    y: player.pos.y + Math.random() * size - size * .5,
    amount: ammo
  });
  inventory = [];
  ammo = 0;
  updateinv();
}

function cheats(x) {
  // give('mapper');
  if (x) give('ferret', 50);
  give('machinegun');
  give('goldenmachine');
  give('shotgun');
  give('goldenshot');
  give('flamethrower');
  give('bomb', 50);
  powerammo = true;
  pierceammo = true;
  itemmagnet = true;
  ammo = 1000;
  player.hp = 1000;
  player.onfire = 0;
}