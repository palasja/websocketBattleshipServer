
import { WebSocketServer } from 'ws';
import { AddShipReq, AddUserToRoomReq,  AttackReq,   Message,   Position, RegReq, Room } from './types/messages';
import  { randomInt, randomUUID,  } from "node:crypto";
import { GameInfo, PlayerGameInfo, SocketInfo } from './types/webServerTypes';
import { sockets, availableRooms, winners, games, players } from './db';
import { sendToRoomPlayer, sendMessageStr } from './senders';
import { getPlayerCellField } from './cellGetter';
import { atack } from './gameAction';
import { newPlayer, createRoom, getGamePlayers } from './romActioon';
import { removeRoomByPlayerId, removePlayer, removeSocketInfo, removeRoom } from './helper';

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
      console.log(messageReq);
      switch(messageReq.type){
        case 'reg': {
          const player: RegReq = JSON.parse(messageReq.data as string);
          const newPlayerResponce = newPlayer(player, playerId);
          sendMessageStr('reg', newPlayerResponce, ws);
          sendMessageStr('update_room', availableRooms);
          sendMessageStr('update_winners', winners);
          break;
        };
        // case 'randomAttack': {
        //   sendMessageStr('update_room', availableRooms);
        //   break;
        // };
        case 'create_room': {
          createRoom(playerId);
          sendMessageStr('update_room',  availableRooms);
          break;
        };
        case 'add_user_to_room': {
          const room: AddUserToRoomReq = JSON.parse(messageReq.data as string);
          const activeRoom = availableRooms.find( r => r.roomId == room.indexRoom) as Room;
          if(activeRoom.roomUsers[0].index == playerId) break;
          const gamePlayers = getGamePlayers(activeRoom.roomUsers[0].index, playerId);
          const game:GameInfo  = {
            idGame: randomUUID(),
            players: gamePlayers,
            actvePlayerSessionId: gamePlayers[randomInt(0,1)].sessionId
          };
          games.push(game);
          removeRoom(room.indexRoom);
          sendMessageStr('update_room', availableRooms);
          sendToRoomPlayer(game, "create_game");
          break;
        };
        case 'add_ships': {
          const shipsInfo: AddShipReq = JSON.parse(messageReq.data as string);
          const curGame = games.find(g => g.idGame == shipsInfo.gameId);
          const curPlayerInfo = curGame?.players.find( p => p.sessionId == shipsInfo.indexPlayer) as PlayerGameInfo;
          curPlayerInfo.ships = shipsInfo.ships;
          curPlayerInfo.playerField = getPlayerCellField(shipsInfo.ships);
          if(curGame?.players.every( p => p.ships)){
            sendToRoomPlayer(curGame, "start_game");
            sendToRoomPlayer(curGame, "turn");
          }
          break;
        };
        case 'attack': {
          const atackReq: AttackReq = JSON.parse(messageReq.data as string);
          const {indexPlayer, gameId, x, y} = atackReq;
          const curGame = games.find(g => g.idGame == gameId) as GameInfo;
          if(indexPlayer != curGame.actvePlayerSessionId) break;
          const atackedPosition:Position = {x, y }
          atack(curGame, atackedPosition);
          sendToRoomPlayer(curGame, "turn");
          break;
        };
      }
    });
  });

}

export default startWebSocketServer