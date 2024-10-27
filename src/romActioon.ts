import { randomUUID } from "node:crypto";
import { players, availableRooms, sockets } from "./db";
import { RegReq, RegRes, Player, RoomUser, Room } from "./types/messages";
import { PlayerGameInfo } from "./types/webServerTypes";
import {  WebSocket,  } from 'ws';

const newPlayer = (data: RegReq, id: string): RegRes => {
  let res: RegRes;
  if(!players.find(p => p.name == data.name)){
    const newPlayer:Player = {
      id: id,
      name: data.name,
      password: data.password
    }
    res = {
      name: newPlayer.name,
      index: newPlayer.id,
      error: false,
      errorText: '',
    };
    players.push(newPlayer);
  } else {
     res = {
      name: newPlayer.name,
      index: '',
      error: true,
      errorText: `Player with name ${data.name} already exist`,
    };
  }
  
  return res;
}

const createRoom = (playerId: string) => {
  const player = players.find(p => p.id == playerId) as Player;
  const roomUser:RoomUser = {name: player.name, index: player.id}
  const newRoom: Room = {
    roomId: randomUUID().toString(),
    roomUsers: [roomUser]
  }
  availableRooms.push(newRoom);
}

const getGamePlayers = (roomOwnerPlayerId:string | number, secondPlayerId:string| number):PlayerGameInfo[] => {
  const player1Socket = sockets.find(s => s.playerId == roomOwnerPlayerId)?.ws as unknown as WebSocket;
  const player1Name = players.find(p => p.id == roomOwnerPlayerId)?.name as string;
  const player2Socket = sockets.find(s => s.playerId == secondPlayerId)?.ws as unknown as  WebSocket;
  const player2Name = players.find(p => p.id == secondPlayerId)?.name as string;
  const roomPlayers:PlayerGameInfo[] = [{
    name: player1Name,
    sessionId: randomUUID().toString(),
    ws: player1Socket,
    countBrokenShip: 0
  }, {
    name: player2Name,
    sessionId: randomUUID().toString(),
    ws: player2Socket,
    countBrokenShip: 0
  }];
  return roomPlayers;
}

export {
  newPlayer,
  createRoom,
  getGamePlayers
}