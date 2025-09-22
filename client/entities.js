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

const squishcolors = {
  'player': ['#97E66C', '#805909'],
  'basic': ['#ff0000', '#884400'],
  'boss': [],
  'super': [],
  'hunter': [],
  'omega': [],
  'team': [], // teammate
  'opp': [], // opposing team
};
class Squish extends Entity {
  constructor(id, type, x, y, data = {}) {
    super(id, type, x, y);
    this.class = "squish";
    this.holding = data.holding || null;
    this.rotation = data.rotation || 0;
    this.cooldown = Date.now();
  }

  draw() {
    push();
    translate(this.pos);
    fill(squishcolors[this.type][0]);
    stroke(squishcolors[this.type][1]);
    strokeWeight(6);
    rect(size * -.5, size * -.5, size);
    imageMode(CENTER);
    if (this.holding) {
      rotate(this.rotation);
      image(tex(this.holding), size * 1.5, 0, size * 1.5, size * 1.5);
    }
    pop();
  }

  getdata() {
    return { holding: this.holding, rotation: this.rotation };
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
    let v = createVector(size * .5, 0).setHeading(this.rot);
    this.pos.add(v);
    if (Math.abs(this.pos.x) > wlmt || Math.abs(this.pos.y) > wlmt) this.remove();
  }
}