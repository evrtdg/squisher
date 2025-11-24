/** @type {WebSocket} */
let ws = null;
let cdcb = null;

function genid() {
  return Math.floor(Math.random() * (36 ** 8 - 1)).toString(36);
}

function connect(mode) {
  ws = new WebSocket(API_URL);
  ws.onmessage = x => handlemsg(JSON.parse(x.data));
  return new Promise(y => {
    ws.onopen = () => send({
      type: 'join', username, mode
    });
    ws.onclose = () => y(false);
    cdcb = y;
  });
}

function send(data) {
  ws.send(JSON.stringify(data));
}

function handlemsg(data) {
  switch (data.type) {
    case 'alert':
      alert(data.message);
      break;
    case 'joined':
      cdcb(true);
      if (data.create) data.create.forEach(x => createEntity(x, true));
      break;
    case 'update':
      if (data.create) data.create.forEach(x => createEntity(x, true));
      if (data.update) data.update.forEach(x => updateEntity(x[0], x[1], true));
      if (data.delete) data.delete.forEach(x => deleteEntity(x, true));
      if (data.event) data.event.forEach(x => handleEvent(x, true));
      break;
  }
}

function mptick() {
  if (!mp) return;

}