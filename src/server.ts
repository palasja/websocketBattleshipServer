import { WebSocketServer, WebSocket,  } from 'ws';
import { AddUserToRoomReq, AddUserToRoomRes, Message, Player, RegReq, RegRes, Room,  RoomUser,  Ship,  Winner } from './types/messages';
import crypto from "node:crypto";

const getRandom = () => crypto.randomBytes(16).toString('hex');

const sockets: {playerId: string, ws:WebSocket}[] = [];
let players: Player[] = [];
let availableRooms: Room[] = [];
const winners: Winner[] = [];

type PlayerGameInfo = {
    sessionId: string,
    ws: WebSocket,
    field: "miss"|"killed"|"shot"[][],
    ships?: Ship[]
}

type GameInfo = {
    idGame: string,
    firstPlayer: PlayerGameInfo
    secondPlayer:PlayerGameInfo
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

// const updateWinners = (winnerName: string) => {
//   const winnerIndex = winners.findIndex( w => w.name == winnerName);
//   winnerIndex == -1 ? winners.push({name: winnerName, wins: 0}) : winners[winnerIndex].wins++;
// }
const sendToRoomPlayer = (game: GameInfo, type: string, data?: []) => {
  if(data) {
    sendMessageStr(type, data, game.firstPlayer.ws);
    sendMessageStr(type, data, game.secondPlayer.ws);
  } else {
    const fpData: AddUserToRoomRes = {
      idGame: game.idGame,
      idPlayer: game.firstPlayer.sessionId
    }
    const spData: AddUserToRoomRes = {
      idGame: game.idGame,
      idPlayer: game.secondPlayer.sessionId
    }
    sendMessageStr(type, fpData, game.firstPlayer.ws);
    sendMessageStr(type, spData, game.secondPlayer.ws);
  }
    
}

const getFielgs = ():[][] => {
  const rows = 10;
  const columns = 10;
  return Array(rows).fill(Array(columns).fill('shot'))

}
const startWebSocketServer = (runPort: number) => {
  const wss = new WebSocketServer({ port: runPort });
  console.log(`Start websocket server on the ${runPort} port!`);
  
  wss.on('connection', function connection(ws) {
    let game: GameInfo;
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
          game = {
            idGame: getRandom(),
            firstPlayer: {
              sessionId: getRandom(),
              ws: sockets.find(s => s.playerId == activeRoom.roomUsers[0].index)?.ws  as WebSocket,
              field: getFielgs()
            },
            secondPlayer:{
              sessionId: getRandom(),
              ws:  sockets.find(s => s.playerId == playerId)?.ws  as WebSocket,
              field: getFielgs()
            }
          }
          availableRooms = availableRooms.filter(r => r.roomId != room.indexRoom);
          sendMessageStr('update_room', availableRooms);
          sendToRoomPlayer(game, "create_game");
          break;
        };
      }
    });


  });

}

export default startWebSocketServer