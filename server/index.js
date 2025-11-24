require('dotenv').config({ quiet: true });
const static = new (require('node-static').Server)('./client');
const server = require('http').createServer((req, res) => {
  if (process.env.DEV)
    static.serve(req, res);
});
const wss = new (require('ws').Server)({ server });
const rooms = {
  test: {
    users: {}
  }
};
wss.on('connection', ws => {
  ws.mode = null;
  ws.name = null;
  ws.room = 'test';
  ws.packet = {
    create: [],
    delete: [],
    update: [],
    event: []
  };
  ws.on('message', d => {
    let data;
    try {
      data = JSON.parse(d);
    } catch (e) { return };
    switch (data.type) {
      case 'join':
        if (ws.room) return;
        if (data.name.length < 2 || data.name.length > 16) return send(ws, {
          type: 'alert',
          message: data.name?.length < 2 ? 'name too short' : 'name too long'
        });
        let nameused = false;
        wss.clients.forEach(w => { if (w.name == data.username) nameused = true });
        if (nameused) return send(ws, {
          type: 'alert',
          message: 'name already used'
        });
        if (data.mode != 'fight') return;
        let r = joinRoom(ws, data.username, 'test', data.mode);
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
        Object.entries(rooms[ws.room].users).forEach(x => {
          if (x[0] != ws.name) {
            let p = x[1].packet;
            p.create.push();
          }
        });
        break;
    }
  });
  ws.on('close', () => {
    if (ws.room) leaveRoom(ws);
  })
});
server.listen(process.env.PORT || 59015);

function joinRoom(ws, name, room, mode) {
  ws.name = name;
  if (!rooms[room]) createRoom(room, mode);
  let r = rooms[room];
  if (r.mode != mode) return 'fuck';
  ws.mode = mode;
  ws.room = room;
  emit(room, {
    type: 'join',
    name: ws.name,
  });
  r.users[name] = ws;
  send()
}

function leaveRoom(ws) {
  delete rooms[ws.room].users[ws.name];
  emit(ws.room, {
    type: 'leave',
    name: ws.name
  });
}

function emit(room, data) {
  Object.values(rooms[room].users).forEach(x => send(x, data));
}

function send(ws, data) {
  ws.send(JSON.stringify(data));
}