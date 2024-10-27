import { getCellAround, getCellKilled } from "./cellGetter";
import { winners } from "./db";
import { sendToRoomPlayer, sendMessageStr } from "./senders";
import { Position } from "./types/messages";
import { GameInfo, PlayerGameInfo, PlayerField, AtackResultStatus } from "./types/webServerTypes";

const switchActivePlayer = (game:GameInfo) => {
  game.actvePlayerSessionId = (game.players.find(p => p.sessionId != game.actvePlayerSessionId) as PlayerGameInfo).sessionId
}

const finishGame = (curGame: GameInfo, playerSessionId: string | number) => {
  sendToRoomPlayer(curGame, "finish");
  const playerName = (curGame.players.find(p => p.sessionId == playerSessionId) as PlayerGameInfo);
  const winner = winners.find(w => w.name == playerName.name);
  if(winner == undefined){
    winners.push({name: playerName.name, wins: 1})
  } else {
    winner.wins += 1;
  }
  sendMessageStr('update_winners', winners);
}

const atack = (curGame: GameInfo, atackPosition: Position) => {
  const enemy = curGame.players.find(p => p.sessionId != curGame.actvePlayerSessionId) as PlayerGameInfo;
  const cellContent = (enemy.playerField as PlayerField)[atackPosition.x][atackPosition.y];
  let status:AtackResultStatus = "miss";
  if(cellContent !== undefined){
    const cellNotShotIndex = cellContent.cell.findIndex(c => c == true);
    if(cellNotShotIndex != -1) cellContent.cell[cellNotShotIndex] = false;
    status = cellContent.cell.every(c => c == false) ?  "killed" : "shot";
    if(status == "killed") {
      const celsAround = getCellAround(cellContent.ship);
      sendToRoomPlayer(curGame, "attack", {position: {x: atackPosition.x, y: atackPosition.y}, status: status});
      celsAround.forEach( c => sendToRoomPlayer(curGame, "attack", {position: c, status: "miss"}));
      const celsKilled = getCellKilled(cellContent.ship);
      celsKilled.forEach( c => sendToRoomPlayer(curGame, "attack", {position: c, status: "killed"}));
      enemy.countBrokenShip++;
      const isFinished = enemy.countBrokenShip == enemy.ships?.length;
      if(isFinished) finishGame(curGame, curGame.actvePlayerSessionId);
      return;
    }
    sendToRoomPlayer(curGame, "attack", {position: {x: atackPosition.x, y: atackPosition.y}, status: status})
  } else {
    sendToRoomPlayer(curGame, "attack", {position: {x: atackPosition.x, y: atackPosition.y}, status: status})
    switchActivePlayer(curGame);
  }
}

export {
  atack,
  switchActivePlayer,
  finishGame
}
