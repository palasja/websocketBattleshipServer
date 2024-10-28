type Player = {
  id: string,
  name: string,
  password: string,
  sessionId?: string
}

type Message = {
  id: number,
  type: string,
  data:  BattleshipRequests | BattleshipResponces
}

type RegReq = {
  name: string,
  password: string,
} 

type RegRes = {
  name: string,
  index: number | string,
  error: boolean,
  errorText: string,
}

type Winner = {
  name: string,
  wins: number,
}
type UpdateWinnersRes = Winner[];

type CreateNewRoomReq = "";

type AddUserToRoomReq = {
  indexRoom: number | string,
}

type AddUserToRoomRes = {
  idGame: number | string,  
  idPlayer: number | string,
}

type RoomUser = {
    name: string,
    index: number | string,
}

type Room = {
  roomId: number | string,
  roomUsers:RoomUser[],
}

type UpdateRoomStateRes = Room[];

type Ship = {
  position: {
      x: number,
      y: number,
  },
  direction: boolean,
  length: number,
  type: "small"|"medium"|"large"|"huge",
}

type AddShipReq =  {
  gameId: number | string,
  ships:Ship[],
  indexPlayer: number | string, /* id of the player in the current game session */
}

type StartGameRes = {
  ships:Ship[],
  currentPlayerIndex: number | string, /* id of the player in the current game session, who have sent his ships */
}

type Position = {
  x: number,
  y: number,
}

type AttackReq =  {
  gameId: number | string,
  indexPlayer: number | string, /* id of the player in the current game session */
} & Position

type AttackRes =  {
  position: Position,
  currentPlayer: number | string, /* id of the player in the current game session */
  status: "miss"|"killed"|"shot",
}

type RandomAttackReq =  {
  gameId: number | string,
  indexPlayer: number | string, /* id of the player in the current game session */
}

type PlayerTurnRes = {
  currentPlayer: number | string; /* id of the player in the current game session */
}

type FinishGameRes = {
  
  winPlayer: number | string /* id of the player in the current game session */
}


type BattleshipRequests = RegReq | CreateNewRoomReq | AddUserToRoomReq | AddShipReq | AttackReq | RandomAttackReq

type BattleshipResponces = RegRes | UpdateWinnersRes | UpdateRoomStateRes | StartGameRes | AttackRes | PlayerTurnRes | FinishGameRes;

export {
  Player,
  Message, 
  RegReq,
  Winner,
  RegRes,
  UpdateWinnersRes,
  CreateNewRoomReq,
  AddUserToRoomReq,
  AddUserToRoomRes,
  RoomUser,
  Room,
  UpdateRoomStateRes,
  Ship,
  AddShipReq,
  StartGameRes,
  Position,
  AttackReq,
  AttackRes,
  RandomAttackReq,
  PlayerTurnRes,
  FinishGameRes,
}