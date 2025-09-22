/** @typedef {import("p5").Element} p5.Element */

let username = window.localStorage?.username || '';
let keys = {};
let menu, game;
/** @type {Array.<p5.Element>} */
let menubtn;
/** @type {p5.Element} */
let menuuser;

function setup() {
  createCanvas(windowWidth, windowHeight);
  menu = null;
  game = null;
  menubtn = [];
  switchmenu('menu');
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
    tickgame();
    drawgame();
  }
}

function initmenu() {
  menubtn.push(...[
    createButton('Classic mode').id('classic'),
    createButton('Freaking mode').id('freak'),
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
  keys[key.toLowerCase()] = true;
}

function keyReleased() {
  keys[key.toLowerCase()] = false;
}