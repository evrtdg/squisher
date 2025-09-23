let wcol = [103, 103, 103, 255].join('_');

function pcoll(p) {
  if (!bound(p)) return false;
  if (tex(map).get((p.x + xlmt) * .5, (p.y + ylmt) * .5)
    .join('_') == wcol) return false;
  return true;
}

function bcoll(p1, s = size, c = true) {
  if (c) p1 = p1.copy().sub(s * .5, s * .5);
  let p2 = p1.copy().add(s, s);
  if (!pcoll(p1)) return false;
  if (!pcoll(p2)) return false;
  if (!pcoll(createVector(p1.x, p2.y))) return false;
  if (!pcoll(createVector(p2.x, p1.y))) return false;
  if (!pcoll(p1.copy().add(p2).mult(.5))) return false;
  return true;
}

function bound(p) {
  return Math.abs(p.x) <= xlmt && Math.abs(p.y) <= ylmt;
}