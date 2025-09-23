function classicinit() {
  new Squish(genid(), 'basic', 30, 30);
  new Item(genid(), 'pistol', -50, 50);
  new Item(genid(), 'ammo', -60, 50, { amount: 50 });
}

function classictick() {
  if (Math.random() < .01 && Object.values(entities).filter(x => 
    x.class == 'squish' && !x.player).length < 100) {
    new Squish(genid(), 'basic',
      Math.random() * wlmt * 2 - wlmt,
      Math.random() * wlmt * 2 - wlmt);
  }
}

function classicdraw() {

}