import { httpServer } from './http_server/index';
import 'dotenv/config';
import startWebSocketServer from './server';

const { PORT, HTTP_PORT } = process.env;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(Number(HTTP_PORT));
startWebSocketServer(Number(PORT));
