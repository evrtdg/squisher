let speed = .3;
let kloop = 25;
let rotamt = Math.PI * .1;
let wlmt = 1200;
let firstshot = true;

let player = null;
let camera = null;
let multiplayer = {};
let mp = false;

let inventory = [null];
let holding = 0;
let points = 0;
let ammo = 0;

async function initgame() {
  entities = {};
  inventory = [];
  holding = 0;
  points = 0;
  ammo = 0;
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
  camera = player.id;
  if (game == 'classic') classicinit();
}

function tickgame() {
  let m = createVector(
    ((keys.d || false) - (keys.a || false)) * dt * speed,
    ((keys.s || false) - (keys.w || false)) * dt * speed,
  );
  player.pos.add(m);
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
  translate(cam.copy().mult(-1).add(
    createVector(windowWidth, windowHeight).mult(.5)));
  drawmap();
  Object.values(entities).reverse().forEach(x => x.draw());
  if (game == 'classic') classicdraw();
  pop();
  drawhud();
}

function drawmap() {
  push();
  image(tex('map'), -wlmt, -wlmt, wlmt * 2, wlmt * 2);
  noFill();
  stroke(0);
  strokeWeight(4);
  rect(-wlmt, -wlmt, wlmt * 2, wlmt * 2);
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

function makebullet() {
  if (mp) callEvent('shoot');
  else {
    let v = createVector(size * 1.5, 0).setHeading(player.rotation).add(player.pos);
    new Bullet(genid(), 'basic', v.x, v.y,
      { from: player.id, rot: player.rotation });
  }
}