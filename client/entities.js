let entities = {};
let size = 20;

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
}

class Squish extends Entity {
  constructor(id, type, x, y, data = {}) {
    super(id, type, x, y);
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
  }

  draw() {
    push();
    translate(this.pos);
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
      'basic': '#884400',
      'boss': '',
      'super': '',
      'hunter': '',
      'omega': '',
      'team': '', // teammate
      'opp': '', // opposing team
    }[this.type]);
    strokeWeight(6);
    rect(size * -.5, size * -.5, size, this.dead ? size * .5 : size);
    imageMode(CENTER);
    if (this.holding) {
      rotate(this.rotation);
      image(tex(this.holding), size * 1.5, 0, size * 1.5, size * 1.5);
    }
    pop();
  }

  damage(x) {
    this.hp -= x;
    if (this.hp <= 0) {
      if (!this.player) {
        let p = Math.floor(Math.random() * {
          basic: 5,
        }[this.type]);
        if (p) new Item(genid(), 'point', this.pos.x, this.pos.y, { amount: p });
        this.remove();
      } else {
        this.dead = true;
      }
    }
  }

  getdata() {
    return { holding: this.holding, rotation: this.rotation, hp: this.hp };
  }
}
classes.squish = Squish;

function hbox(a, b) {
  return a.x + size > b.x && a.x - size < b.x &&
    a.y + size > b.y && a.y - size < b.y;
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
    let v = createVector(size * .75, 0).setHeading(this.rot);
    this.pos.add(v);
    if (Math.abs(this.pos.x) > wlmt || Math.abs(this.pos.y) > wlmt) this.remove();
    Object.values(entities).forEach(e => {
      if (!e.hp && e.id != this.from) return;
      if (hbox(this.pos, e.pos)) {
        e.damage({
          basic: 10
        }[this.type]);
      }
    });
  }
}