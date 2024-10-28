import { Position, Ship } from './types/messages';
import { PlayerField, CellInfo } from './types/webServerTypes';

const getPlayerCellField = (ships: Ship[]): PlayerField => {
  const field: PlayerField = Array(10)
    .fill(0)
    .map(() => Array(10).fill(undefined));
  ships.forEach((s) => {
    const gameShip: CellInfo = {
      shipCellCounter: new Array(s.length).fill(true),
      ship: s,
    };

    for (let shipCellIndex = 0; shipCellIndex < s.length; shipCellIndex++) {
      if (s.direction) {
        field[s.position.x][s.position.y + shipCellIndex] = gameShip;
      } else {
        field[s.position.x + shipCellIndex][s.position.y] = gameShip;
      }
    }
  });
  return field;
};

const getShipCels = (ship: Ship): Position[] => {
  const cell: Position[] = [];
  for (let i = 0; i < ship.length; i++) {
    const pos: Position = ship.direction
      ? { x: ship.position.x, y: ship.position.y + i }
      : { x: ship.position.x + i, y: ship.position.y };
    cell.push(pos);
  }

  return cell;
};

const getCellAround = (ship: Ship): Position[] => {
  const cell: Position[] = [];
  if (ship.direction) {
    cell.push({ x: ship.position.x, y: ship.position.y - 1 });
    cell.push({ x: ship.position.x, y: ship.position.y + ship.length });
    for (let i = -1; i < ship.length + 1; i++) {
      cell.push({ x: ship.position.x - 1, y: ship.position.y + i });
      cell.push({ x: ship.position.x + 1, y: ship.position.y + i });
    }
  } else {
    cell.push({ x: ship.position.x - 1, y: ship.position.y });
    cell.push({ x: ship.position.x + ship.length, y: ship.position.y });
    for (let i = -1; i < ship.length + 1; i++) {
      cell.push({ x: ship.position.x + i, y: ship.position.y + 1 });
      cell.push({ x: ship.position.x + i, y: ship.position.y - 1 });
    }
  }

  const existsCell = cell.filter((c) => c.x >= 0 && c.x < 10 && c.y >= 0 && c.y < 10);
  return existsCell;
};

export { getPlayerCellField, getShipCels, getCellAround };
