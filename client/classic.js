function classicinit() {
  player.pos.set(spawnzone('player'));
  new Squish(genid(), 'basic', 30, 30);
  new Item(genid(), 'pistol', player.pos.x + 50, player.pos.y);
  new Item(genid(), 'ammo', player.pos.x + 50, player.pos.y, { amount: 50 });
}

function classictick() {
  if (Math.random() < .01 && Object.values(entities).filter(x => 
    x.class == 'squish' && !x.player).length < 100) {
    let p = spawnzone('enemy');
    new Squish(genid(), 'basic', p.x, p.y);
  }
}

function classicdraw() {

}