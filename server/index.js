const DEBUG = 0;
require('dotenv').config({ quiet: true });
const static = new (require('node-static').Server)('./client');
const server = require('http').createServer(async (req, res) => {
  if (process.env.DEV)
    static.serve(req, res);
  else if (req.url == "/" + process.env.UPDATE_TOKEN) {
    require("child_process").exec('git pull | grep "server" && pm2 restart x');
    res.writeHead(200).end();
  }
});
const wss = new (require('ws').Server)({ server });

const rooms = {};

const sendinterval = 10;

wss.on('connection', ws => {
  console.log("new conn");
  ws.mode = null;
  ws.name = null;
  ws.room = null;
  ws.plent = null;
  ws.pingt = null;
  ws.res = [];
  ws.packet;
  ws.on('message', d => {
    let data;
    try {
      data = JSON.parse(d);
      if (DEBUG) console.log(ws.name, ">", data);
    } catch (e) { return };
    switch (data.type) {
      case 'join':
        if (ws.room) return;
        if (data.username?.length < 2 || data.username?.length > 16) return send(ws, {
          type: 'alert',
          message: data.username?.length < 2 ? 'name too short' : 'name too long'
        });
        let nameused = false;
        wss.clients.forEach(w => { if (w.name == data.username && w != ws) nameused = true });
        if (nameused) return send(ws, {
          type: 'alert',
          message: 'name already used'
        });
        if (data.mode != 'fight') return;
        let r = joinRoom(ws, data.username, 'test', data.mode, data.vars);
        if (r) return send(ws, {
          type: 'alert',
          message: r
        });
        break;
      case 'leave':
        if (ws.room) leaveRoom(ws);
        break;
      case 'packet':
        if (!ws.room) return;
        let b = data.packet;
        if (b.create) {
          let x = b.create.findIndex(x => x.class == "squish" && x.type == "player");
          if (x >= 0) {
            if (this.plent || b.create[x].name != ws.name) b.splice(x, 1);
            else this.plent = x.id;
          }
          b.create.forEach(x => {
            ws.res.push(x.id);
            rooms[ws.room].res[x.id] = ws;
          });
        }
        if (b.delete) b.delete.forEach(x => {
          let y = rooms[ws.room].res[x];
          if (!y || !y.res) return; //odd...
          let z = y.res.findIndex(a => a == x);
          if (!z) return; //even odder....
          y.res.splice(z, 1);
          delete rooms[ws.room].res[x];
        });
        if (b.delete && b.delete.includes(this.plent)) this.plent = null;
        Object.entries(rooms[ws.room].users).forEach(x => {
          if (x[0] != ws.name) {
            let a = x[1].packet;
            if (b.create) a.create.push(...b.create);
            if (b.update) a.update.push(...b.update);
            if (b.delete) a.delete.push(...b.delete);
            if (b.event) a.event.push(...b.event.map(x => [ws.name, ...x]));
            if (b.vars) a.vars = { ...a.vars, ...b.vars };
          }
        });
        let s = rooms[ws.room].state;
        if (b.vars) Object.entries(b.vars).forEach(x => s.vars[x[0]] = x[1]);
        if (b.create) b.create.forEach(x => s.create[x.id] = x);
        if (b.update) b.update.forEach(x => s.update[x[0]] = s.update[x[0]] ? { ...s.update[x[0]], ...x[1] } : x[1]);
        if (b.delete) b.delete.forEach(x => {
          if (s.create[x]) delete s.create[x];
          if (s.update[x]) delete s.update[x];
        });
        break;
      case "pong":
        ws.pingt = null;
        break;
    }
  });
  ws.on('close', () => {
    if (ws.room) leaveRoom(ws);
    console.log(ws.name, "disconnected");
  })
});
server.listen(process.env.PORT || 59015);

function joinRoom(ws, name, room, mode, vars) {
  ws.name = name;
  if (!rooms[room]) createRoom(room, mode, vars);
  let r = rooms[room];
  if (r.mode != mode) return 'room already exist on different gamemode';
  ws.mode = mode;
  ws.room = room;
  clearPacket(ws);
  emit(room, {
    type: 'join',
    name: ws.name,
  });
  r.users[name] = ws;
  send(ws, {
    type: "youjoin",
    create: Object.values(r.state.create),
    update: r.state.update,
    vars: r.state.vars,
    users: Object.values(r.users).map(x => x.name)
  });
  console.log(ws.name, "joined", ws.room);
}

function createRoom(room, mode, vars = {}) {
  rooms[room] = {
    users: {},
    state: {
      create: {},
      update: {},
      vars: vars
    },
    res: {},
    mode
  }
  return rooms[room];
}

function leaveRoom(ws) {
  let room = ws.room;
  ws.room = null;
  delete rooms[room].users[ws.name];
  console.log(ws.name, "left", room);
  emit(room, {
    type: 'leave',
    name: ws.name
  });
  let roomies = Object.values(rooms[room].users);
  if (roomies.length == 0) {
    delete rooms[room];
    console.log(room, "destroyed");
  } else ws.res.forEach(x => reres(x, room));
  ws.res = [];
  ws.plent = null;
}

function reres(x, room, old = null) {
  let roomies = Object.values(rooms[room].users);
  if (old) roomies.splice(roomies.indexOf(old), 1);
  let newowner = roomies[Math.floor(Math.random() * roomies.length)];
  newowner.res.push(x);
  rooms[room].res[x] = newowner;
  newowner.packet.update.push([x, { OWNER: newowner.name }]);
  if (old) old.packet.update.push([x, { OWNER: newowner.name }]);
}

function emit(room, data) {
  Object.values(rooms[room].users).forEach(x => send(x, data));
}

function send(ws, data) {
  ws.send(JSON.stringify(data));
  if (DEBUG) console.log(ws.name, "<", data);
}

setInterval(() => Object.values(rooms).forEach(room => Object.values(room.users).forEach(ws => {
  if (ws.pingt && ws.pingt < Date.now() - 10e3) {
    console.log(ws.name, "was kicked due to inactivity");
    leaveRoom(ws);
    send(ws, { type: "kick", reason: "Kicked due to inactivity" });
    return;
  }
  // if (ws.res.length > 50 && Object.keys(room.res).length / Object.keys(room.users).length < 50) {
  //   let r = ws.res[Math.floor(Math.random() * ws.res.length)];
  //   if (ws.plent != r) reres(r, ws.room, ws);
  // };
  let packet = ws.packet;
  if (!packet.create.length) delete packet.create;
  if (!packet.update.length) delete packet.update;
  if (!packet.delete.length) delete packet.delete;
  if (!packet.event.length) delete packet.event;
  if (!packet.vars.length) delete packet.vars;
  if (Object.keys(packet).length != 0) {
    send(ws, { type: "packet", ...packet });
  }
  clearPacket(ws);
})), sendinterval);

function clearPacket(ws) {
  ws.packet = {
    create: [],
    delete: [],
    update: [],
    event: [],
    vars: {}
  };
}

setInterval(() => Object.values(rooms).forEach(room => Object.values(room.users).forEach(ws => {
  ws.pingt = Date.now();
  send(ws, { type: "ping", time: Date.now() });
})), 15e3);