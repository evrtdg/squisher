class Item extends Entity {
  constructor(id, type, x, y, data = {}) {
    super(id, type, x, y);
    this.class = "item";
    this.amount = data.amount || 1;
  }

  draw() {
    push();
    translate(this.pos);
    let s = (tex(this.type).size || 1) * size;
    image(tex(this.type), s * -.5, s * -.5, s * 1.5, s * 1.5);
    pop();
  }

  tick() {
    if (itemmagnet && hbox(this.pos, player.pos, size * 8)) 
      this.pos.add(player.pos.copy().sub(this.pos).setMag(5000 / player.pos.copy().sub(this.pos).magSq()));
    if (hbox(player.pos, this.pos, size * 2)) {
      if (mp) callEvent('delete', this.id);
      this.remove();
      if (this.type == 'point') {
        points += this.amount;
        score += this.amount;
        return;
      }
      if (this.type == 'ammo') return ammo += this.amount;
      if (this.type == 'hp') return player.heal(this.amount);
      give(this.type, this.amount);
    }
  }

  getdata() {
    return { amount: this.amount };
  }
}
classes.item = Item;

function give(type, amount = 1) {
  let y = false;
  inventory.forEach(x => {
    if (x[0] == type) {
      y = true;
      x[1] += amount;
    }
  });
  if (!y) {
    inventory.push([type, amount]);
    holding = inventory.length - 1;
  }
  updateinv();
}

function useitem() {
  if (player.holding == 'pistol' && Date.now() - player.cooldown >= 250 && firstshot && ammo >= .5) {
    player.cooldown = Date.now();
    makebullet(powerammo ? [25] : [15, 5], Math.PI * .05, 1);
    ammo -= .5;
  }
  if (player.holding == 'shotgun' && Date.now() - player.cooldown >= 1000 && firstshot && ammo >= 1) {
    player.cooldown = Date.now();
    makebullet(powerammo ? [25] : [5, 2], Math.PI * .15, 6);
    ammo -= 1;
  }
  if (player.holding == 'machinegun' && Date.now() - player.cooldown >= 75 && ammo >= .2) {
    player.cooldown = Date.now();
    makebullet(powerammo ? [15] : [7, 5], Math.PI * .075, 1);
    ammo -= .2;
  }
  if (player.holding == 'flamethrower' && Date.now() - player.cooldown >= 150 && ammo >= 1.5) {
    player.cooldown = Date.now();
    let v = createVector(size * 2, 0).setHeading(player.rotation).add(player.pos);
    new Flame(genid(), '', v.x, v.y, {
      from: player.id, rot: player.rotation +
        Math.random() * .2 - .1, vel: size * .1
    });
    ammo -= 1.5;
  }
  if (Date.now() - player.cooldown >= 250 && firstshot) {
    let d = false;
    Object.values(entities).forEach(e => {
      if (d || !e.hp || e == player) return;
      if (hbox(player.pos, e.pos, size * 3)) {
        player.cooldown = Date.now();
        e.damage(10, player.id);
        d = true;
      }
    });
  }
  if (player.holding == 'mapper' && firstshot)
    console.log(Math.floor(player.pos.x) + ', ' + Math.floor(player.pos.y));
}

function updateinv() {
  if (holding >= inventory.length) holding = inventory.length - 1;
  if (holding < 0) holding = 0;
  player.holding = inventory[holding]?.[0] || null;
}