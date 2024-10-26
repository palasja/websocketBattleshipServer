import { WebSocketServer } from 'ws';
import 'dotenv/config';

const wss = new WebSocketServer({ port:process.env.port });

wss.on('connection', function connection(ws) {
  ws.on('error', console.error);

  ws.on('message', function message(data) {

    const d = JSON.parse(data);
    console.log('received: %s', d);
    const str = JSON.stringify({
      name: '123',
      index: 1,
      error: false,
      errorText: '',
  });
    const r = {
      type: "reg",
      data:str,
      id: 0,
    };
    const res = JSON.stringify(r);
    console.log('send: %s', typeof res);

    ws.send( res );
  });

  // ws.send('something');
});