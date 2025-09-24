function classicinit() {
  playerspawn();
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