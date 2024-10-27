import { Player, Room, Winner } from "./types/messages";
import { GameInfo, SocketInfo } from "./types/webServerTypes";


let sockets: SocketInfo[] = [];
let players: Player[] = [];
let availableRooms: Room[] = [];
let winners: Winner[] = [];
let games: GameInfo[] = [];

 export {
  sockets,
  players,
  availableRooms,
  winners,
  games
 } 