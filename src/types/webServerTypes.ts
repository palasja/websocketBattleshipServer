import { Position, Ship } from "./messages"
import { WebSocket,  } from 'ws';

type SocketInfo = {
  playerId: string, 
  ws:WebSocket
};
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
  cell: boolean[],
  ship: Ship
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

export {
  PlayerField,
  PlayerGameInfo,
  CellInfo,
  GameInfo,
  AtackResultStatus,
  AtackResult,
  SocketInfo
}