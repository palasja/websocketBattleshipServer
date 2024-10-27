import { Player, Room, Winner } from "./types/messages";
import { GameInfo } from "./types/webServerTypes";
import {  WebSocket,  } from 'ws';

let sockets: {playerId: string, ws:WebSocket}[] = [];
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