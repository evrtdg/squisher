function pcoll(p) {
  if (!bound(p)) return false;
  let i = (Math.floor(
    Math.floor((p.x + xlmt) * .5)
  ) + Math.floor(
    Math.floor((p.y + ylmt) * .5)
  ) * xlmt) * 4;
  let z = tex(map);
  if (z.pixels.length == 0) z.loadPixels();
  return !(
    z.pixels[i] == 103 &&
    z.pixels[i + 1] == 103 &&
    z.pixels[i + 2] == 103)
}

function bcoll(p1, s = size, c = true) {
  if (c) p1 = p1.copy().sub(s * .5, s * .5);
  let p2 = p1.copy().add(s, s);
  if (!pcoll(p1)) return false;
  if (!pcoll(p2)) return false;
  if (!pcoll(createVector(p1.x, p2.y))) return false;
  if (!pcoll(createVector(p2.x, p1.y))) return false;
  // if (!pcoll(createVector((p1.x + p2.x) * .5, p1.y))) return false;
  // if (!pcoll(createVector((p1.x + p2.x) * .5, p2.y))) return false;
  // if (!pcoll(createVector(p1.x, (p1.y + p2.y) * .5))) return false;
  // if (!pcoll(createVector(p2.x, (p1.y + p2.y) * .5))) return false;
  if (!pcoll(createVector((p1.x + p2.x) * .5, (p1.y + p2.y) * .5))) return false;
  return true;
}

function bound(p) {
  return Math.abs(p.x) <= xlmt && Math.abs(p.y) <= ylmt;
}