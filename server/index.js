require('dotenv').config({ quiet: true });
const static = new (require('node-static').Server)('./client');
const server = require('http').createServer((req, res) => {
  //if (process.env.DEV)
  static.serve(req, res);
});
const wss = new (require('ws').Server)({ server });
wss.on('connection', ws => {
  ws.mode = null;
  ws.name = null;
  ws.on('message', d => {
    let data;
    try {
      data = JSON.parse(d);
    } catch (e) { return };
    switch (data.type) {
      case 'join':
        if (ws.mode) return;
        if (data.name.length < 2 || data.name.length > 16) return send(ws, {
          type: 'alert',
          message: data.name?.length < 2 ? 'name too short' : 'name too long'
        });
        let nameused = false;
        wss.clients.forEach(w => { if (w.name == data.name) nameused = true });
        if (nameused) return send(ws, {
          type: 'alert',
          message: 'name already used'
        });
        if (data.mode != 'fight') return;
        ws.mode = data.mode;
        wsname = data.name;
        
        break;
    }
  })
});
server.listen(process.env.PORT || 59015);