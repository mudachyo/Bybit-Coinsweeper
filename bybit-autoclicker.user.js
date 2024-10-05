// ==UserScript==
// @name         Bybit Coinsweeper
// @namespace    Violentmonkey Scripts
// @match        *://bybitcoinsweeper.com/*
// @grant        none
// @version      1.2
// @author       mudachyo
// @icon         https://mudachyo.codes/bybit/logo.jpg
// @downloadURL  https://github.com/mudachyo/Bybit-Coinsweeper/raw/main/bybit-autoclicker.user.js
// @updateURL    https://github.com/mudachyo/Bybit-Coinsweeper/raw/main/bybit-autoclicker.user.js
// @homepage     https://github.com/mudachyo/Bybit-Coinsweeper
// ==/UserScript==

(async function () {
  // Функция для ожидания появления игрового поля
  function waitForGameBoard() {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const gameBoardXPath = '/html/body/div[2]/section';
        const gameBoardResult = document.evaluate(
          gameBoardXPath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        );
        const gameBoard = gameBoardResult.singleNodeValue;

        if (gameBoard) {
          clearInterval(checkInterval);
          setTimeout(() => {
            resolve(gameBoard);
          }, 200);
        }
      }, 150);
    });
  }

  function parseGameBoard() {
    const gameBoardXPath = '/html/body/div[2]/section';
    const gameBoardResult = document.evaluate(
      gameBoardXPath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );
    const gameBoard = gameBoardResult.singleNodeValue;

    if (!gameBoard) {
    //  console.error('Игровое поле не найдено');
      return [];
    }

    // Ищем все ячейки внутри игрового поля
    const cellSelector = './/div[contains(@class, "_field_")]';
    const cellsSnapshot = document.evaluate(
      cellSelector,
      gameBoard,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    );

    const totalCells = cellsSnapshot.snapshotLength;
    const totalRows = 9;
    const totalColumns = 6;

    if (totalCells !== totalRows * totalColumns) {
    //  console.error('Неожиданное количество ячеек на поле');
      return [];
    }

    let boardState = [];

    for (let rowIndex = 0; rowIndex < totalRows; rowIndex++) {
      let currentRowData = [];
      for (let colIndex = 0; colIndex < totalColumns; colIndex++) {
        const cellIndex = rowIndex * totalColumns + colIndex;
        const cell = cellsSnapshot.snapshotItem(cellIndex);
        let currentCellData = {};
        const cellClass = cell.getAttribute('class');
        const isOpen = cellClass.includes('open');

        if (isOpen) {
          const img = cell.querySelector('img');
          if (img) {
            const altText = img.getAttribute('alt');
            if (altText) {
              if (altText.startsWith('Coin')) {
                // Ячейка с числом мин вокруг
                const minesAround = parseInt(altText.replace('Coin ', ''));
                currentCellData = { type: 'number', value: minesAround };
              } else if (altText === 'Block') {
                // Закрытая ячейка (но не должна быть открытой)
                currentCellData = { type: 'closed' };
              } else {
                // Открытая пустая ячейка
                currentCellData = { type: 'empty' };
              }
            } else {
              // Если altText нет, возможно это пустая ячейка
              currentCellData = { type: 'empty' };
            }
          } else {
            // Открытая пустая ячейка без изображения
            currentCellData = { type: 'empty' };
          }
        } else {
          // Закрытая ячейка
          currentCellData = { type: 'closed' };
        }

        currentRowData.push(currentCellData);
      }
      boardState.push(currentRowData);
    }

    return boardState;
  }

let isClicking = false;

function clickPlayNowButton() {
  const interval = setInterval(() => {
    const playNowButton = document.querySelector('button.btn.primary-btn._button_1a7vv_65');

    if (playNowButton && playNowButton.textContent.trim() === 'Play Now') {
      playNowButton.click();
      console.log('Нажата кнопка "Play Now".');
      clearInterval(interval);
    }
  }, Math.random() * (3000 - 2000) + 2000);
}

clickPlayNowButton();

// Функция для клика по ячейке
function clickCell(row, col) {
    if (isClicking) {
    //    console.log('Пропуск клика, так как клик уже выполняется.');
        return;
    }

    isClicking = true;

    const gameBoardXPath = '/html/body/div[2]/section';
    const gameBoardResult = document.evaluate(
        gameBoardXPath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
    );
    const gameBoard = gameBoardResult.singleNodeValue;

    if (!gameBoard) {
    //    console.error('Игровое поле не найдено для клика');
        isClicking = false;
        return;
    }

    const cellSelector = './/div[contains(@class, "_field_")]';
    const cellsSnapshot = document.evaluate(
        cellSelector,
        gameBoard,
        null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null
    );

    const totalRows = 9;
    const totalColumns = 6;
    const totalCells = cellsSnapshot.snapshotLength;

    if (totalCells !== totalRows * totalColumns) {
    //    console.error('Неожиданное количество ячеек на поле при клике');
        isClicking = false;
        return;
    }

    const cellIndex = row * totalColumns + col;
    const cell = cellsSnapshot.snapshotItem(cellIndex);
    const randomDelay = Math.floor(Math.random() * (3000 - 300 + 1) + 300);

    if (cell) {
        setTimeout(() => {
            cell.click();
        //    console.log(`Кликнули по ячейке (${row}, ${col}), задержка ${randomDelay} мс`);
            isClicking = false;
        }, randomDelay);
    } else {
    //    console.error(`Ячейка с индексом ${cellIndex} не найдена`);
        isClicking = false;
    }
}

  // Функции для решения сапера
function solve_minesweeper(field) {
  field = JSON.parse(JSON.stringify(field));
  const rows = field.length;
  const cols = field[0].length;

  let changed = true;
  while (changed) {
    changed = false;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        let cell = field[row][col];
        if (cell['type'] === 'number') {
          let minesAround = cell['value'];
          let neighbors = get_neighbors(field, row, col);
          let closedNeighbors = neighbors.filter(
            (n) =>
              field[n[0]][n[1]]['type'] === 'closed' &&
              !field[n[0]][n[1]].hasOwnProperty('flagged')
          );
          let flaggedNeighbors = neighbors.filter((n) =>
            field[n[0]][n[1]].hasOwnProperty('flagged')
          );

          if (minesAround === flaggedNeighbors.length + closedNeighbors.length) {
            for (let n of closedNeighbors) {
              if (!field[n[0]][n[1]].hasOwnProperty('flagged')) {
                field[n[0]][n[1]]['flagged'] = true;
                changed = true;
              }
            }
          } else if (minesAround === flaggedNeighbors.length) {
            for (let n of closedNeighbors) {
              if (!field[n[0]][n[1]].hasOwnProperty('safe')) {
                field[n[0]][n[1]]['safe'] = true;
                changed = true;
              }
            }
          }
        }
      }
    }
  }

  let safeCells = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let cell = field[row][col];
      if (cell.hasOwnProperty('safe') && cell['type'] === 'closed') {
        safeCells.push({ row: row, col: col });
      }
    }
  }

  if (safeCells.length > 0) {
    return { action: 'click', row: safeCells[0].row, col: safeCells[0].col };
  }

  let minProbability = 1.0;
  let minCell = null;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (field[row][col]['type'] === 'closed' && !field[row][col].hasOwnProperty('flagged')) {
        let prob = estimate_mine_probability(field, row, col);
        if (prob < minProbability) {
          minProbability = prob;
          minCell = { row: row, col: col };
        }
      }
    }
  }

  if (minCell) {
    return { action: 'click', row: minCell.row, col: minCell.col };
  }

  return { action: 'finish' };
}

function get_neighbors(field, row, col) {
  let neighbors = [];
  for (let i = Math.max(0, row - 1); i <= Math.min(field.length - 1, row + 1); i++) {
    for (let j = Math.max(0, col - 1); j <= Math.min(field[0].length - 1, col + 1); j++) {
      if (i !== row || j !== col) {
        neighbors.push([i, j]);
      }
    }
  }
  return neighbors;
}

function estimate_mine_probability(field, row, col) {
  let total_prob = 0;
  let count = 0;
  let neighbors = get_neighbors(field, row, col);

  for (let n of neighbors) {
    let n_row = n[0];
    let n_col = n[1];
    let n_cell = field[n_row][n_col];
    if (n_cell['type'] === 'number') {
      let minesAround = n_cell['value'];
      let closedNeighbors = get_neighbors(field, n_row, n_col).filter(
        (nb) =>
          field[nb[0]][nb[1]]['type'] === 'closed' &&
          !field[nb[0]][nb[1]].hasOwnProperty('flagged')
      );
      let flaggedNeighbors = get_neighbors(field, n_row, n_col).filter((nb) =>
        field[nb[0]][nb[1]].hasOwnProperty('flagged')
      );

      let remaining_mines = minesAround - flaggedNeighbors.length;
      let remaining_cells = closedNeighbors.length;

      if (closedNeighbors.some(nb => nb[0] === row && nb[1] === col) && remaining_cells > 0) {
        let prob = remaining_mines / remaining_cells;
        total_prob += prob;
        count += 1;
      }
    }
  }

  return count > 0 ? total_prob / count : 0.5;
}

// Функция для нажатия на кнопку
async function clickUntilDisappear(buttonXPath) {
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            const buttonResult = document.evaluate(
                buttonXPath,
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            );
            const button = buttonResult.singleNodeValue;

            if (button) {
                button.click();
            //    console.log('Кнопка нажата. Ждем её исчезновения...');
            } else {
                clearInterval(interval);
            //    console.log('Кнопка исчезла.');
                resolve();
            }
        }, 1000);
    });
}

// Функция для нажатия на кнопку "Play Again" при победе или проигрыше
async function clickPlayAgain() {
    return new Promise((resolve) => {
        const interval = setInterval(async () => {
            const playAgainButton = document.querySelector('button.btn.primary-btn');

            if (playAgainButton) {
                playAgainButton.click();
                console.log('Нажата кнопка "Play Again".');
                await new Promise(r => setTimeout(r, 500));
                const stillExists = document.body.contains(playAgainButton);
                if (!stillExists) {
                    console.log('Кнопка "Play Again" исчезла.');
                    clearInterval(interval);
                    resolve();
                } else {
                    console.log('Кнопка "Play Again" всё ещё присутствует, нажимаем повторно...');
                }
            }
        }, 1000);
    });
}

async function main() {
    while (true) {
        try {
            await waitForGameBoard();

            const boardState = parseGameBoard();
        //    console.log('Поле:', boardState);

            if (boardState.length === 0) {
            //    console.error('Ожидание поля');
                const buttonXPath = '//*[@id="root"]/div[3]/div/button';
                await clickUntilDisappear(buttonXPath);
                continue;
            }

            const solution = solve_minesweeper(boardState);
        //    console.log('Решение:', solution);

            if (solution && solution.action === 'click' && solution.row !== undefined && solution.col !== undefined) {
                clickCell(solution.row, solution.col);
            } else if (solution && solution.action === 'finish') {
                console.log('Игра завершена. Ищем кнопку "Play Again".');
                await clickPlayAgain(); // Нажимаем на кнопку "Play Again" при победе или проигрыше
            } else {
            //    console.error('Некорректный ответ от функции');
            }
        } catch (error) {
        //    console.error('Неожиданная ошибка в main:', error);
        }
    }
}

setTimeout(main, 3000);
})();