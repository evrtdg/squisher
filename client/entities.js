let entities = {};
let size = 24;

const classes = {};
class Entity {
  constructor(id, type, x, y, data = {}) {
    this.class = "";
    this.id = id;
    this.type = type;
    this.pos = createVector(x, y);
    entities[id] = this;
  }

  draw() {
    push();
    translate(this.pos);
    fill(255, 0, 0);
    stroke(0);
    strokeWeight(1);
    rect(0, 0, size);
    pop();
  }

  tick() {

  }

  remove() {
    this.removed = true;
    delete entities[this.id];
  }

  onscreen(c) {
    let x = this.pos.copy().add(c);
    return x.x > -size * 3 && x.x < windowWidth + size * 3 &&
      x.y > -size * 3 && x.y < windowHeight + size * 3;
  }
}

class Squish extends Entity {
  constructor(id, type, x, y, data = {}) {
    super(id, type, x, y);
    this.dispos = createVector(x, y);
    this.class = "squish";
    this.holding = data.holding || null;
    this.rotation = data.rotation || 0;
    this.cooldown = Date.now();
    if (type == 'player' || type == 'team' || type == 'opp') {
      this.player = true;
    }
    this.hp = {
      player: 100,
      basic: 25
    }[type];
    this.maxhp = this.hp;
    this.bonushp = this.player ? 50 : 0;
    this.firetick = 0;
    this.onfire = 0;
  }

  tick() {
    this.dispos.add(this.pos.copy().sub(this.dispos).mult(.5));
    if (this.onfire > Date.now()) {
      this.firetick += dt;
      if (this.firetick > 250) {
        this.firetick %= 250;
        this.damage((this.onfire - Date.now()) * .0025);
      }
    }
    if (player == this) {
      if (!this.dead) {
        let m = createVector(
          ((keys.d || false) - (keys.a || false)) * dt * speed,
          ((keys.s || false) - (keys.w || false)) * dt * speed,
        );
        if (bcoll(this.pos.copy().add(m.x, 0))) this.pos.add(m.x, 0);
        if (bcoll(this.pos.copy().add(0, m.y))) this.pos.add(0, m.y);
      }
    }
    if (this.player) return;
    if (hbox(this.pos, player.pos) && !player.dead) {
      if (Date.now() - this.cooldown > 100) {
        this.cooldown = Date.now();
        player.damage({
          basic: Math.floor(Math.random() * 4) + 2
        }[this.type], this.id);
      }
    } else {
      let x = createVector((Math.random() - .5) * dt * .5, (Math.random() - .5) * dt * .5);
      if (hbox(this.pos, player.pos, 4 * size) && !player.dead)
        x.add(player.pos.copy().sub(this.pos).setMag(dt * .1));
      if (hbox(this.pos, player.pos, 16 * size) && !player.dead)
        x.add(player.pos.copy().sub(this.pos).setMag(dt * .05));
      if (pcoll(this.pos.copy().add(x))) this.pos.add(x);
    }
  }

  draw() {
    push();
    translate(this.dispos);
    fill({
      'player': '#97E66C',
      'basic': '#ff0000',
      'boss': '',
      'super': '',
      'hunter': '',
      'omega': '',
      'team': '', // teammate
      'opp': '', // opposing team
    }[this.type]);
    stroke({
      'player': '#805909',
      'basic': '#aa2200',
      'boss': '',
      'super': '',
      'hunter': '',
      'omega': '',
      'team': '', // teammate
      'opp': '', // opposing team
    }[this.type]);
    strokeWeight(8);
    rect(size * -.5, size * -.5, size, this.dead ? size * .5 : size);
    if (this.onfire > Date.now()) {
      strokeWeight(4);
      stroke('#FFAA0088');
      fill('#FF000088');
      rect(-size, -size, size * 2, this.dead ? size : size * 2);
    }
    if (this.holding && !this.dead) {
      push();
      rotate(this.rotation);
      let s = (tex(this.holding).size || 1) * size;
      image(tex(this.holding), size * .8, s * -.75, s * 1.5, s * 1.5);
      pop();
    }
    if (this.hp < this.maxhp) {
      noStroke();
      fill(0);
      rect(-size * .8, -size * 1.3, size * 1.6, size * .4);
      fill(255, 0, 0);
      rect(-size * .8, -size * 1.3, size * 1.6 *
        (this.hp / this.maxhp), size * .4);
    }
    pop();
  }

  damage(x, f = null) {
    if (this.dead) return;
    this.hp -= x;
    if (this.hp <= 0) {
      if (!this.player) {
        let p = Math.floor(Math.random() * ({
          basic: 5, //points
        }[this.type] + 1));
        if (p > 0) new Item(genid(), 'point',
          this.pos.x + Math.random() * size - size * .5,
          this.pos.y + Math.random() * size - size * .5, { amount: p });

        let a = Math.floor(Math.random() * ({
          basic: 15, //ammo max
        }[this.type] + 1)) - Math.floor(Math.random() * ({
          basic: 5, //ammo sub
        }[this.type] + 1));
        if (a > 0) new Item(genid(), 'ammo',
          this.pos.x + Math.random() * size - size * .5,
          this.pos.y + Math.random() * size - size * .5, { amount: p });

        let h = Math.floor(Math.random() * ({
          basic: 15, //hp max
        }[this.type] + 1)) - Math.floor(Math.random() * ({
          basic: 5, //hp sub
        }[this.type] + 1));
        if (h > 0) new Item(genid(), 'hp',
          this.pos.x + Math.random() * size - size * .5,
          this.pos.y + Math.random() * size - size * .5, { amount: h });
        this.remove();
      } else {
        playerdeath();
        if (f) camera = f;
      }
    }
  }

  heal(x) {
    this.hp += x;
    if (this.hp > this.maxhp + this.bonushp) this.hp = this.maxhp + this.bonushp;
  }

  getdata() {
    return { holding: this.holding, rotation: this.rotation, hp: this.hp };
  }
}
classes.squish = Squish;

function hbox(a, b, s1 = size) {
  return a.x + s1 > b.x && a.x < b.x + s1 &&
    a.y + s1 > b.y && a.y < b.y + s1;
}

class Bullet extends Entity {
  constructor(id, type, x, y, data = {}) {
    super(id, type, x, y, data);
    this.class = "bullet";
    this.from = data.from;
    this.rot = data.rot;
    if (pierceammo ? !bound(this.pos) : !pcoll(this.pos)) this.remove();
  }

  draw() {
    push();
    translate(this.pos);
    stroke(255, 255, 0);
    strokeWeight(size * .25);
    let v = createVector(size, 0).setHeading(this.rot);
    line(0, 0, v.x, v.y);
    pop();
  }

  tick() {
    for (let i = 0; i < 2; i++) {
      this.pos.add(createVector(size * .05 * dt * .5, 0).setHeading(this.rot));
      if (pierceammo ? !bound(this.pos) : !pcoll(this.pos)) return this.remove();
    }
    Object.values(entities).forEach(e => {
      if (!e.hp || e.id == this.from) return;
      if (hbox(this.pos, e.pos, size * 1.5)) {
        e.damage(this.type[0] + Math.floor(Math.random() * ((this.type[1] || 0) + 1)), this.from);
        this.remove();
      }
    });
  }
}

function spawnzone(t = 'enemy') {
  let x = spawn.map[t];
  x = x[Math.floor(Math.random() * x.length)];
  return createVector(
    Math.floor(Math.random() * (x[0] - x[2])) + x[2],
    Math.floor(Math.random() * (x[1] - x[3])) + x[3],
  );
}

class Flame extends Entity {
  constructor(id, type, x, y, data = {}) {
    super(id, type, x, y, data);
    this.class = "flame";
    this.from = data.from;
    this.rot = data.rot;
    this.vel = data.vel || 0;
    this.size = data.size || size;
    this.svel = this.vel * .5;
  }

  draw() {
    push();
    translate(this.pos);
    fill(255, 0, 0);
    stroke(255, 128, 0);
    strokeWeight(2);
    scale(Math.sqrt(this.size));
    rect(-4, -4, 8, 8);
    pop();
  }

  tick() {
    this.vel *= .9;
    let v = createVector(this.vel * dt * .5, 0).setHeading(this.rot);
    if (pcoll(this.pos.copy().add(v))) this.pos.add(v);
    else this.vel = 0;
    this.svel *= .99;
    this.size += this.svel * 3;
    this.size -= 50 / this.size;
    Object.values(entities).forEach(e => {
      if (e.class == 'flame' && e != this && this.size > e.size &&
        hbox(this.pos, e.pos, Math.min(this.size, size * 12) * .5 + e.size * .5)) {
        this.pos.add(e.pos.copy().sub(this.pos).mult(.01));
        e.size -= 1;
        this.size += .5;
        return;
      }
      if (!e.hp /*|| e.id == this.from*/) return;
      if (hbox(this.pos, e.pos, Math.min(this.size, size * 4)) && e.class == 'squish') {
        let x = Math.max(0, (e.onfire || 0) - Date.now());
        // x = x * x;
        x = x * .4 + dt * Math.max(this.vel * this.vel, size) * .8;
        // x = Math.sqrt(x);
        e.onfire = Math.min(x, 3e3) + Date.now();
        this.vel = Math.max(this.vel - .0002 * x, 0);
      }
      if (hbox(this.pos, e.pos, Math.min(this.size, size * 12))) {
        let x = Math.random() * Math.max(Math.min(this.size, size * 12), size * 2) / Math.max(this.pos.copy()
          .sub(e.pos).magSq(), size * 4) * dt * .2;
        // console.log(e.class + '.' + e.type, x);
        e.damage(x, this.from);
        this.svel -= x * .05;
      }
    });
    if (this.size <= 1) this.remove();
  }

  onscreen(c) {
    let x = this.pos.copy().add(c);
    return x.x > -this.size * .5 && x.x < windowWidth + this.size * .5 &&
      x.y > -this.size * .5 && x.y < windowHeight + this.size * .5;
  }
}

class Bomb extends Entity {
  constructor(id, type, x, y, data) {
    super(id, type, x, y);
    this.class = "Bomb";
    this.from = data.from;
  }
}