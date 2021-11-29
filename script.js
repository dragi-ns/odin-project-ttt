(function IIFE() {
    // CONSTANTS
    const SLIDE_ANIMATIONS = {
        OUT: {
            TOP: [
                { transform: 'translateY(0)', opacity: 1 },
                { transform: 'translateY(-100%)', opacity: 0 }
            ],
            RIGHT: [
                { transform: 'translateX(0)', opacity: 1 },
                { transform: 'translateX(100%)', opacity: 0 }
            ],
            BOTTOM: [
                { transform: 'translateY(0)', opacity: 1 },
                { transform: 'translateY(100%)', opacity: 0 }
            ],
            LEFT: [
                { transform: 'translateX(0)', opacity: 1 },
                { transform: 'translateX(-100%)', opacity: 0 }
            ]
        },
        IN: {
            TOP: [
                { transform: 'translateY(-100%)', opacity: 0 },
                { transform: 'translateY(0)', opacity: 1 }
            ],
            BOTTOM: [
                { transform: 'translateY(100%)', opacity: 0 },
                { transform: 'translateY(0)', opacity: 1 }
            ],
            RIGHT: [
                { transform: 'translateX(100%)', opacity: 0 },
                { transform: 'translateX(0)', opacity: 1 }
            ],
            LEFT: [
                { transform: 'translateX(-100%)', opacity: 0 },
                { transform: 'translateX(0)', opacity: 1 }
            ]
        },
        TIMING: {
            duration: 250
        }
    };
    const FADE_ANIMATIONS = {
        IN: [
            { opacity: 0 },
            { opacity: 1 }
        ],
        OUT: [
            { opacity: 1 },
            { opacity: 0 }
        ],
        TIMING: {
            duration: 250
        }
    };
    const ZOOM_ANIMATIONS = {
        IN: [
            { transform: 'scale(0)' },
            { transform: 'scale(1)' }
        ],
        OUT: [
            { transform: 'scale(1)' },
            { transform: 'scale(0)' }
        ],
        TIMING: {
            duration: 100
        }
    };
    const MAX_NAME_LENGTH = 16;
    const VALID_BOARD_SIDE_SIZES = [3, 4, 5];

    // ELEMENTS
    const root = document.documentElement;
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');

    const gameSettingsForm = document.querySelector('#game-settings');

    const gameContainer = document.querySelector('#game-container');
    const gameContainerOptions = gameContainer.querySelector('.options');
    const gameContainerOptionClearBoard = gameContainerOptions.querySelector('.clear-board');
    const gameContainerOptionNewGame = gameContainerOptions.querySelector('.new-game');

    const playerTopContainer = gameContainer.querySelector('.player-info.top');
    const playerTopName = playerTopContainer.querySelector('.left-info');
    const playerTopScore = playerTopContainer.querySelector('.right-info');

    const playerBottomContainer = gameContainer.querySelector('.player-info.bottom');
    const playerBottomName = playerBottomContainer.querySelector('.left-info');
    const playerBottomScore = playerBottomContainer.querySelector('.right-info');

    const board = gameContainer.querySelector('.board');

    const roundStatusModal = document.querySelector('#round-status');
    const roundStatusModalCard = roundStatusModal.querySelector('.modal-card');
    const roundStatusModalHeader = roundStatusModal.querySelector('.modal-header');
    const roundStatusModalActionContinue = roundStatusModal.querySelector('.continue-game');
    const roundStatusModalActionNewGame = roundStatusModal.querySelector('.new-game');

    const inGameMenuModal = document.querySelector('#in-game-options');
    const inGameMenuModalCloseButton = inGameMenuModal.querySelector('.close-button');
    const inGameMenuModalCard = inGameMenuModal.querySelector('.modal-card');
    const inGameMenuModalActionClearBoard = inGameMenuModal.querySelector('.clear-board');
    const inGameMenuModalActionNewGame = inGameMenuModal.querySelector('.new-game');

    const state = {
        boardController: null,
        playerX: null,
        playerO: null,
        currentPlayer: null,
        cellElements: []
    };

    // EVENT LISTENERS
    window.addEventListener('resize', debounce(handleWindowResize, 250));
    gameSettingsForm.addEventListener('submit', handleGameSettingsForm);
    gameContainerOptionClearBoard.addEventListener(
        'click',
        handleGameContainerOptionResetBoard,
        { once: true }
    );
    gameContainerOptionNewGame.addEventListener(
        'click',
        handleGameContainerOptionNewGame,
        { once: true }
    );
    roundStatusModalActionContinue.addEventListener(
        'click',
        handleRoundStatusModalActionContinue,
        { once: true }
    );
    roundStatusModalActionNewGame.addEventListener(
        'click',
        handleRoundStatusModalActionNewGame,
        { once: true }
    );
    inGameMenuModalCloseButton.addEventListener(
        'click',
        hideModal.bind(null, inGameMenuModal, inGameMenuModalCard)
    );
    inGameMenuModalActionClearBoard.addEventListener(
        'click',
        handleInGameMenuModalActionResetBoard,
        { once: true }
    );
    inGameMenuModalActionNewGame.addEventListener(
        'click',
        handleInGameMenuModalActionNewGame,
        { once: true }
    );

    togglePlayerContainerEventListener();

    // Good explanation of debounce function - https://www.youtube.com/watch?v=LZb_Bv81vQs
    function debounce(fn, delay) {
        let timeoutID = null;
        return (...args) => {
            if (timeoutID) {
                clearTimeout(timeoutID);
            }

            timeoutID = setTimeout(() => {
                fn(...args);
            }, delay);
        };
    }

    function handleWindowResize() {
        if (!state.boardController) {
            return;
        }

        togglePlayerContainerEventListener();
        toggleHeaderFooterVisibility();

        adjustCellFontSize();
    }

    function togglePlayerContainerEventListener() {
        if (mobileBreakpoint()) {
            playerTopContainer.addEventListener('click', handlePlayerContainer);
            playerBottomContainer.addEventListener('click', handlePlayerContainer);
        } else {
            playerTopContainer.removeEventListener('click', handlePlayerContainer);
            playerBottomContainer.removeEventListener('click', handlePlayerContainer);
        }
    }

    function handlePlayerContainer(event) {
        const target = event.currentTarget;

        if (target.classList.contains('top')) {
            inGameMenuModalCard.classList.add('top');
        } else {
            inGameMenuModalCard.classList.remove('top');
        }

        showModal(inGameMenuModal, inGameMenuModalCard);
    }

    function toggleHeaderFooterVisibility() {
        if (mobileBreakpoint()) {
            hideElement(header);
            hideElement(footer);
        } else {
            showElement(header);
            showElement(footer);
        }
    }

    function mobileBreakpoint() {
        return window.innerWidth < 1024;
    }

    function hideElement(element) {
        element.classList.add('hide');
    }

    function showElement(element) {
        element.classList.remove('hide');
    }

    function adjustCellFontSize() {
        if (state.cellElements.length === 0) {
            return;
        }

        const currentCellSize = getComputedStyle(state.cellElements[0]);
        const minSize = Math.min(
            parseFloat(currentCellSize.width),
            parseFloat(currentCellSize.height)
        );
        state.cellElements.forEach((cellElement) => {
            cellElement.style.fontSize = `${(65 / 100) * minSize}px`;
            const cellElementSpan = cellElement.children[0];
            if (cellElementSpan.textContent.length === 0) {
                cellElementSpan.innerHTML = '&nbsp';
            }
        });
    }

    function handleGameSettingsForm(event) {
        event.preventDefault();

        if (state.boardController) {
            return;
        }

        const playerXName = formatPlayerName(
            gameSettingsForm['player-x-name'].value.trim(),
            'Player 1'
        );
        const playerOName = formatPlayerName(
            gameSettingsForm['player-o-name'].value.trim(),
            'Player 2'
        );
        let boardSideSize = +gameSettingsForm['board-size'].value.trim();
        if (Number.isNaN(boardSideSize) || !VALID_BOARD_SIDE_SIZES.includes(boardSideSize)) {
            boardSideSize = 3;
        }

        state.boardController = Board(boardSideSize);
        state.playerX = Player(playerXName, 'X');
        state.playerO = Player(playerOName, 'O');
        state.currentPlayer = state.playerX;

        startGame();
    }

    function formatPlayerName(playerName, alternativeName) {
        if (playerName.length === 0) {
            return alternativeName;
        }

        if (playerName.length > MAX_NAME_LENGTH) {
            return playerName.slice(0, MAX_NAME_LENGTH);
        }

        return playerName;
    }

    async function startGame() {
        generateBoardCells();
        setPlayersInfo();
        updateActivePlayer(true);
        await hideLandingElements();
        await showInGameElements();
        board.addEventListener('click', handleBoardClick);
    }

    function generateBoardCells() {
        const boardData = state.boardController.getBoard();
        let cellNumber = 0;
        boardData.forEach((rowData) => {
            const rowElement = document.createElement('div');
            rowElement.classList.add('row');
            rowData.forEach((cellData) => {
                const cellElement = document.createElement('div');
                cellElement.classList.add('cell');
                cellElement.dataset.cellNumber = cellNumber++;
                cellElement.innerHTML = `<span>${cellData}<span>`;
                rowElement.appendChild(cellElement);
                state.cellElements.push(cellElement);
            });
            board.appendChild(rowElement);
        });
    }

    function setPlayersInfo() {
        playerTopName.textContent = state.playerO.getFormatedString();
        playerTopScore.textContent = state.playerO.getScore();

        playerBottomName.textContent = state.playerX.getFormatedString();
        playerBottomScore.textContent = state.playerX.getScore();
    }

    async function hideLandingElements() {
        const animationQueue = [
            gameSettingsForm.animate(
                SLIDE_ANIMATIONS.OUT.RIGHT,
                SLIDE_ANIMATIONS.TIMING
            ).finished
        ];

        if (mobileBreakpoint()) {
            animationQueue.push(
                header.animate(
                    SLIDE_ANIMATIONS.OUT.TOP,
                    SLIDE_ANIMATIONS.TIMING
                ).finished,
                footer.animate(
                    SLIDE_ANIMATIONS.OUT.BOTTOM,
                    SLIDE_ANIMATIONS.TIMING
                ).finished
            );
        }

        const animations = await Promise.all(animationQueue);
        animations.forEach((animation) => hideElement(animation.effect.target));
    }

    async function showInGameElements() {
        const animationQueue = [
            playerTopContainer.animate(
                SLIDE_ANIMATIONS.IN.RIGHT,
                SLIDE_ANIMATIONS.TIMING
            ).finished,
            playerBottomContainer.animate(
                SLIDE_ANIMATIONS.IN.LEFT,
                SLIDE_ANIMATIONS.TIMING
            ).finished
        ];

        if (!mobileBreakpoint()) {
            showElement(gameContainerOptions);
            animationQueue.push(
                gameContainerOptions.animate(
                    SLIDE_ANIMATIONS.IN.BOTTOM,
                    SLIDE_ANIMATIONS.TIMING
                ).finished
            );
        }

        showElement(gameContainer);
        adjustCellFontSize();
        await Promise.all(animationQueue);
        board.classList.add('active');
    }

    function handleBoardClick(event) {
        let targetCell = null;
        if (event.target.classList.contains('cell')) {
            targetCell = event.target;
        } else if (event.target.parentElement.classList.contains('cell')) {
            targetCell = event.target.parentElement;
        } else {
            return;
        }

        const coordinates = state.boardController.cellNumberToCoordinates(
            targetCell.dataset.cellNumber
        );
        if (!coordinates) {
            return;
        }

        if (!state.boardController.makeMove(coordinates, state.currentPlayer.getMark())) {
            return;
        }

        const targetCellSpan = targetCell.children[0];
        targetCellSpan.textContent = state.currentPlayer.getMark();
        targetCellSpan.animate(
            ZOOM_ANIMATIONS.IN,
            ZOOM_ANIMATIONS.TIMING
        );

        const winningCoordinates = state.boardController.checkForWinner(
            coordinates,
            state.currentPlayer.getMark()
        );
        if (winningCoordinates) {
            board.removeEventListener('click', handleBoardClick);

            const winningCellNumbers = winningCoordinates.map(
                state.boardController.coordinatesToCellNumber
            );

            state.cellElements.forEach((cellElement) => {
                const cellNumber = +cellElement.dataset.cellNumber;
                if (winningCellNumbers.includes(cellNumber)) {
                    cellElement.classList.add('win');
                }
            });

            updatePlayerScore();
            showRoundStatusModal(`${state.currentPlayer.getFormatedString()} WON!`);
            return;
        }

        if (state.boardController.checkForDraw()) {
            board.removeEventListener('click', handleBoardClick);
            showRoundStatusModal('DRAW!');
            return;
        }

        updateActivePlayer();
    }

    function updatePlayerScore() {
        const newScore = state.currentPlayer.increaseScore();
        if (state.currentPlayer === state.playerX) {
            playerBottomScore.textContent = newScore;
        } else {
            playerTopScore.textContent = newScore;
        }
    }

    function updateActivePlayer(reset = false) {
        if (!reset) {
            state.currentPlayer = (
                state.currentPlayer === state.playerX ? state.playerO : state.playerX
            );
        } else {
            state.currentPlayer = state.playerX;
        }
        if (state.currentPlayer === state.playerX) {
            playerTopContainer.classList.remove('active');
            playerBottomContainer.classList.add('active');
        } else {
            playerBottomContainer.classList.remove('active');
            playerTopContainer.classList.add('active');
        }
    }

    async function showRoundStatusModal(headerText) {
        roundStatusModalHeader.textContent = headerText;
        showModal(roundStatusModal, roundStatusModalCard);
        roundStatusModalActionContinue.focus();
    }

    async function showModal(modal, modalCard) {
        root.classList.add('clipped');
        modal.classList.add('active');
        Promise.all([
            modal.animate(
                FADE_ANIMATIONS.IN,
                FADE_ANIMATIONS.TIMING
            ).finished,
            modalCard.animate(
                SLIDE_ANIMATIONS.IN.TOP,
                SLIDE_ANIMATIONS.TIMING
            ).finished
        ]);
    }

    function handleRoundStatusModalActionContinue() {
        hideModal(roundStatusModal, roundStatusModalCard);
        state.boardController.clearBoard();
        clearBoard();
        updateActivePlayer(true);
        board.addEventListener('click', handleBoardClick);
        roundStatusModalActionContinue.addEventListener(
            'click',
            handleRoundStatusModalActionContinue,
            { once: true }
        );
    }

    async function hideModal(modal, modalCard) {
        await Promise.all([
            modal.animate(
                FADE_ANIMATIONS.OUT,
                FADE_ANIMATIONS.TIMING
            ).finished,
            modalCard.animate(
                SLIDE_ANIMATIONS.OUT.TOP,
                SLIDE_ANIMATIONS.TIMING
            ).finished
        ]);
        modal.classList.remove('active');
        root.classList.remove('clipped');
    }

    function clearBoard() {
        state.cellElements.forEach((cellElement) => {
            const cellElementSpan = cellElement.children[0];
            cellElement.classList.remove('win');
            cellElementSpan.animate(
                ZOOM_ANIMATIONS.OUT,
                ZOOM_ANIMATIONS.TIMING
            ).finished
                .then((animation) => animation.effect.target.innerHTML = '&nbsp;');
        });
    }

    function handleRoundStatusModalActionNewGame() {
        hideModal(roundStatusModal, roundStatusModalCard);
        endGame();
        roundStatusModalActionNewGame.addEventListener(
            'click',
            handleRoundStatusModalActionNewGame,
            { once: true }
        );
    }

    async function endGame() {
        await hideInGameElements();
        await showLandingElements();
        tearDownBoard();
        state.boardController = null;
        state.playerX = null;
        state.playerO = null;
        state.currentPlayer = null;
    }

    async function hideInGameElements() {
        const animationQueue = [
            playerTopContainer.animate(
                SLIDE_ANIMATIONS.OUT.RIGHT,
                SLIDE_ANIMATIONS.TIMING
            ).finished,
            playerBottomContainer.animate(
                SLIDE_ANIMATIONS.OUT.LEFT,
                SLIDE_ANIMATIONS.TIMING
            ).finished
        ];

        if (!mobileBreakpoint()) {
            animationQueue.push(
                gameContainerOptions.animate(
                    SLIDE_ANIMATIONS.OUT.BOTTOM,
                    SLIDE_ANIMATIONS.TIMING
                ).finished
                    .then((animation) => hideElement(animation.effect.target))
            );
        }

        clearBoard();
        board.classList.remove('active');
        await Promise.all(animationQueue);
        hideElement(gameContainer);
    }

    function tearDownBoard() {
        // TODO: Maybe don't remove all board cells when the user
        // selectes new game.
        const rowElements = board.querySelectorAll('.row');
        rowElements.forEach((rowElement) => rowElement.remove());
        state.cellElements = [];
    }

    async function showLandingElements() {
        const animationQueue = [
            gameSettingsForm.animate(
                SLIDE_ANIMATIONS.IN.LEFT,
                SLIDE_ANIMATIONS.TIMING
            ).finished
        ];

        if (mobileBreakpoint()) {
            showElement(header);
            showElement(footer);
            animationQueue.push(
                header.animate(
                    SLIDE_ANIMATIONS.IN.TOP,
                    SLIDE_ANIMATIONS.TIMING
                ).finished,
                footer.animate(
                    SLIDE_ANIMATIONS.IN.BOTTOM,
                    SLIDE_ANIMATIONS.TIMING
                ).finished
            );
        }

        showElement(gameSettingsForm);
        await Promise.all(animationQueue);
    }

    function handleGameContainerOptionResetBoard() {
        state.boardController.clearBoard();
        clearBoard();
        updateActivePlayer(true);
        gameContainerOptionClearBoard.addEventListener(
            'click',
            handleGameContainerOptionResetBoard,
            { once: true }
        );
    }

    function handleGameContainerOptionNewGame() {
        endGame();
        gameContainerOptionNewGame.addEventListener(
            'click',
            handleGameContainerOptionNewGame,
            { once: true }
        );
    }

    function handleInGameMenuModalActionResetBoard() {
        hideModal(inGameMenuModal, inGameMenuModalCard);
        state.boardController.clearBoard();
        clearBoard();
        updateActivePlayer(true);
        inGameMenuModalActionClearBoard.addEventListener(
            'click',
            handleInGameMenuModalActionResetBoard,
            { once: true }
        );
    }

    function handleInGameMenuModalActionNewGame() {
        hideModal(inGameMenuModal, inGameMenuModalCard);
        endGame();
        inGameMenuModalActionNewGame.addEventListener(
            'click',
            handleInGameMenuModalActionNewGame,
            { once: true }
        );
    }
}());

function Board(sideSize) {
    // TODO: Add an option for board resizing
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

    function clearBoard() {
        turnCount = 0;
        for (let i = 0; i < sideSize; ++i) {
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
        clearBoard,
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
    const getFormatedString = () => `${name} (${mark})`;

    return {
        getName,
        getMark,
        getScore,
        increaseScore,
        resetScore,
        getFormatedString
    };
}
