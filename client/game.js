let speed = .3;
let kloop = 25;
let rotamt = Math.PI * .1;
let xlmt = 1200;
let ylmt = 1200;
let firstshot = true;

let map = 'map';
let spawn = {
  map: {
    enemy: [[357, -208, 438, -122], [418, 177, 448, 295],
    [-599, 692, -254, 814], [-1163, -1037, -1006, -895]],
    player: [[-1052, -86, -975, 65], [-1082, 965, -1001, 1057],
    [1002, -87, 1063, -36]]
  }
}

let powerammo = false;
let pierceammo = false;
let itemmagnet = false;

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
  entities = {};
  if (game == 'classic') {
    mp = false;
    player = new Squish(genid(), 'player', 0, 0);
  } else {
    if (!await connect()) {
      alert('Server is offline. Play classic mode instead.');
      switchmenu('menu');
      return;
    };
    mp = true;
  }
  inventory = [[null, 1]];
  holding = 0;
  points = 0;
  ammo = 0;
  camera = player.id;
  xlmt = tex(map).width;
  ylmt = tex(map).height;
  if (game == 'classic') classicinit();
}

function tickgame() {
  Object.values(entities).reverse().forEach(x => { if (!x.removed) x.tick() });
  if (keys.arrowup || keys.mouseleft || keys[' ']) {
    useitem();
    firstshot = false;
  } else firstshot = true;
  if (keys.arrowleft && Date.now() - keytimes.arrowleft >= kloop) {
    keytimes.arrowleft = Date.now();
    player.rotation -= rotamt;
  }
  if (keys.arrowright && Date.now() - keytimes.arrowright >= kloop) {
    keytimes.arrowright = Date.now();
    player.rotation += rotamt;
  }
  if (game == 'classic') classictick();
}

function drawgame() {
  push();
  let cam = (camera.constructor.name == 'String' ?
    entities[camera]?.dispos || entities[camera]?.pos : camera) || createVector();
  cam = cam.copy().mult(-1).add(createVector(windowWidth, windowHeight).mult(.5));
  translate(cam);
  drawmap();
  Object.values(entities).filter(x => x.onscreen(cam)).reverse().forEach(x => x.draw());
  if (game == 'classic') classicdraw();
  pop();
  drawhud();
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
    `\nammo: ${a}`, 10, 10);
  pop();
}

function makebullet(type = 'basic', spread = 0, amount = 1) {
  // if (mp) callEvent('shoot');
  // else {
  for (let i = 0; i < amount; i++) {
    let v = createVector(size * 1.5, 0).setHeading(player.rotation).add(player.pos);
    new Bullet(genid(), type, v.x, v.y,
      { from: player.id, rot: player.rotation - spread * .5 + Math.random() * spread });
  }
  // }
}

function playerspawn() {
  player.dead = false;
  player.hp = player.maxhp;
  player.holding = null;
  camera = player.id;
  updateinv();
  player.pos.set(spawnzone('player'));
  new Item(genid(), 'pistol', player.pos.x + 50, player.pos.y);
  new Item(genid(), 'ammo', player.pos.x + 50, player.pos.y, { amount: 20 });
}

function playerdeath() {
  player.dead = true;
  inventory.forEach(x => {
    if (x[0]) new Item(genid(), x[0],
      player.pos.x + Math.random() * size - size * .5,
      player.pos.y + Math.random() * size - size * .5,
      { amount: x[1] })
  });
  if (ammo) new Item(genid(), 'ammo',
    player.pos.x + Math.random() * size - size * .5,
    player.pos.y + Math.random() * size - size * .5,
    { amount: ammo });
  inventory = [[null, 1]];
  ammo = 0;
  updateinv();
}

function cheats() {
  // give('mapper');
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