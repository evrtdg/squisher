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
  let boog = 0;
  domusic = 1;
  if (playing) playing.pause();
  while (domusic) {
    if (!sounds[songs[song]]) await new Promise(y => {
      sounds[songs[song]] = loadSound('assets/sounds/' + songs[song] + '.mp3', y);
    });
    let s = play(songs[song], 0.3);
    if (menu == "pause" && boog) s.pause();
    boog = 1;
    playing = s;
    if (domusic) await new Promise(y => {
      s.onended(() => {
        if (!domusic) return y();
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
  updatetouch();
  if (font) textFont(font);
  if (menu == 'menu') {
    background(245);
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
      dt = dt % itps;
    }
    drawgame(true);
  } else if (menu == 'pause') {
    dt += deltaTime;
    if (dt > pdps) {
      if (dt > 100) dt = 100;
      drawgame();
      if (mp && Object.keys(users).length > 1) tickgame();
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
  if (!GPcursorElement) GPcursorElement = document.querySelector("#gpcursor");
  if (GPcursor) {
    GPcursorElement.style.left = GPcursorPos.x + "px";
    GPcursorElement.style.top = GPcursorPos.y + "px";
  }
  if (GPcursor != GPcursorEltShow) {
    GPcursorElement.style.display = GPcursor ? "inline" : "none";
    GPcursorEltShow = GPcursor;
    if (GPcursor == false) {
      document.querySelector(".gphover")?.classList.remove("gphover");
      GPcursorElement.style.borderRadius = "100px";
    }
  }
  mptick();
}

function initmenu() {
  mp = false;
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
  document.querySelector("#pause").classList.add("hidden");
  if (menu == "pause") {
    document.querySelector("#returnbtn").onclick = () => switchmenu("game");
    document.querySelector("#leavebtn").onclick = () => leaveGame();
    document.querySelector("#musicbtn").onclick = () => {
      if (domusic) {
        domusic = 0;
        if (playing) playing.pause();
      } else music();
    };
    document.querySelector("#pause").classList.remove("hidden");
  }
  if (menu == "game") {
    if (playing && domusic) playing.play();
    if (GP.yeah) {
      GPcursor = false;
      GPcursorPos = createVector(innerWidth / 2, innerHeight / 2);
    }
  } else if (GP.yeah) {
    GPcursor = true;
    GPcursorPos = createVector(innerWidth / 2, innerHeight / 2);
  }
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
  if (k == '~' && lk == "`" && player && menu == "game") cheats();
  if (k == 'escape' && player) switchmenu(menu == 'pause' ? 'game' : 'pause');
  if (parseInt(k) <= inventory?.length) {
    holding = parseInt(k) - 1;
    updateinv()
  }
  lk = k == "shift" ? lk : k;
  if (player && player.dead && menu == "game") playerspawn();
}

function keyReleased() {
  let k = key.toLowerCase();
  keys[k] = false;
}

function mouseMoved() {
  document.body.classList.remove("nocursor");
  let x = createVector(mouseX, mouseY).sub(windowWidth * .5, windowHeight * .5).heading();
  if (player && menu == "game" && !touches.length) player.rotation = x;
  GPcursor = false;
  GPcursorPos = createVector(mouseX, mouseY);
}

function mouseDragged() {
  mouseMoved();
}

function mousePressed() {
  document.body.classList.remove("nocursor");
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
let GPcursor = false;
let GPcursorEltShow = false;
let GPcursorPos;
let GPcursorElement = null;
function updategamepad() {
  if (!GPcursorPos) GPcursorPos = createVector(innerWidth / 2, innerHeight / 2);
  const gpo = GP;
  GP = { yeah: true };
  const gp = navigator.getGamepads()[0];
  if (!gp) return GP.yeah = false;

  GP.b = gp.buttons[0]?.pressed;
  GP.a = gp.buttons[1]?.pressed;
  GP.y = gp.buttons[2]?.pressed;
  GP.x = gp.buttons[3]?.pressed;
  GP.l = gp.buttons[4]?.pressed;
  GP.r = gp.buttons[5]?.pressed;
  GP.zl = gp.buttons[6]?.pressed;
  GP.zr = gp.buttons[7]?.pressed;
  GP.cx = gp.buttons[10]?.pressed;
  GP.ca = gp.buttons[9]?.pressed;
  GP.cb = gp.buttons[8]?.pressed;
  GP.menu = (GP.ca || GP.cb) && !GP.cx;

  GP.ls = createVector(gp.axes[0], gp.axes[1]);
  GP.rs = createVector(gp.axes[2], gp.axes[3]);
  GP.dp = createVector(
    gp.buttons[15]?.pressed - gp.buttons[14]?.pressed,
    gp.buttons[13]?.pressed - gp.buttons[12]?.pressed
  );
  if (player && menu == "game" && GP.rs.magSq() > .1) player.rotation = GP.rs.heading();

  GPold = gpo;
  for (const key in GP) {
    if (key == "rs" || key == "ls" || key == "cd" || !GP[key] || GPold[key]) continue;

    if (key == "menu" && (menu == "pause" || menu == "game"))
      switchmenu(menu == 'pause' ? 'game' : 'pause');
    if ((key == "a" || key == "b" || key == "zr") && GPcursor) {
      let x = document.querySelector(".gphover");
      if (x) x.click();
    }
    if (menu != "game") continue;

    let x = inventory.length;
    if (key == "l" || key == "x") updateinv(holding = (x + holding - 1) % x);
    if (key == "r" || key == "y") updateinv(holding = ++holding % x);

    if (player && player.dead) playerspawn();

    if (key == "ca" && GP.cx) cheats();
    if (key == "cb" && GP.cx) freecam();
  }
  // if ((GP.l || GP.r) && (keytimes.gpturn || 0) < Date.now() && menu == "game") {
  //   player.rotation += (GP.r - GP.l) * rotamt;
  //   keytimes.gpturn = Date.now() + kloop;
  // }
  if (menu != "game" && (GP.ls.magSq() > 0.1 ||
    GP.dp.magSq() > 0.1 || GP.rs.magSq() > 0.1)) {
    GPcursor = true;
    GPcursorPos.add(GP.ls.copy().add(GP.rs).add(GP.dp).mult(4));
    if (GPcursorPos.x > innerWidth) GPcursorPos.x -= innerWidth;
    if (GPcursorPos.x < 0) GPcursorPos.x += innerWidth;
    if (GPcursorPos.y > innerHeight) GPcursorPos.y -= innerHeight;
    if (GPcursorPos.y < 0) GPcursorPos.y += innerHeight;
    let e = document.elementsFromPoint(GPcursorPos.x, GPcursorPos.y)
      .filter(x => x.id != "gpcursor")[0];
    if (e && !e.classList.contains("gphover")) {
      document.querySelector(".gphover")?.classList.remove("gphover");
      if (e.tagName == "BUTTON") e.classList.add("gphover");
      GPcursorElement.style.borderRadius = e.tagName == "BUTTON" ? "4px" : "100px";
    }
    document.body.classList.add("nocursor");
  }
}

window.oncontextmenu = e => e.preventDefault();

// if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) alert("Notice: Safari touch controls do not work");
// ^ google told me this but apparently its total bullshit
let starttouch = {};
let touch = {};
let ti = {};
function updatetouch() {
  if (touches.length) ti.yeah = true;
  for (let t of touches) {
    if (!touch[t.id]) {
      if (player?.dead && menu == "game") playerspawn();
      starttouch[t.id] = createVector(t.x, t.y);
      if (t.x < innerWidth / 2 && !ti.s) {
        ti.si = t.id;
        ti.s = createVector(0, 0);
      }
      if (hbox(createVector(innerWidth - 100, innerHeight - 200),
        starttouch[t.id], 70)) ti.a = t.id + 1;
      if (hbox(createVector(innerWidth - 200, innerHeight - 100),
        starttouch[t.id], 55)) ti.b = t.id + 1;
      if (hbox(createVector(innerWidth - 100, innerHeight - 300),
        starttouch[t.id], 35)) {
        holding = ++holding % inventory.length;
        updateinv();
      }
      if (menu == "game" && hbox(createVector(25, 25), starttouch[t.id], 30))
        switchmenu('pause');
      if (ti.goog == true && menu == 'pause' && hbox(createVector(
        20, 20), starttouch[t.id], 35)) cheats();
      if (menu == 'pause' && hbox(createVector(innerWidth - 20, innerHeight - 20),
        starttouch[t.id], 35)) ti.goog = true;
      else ti.goog = false;
    }
    touch[t.id] = createVector(t.x, t.y);
    if (ti.s) {
      ti.s.set(touch[ti.si].copy().sub(starttouch[ti.si]));
      if (player && menu == "game" && (ti.s.magSq() < 130 * 130)) player.rotation = ti.s.heading();
      ti.s.limit(100);
    }
  }
  for (let id in touch) {
    if (!touches.find(t => t.id == id)) {
      delete touch[id];
      if (id == ti.si) ti.s = null;
      if (id == ti.a - 1) ti.a = null;
      if (id == ti.b - 1) ti.b = null;
    }
  }
}

function freecam() {
  camera = player?.pos.copy() || createVector(0, 0);
  camera.freecam = true;
}

function getmovementinput() {
  let m = createVector(
    ((keys.d || false) - (keys.a || false)),
    ((keys.s || false) - (keys.w || false)),
  );
  if (GP.ls && GP.ls.magSq() > 0.1) m.add(GP.ls.mult(2));
  if (ti.s && ti.s.magSq() > 65 * 65) m.add(ti.s.copy().mult(0.025));
  if (GP.dp) m.add(GP.dp.mult(2));
  m.set(
    Math.min(Math.max(m.x, -1), 1),
    Math.min(Math.max(m.y, -1), 1)
  );
  m.mult(dt);
  return m;
}