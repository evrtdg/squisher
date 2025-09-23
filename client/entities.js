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
  }

  tick() {
    this.dispos.add(this.pos.copy().sub(this.dispos).mult(.6));
    if (player == this) {

    }
    if (this.player) return;
    if (hbox(this.pos, player.pos)) {
      if (Date.now() - this.cooldown > 100) {
        this.cooldown = Date.now();
        player.damage({
          basic: Math.floor(Math.random() * 3) + 1
        }[this.type]);
      }
    } else {
      this.pos.add(
        (Math.random() - .5) * dt * .5,
        (Math.random() - .5) * dt * .5);
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
    imageMode(CENTER);
    if (this.holding) {
      push();
      rotate(this.rotation);
      image(tex(this.holding), size * 1.5, 0, size * 1.5, size * 1.5);
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

  damage(x) {
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
        this.dead = true;
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
    this.id = id;
    this.type = type;
    this.pos = createVector(x, y);
    this.from = data.from;
    this.rot = data.rot;
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
    let v = createVector(size * .05 * dt, 0).setHeading(this.rot);
    this.pos.add(v);
    if (Math.abs(this.pos.x) > xlmt || Math.abs(this.pos.y) > ylmt) this.remove();
    Object.values(entities).forEach(e => {
      if (!e.hp || e.id == this.from) return;
      if (hbox(this.pos, e.pos, size * 1.5)) {
        e.damage({
          basic: 15
        }[this.type] + Math.floor(Math.random() * ({
          basic: 5,
        }[this.type] + 1)));
        this.remove();
      }
    });
  }
}