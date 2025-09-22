let entites = {};
let size = 20;

class Entity {
  constructor(id, type, x, y) {
    this.class = "";
    this.id = id;
    this.type = type;
    this.pos = createVector(x, y);
    this.data = {};
    entites[id] = this;
  }

  draw() {
    push();
    translate(this.pos);
    fill('#ff00000');
    stroke(0);
    strokeWeight(1);
    rect(0, 0, size);
    pop();
  }

  tick() {

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
  constructor(id, type, x, y) {
    super(id, type, x, y);
    this.class = "squish";
    this.data.holding = null;
  }

  draw() {
    push();
    translate(this.pos);
    fill(squishcolors[this.type][0]);
    stroke(squishcolors[this.type][1]);
    strokeWeight(6);
    rect(0, 0, size);
    pop();
  }
}