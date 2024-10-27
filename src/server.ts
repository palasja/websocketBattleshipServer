
import { WebSocketServer, WebSocket,  } from 'ws';
import { AddShipReq, AddUserToRoomReq, AddUserToRoomRes, AttackReq, AttackRes, FinishGameRes, Message, Player, PlayerTurnRes, Position, RegReq, RegRes, Room,  RoomUser,  Ship,  StartGameRes,  Winner } from './types/messages';
import  { randomInt, randomUUID,  } from "node:crypto";

const getRandom = () => randomUUID().toString();

const sockets: {playerId: string, ws:WebSocket}[] = [];
let players: Player[] = [];
let availableRooms: Room[] = [];
const winners: Winner[] = [];
const games: GameInfo[] = [];

type PlayerField = CellInfo[][]
type PlayerGameInfo = {
    name: string,
    sessionId: string,
    ws: WebSocket,
    playerField?: PlayerField,
    ships?: Ship[],
    countBrokenShip: number
}
type CellInfo = {
  cell: boolean[]
}

type GameInfo = {
    idGame: string,
    players: PlayerGameInfo[],
    actvePlayerSessionId: string
}
type AtackResultStatus = "miss"|"killed"|"shot";
type AtackResult = {
  position: Position,
  status: AtackResultStatus
}

const getPlayerField = (ships: Ship[]):PlayerField => {
  const field:PlayerField = Array(10).fill(0).map(() => Array(10).fill(undefined))
  ships.forEach( s => {
    const gameShip:CellInfo = {
      cell: new Array(s.length).fill(true)
    };

    for (let shipCellIndex = 0; shipCellIndex < s.length; shipCellIndex++) {
      if(s.direction){
        field[s.position.x][s.position.y + shipCellIndex] = gameShip;
      } else {
        field[s.position.x + shipCellIndex][s.position.y] = gameShip;
      }
    }
  })
  return field;
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

const sendToRoomPlayer = (game: GameInfo, type: string, typeInfo:string, atackInfo?: AtackResult) => {
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

const getGameUser = (name:string, socket: WebSocket):PlayerGameInfo => {
  return {
    name: name,
    sessionId: getRandom(),
    ws: socket,
    countBrokenShip: 0
  }
}

const switchActivePlayer = (game:GameInfo) => {
  game.actvePlayerSessionId = (game.players.find(p => p.sessionId != game.actvePlayerSessionId) as PlayerGameInfo).sessionId
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
          const player1Name = activeRoom.roomUsers[0].name;
          const player1 = getGameUser(player1Name, player1Socket);
          const player2Socket = sockets.find(s => s.playerId == playerId)?.ws as WebSocket;
          const player2Name = players.find(p => p.id == activeRoom.roomUsers[0].index)?.name as string;
          const player2 = getGameUser(player2Name, player2Socket);
          const roomPlayers = [player1, player2];
          const game:GameInfo  = {
            idGame: getRandom(),
            players: roomPlayers,
            actvePlayerSessionId: roomPlayers[randomInt(0,1)].sessionId
          };
          games.push(game);
          availableRooms = availableRooms.filter(r => r.roomId != room.indexRoom);
          sendMessageStr('update_room', availableRooms);
          sendToRoomPlayer(game, "create_game", "ready");
          break;
        };
        case 'add_ships': {
          const shipsInfo: AddShipReq = JSON.parse(messageReq.data as string);
          const curGame = games.find(g => g.idGame == shipsInfo.gameId);
          const curPlayerInfo = curGame?.players.find( p => p.sessionId == shipsInfo.indexPlayer) as PlayerGameInfo;
          curPlayerInfo.ships = shipsInfo.ships;
          curPlayerInfo.playerField = getPlayerField(shipsInfo.ships);
          if(curGame?.players.every( p => p.ships)){
            sendToRoomPlayer(curGame, "start_game", "ships");
            sendToRoomPlayer(curGame, "turn", "turn");
          }
          break;
        };
        case 'attack': {
          const atackReq: AttackReq = JSON.parse(messageReq.data as string);
          const curGame = games.find(g => g.idGame == atackReq.gameId) as GameInfo;
          if(atackReq.indexPlayer != curGame.actvePlayerSessionId) break;
          const enemy = curGame.players.find(p => p.sessionId != atackReq.indexPlayer) as PlayerGameInfo;
          const cellContent = (enemy.playerField as PlayerField)[atackReq.x][atackReq.y];
          let status:AtackResultStatus = "miss";
          if(cellContent !== undefined){
            const cellNotShotIndex = cellContent.cell.findIndex(c => c == true);
            if(cellNotShotIndex != -1) cellContent.cell[cellNotShotIndex] = false;
            status = cellContent.cell.every(c => c == false) ?  "killed" : "shot";
            if(status == "killed") {
              enemy.countBrokenShip++;
              if(enemy.countBrokenShip == enemy.ships?.length) sendToRoomPlayer(curGame, "finish", "finish");
              const playerName = (curGame.players.find(p => p.sessionId == atackReq.indexPlayer) as PlayerGameInfo);
              const winner = winners.find(w => w.name == playerName.name);
              if(winner == undefined){
                winners.push({name: playerName.name, wins: 1})
              } else {
                winner.wins += 1;
              }
              console.log(winner);
              sendMessageStr('update_winners', winners);
            }
            sendToRoomPlayer(curGame, "attack", "attack", {position: {x: atackReq.x, y: atackReq.y}, status: status})
          } else {
            sendToRoomPlayer(curGame, "attack", "attack", {position: {x: atackReq.x, y: atackReq.y}, status: status})
            switchActivePlayer(curGame);
          }
          sendToRoomPlayer(curGame, "turn", "turn");
          break;
        };
      }
    });


  });

}

export default startWebSocketServer