function classicinit() {
  playerspawn();
}

function classictick() {
  if (Math.random() < .008 &&
    Object.values(entities).filter(x =>
      x.class == 'squish' && !x.player).length < 100) {
    let p = spawnzone('enemy');
    createEntity({
      class: 'squish',
      id: genid(),
      type: 'basic',
      x: p.x,
      y: p.y
    });
  }
}

function classicdraw() {

}

function fightinit() {
  playerspawn();
}

function fighttick() {
  if (Math.random() < .005 / Object.keys(users).length &&
    Object.values(entities).filter(x =>
      x.class == 'squish' && !x.player).length < 100) {
    let p = spawnzone('enemy');
    createEntity({
      class: 'squish',
      id: genid(),
      type: 'basic',
      x: p.x,
      y: p.y
    });
  }
}

function fightdraw() {

}