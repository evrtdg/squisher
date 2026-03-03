/** @type {WebSocket} */
let ws = null;
let cdcb = null;
let packet;
let lastsent;
let users = {};

let DEBUG = 0;
let sendinterval = 75;

function genid() {
  return Math.floor(Math.random() * (36 ** 8 - 1)).toString(36);
}

function connect(mode) {
  mpinit();
  if (ws) ws.close();
  ws = new WebSocket(API_URL);
  ws.onmessage = x => handlemsg(JSON.parse(x.data));
  return new Promise(y => {
    ws.onopen = () => joinGame(mode);
    ws.onclose = () => y("Server is offline. You can play classic mode instead.");
    setTimeout(y, 10e3, "Server is offline. You can play classic mode instead.");
    cdcb = y;
  });
}

function joinGame(mode) {
  send({
    type: 'join', username, mode
  });
}

function send(data) {
  ws.send(JSON.stringify(data));
  if (DEBUG) console.log(">", data);
}

function handlemsg(data) {
  if (DEBUG) console.log("<", data);
  switch (data.type) {
    case 'alert':
      if (cdcb) cdcb(data.message);
      else alert(data.message);
      break;
    case 'youjoin':
      cdcb(false);
      cdcb = null;
      mp = true;
      data.users.forEach(u => users[u] = true);
      data.create.forEach(x => createEntity(x, true));
      Object.entries(data.update).forEach(x => updateEntity(x[0], x[1], true));
      Object.entries(data.vars).forEach(x => netVar(x[0], x[1], true));
      break;
    case 'packet':
      if (data.create) data.create.forEach(x => createEntity(x, true));
      if (data.update) data.update.forEach(x => updateEntity(x[0], x[1], true));
      if (data.delete) data.delete.forEach(x => deleteEntity(x, true));
      if (data.event) data.event.forEach(x => callEvent(x, true));
      if (data.vars) Object.entries(data.vars).forEach(x => netVar(x[0], x[1], true));
      break;
    case 'join':
      users[data.name] = true;
      break;
    case 'leave':
      deleteEntity(users[data.name].id);
      delete users[data.name];
      break;
  }
}

function mpinit() {
  clearPacket();
  users = {
    [username]: true
  };
}

function mptick() {
  if (!mp) return;
  if (Date.now() > lastsent + sendinterval)
    sendPacket();
}

function clearPacket() {
  packet = {
    create: [],
    update: [],
    delete: [],
    event: [],
    vars: {}
  };
  lastsent = Date.now();
}

function createEntity(data, local = false) {
  if (!data.class) return console.error(data.class, "does not exist", data);
  let e = new (classes[data.class])(data.id, data.type, data.x, data.y, data);
  e.OWNER = local ? data.OWNER : username;
  if (DEBUG) console.log('create', e.type, e.class, e.OWNER, e.id);
  if (!local && mp) packet.create.push(data);
  if (mp && data.class == "squish" && data.type == "player") users[data.name] = e;
  return e;
}

function deleteEntity(id, local = false) {
  let e = entities[id];
  if (!e) return false;
  if (DEBUG) console.log('delete', e.type, e.class, e.OWNER, e.id);
  e.removed = true;
  delete entities[id];
  if (!local && mp) {
    let i = packet.update.findIndex(x => x[0] == id);
    if (i >= 0) packet.update.splice(i, 1);
    i = packet.create.findIndex(x => x.id == id);
    if (i >= 0) {
      packet.create.splice(i, 1);
      return true;
    }
    packet.delete.push(id);
  }
  return true;
}

function updateEntity(id, data, local = false) {
  let e = entities[id];
  if (!e) return false;
  if (DEBUG) console.log('update', e.type, e.class, e.OWNER, e.id, data);
  if (local) e.update(data);
  if (!local && mp) {
    let i = packet.update.findIndex(x => x[0] == id);
    let x = packet.update[i] ? { ...packet.update[i]?.[1], ...data } : data;
    if (i >= 0) packet.update[i] = [id, x];
    else packet.update.push([id, x]);
  }
  return true;
}

function sendPacket() {
  if (!packet.create.length) delete packet.create;
  if (!packet.update.length) delete packet.update;
  if (!packet.delete.length) delete packet.delete;
  if (!packet.event.length) delete packet.event;
  if (!packet.vars.length) delete packet.vars;
  if (Object.keys(packet).length != 0) {
    send({ type: "packet", packet });
  }
  clearPacket();
}