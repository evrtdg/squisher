class Item extends Entity {
  constructor(id, type, x, y, data = {}) {
    super(id, type, x, y);
    this.class = "item";
    this.amount = data.amount || 1;
  }

  draw() {
    push();
    translate(this.pos);
    image(tex(this.type), 0, 0, size * 1.5, size * 1.5);
    pop();
  }

  tick() {
    if (hbox(player.pos, this.pos, size * 2)) {
      if (mp) callEvent('delete', this.id);
      this.remove();
      if (this.type == 'point') return points += this.amount;
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
  if (player.holding == 'pistol' && Date.now() - player.cooldown >= 250 && firstshot && ammo > 0) {
    player.cooldown = Date.now();
    makebullet(player.pos, player.rotation, player);
    ammo -= .25;
  }
  if (Date.now() - player.cooldown >= 250 && firstshot) {
    let d = false;
    Object.values(entities).forEach(e => {
      if (d || !e.hp || e == player) return;
      if (hbox(player.pos, e.pos, size * 5)) {
        player.cooldown = Date.now(); 
        e.damage(10);
        d = true;
      }
    });
  }
}

function updateinv() {
  if (holding >= inventory.length) holding = inventory.length - 1;
  if (holding < 0) holding = 0;
  player.holding = inventory[holding]?.[0] || null;
}