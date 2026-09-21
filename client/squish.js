
class Squish extends Entity {
  constructor(id, type, x, y, data = {}) {
    super(id, type, x, y, data);
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
      basic: 25,
      boss: 150,
      super: 500,
      hunter: 1000,
      omega: 2500, // Nerfed because the initial numbers in the doc is too high
    }[type];
    this.maxhp = this.hp;
    this.bonushp = this.player ? 50 : 0;
    this.firetick = 0;
    this.onfire = 0;
    this.name = data.name;
    this.healto = 0;
    this.dash = 0;
  }

  tickall() {
    this.dispos.add(this.pos.copy().sub(this.dispos).mult(this.OWNER == username ? .5 : smoothfactor));
  }

  tick() {
    if (this.onfire > Date.now()) {
      this.firetick += dt;
      if (this.firetick > 250) {
        this.firetick %= 250;
        this.damage((this.onfire - Date.now()) * .0025);
      }
    }
    if (player == this) {
      if (this.hp <= 0) {
        playerdeath();
        // if (f) camera = f;
      }
      if (!this.dead && this.healto < Date.now() && this.hp < this.maxhp) {
        this.healto = Date.now() + healspeed;
        this.heal(1);
      }
      if (!this.dead && menu != "pause" && !camera?.freecam) {
        if (!((keys.z || GP.cx) && this.dash < 0)) this.dash -= dt;
        let m = getmovementinput();
        if (this.dash < -3e3 && (keys.z || GP.cx) && m.magSq() > 0.5) 
          this.dash = 1e3;
        m.mult(speed + Math.max(0, this.dash * .0003));
        if (bcoll(this.pos.copy().add(m.x, 0))) this.pos.add(m.x, 0);
        if (bcoll(this.pos.copy().add(0, m.y))) this.pos.add(0, m.y);
      }
    }
    if (this.player) return this.checkup();
    let touching = (mp ? Object.values(users) : [player]).find(x =>
      x === true ? false : hbox(this.pos, x.pos) && !x.dead);
    if (touching) {
      if (Date.now() - this.cooldown > 100) {
        this.cooldown = Date.now();
        touching.damage({
          basic: Math.floor(Math.random() * 4) + 2,
          boss: Math.floor(Math.random() * 6) + 4,
          super: Math.floor(Math.random() * 8) + 6,
          hunter: Math.floor(Math.random() * 10) + 8,
          omega: Math.floor(Math.random() * 12) + 10
        }[this.type], this.id);
      }
    } else {
      // if (!this.v) this.v = createVector(0, 0);
      let x = createVector((Math.random() - .5) * dt * .5, (Math.random() - .5) * dt * .5);
      (mp ? Object.values(users) : [player]).forEach(p => {
        if (p === true) return;
        if (hbox(this.pos, p.pos, 4 * size) && !p.dead)
          x.add(p.pos.copy().sub(this.pos).setMag(dt * .1));
        if (hbox(this.pos, p.pos, 16 * size) && !p.dead)
          x.add(p.pos.copy().sub(this.pos).setMag(dt * .05));
      });
      // this.v.add(x);
      // if (this.v.magSq > 1) this.v.setMag(1);
      let y = x;//this.v.copy().mult(dt * .5);
      if (pcoll(this.pos.copy().add(y))) this.pos.add(y);
    }
    this.checkup();
  }

  checkupplus() {
    let r = Math.floor(this.rotation * 10);
    if (this.old.r != r) updateEntity(this.id, { r });
    this.old.r = r;
  }

  draw() {
    push();
    translate(this.dispos);
    let type = this.type;
    if (this.player && this != player) type = "team";
    fill({
      'player': '#97E66C',
      'basic': '#ff0000',
      'boss': '#B3B3B3',
      'super': '#ffe815',
      'hunter': '#09EEDC',
      'omega': '#fb48f8',
      'team': '#5555ee', // teammate
      'opp': '#b6007f', // opposing team (this looks too much like basic!!)
    }[type]);
    stroke({
      'player': '#805909',
      'basic': '#aa2200',
      'boss': '#888090',
      'super': '#b2a428',
      'hunter': '#24c3c6',
      'omega': '#b837b6',
      'team': '#3333cc', // teammate
      'opp': '#cc3333', // opposing team
    }[type]);
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
    if (this.hp < this.maxhp - 5) {
      noStroke();
      fill(0);
      rect(-size * .8, -size * 1.3, size * 1.6, size * .4);
      fill(255, 0, 0);
      rect(-size * .8, -size * 1.3, this.hp > 0 ? size * 1.6 *
        (this.hp / this.maxhp) : 0, size * .4);
    }
    if (this.player && this != player) {
      push();
      if (this.hp < this.maxhp - 5) translate(0, -15);
      fill(255);
      stroke(0);
      strokeWeight(2);
      textSize(12);
      textAlign(CENTER, BOTTOM);
      text(this.name, 0, -size * .70);
      pop();
    }
    pop();
  }

  damage(x, f = null, l = false) {
    if (this.dead) return;
    if (f == player?.id && this.player && this != player && !friendlyfire) return;
    this.hp -= x;
    if (this.hp <= 0) {
      if (!this.player) {
        if (Math.random() < 0.15) createEntity({
          class: 'item',
          id: genid(),
          type: 'bomb',
          x: this.pos.x + Math.random() * size - size * .5,
          y: this.pos.y + Math.random() * size - size * .5,
          amount: Math.floor(Math.random() * 3) + 1
        });

        let p = Math.floor(Math.random() * ({
          basic: 5, //points
        }[this.type] + 1));
        if (p > 0) createEntity({
          class: 'item',
          id: genid(),
          type: 'point',
          x: this.pos.x + Math.random() * size - size * .5,
          y: this.pos.y + Math.random() * size - size * .5,
          amount: p
        });

        let a = Math.floor(Math.random() * ({
          basic: 15, //ammo max
          boss: 25,
          super: 150,
          hunter: 250,
          omega: 400,
        }[this.type] + 1)) - Math.floor(Math.random() * ({
          basic: 5, //ammo sub
          boss: 15,
          super: 25,
          hunter: 150,
          omega: 250,
        }[this.type] + 1));
        if (a > 0) createEntity({
          class: 'item',
          id: genid(),
          type: 'ammo',
          x: this.pos.x + Math.random() * size - size * .5,
          y: this.pos.y + Math.random() * size - size * .5,
          amount: p
        });

        let h = Math.floor(Math.random() * ({
          basic: 15, //hp max
          boss: 25,
          super: 35,
          hunter: 45,
          omega: 55,
        }[this.type] + 1)) - Math.floor(Math.random() * ({
          basic: 5, //hp sub
          boss: 15,
          super: 25,
          hunter: 35,
          omega: 45
        }[this.type] + 1));
        if (h > 0) createEntity({
          class: 'item',
          id: genid(),
          type: 'hp',
          x: this.pos.x + Math.random() * size - size * .5,
          y: this.pos.y + Math.random() * size - size * .5,
          amount: h
        });
        this.remove();
      }
    }
    this.healto = Date.now() + healdelay;
    if (!l) updateEntity(this.id, f ?
      { hp: this.hp, damager: f } :
      { hp: this.hp });
  }

  heal(x) {
    if (this.hp >= this.maxhp + this.bonushp) return x;
    let r = this.hp;
    this.hp += x;
    if (this.hp > this.maxhp + this.bonushp) this.hp = this.maxhp + this.bonushp;
    if (this.hp != r) updateEntity(this.id, { hp: this.hp });
    return (r + x) - (this.maxhp + this.bonushp);
  }

  getdata() {
    return { holding: this.holding, rotation: this.rotation, hp: this.hp };
  }

  update(data) {
    let d = null;
    Object.entries(data).forEach(x => {
      if (x[0] == "x") return this.pos.x = x[1];
      if (x[0] == "y") return this.pos.y = x[1];
      if (x[0] == "r") return this.rotation = x[1] * .1;
      // console.log(this.id, this.type, x[0], x[1]);
      if (x[0] == "OWNER" && x[1] == username && this.player) this.remove();
      if (x[0] == "damager") d = x[1];
      this[x[0]] = x[1];
    });
    if (d) this.damage(0, d, true);
  }
}
classes.squish = Squish;