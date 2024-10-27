import { sockets } from "./db";
import { StartGameRes, Ship, AddUserToRoomRes, PlayerTurnRes, AttackRes, FinishGameRes } from "./types/messages";
import { GameInfo, AtackResult } from "./types/webServerTypes";
import {  WebSocket,  } from 'ws';

const sendMessageStr = (type: string, data: object, ws?: WebSocket) => {
  const dataStr = JSON.stringify(data);
  const message = {
    type: type,
    data: dataStr,
    id: 0,
  }
  const messageReg = JSON.stringify(message);

  if(ws == undefined){
    sockets.forEach(el => el.ws.send(messageReg));
  } else {
    ws.send(messageReg);
  }
}

const sendToRoomPlayer = (game: GameInfo, type: string, atackInfo?: AtackResult) => {
  switch (type) {
    case 'start_game':
      game.players.forEach(p => {
        const data: StartGameRes = {
          ships: p.ships as Ship[],
          currentPlayerIndex: p.sessionId
        }
        sendMessageStr(type, data, p.ws);
      });
      break;
    case 'create_game':
      game.players.forEach(p => {
        const data: AddUserToRoomRes = {
          idGame: game.idGame,
          idPlayer: p.sessionId
        }
        sendMessageStr(type, data, p.ws);
      });
      break;
    case 'turn':
        game.players.forEach(p => {
          const data: PlayerTurnRes = {
            currentPlayer: game.actvePlayerSessionId
          }
          sendMessageStr(type, data, p.ws);
        });
        break;
    case 'attack':
      game.players.forEach(p => {
         const data: AttackRes = {
          ...atackInfo as AtackResult,
          currentPlayer: game.actvePlayerSessionId,
        }
        sendMessageStr(type, data, p.ws);
      });
      break;
    case 'finish':
      game.players.forEach(p => {
        const data: FinishGameRes = {
          winPlayer: game.actvePlayerSessionId
        }
        sendMessageStr(type, data, p.ws);
      });
      break;
    default:
      break;
  }
}


export {sendMessageStr, sendToRoomPlayer}