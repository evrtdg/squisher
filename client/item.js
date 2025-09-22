class Item extends Entity {
  constructor(id, type, x, y, data = {}) {
    super(id, type, x, y);
    this.class = "item";
    this.amount = data.amount || 1;
  }

  draw() {
    push();
    translate(this.pos);
    image(tex(this.type), 0, 0, size, size);
    pop();
  }

  tick() {
    if (hbox(player.pos, this.pos)) {
      if (mp) callEvent('delete', this.id);
      this.remove();
      let y = false;
      inventory.forEach(x => {
        if (x[0] == this.type) {
          y = true;
          x[1] += this.amount;
        }
      });
      if (!y) inventory.push([this.type, this.amount]);
      updateinv();
    }
  }

  getdata() {
    return { amount: this.amount };
  }
}
classes.item = Item;