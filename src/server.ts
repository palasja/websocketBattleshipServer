
import { WebSocketServer } from 'ws';
import { AddShipReq, AddUserToRoomReq,  AttackReq,   Message, Position, RandomAttackReq, RegReq, Room } from './types/messages';
import  { randomInt, randomUUID,  } from "node:crypto";
import { GameInfo, PlayerGameInfo, RequestType, ResponseType, SocketInfo } from './types/webServerTypes';
import { sockets, availableRooms, winners, games, players } from './db';
import { sendToRoomPlayer, sendMessageStr } from './senders';
import { getPlayerCellField } from './cellGetter';
import { atack, createGameWithBot, isBot, randomAtack } from './gameAction';
import { newPlayer, createRoom, getGamePlayers } from './romActioon';
import { removeRoomByPlayerId, removePlayer, removeSocketInfo, removeRoom } from './helper';
import { INPUT_MARK } from './constants';

const startWebSocketServer = (runPort: number) => {
  const wss = new WebSocketServer({ port: runPort });
  console.log(`Start websocket server on the ${runPort} port!`);
  
  wss.on('connection', (ws) => {
    const playerId = randomUUID().toString();
    const socketInfo: SocketInfo = {playerId, ws};
    sockets.push(socketInfo);
    ws.on('error', console.error);
    ws.on('close', (code:number) => {
      const playerName = players.find(p => p.id == playerId)?.name;
      removeRoomByPlayerId(playerId);
      removePlayer(playerId);
      removeSocketInfo(playerId);
      console.log(`Socket ${playerName ? playerName : 'someUser'} is closed with code ${code}. `)
    })
    ws.on('message', function message(mes) {
      const messageReq: Message = JSON.parse(mes.toString());
      console.log(INPUT_MARK);
      console.log(messageReq);
      switch(messageReq.type){
        case RequestType.REG: {
          const player: RegReq = JSON.parse(messageReq.data as string);
          const newPlayerResponce = newPlayer(player, playerId);
          sendMessageStr(ResponseType.REG, newPlayerResponce, ws);
          sendMessageStr(ResponseType.UPDATE_ROOM, availableRooms);
          sendMessageStr(ResponseType.UPDATE_WINNERS, winners);
          break;
        };
        case RequestType.RANDOM_ATACK: {
          const randomAtackRequest: RandomAttackReq = JSON.parse(messageReq.data as string);
          const curGame = games.find(g => g.idGame == randomAtackRequest.gameId);
          if(randomAtackRequest.indexPlayer != curGame?.actvePlayerSessionId) break;
          randomAtack(curGame);
          break;
        };
        case RequestType.CREATE_ROOM: {
          if(availableRooms.find(r => r.roomUsers.find(p =>p.index == playerId))) break;
          createRoom(playerId);
          sendMessageStr(ResponseType.UPDATE_ROOM,  availableRooms);
          break;
        };
        case RequestType.SINGLE_PLAY: {
          const playerRoom = availableRooms.find(r => r.roomUsers.find(p =>p.index == playerId));
          if(playerRoom) {
            removeRoom(playerRoom.roomId);
            sendMessageStr(ResponseType.UPDATE_ROOM, availableRooms);
          }
          createGameWithBot(playerId);
          break;
        };
        case RequestType.ADD_USER_TO_ROOM: {
          const room: AddUserToRoomReq = JSON.parse(messageReq.data as string);
          const activeRoom = availableRooms.find( r => r.roomId == room.indexRoom) as Room;
          if(activeRoom.roomUsers[0].index == playerId) break;
          const gamePlayers = getGamePlayers(activeRoom.roomUsers[0].index, playerId);
          const game:GameInfo  = {
            idGame: randomUUID(),
            players: gamePlayers,
            actvePlayerSessionId: gamePlayers[randomInt(0,2)].sessionId
          };
          games.push(game);
          const playerRoomn = availableRooms.find(r => r.roomUsers.find( u => u.index == playerId)) as Room; 
          removeRoom(playerRoomn?.roomId);
          removeRoom(room.indexRoom);
          sendMessageStr(ResponseType.UPDATE_ROOM, availableRooms);
          sendToRoomPlayer(game, ResponseType.CREATE_GAME);
          break;
        };
        case RequestType.ADD_SHIP: {
          const shipsInfo: AddShipReq = JSON.parse(messageReq.data as string);
          const curGame = games.find(g => g.idGame == shipsInfo.gameId);
          const curPlayerInfo = curGame?.players.find( p => p.sessionId == shipsInfo.indexPlayer) as PlayerGameInfo;
          curPlayerInfo.ships = shipsInfo.ships;
          curPlayerInfo.playerField = getPlayerCellField(shipsInfo.ships);
          if(curGame?.players.every( p => p.ships)){
            sendToRoomPlayer(curGame, ResponseType.START_GAME);
            sendToRoomPlayer(curGame, ResponseType.TURN);
            if(isBot(curGame.actvePlayerSessionId)) randomAtack(curGame);
          }
          break;
        };
        case RequestType.ATTACK: {
          const atackReq: AttackReq = JSON.parse(messageReq.data as string);
          const {indexPlayer, gameId, x, y} = atackReq;
          const curGame = games.find(g => g.idGame == gameId) as GameInfo;
          if(indexPlayer != curGame.actvePlayerSessionId) break;
          const atackedPosition:Position = {x, y }
          atack(curGame, atackedPosition);
          break;
        };
      }
    });
  });

}

export default startWebSocketServer