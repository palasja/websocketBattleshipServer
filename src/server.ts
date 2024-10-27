import { WebSocketServer, WebSocket,  } from 'ws';
import { AddShipReq, AddUserToRoomReq, AddUserToRoomRes, Message, Player, PlayerTurnRes, RegReq, RegRes, Room,  RoomUser,  Ship,  StartGameRes,  Winner } from './types/messages';
import  { randomInt, randomUUID,  } from "node:crypto";

const getRandom = () => randomUUID().toString();

const sockets: {playerId: string, ws:WebSocket}[] = [];
let players: Player[] = [];
let availableRooms: Room[] = [];
const winners: Winner[] = [];
const games: GameInfo[] = [];

type PlayerGameInfo = {
    sessionId: string,
    ws: WebSocket,
    field: "miss"|"killed"|"shot"[][],
    ships?: Ship[]
}

type GameInfo = {
    idGame: string,
    players: PlayerGameInfo[],
    actvePlayerId: number
}

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


const newPlayer = (data: RegReq, id: string): RegRes => {
  const newPlayer:Player = {
    id: id,
    name: data.name,
    password: data.password
  }
  players.push(newPlayer);
  const res: RegRes = {
    name: newPlayer.name,
    index: newPlayer.id,
    error: false,
    errorText: '',
  };
  return res;
}

const createRoom = (playerId: string) => {
  const player = players.find(p => p.id == playerId) as Player;
  const roomUser:RoomUser = {name: player.name, index: player.id}
  const newRoom: Room = {
    roomId: getRandom(),
    roomUsers: [roomUser]
  }
  availableRooms.push(newRoom);
}

const sendToRoomPlayer = (game: GameInfo, type: string, typeInfo:string) => {
  switch (typeInfo) {
    case 'ships':
      game.players.forEach(p => {
        const data: StartGameRes = {
          ships: p.ships as Ship[],
          currentPlayerIndex: p.sessionId
        }
        sendMessageStr(type, data, p.ws);
      });
      break;
    case 'ready':
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
            currentPlayer: game.players[game.actvePlayerId].sessionId
          }
          sendMessageStr(type, data, p.ws);
        });
        break;
    default:
      
      break;
  }
}

const getFields = ():[][] => {
  const rows = 10;
  const columns = 10;
  return Array(rows).fill(Array(columns).fill('shot'))

}

const getGameUser = (socket: WebSocket) => {
  return {
    sessionId: getRandom(),
    ws: socket,
    field: getFields()
  }
}

const startWebSocketServer = (runPort: number) => {
  const wss = new WebSocketServer({ port: runPort });
  console.log(`Start websocket server on the ${runPort} port!`);
  
  wss.on('connection', function connection(ws) {
    const playerId = getRandom();
    sockets.push({playerId, ws});
    console.log(playerId);
    ws.on('error', console.error);
  
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
        case 'create_room': {
          createRoom(playerId);
          sendMessageStr('update_room', availableRooms);
          break;
        };
        case 'add_user_to_room': {
          const room: AddUserToRoomReq = JSON.parse(messageReq.data as string);
          const activeRoom = availableRooms.find( r => r.roomId == room.indexRoom) as Room;
          const player1Socket = sockets.find(s => s.playerId == activeRoom.roomUsers[0].index)?.ws  as WebSocket;
          const player1 = getGameUser(player1Socket);
          const player2Socket = sockets.find(s => s.playerId == playerId)?.ws  as WebSocket;
          const player2 = getGameUser(player2Socket);
          const game = {
            idGame: getRandom(),
            players: [player1, player2],
            actvePlayerId: randomInt(0, 1)
          };
          games.push(game);
          availableRooms = availableRooms.filter(r => r.roomId != room.indexRoom);
          sendMessageStr('update_room', availableRooms);
          sendToRoomPlayer(game, "create_game", "ready");
          break;
        };
        case 'add_ships': {
          createRoom(playerId);
          const shipsInfo: AddShipReq = JSON.parse(messageReq.data as string);
          const curGame = games.find(g => g.idGame == shipsInfo.gameId);
          const curPlayerInfo = curGame?.players.find( p => p.sessionId == shipsInfo.indexPlayer) as PlayerGameInfo;
          curPlayerInfo.ships = shipsInfo.ships;
          if(curGame?.players.some( p => p.ships)){
            sendToRoomPlayer(curGame, "start_game", "ships");
            sendToRoomPlayer(curGame, "turn", "turn");
          }
          break;
        };
      }
    });


  });

}

export default startWebSocketServer