class Item extends Entity {
  constructor(id, type, x, y, data = {}) {
    super(id, type, x, y);
    this.class = "item";
    this.amount = data.amount || 1;
  }

  draw() {
    push();
    translate(this.pos);
    image(tex(this.type), 0, 0, 
      tex(this.type).width / tex(this.type).height * size * 1.5, size * 1.5);
    pop();
  }

  tick() {
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
      let y = false;
      inventory.forEach(x => {
        if (x[0] == this.type) {
          y = true;
          x[1] += this.amount;
        }
      });
      if (!y) {
        inventory.push([this.type, this.amount]);
        holding = inventory.length - 1;
      }
      updateinv();
    }
  }

  getdata() {
    return { amount: this.amount };
  }
}
classes.item = Item;

function useitem() {
  if (player.holding == 'pistol' && Date.now() - player.cooldown >= 250 && firstshot && ammo >= .5) {
    player.cooldown = Date.now();
    makebullet(powerammo ? 'power' : 'pistol', Math.PI * .05, 1);
    ammo -= .5;
  }
  if (player.holding == 'shotgun' && Date.now() - player.cooldown >= 1000 && firstshot && ammo >= 2) {
    player.cooldown = Date.now();
    makebullet(powerammo ? 'power' : 'shotgun', Math.PI * .15, 6);
    ammo -= 1;
  }
  if (Date.now() - player.cooldown >= 250 && firstshot) {
    let d = false;
    Object.values(entities).forEach(e => {
      if (d || !e.hp || e == player) return;
      if (hbox(player.pos, e.pos, size * 3)) {
        player.cooldown = Date.now();
        e.damage(10);
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