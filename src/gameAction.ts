import { randomInt, randomUUID } from 'node:crypto';
import { getCellAround, getPlayerCellField, getShipCels } from './cellGetter';
import { games, players, sockets, winners } from './db';
import { sendToRoomPlayer, sendMessageStr } from './senders';
import { Position, Ship } from './types/messages';
import {
  GameInfo,
  PlayerGameInfo,
  PlayerField,
  AtackResultStatus,
  ResponseType,
} from './types/webServerTypes';
import { BOT_NAME, sipsForBot } from './constants';

const switchActivePlayer = (game: GameInfo) => {
  game.actvePlayerSessionId = (
    game.players.find((p) => p.sessionId != game.actvePlayerSessionId) as PlayerGameInfo
  ).sessionId;
};

const finishGame = (curGame: GameInfo, playerSessionId: string | number) => {
  sendToRoomPlayer(curGame, ResponseType.FINISH);
  const playerName = curGame.players.find((p) => p.sessionId == playerSessionId) as PlayerGameInfo;
  const winner = winners.find((w) => w.name == playerName.name);
  if (!curGame.players.find((p) => isBot(p.sessionId))) {
    if (winner == undefined) {
      winners.push({ name: playerName.name, wins: 1 });
    } else {
      winner.wins += 1;
    }
    sendMessageStr('update_winners', winners);
  }
};

const randomAtack = (curGame: GameInfo) => {
  const enemy = curGame.players.find(
    (p) => p.sessionId != curGame.actvePlayerSessionId
  ) as PlayerGameInfo;
  const enemyField = enemy.playerField as PlayerField;
  const aliveCell: Position[] = [];
  for (let i = 0; i < enemyField.length; i++) {
    for (let e = 0; e < enemyField[i].length; e++) {
      if (enemyField[i][e] !== null) aliveCell.push({ x: i, y: e });
    }
  }

  const acatckPositionIndex = randomInt(0, aliveCell.length - 1);
  atack(curGame, aliveCell[acatckPositionIndex]);
};

const atack = (curGame: GameInfo, atackPosition: Position) => {
  const enemy = curGame.players.find(
    (p) => p.sessionId != curGame.actvePlayerSessionId
  ) as PlayerGameInfo;
  const enemyField = enemy.playerField as PlayerField;
  const cellContent = enemyField[atackPosition.x][atackPosition.y];
  if (cellContent === null) return;
  let status = AtackResultStatus.MISS;
  if (cellContent !== undefined) {
    const cellNotShotIndex = cellContent.shipCellCounter.findIndex((c) => c == true);
    if (cellNotShotIndex != -1) cellContent.shipCellCounter[cellNotShotIndex] = false;
    status = cellContent.shipCellCounter.every((c) => c == false)
      ? AtackResultStatus.KILLED
      : AtackResultStatus.SHOT;
    if (status == AtackResultStatus.KILLED) {
      const celsAround = getCellAround(cellContent.ship);
      sendToRoomPlayer(curGame, ResponseType.ATACK, {
        position: { x: atackPosition.x, y: atackPosition.y },
        status: status,
      });
      celsAround.forEach((c) => {
        sendToRoomPlayer(curGame, ResponseType.ATACK, {
          position: c,
          status: AtackResultStatus.MISS,
        });
        enemyField[c.x][c.y] = null;
      });
      const celsKilled = getShipCels(cellContent.ship);
      celsKilled.forEach((c) => {
        sendToRoomPlayer(curGame, ResponseType.ATACK, {
          position: c,
          status: AtackResultStatus.KILLED,
        });
        enemyField[c.x][c.y] = null;
      });
      enemy.countBrokenShip++;
      const isFinished = enemy.countBrokenShip == enemy.ships?.length;
      if (isFinished) {
        finishGame(curGame, curGame.actvePlayerSessionId);
        return;
      }
    }
    sendToRoomPlayer(curGame, ResponseType.ATACK, {
      position: { x: atackPosition.x, y: atackPosition.y },
      status: status,
    });
  } else {
    sendToRoomPlayer(curGame, ResponseType.ATACK, {
      position: { x: atackPosition.x, y: atackPosition.y },
      status: status,
    });
    switchActivePlayer(curGame);
  }
  enemyField[atackPosition.x][atackPosition.y] = null;
  sendToRoomPlayer(curGame, ResponseType.TURN);
  if (isBot(curGame.actvePlayerSessionId)) setTimeout(() => randomAtack(curGame), 700);
};

const isBot = (sessionId: string | number) => {
  return sessionId.toString().length == 0;
};

const createGameWithBot = (playerId: string) => {
  const botShips = getBotSips();
  const bot: PlayerGameInfo = {
    name: BOT_NAME,
    sessionId: '',
    ws: undefined,
    countBrokenShip: 0,
    ships: botShips,
    playerField: getPlayerCellField(botShips),
  };
  const player: PlayerGameInfo = {
    name: players.find((p) => p.id == playerId)?.name as string,
    sessionId: randomUUID().toString(),
    ws: sockets.find((s) => s.playerId == playerId)?.ws,
    countBrokenShip: 0,
  };
  const gamePlayers = [player, bot];
  console.log(`bot Id = ${player.sessionId}`);
  const game: GameInfo = {
    idGame: randomUUID(),
    players: [player, bot],
    actvePlayerSessionId: gamePlayers[randomInt(0, 2)].sessionId,
  };
  games.push(game);
  sendToRoomPlayer(game, ResponseType.CREATE_GAME);
};

const getBotSips = (): Ship[] => {
  const field: PlayerField = Array(10)
    .fill(0)
    .map(() => Array(10).fill(undefined));
  const botShips: Ship[] = sipsForBot.map((s) => {
    const aliveCellByDirection: Position[] = [];
    const direction = Boolean(randomInt(0, 2));

    for (let i = 0; i < field.length; i++) {
      for (let e = 0; e < field[i].length; e++) {
        if (field[i][e] === undefined) {
          const isInEdge = direction ? e + s.length <= 10 : i + s.length <= 10;
          if (!isInEdge) continue;

          const ship: Ship = { ...s, position: { x: i, y: e }, direction: direction };
          const arround = getCellAround(ship);

          const notNierShip = arround.every((c) => field[c.x][c.y] === undefined);
          if (!notNierShip) continue;
          aliveCellByDirection.push({ x: i, y: e });
        }
      }
    }
    const randomCellPosition = randomInt(0, aliveCellByDirection.length - 1);
    const randomCell = aliveCellByDirection[randomCellPosition];
    const ship = {
      ...s,
      position: randomCell,
      direction: direction,
    };
    getShipCels(ship).forEach((p) => (field[p.x][p.y] = null));
    return ship;
  });
  //console.log(botShips); // For check bot play
  return botShips;
};

export { atack, randomAtack, switchActivePlayer, finishGame, createGameWithBot, isBot };
