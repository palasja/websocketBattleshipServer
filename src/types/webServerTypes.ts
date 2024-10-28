import { Position, Ship } from "./messages"
import { WebSocket,  } from 'ws';

type SocketInfo = {
  playerId: string, 
  ws:WebSocket
};
type PlayerField = CellInfo[][] | null[][] 
type PlayerGameInfo = {
    name: string,
    sessionId: string,
    ws: WebSocket | undefined,
    playerField?: PlayerField,
    ships?: Ship[],
    countBrokenShip: number
}
type CellInfo = {
  shipCellCounter: boolean[],
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