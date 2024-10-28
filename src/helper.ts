import { availableRooms, players, sockets } from './db';

const removeSocketInfo = (playerId: string) => {
  const index = sockets.findIndex((s) => s.playerId == playerId);
  sockets.splice(index, 1);
};

const removePlayer = (playerId: string) => {
  const index = players.findIndex((s) => s.id == playerId);
  players.splice(index, 1);
};
const removeRoom = (roomId: string | number) => {
  const index = availableRooms.findIndex((r) => r.roomId == roomId);
  availableRooms.splice(index, 1);
};
const removeRoomByPlayerId = (playerId: string) => {
  const index = availableRooms.findIndex((r) => r.roomUsers[0].index == playerId);
  availableRooms.splice(index, 1);
};

export { removeSocketInfo, removePlayer, removeRoomByPlayerId, removeRoom };
