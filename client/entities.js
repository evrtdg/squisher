let entities = {};
let size = 24;

const classes = {};
class Entity {
  constructor(id, type, x, y, data = {}) {
    this.class = "";
    this.id = id;
    this.type = type;
    this.pos = createVector(x, y);
    this.dispos = createVector(x, y);
    entities[id] = this;
    this.old = {};
  }

  draw() {
    push();
    translate(this.dispos);
    fill(255, 0, 0);
    stroke(0);
    strokeWeight(1);
    rect(0, 0, size);
    pop();
  }

  tickall() {
    if (this.OWNER != username) this.dispos.add(this.pos.copy().sub(this.dispos).mult(smoothfactor));
    else this.dispos.set(this.pos);
  }

  tick() {
    this.checkup();
  }

  remove() {
    deleteEntity(this.id);
  }

  onscreen(c) {
    let x = this.pos.copy().add(c);
    return x.x > -size * 3 && x.x < windowWidth + size * 3 &&
      x.y > -size * 3 && x.y < windowHeight + size * 3;
  }

  update(data) {
    Object.entries(data).forEach(x => {
      if (x[0] == "x") return this.pos.x = x[1];
      if (x[0] == "y") return this.pos.y = x[1];
      this[x[0]] = x[1];
    });
  }

  checkup() {
    let x = Math.floor(this.pos.x);
    let y = Math.floor(this.pos.y);
    if (this.old.x != x) updateEntity(this.id, { x });
    if (this.old.y != y) updateEntity(this.id, { y });
    this.old.x = x;
    this.old.y = y;
    if (this.checkupplus) this.checkupplus();
  }
}

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
    this.damage = data.damage || [25];
    if (pierceammo ? !bound(this.pos) : !pcoll(this.pos)) this.remove();
    // this.colc = 0
  }

  draw() {
    push();
    translate(this.dispos);
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
        e.damage(this.damage[0] + Math.floor(Math.random() * ((this.damage[1] || 0) + 1)), this.from);
        this.remove();
      }
      if (e.class == "bomb") e.explode;
    });
    this.checkup();
  }
}
classes.bullet = Bullet;

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
    this.dissize = this.size;
    this.svel = this.vel * 1.2;
    this.livetime = Date.now() + 15e3;
  }

  draw() {
    push();
    translate(this.dispos);
    fill(255, 0, 0);
    stroke(255, 128, 0);
    strokeWeight(2);
    scale(Math.sqrt(this.dissize));
    rect(-4, -4, 8, 8);
    pop();
  }

  tickall() {
    if (this.OWNER != username) {
      this.dispos.add(this.pos.copy().sub(this.dispos).mult(smoothfactor));
      this.dissize += (this.size - this.dissize) * smoothfactor;
    } else {
      this.dispos.set(this.pos);
      this.dissize = this.size;
    }
  }

  tick() {
    this.vel *= .9;
    let v = createVector(this.vel * dt * .5, 0).setHeading(this.rot);
    if (pcoll(this.pos.copy().add(v))) this.pos.add(v);
    else this.vel = 0;
    this.svel *= .99 - this.size * 0.0002;
    this.size += this.svel * 3;
    this.size -= 50 / this.size;
    Object.values(entities).forEach(e => {
      if (e.class == 'flame' && e != this && this.size > e.size && hbox(this.pos,
        e.pos, Math.min(this.size, size * 8) * .5 + e.size * .5)) {
        if (this.size < 300) this.pos.add(e.pos.copy().sub(this.pos).mult(.01));
        if (this.size > 400) this.pos.sub(e.pos.copy().sub(this.pos)
          .div(e.pos.copy().sub(this.pos).magSq()).mult(30));
        if (this.size < 500) {
          e.size -= 1;
          this.size += .8;
        }
        return;
      }
      if (!e.hp) return;
      if (hbox(this.pos, e.pos, Math.min(this.size, size * 4)) && e.class == 'squish') {
        let x = Math.max(0, (e.onfire || 0) - Date.now());
        x = x * .4 + dt * Math.max(this.vel * this.vel * 4, size) * .8;
        if (player == e || !e.player || (e.player && friendlyfire) || !mp){
          e.onfire = Math.min(x, 1e3) * 3 + Date.now();
          if (mp && !e.dead) updateEntity(e.id, { onfire: e.onfire });
        }
        this.vel = Math.max(this.vel - .00006 * x, 0);
      }
      if (hbox(this.pos, e.pos, Math.min(this.size, size * 8))) {
        let x = Math.random() * Math.max(Math.min(this.size, size * 8), size * 2) /
          Math.max(this.pos.copy().sub(e.pos).mag(), size * 4) * dt * .002;
        e.damage(x, this.from);
        this.svel *= 1 - x * .025;
      }
    });
    if (this.livetime < Date.now()) this.svel -= dt * 0.004;
    if (this.size <= 1 || this.size > 600) this.remove();
    this.checkup();
  }

  onscreen(c) {
    let x = this.pos.copy().add(c);
    return x.x > -this.size * .5 && x.x < windowWidth + this.size * .5 &&
      x.y > -this.size * .5 && x.y < windowHeight + this.size * .5;
  }

  checkupplus() {
    let s = Math.floor(this.size);
    if (this.old.s != s) updateEntity(this.id, { size: s });
    this.old.s = s;
  }
}
classes.flame = Flame;

class Bomb extends Entity {
  constructor(id, type, x, y, data = {}) {
    super(id, type, x, y, data);
    this.class = "bomb";
    this.from = data.from || null;
    this.countdown = Date.now();
    this.rot = data.rot || 0;
    this.vel = data.vel || 0;
  }

  tick() {
    this.vel *= .97;
    let v = createVector(this.vel * dt * .5, 0).setHeading(this.rot);
    if (pcoll(this.pos.copy().add(v))) this.pos.add(v);
    else this.vel = 0;
    if (Date.now() - this.countdown > 3e3) this.explode(this);
    Object.values(entities).forEach(e => {
      if (hbox(this.pos, e.pos, size * 1)) {
        if (e.class == "squish" &&
          e.id != this.from) this.explode(this);
      }
    });
    this.checkup();
  }

  draw() {
    push();
    translate(this.dispos);
    let x = Date.now() - this.countdown;
    let s = x * .01 + size * .5;
    image(tex((x % 1e3 > 500 ? 'white' : '') + 'bomb'),
      (s + size) * -.5, (s + size) * -.5, size + s, size + s);
    pop();
  }

  explode() {
    createEntity({
      class: 'explosion',
      id: genid(),
      x: this.pos.x,
      y: this.pos.y,
      from: this.from,
    });
    this.remove();
  }
}
classes.bomb = Bomb;

class Landmine extends Entity {
  constructor(id, type, x, y, data = {}) {
    super(id, type, x, y, data);
    this.class = "landmine";
    this.from = data.from || null;
    this.activation = Date.now();
  }

  tick() {
    if (Date.now() - this.activation > 5e3) Object.values(entities).forEach(e => {
      if (hbox(this.pos, e.pos, size * .7)) {
        if ((e.class == "squish" || e.class == "bullet")
          // && e.id != this.from
        ) this.explode(this);
        if (e.class == "bullet") e.remove();
      }
    });
    this.checkup();
  }

  draw() {
    push();
    translate(this.dispos);
    image(tex(Date.now() - this.activation > 5e3 ? "landmineactive" : "landmine"), 
      size * -.75, size * -.75, size * 1.5, size * 1.5);
    pop();
  }

  explode() {
    createEntity({
      class: 'explosion',
      id: genid(),
      x: this.pos.x,
      y: this.pos.y,
      from: this.from,
      force: 2
    });
    this.remove();
  }
}
classes.landmine = Landmine;

class Ferret extends Bomb {
  constructor(id, type, x, y, data = {}) {
    super(id, type, x, y, data);
    this.class = "ferret";
  }

  draw() {
    this.vel *= .98;
    let v = createVector(this.vel * dt * .5, 0).setHeading(this.rot);
    if (pcoll(this.pos.copy().add(v))) this.pos.add(v);
    push();
    translate(this.pos);
    let x = Date.now() - this.countdown;
    image(tex((x % 400 > 200 ? 'white' : '') + 'ferret'), size * -2.5, size * -2.5, size * 5, size * 5);
    if (x > 3000) this.explode();
    pop();
  }

  explode() {
    createEntity({
      class: 'explosion',
      id: genid(),
      x: this.pos.x,
      y: this.pos.y,
      from: this.from,
      size: 100000,
      force: 2
    });
    this.remove();
  }
}
// classes.ferret = Ferret;

class Explosion extends Entity {
  constructor(id, type, x, y, data = {}) {
    super(id, type, x, y, data);
    this.class = "explosion";
    this.from = data.from;
    this.size = data.size || size;
    this.force = data.force || 8;
    this.fade = 0;
    this.dissize = this.size;
    this.disfade = this.fade;
  }

  tickall() {
    if (this.OWNER != username) {
      this.dispos.add(this.pos.copy().sub(this.dispos).mult(smoothfactor));
      this.dissize += (this.size - this.dissize) * smoothfactor;
      this.disfade += (this.fade - this.disfade) * smoothfactor;
    } else {
      this.dispos.set(this.pos);
      this.dissize = this.size;
      this.disfade = this.fade;
    }
  }

  draw() {
    push();
    translate(this.dispos);
    scale(Math.sqrt(this.dissize));
    // fill(255);
    // noStroke();
    // rect(-4, -4, 8, 8);
    fill(255, 0, 0, (1 - this.disfade) * 255);
    stroke(255, 128, 0, (1 - this.disfade) * 255);
    strokeWeight(2);
    rect(-4, -4, 8, 8);
    pop();
  }

  tick() {
    this.force *= .99;
    this.size += this.force * 8;
    if (this.fade < .8) {
      Object.values(entities).forEach(e => {
        if (hbox(this.pos, e.pos, this.size)) {
          if (e.class == "bomb" && Date.now() - e.countdown > 500) e.explode();
          if (!e.hp) return;

          let dmg = Math.random() * this.size /
            Math.max(this.pos.copy().sub(e.pos).magSq(), size * 4) * dt * (this.force * 2.5) * (1 - this.fade);

          if (dmg > 0) e.damage(dmg, this.from);
        }
      });
    }
    this.fade += this.force * 0.003 + .08;
    if (this.fade >= 1) this.remove();
    this.checkup();
  }

  onscreen(c) {
    let x = this.pos.copy().add(c);
    return x.x > -this.size * .5 && x.x < windowWidth + this.size * .5 &&
      x.y > -this.size * .5 && x.y < windowHeight + this.size * .5;
  }

  checkupplus() {
    let s = Math.floor(this.size);
    let f = Math.floor(this.fade);
    if (this.old.s != s) updateEntity(this.id, { size: s });
    if (this.old.f != f) updateEntity(this.id, { fade: f });
    this.old.s = s;
    this.old.f = f;
  }
}
classes.explosion = Explosion;