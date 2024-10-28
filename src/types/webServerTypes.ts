import { Position, Ship } from './messages';
import { WebSocket } from 'ws';

type SocketInfo = {
  playerId: string;
  ws: WebSocket;
};
type PlayerField = CellInfo[][] | null[][];
type PlayerGameInfo = {
  name: string;
  sessionId: string;
  ws: WebSocket | undefined;
  playerField?: PlayerField;
  ships?: Ship[];
  countBrokenShip: number;
};
type CellInfo = {
  shipCellCounter: boolean[];
  ship: Ship;
};

type GameInfo = {
  idGame: string;
  players: PlayerGameInfo[];
  actvePlayerSessionId: string;
};

enum AtackResultStatus {
  MISS = 'miss',
  KILLED = 'killed',
  SHOT = 'shot',
}

enum RequestType {
  REG = 'reg',
  RANDOM_ATACK = 'randomAttack',
  CREATE_ROOM = 'create_room',
  SINGLE_PLAY = 'single_play',
  ADD_USER_TO_ROOM = 'add_user_to_room',
  ADD_SHIP = 'add_ships',
  ATTACK = 'attack',
}

enum ResponseType {
  ATACK = 'attack',
  REG = 'reg',
  UPDATE_ROOM = 'update_room',
  UPDATE_WINNERS = 'update_winners',
  CREATE_GAME = 'create_game',
  START_GAME = 'start_game',
  TURN = 'turn',
  FINISH = 'finish',
}

type AtackResult = {
  position: Position;
  status: AtackResultStatus;
};

export {
  PlayerField,
  PlayerGameInfo,
  CellInfo,
  GameInfo,
  AtackResultStatus,
  AtackResult,
  SocketInfo,
  RequestType,
  ResponseType,
};
