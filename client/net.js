/** @type {WebSocket} */
let ws = null;

function genid() {
  return Math.floor(Math.random() * (36 ** 8 - 1)).toString(36);
}

function connect() {
  ws = new WebSocket(API_URL);
  ws.onmessage = x => handlemsg(JSON.parse(x.data));
  return new Promise(y => {
    ws.onopen = () => y(true);
    ws.onclose = () => y(false);
  });
}

function handlemsg(data) {
  switch(data.type) {
    case 'alert':
      alert(data.message);
      break;
    case 'info':
      data.createPlayer();
      break;
  }
}