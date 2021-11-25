(function IIFE() {
    const state = {
        boardController: Board(3),
        playerX: Player('Player 1', 'X'),
        playerO: Player('Player 2', 'O'),
        currentPlayer: null
    };
    state.currentPlayer = state.playerX;

    // ELEMENTS
    const message = document.querySelector('.message');
    const board = document.querySelector('.board');

    generateBoardCells();
    board.addEventListener('click', handleBoardClick);
    message.textContent = `${state.currentPlayer.getName()} (${state.currentPlayer.getMark()}) turn!`;

    function generateBoardCells() {
        const boardData = state.boardController.getBoard();
        let cellNumber = 0;
        boardData.forEach((row) => {
            const rowElement = document.createElement('div');
            rowElement.classList.add('row');
            row.forEach((cell) => {
                const cellElement = document.createElement('div');
                cellElement.classList.add('cell');
                cellElement.dataset.cellNumber = cellNumber++;
                cellElement.textContent = cell;
                rowElement.appendChild(cellElement);
            });
            board.appendChild(rowElement);
        });
    }

    function handleBoardClick(event) {
        if (!event.target.classList.contains('cell')) {
            return;
        }

        const targetCell = event.target;
        const coordinates = state.boardController.cellNumberToCoordinates(
            targetCell.dataset.cellNumber
        );
        if (!coordinates) {
            return;
        }

        if (!state.boardController.makeMove(coordinates, state.currentPlayer.getMark())) {
            return;
        }
        targetCell.textContent = state.currentPlayer.getMark();

        const winningCoordinates = state.boardController.checkForWinner(
            coordinates,
            state.currentPlayer.getMark()
        );
        if (winningCoordinates) {
            board.removeEventListener('click', handleBoardClick);
            message.textContent = `${state.currentPlayer.getName()} WOOOON!`;
            const winningCellNumbers = winningCoordinates.map(
                state.boardController.coordinatesToCellNumber
            );
            winningCellNumbers.forEach((winningCellNumber) => {
                const winningCell = board.querySelector(`[data-cell-number='${winningCellNumber}']`);
                if (winningCell) {
                    winningCell.classList.add('win');
                }
            });
            return;
        }

        if (state.boardController.checkForDraw()) {
            board.removeEventListener('click', handleBoardClick);
            message.textContent = 'DRAAAAAAW!';
            return;
        }

        state.currentPlayer = state.currentPlayer === state.playerX ? state.playerO : state.playerX;
        message.textContent = `${state.currentPlayer.getName()} (${state.currentPlayer.getMark()}) turn!`;
    }
}());

function Board(sideSize) {
    let turnCount = 0;
    const board = [];
    const totalSize = sideSize * sideSize;

    initializeBoard();

    const getBoard = () => board.slice(0);
    const getFlatBoard = () => board.flat();

    function initializeBoard() {
        for (let i = 0; i < sideSize; ++i) {
            board[i] = [];
            for (let j = 0; j < sideSize; ++j) {
                board[i][j] = '';
            }
        }
    }

    function makeMove({ x, y }, mark) {
        if (!validMove({ x, y })) {
            return false;
        }
        board[x][y] = mark;
        ++turnCount;
        return true;
    }

    function validMove({ x, y }) {
        return validCoordinates({ x, y }) && board[x][y] === '';
    }

    function cellNumberToCoordinates(cellNumber) {
        if (!validCellNumber(cellNumber)) {
            return null;
        }
        return {
            // https://stackoverflow.com/a/5494983
            x: Math.floor(cellNumber / sideSize),
            y: cellNumber % sideSize
        };
    }

    function validCellNumber(cellNumber) {
        return cellNumber >= 0 && cellNumber < totalSize;
    }

    function coordinatesToCellNumber({ x, y }) {
        if (!validCoordinates({ x, y })) {
            return null;
        }
        // https://stackoverflow.com/a/1730975
        return x * sideSize + y;
    }

    function validCoordinates({ x, y }) {
        return (x >= 0 && x < sideSize) && (y >= 0 && y < sideSize);
    }

    function checkForWinner({ x, y }, mark) {
        // https://stackoverflow.com/a/1056352
        if (!shouldCheckForWinner() || !validCoordinates({ x, y })) {
            return null;
        }

        const winningRowCoordinates = checkRow(x, mark);
        if (winningRowCoordinates) {
            return winningRowCoordinates;
        }

        const winningColumnCoordinates = checkColumn(y, mark);
        if (winningColumnCoordinates) {
            return winningColumnCoordinates;
        }

        const winningDiagonalCoordinates = checkDiagonal({ x, y }, mark);
        if (winningDiagonalCoordinates) {
            return winningDiagonalCoordinates;
        }

        const winningAntiDiagonalCoordinates = checkAntiDiagonal({ x, y }, mark);
        if (winningAntiDiagonalCoordinates) {
            return winningAntiDiagonalCoordinates;
        }

        return null;
    }

    function shouldCheckForWinner() {
        return turnCount >= sideSize * 2 - 1;
    }

    function checkRow(x, mark) {
        const winningCoordinates = [];
        for (let i = 0; i < sideSize; ++i) {
            if (board[x][i] !== mark) {
                break;
            }
            winningCoordinates.push({ x, y: i });

            if (i === sideSize - 1) {
                return winningCoordinates;
            }
        }
        return null;
    }

    function checkColumn(y, mark) {
        const winningCoordinates = [];
        for (let i = 0; i < sideSize; ++i) {
            if (board[i][y] !== mark) {
                break;
            }
            winningCoordinates.push({ x: i, y });

            if (i === sideSize - 1) {
                return winningCoordinates;
            }
        }
        return null;
    }

    function checkDiagonal({ x, y }, mark) {
        if (x === y) {
            const winningCoordinates = [];
            for (let i = 0; i < sideSize; ++i) {
                if (board[i][i] !== mark) {
                    break;
                }
                winningCoordinates.push({ x: i, y: i });

                if (i === sideSize - 1) {
                    return winningCoordinates;
                }
            }
        }
        return null;
    }

    function checkAntiDiagonal({ x, y }, mark) {
        if (x + y === sideSize - 1) {
            const winningCoordinates = [];
            for (let i = 0; i < sideSize; ++i) {
                if (board[i][(sideSize - 1) - i] !== mark) {
                    break;
                }
                winningCoordinates.push({ x: i, y: (sideSize - 1) - i });

                if (i === sideSize - 1) {
                    return winningCoordinates;
                }
            }
        }
        return null;
    }

    function checkForDraw() {
        return turnCount === totalSize;
    }

    return {
        getBoard,
        getFlatBoard,
        makeMove,
        cellNumberToCoordinates,
        coordinatesToCellNumber,
        checkForWinner,
        checkForDraw
    };
}

function Player(name, mark) {
    let score = 0;

    const getName = () => name;
    const getMark = () => mark;
    const getScore = () => score;
    const increaseScore = () => ++score;
    const resetScore = () => score = 0;

    return {
        getName,
        getMark,
        getScore,
        increaseScore,
        resetScore
    };
}
