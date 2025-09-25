/** @typedef {import("p5").Element} p5.Element */

let username = window.localStorage?.username || '';
let keys = {};
let keytimes = {};
let menu, game;
/** @type {Array.<p5.Element>} */
let menubtn;
/** @type {p5.Element} */
let menuuser;
let textures = {};
let sounds = {};

let dt = 0;
let tps = 45;
let itps = 1000 / tps;

function setup() {
  createCanvas(windowWidth, windowHeight);
  menu = null;
  game = null;
  menubtn = [];
  textures.pistol = loadImage('assets/pistol.png');
  textures.shotgun = loadImage('assets/shotgun.svg');
  textures.shotgun.size = 2;
  textures.goldenshot = loadImage('assets/goldenshot.svg');
  textures.goldenshot.size = 2;
  textures.machinegun = loadImage('assets/machinegun.svg');
  textures.machinegun.size = 2;
  textures.goldenmachine = loadImage('assets/goldenmachine.svg');
  textures.goldenmachine.size = 2;
  textures.flamethrower = loadImage('assets/flamethrower.svg');
  textures.flamethrower.size = 2;
  textures.bomb = loadImage('assets/bomb.svg');
  textures.whitebomb = loadImage('assets/whitebomb.svg');
  textures.point = loadImage('assets/point.png');
  textures.ammo = loadImage('assets/ammo.png');
  textures.map = loadImage('assets/map.svg');
  textures.hp = loadImage('assets/hp.png');
  textures.missing = loadImage('assets/missing.png');
  sounds.missing = loadSound('assets/missing.mp3');
  switchmenu('menu');
}

/** @returns {import("p5").Image} */
function tex(n) {
  return textures[n] || textures.missing;
}

function play(n, v = .5) {
  let s = sounds[n] || sounds.missing;
  s.playMode('sustain');
  s.setVolume(v);
  s.play();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(255);
  if (menu == 'menu') {
    fill(255, 0, 0);
    rect(20, 20, 20);
  } else if (menu == 'game') {
    dt += deltaTime;
    if (dt > itps) {
      if (dt > 100) dt = 100;
      tickgame();
      dt = dt % itps;
    }
    drawgame();
  }
}

function initmenu() {
  menubtn.push(...[
    createButton('Classic mode').id('classic'),
    createButton('Fighting mode').id('fight'),
  ]);
  createElement('div', 'Squisher').id('rainbow').parent('gms');
  menubtn.forEach(b => {
    b.parent('gms');
    createElement('br').parent('gms');
    b.elt.onclick = () => {
      switchmenu('game', b.id());
    }
  });
  menuuser = createInput(username);
  menuuser.attribute('placeholder', 'Username');
  createElement('br').parent('gms');
  menuuser.parent('gms');
  menuuser.elt.focus();
}

function removemenu() {
  username = menuuser.value();
  if (window.localStorage) localStorage.username = username;
  document.querySelector('#gms').innerHTML = '';
  menubtn = [];
  menuuser = null;
}

async function switchmenu(m, g) {
  if (m == menu) return;
  game = g;
  if (menu == 'menu') removemenu();
  if (m == 'game') await initgame();
  menu = m;
  if (menu == 'menu') initmenu();
}

function keyPressed() {
  let k = key.toLowerCase();
  keys[k] = true;
  keytimes[k] = Date.now() - kloop;
  if ((k == 'arrowdown' || k == 'mouseright') && player) {
    holding = (holding + 1) % inventory.length;
    updateinv();
  }
  if (k == '~') cheats();
}

function keyReleased() {
  let k = key.toLowerCase();
  keys[k] = false;
}

function mouseMoved() {
  let x = createVector(mouseX, mouseY).sub(windowWidth * .5, windowHeight * .5).heading();
  if (player) player.rotation = x;
}

function mouseDragged() {
  let x = createVector(mouseX, mouseY).sub(windowWidth * .5, windowHeight * .5).heading();
  if (player) player.rotation = x;
}

function mousePressed() {
  if (player && player.dead) playerspawn();
  key = 'mouse' + mouseButton;
  keyPressed();
}

function mouseReleased() {
  key = 'mouse' + mouseButton;
  keyReleased();
}