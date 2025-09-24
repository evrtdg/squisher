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
  Object.values(entities).reverse().forEach(x => x.tick());
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
    entities[camera]?.pos : camera) || createVector();
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
  text(`points: ${points}\nhealth: ${player.hp}\nammo: ${ammo}`, 10, 10);
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