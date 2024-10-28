import { randomInt } from "node:crypto";
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

const randomAtack = (curGame: GameInfo) => {
  const enemy = curGame.players.find(p => p.sessionId != curGame.actvePlayerSessionId) as PlayerGameInfo;
  const enemyField = enemy.playerField as PlayerField;
  const aliveCell:Position[] = [];
  for (let i = 0; i < enemyField.length; i++) {
    for (let e = 0; e < enemyField[i].length; e++) {
      if(enemyField[i][e] !== null) aliveCell.push({x:i, y:e})
    }
  }

  const acatckPositionIndex = randomInt(0, aliveCell.length -1);
  atack(curGame, aliveCell[acatckPositionIndex]);
}

const atack = (curGame: GameInfo, atackPosition: Position) => {
  const enemy = curGame.players.find(p => p.sessionId != curGame.actvePlayerSessionId) as PlayerGameInfo;
  const enemyField = enemy.playerField as PlayerField;
  const cellContent = enemyField[atackPosition.x][atackPosition.y];
  if(cellContent === null) return;
  let status:AtackResultStatus = "miss";
  if(cellContent !== undefined){
    const cellNotShotIndex = cellContent.shipCellCounter.findIndex(c => c == true);
    if(cellNotShotIndex != -1) cellContent.shipCellCounter[cellNotShotIndex] = false;
    status = cellContent.shipCellCounter.every(c => c == false) ?  "killed" : "shot";
    if(status == "killed") {
      const celsAround = getCellAround(cellContent.ship);
      sendToRoomPlayer(curGame, "attack", {position: {x: atackPosition.x, y: atackPosition.y}, status: status});
      celsAround.forEach( c => {
        sendToRoomPlayer(curGame, "attack", {position: c, status: "miss"});
        enemyField[c.x][c.y] = null;
      });
      const celsKilled = getCellKilled(cellContent.ship);
      celsKilled.forEach( c => {
        sendToRoomPlayer(curGame, "attack", {position: c, status: "killed"});
        enemyField[c.x][c.y] = null;
      });
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
  enemyField[atackPosition.x][atackPosition.y] = null;
  sendToRoomPlayer(curGame, "turn");
}

export {
  atack,
  randomAtack,
  switchActivePlayer,
  finishGame
}
