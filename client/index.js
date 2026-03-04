/** @typedef {import("p5").Element} p5.Element */

let username = window.localStorage?.username || '';
let keys = {};
let keytimes = {};
let menu, game;
/** @type {Array.<p5.Element>} */
/** @type {p5.Element} */
let menuuser;
let textures = {};
let sounds = {};
let loadstat = null;
let font = null;

let dt = 0;
let tps = 45;
let itps = 1000 / tps;
let pdps = 1000 / 24;

function setup() {
  createCanvas(windowWidth, windowHeight);
  menu = null;
  game = null;
  textures.map = loadImage('assets/map.svg');
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
  textures.ferret = loadImage('assets/ferret.jpeg');
  textures.whiteferret = loadImage('assets/whiteferret.jpeg');
  textures.point = loadImage('assets/point.png');
  textures.ammo = loadImage('assets/ammo.png');
  textures.hp = loadImage('assets/hp.png');
  textures.medkit = loadImage('assets/medkit.png');
  textures.missing = loadImage('assets/missing.png');
  sounds.missing = loadSound('assets/sounds/missing.mp3');
  sounds.start = loadSound('assets/sounds/start.mp3');
  font = loadFont('assets/prodsans.ttf');
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
  return s;
}

let songs = ["tread_carefully", "jets_average"];
let playing = null;
let domusic = 0;
async function music() {
  let song = 0;
  domusic = 1;
  while (domusic) {
    if (!sounds[songs[song]]) await new Promise(y => {
      sounds[songs[song]] = loadSound('assets/sounds/' + songs[song] + '.mp3', y);
    });
    let s = play(songs[song], 0.3);
    if (menu == "pause") s.pause();
    playing = s;
    await new Promise(y => {
      s.onended(() => {
        if (playing._paused) return;
        playing = null;
        setTimeout(y, 500);
      });
    });
    song = (song + 1) % songs.length;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  updategamepad();
  if (font) textFont(font);
  if (menu == 'menu') {
    background(255);
    fill(255, 0, 0);
    push();
    rect(20, 20, 20);
    fill(255);
    stroke(0);
    strokeWeight(2);
    textSize(16);
    textAlign(LEFT, TOP);
    text(" !    IN DEV", 24, 20);
    pop();
  } else if (menu == 'game') {
    dt += deltaTime;
    if (dt > itps) {
      if (dt > 100) dt = 100;
      tickgame();
      mptick();
      dt = dt % itps;
    }
    drawgame(true);
  } else if (menu == 'pause') {
    dt += deltaTime;
    if (dt > pdps) {
      if (dt > 100) dt = 100;
      drawgame();
      dt = dt % pdps;
    }
    drawpause();
  }
  if (loadstat) {
    push();
    fill(255);
    stroke(0);
    strokeWeight(2);
    textSize(20);
    textAlign(RIGHT, TOP);
    text(loadstat, innerWidth - 10, 10);
    pop();
  }
}

function initmenu() {
  document.querySelector('#gms').classList.remove("hidden");
  document.querySelector('#classicbtn').onclick = () => switchmenu('game', 'classic');
  document.querySelector('#fightbtn').onclick = () => switchmenu('game', 'fight');
  menuuser = document.querySelector('#username');
  menuuser.value = username;
  menuuser.focus();
}

function removemenu() {
  username = menuuser.value;
  if (window.localStorage) localStorage.username = username;
  document.querySelector('#gms').classList.add("hidden");
}

async function switchmenu(m, g) {
  if (m == menu) return;
  if (g) game = g;
  if (menu == 'menu') removemenu();
  if (m == 'game' && menu == 'menu') if (!await initgame()) return initmenu();
  menu = m;
  if (menu == 'menu') initmenu();
  if (menu == "pause" && playing) playing.pause();
  if (menu == "game" && playing && domusic) playing.play();
}

let lk = "";
function keyPressed() {
  let k = key.toLowerCase();
  keys[k] = true;
  keytimes[k] = Date.now() - kloop;
  if ((k == 'arrowdown' || k == 'q') && player && menu == "game") {
    holding = (holding + 1) % inventory.length;
    updateinv();
  }
  if (k == '~' && player && menu == "game") cheats(lk == "z");
  if (k == 'escape' && player) switchmenu(menu == 'pause' ? 'game' : 'pause');
  if (parseInt(k) <= inventory?.length) {
    holding = parseInt(k) - 1;
    updateinv()
  }
  lk = k;
  if (player && player.dead && menu == "game") playerspawn();
}

function keyReleased() {
  let k = key.toLowerCase();
  keys[k] = false;
}

function mouseMoved() {
  let x = createVector(mouseX, mouseY).sub(windowWidth * .5, windowHeight * .5).heading();
  if (player && menu == "game") player.rotation = x;
}

function mouseDragged() {
  let x = createVector(mouseX, mouseY).sub(windowWidth * .5, windowHeight * .5).heading();
  if (player && menu == "game") player.rotation = x;
}

function mousePressed() {
  if (player && player.dead && menu == "game") playerspawn();
  key = 'mouse' + mouseButton;
  keyPressed();
}

function mouseReleased() {
  key = 'mouse' + mouseButton;
  keyReleased();
}

let GP = {};
let GPold = {};
function updategamepad() {
  const gpo = GP;
  GP = {};
  const gp = navigator.getGamepads()[0];
  if (!gp) return;

  GP.b = gp.buttons[0].pressed;
  GP.a = gp.buttons[1].pressed;
  GP.y = gp.buttons[2].pressed;
  GP.x = gp.buttons[3].pressed;
  GP.l = gp.buttons[4].pressed;
  GP.r = gp.buttons[5].pressed;
  GP.zl = gp.buttons[6].pressed;
  GP.zr = gp.buttons[7].pressed;
  GP.menu = gp.buttons[8].pressed || gp.buttons[9].pressed;
  GP.ma = gp.buttons[16].pressed;
  GP.mb = gp.buttons[17].pressed || gp.buttons[10].pressed;
  
  GP.ls = createVector(gp.axes[0], gp.axes[1]);
  GP.rs = createVector(gp.axes[2], gp.axes[3]);
  GP.dp = createVector(
    gp.buttons[15].pressed - gp.buttons[14].pressed,
    gp.buttons[13].pressed - gp.buttons[12].pressed
  );
  if (player && menu == "game" && GP.rs.magSq() > .1) player.rotation = GP.rs.heading();

  GPold = gpo;
  for (const key in GP) {
    if (key == "rs" || key == "ls" || key == "cd" || !GP[key] || GPold[key]) continue;

    if (key == "menu" && (menu == "pause" || menu == "game")) 
      switchmenu(menu == 'pause' ? 'game' : 'pause');
    if (menu != "game") continue;

    let x = inventory.length;
    if (key == "l" || key == "x") updateinv(holding = (x + holding - 1) % x);
    if (key == "r" || key == "y") updateinv(holding = ++holding % x);

    if (player && player.dead) playerspawn();

    if (key == "ma" && GP.mb) cheats();
  }
  // if ((GP.l || GP.r) && (keytimes.gpturn || 0) < Date.now() && menu == "game") {
  //   player.rotation += (GP.r - GP.l) * rotamt;
  //   keytimes.gpturn = Date.now() + kloop;
  // }
}

function drawpause() {
  push();
  fill(255, 0, 0);
  stroke(0, 0, 0);
  strokeWeight(2);
  rect(50, 50, 100, 100);
  pop();
}

window.oncontextmenu = e => e.preventDefault();