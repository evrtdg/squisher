let speed = .3;

let player = null;
let camera = null;
let multiplayer = {};

async function initgame() {
  entites = {};
  if (game == 'classic')
    player = new Squish(genid(), 'player', 0, 0);
  else await connect();
  camera = player.id;
  new Squish(genid(), 'basic', 30, 30);
}

function tickgame() {
  let m = createVector(
    ((keys.d || keys['arrowright'] || false) -
      (keys.a || keys['arrowleft'] || false)) * deltaTime * speed,
    ((keys.s || keys['arrowdown'] || false) -
      (keys.w || keys['arrowup'] || false)) * deltaTime * speed,
  );
  player.pos.add(m);
  Object.values(entites).reverse().forEach(x => x.tick());
}

function drawgame() {
  push();
  let cam = (camera.constructor.name == 'String' ?
    entites[camera]?.pos : camera) || createVector();
  translate(cam.copy().mult(-1).add(
    createVector(windowWidth, windowHeight).mult(.5)));
  Object.values(entites).reverse().forEach(x => x.draw());
  pop();
  drawhud();
}

function drawhud() {

}