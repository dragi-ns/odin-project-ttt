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
    const VALID_GAME_MODES = ['vs-friend', 'vs-ai'];
    const VALID_MARKS = ['X', 'O'];
    const VALID_BOT_DIFFICULTIES = ['easy', 'medium', 'impossible'];
    const VALID_BOARD_SIDE_SIZES = [3, 4, 5];

    // ELEMENTS
    const root = document.documentElement;
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');

    const gameSettingsForm = document.querySelector('#game-settings');
    const vsFriendRadio = gameSettingsForm.querySelector('#vs-friend');
    const friendFormFields = gameSettingsForm.querySelectorAll('.form-field.friend');
    const vsAiRadio = gameSettingsForm.querySelector('#vs-ai');
    const aiFormFields = gameSettingsForm.querySelectorAll('.form-field.ai');
    const startGameButton = gameSettingsForm.querySelector('.start-game');

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

    // GAME VARIABLES
    const state = {
        boardController: null,
        playerX: null,
        playerO: null,
        currentPlayer: null,
        cellElements: []
    };

    const playerContainerDebounceFunction = debounce(handlePlayerContainer, 500, true);

    // EVENT LISTENERS
    window.addEventListener('resize', debounce(handleWindowResize, 250));
    vsFriendRadio.addEventListener('change', handleGameModeChange);
    vsAiRadio.addEventListener('change', handleGameModeChange);
    startGameButton.addEventListener(
        'click',
        debounce(handleGameSettingsForm, 500, true)
    );
    gameContainerOptionClearBoard.addEventListener(
        'click',
        debounce(handleGameContainerOptionResetBoard, 500, true)
    );
    gameContainerOptionNewGame.addEventListener(
        'click',
        debounce(handleGameContainerOptionNewGame, 500, true)
    );
    roundStatusModalActionContinue.addEventListener(
        'click',
        debounce(handleRoundStatusModalActionContinue, 500, true)
    );
    roundStatusModalActionNewGame.addEventListener(
        'click',
        debounce(handleRoundStatusModalActionNewGame, 500, true)
    );
    inGameMenuModalCloseButton.addEventListener(
        'click',
        debounce(
            closeModal.bind(null, inGameMenuModal, inGameMenuModalCard),
            500,
            true
        )
    );
    inGameMenuModalActionClearBoard.addEventListener(
        'click',
        debounce(handleInGameMenuModalActionResetBoard, 500, true)
    );
    inGameMenuModalActionNewGame.addEventListener(
        'click',
        debounce(handleInGameMenuModalActionNewGame, 500, true)
    );

    // Good explanation of debounce function - https://www.youtube.com/watch?v=LZb_Bv81vQs
    // https://css-tricks.com/debouncing-throttling-explained-examples/
    function debounce(fn, delay, leading = false) {
        let timeoutID = null;
        return (...args) => {
            const shouldCallNow = leading && !timeoutID;
            if (timeoutID) {
                clearTimeout(timeoutID);
            }
            timeoutID = setTimeout(() => {
                timeoutID = null;
                if (!leading) {
                    fn(...args);
                }
            }, delay);
            if (shouldCallNow) {
                fn(...args);
            }
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

    // TODO: When I change game mode to 'vs-ai' and soft refresh (not hard refresh) the page
    //       it will show 'vs-friend' form fields but 'vs-ai' game mode will still be selected
    function handleGameModeChange() {
        if (vsFriendRadio.checked) {
            aiFormFields.forEach(hideElement);
            friendFormFields.forEach(showElement);
        } else if (vsAiRadio.checked) {
            friendFormFields.forEach(hideElement);
            aiFormFields.forEach(showElement);
        }
    }

    function togglePlayerContainerEventListener() {
        if (mobileBreakpoint()) {
            playerTopContainer.addEventListener('click', playerContainerDebounceFunction);
            playerBottomContainer.addEventListener('click', playerContainerDebounceFunction);
        } else {
            playerTopContainer.removeEventListener('click', playerContainerDebounceFunction);
            playerBottomContainer.removeEventListener('click', playerContainerDebounceFunction);
        }
    }

    function handlePlayerContainer(event) {
        const target = event.currentTarget;

        if (target.classList.contains('top')) {
            inGameMenuModalCard.classList.add('top');
        } else {
            inGameMenuModalCard.classList.remove('top');
        }

        openModal(inGameMenuModal, inGameMenuModalCard);
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
        const cellNewSize = (65 / 100) * minSize;
        root.style.setProperty('--cell-font-size', `${cellNewSize}px`);
    }

    function handleGameSettingsForm() {
        if (state.boardController !== null) {
            return;
        }

        const gameMode = gameSettingsForm['game-mode'].value.trim();
        if (!VALID_GAME_MODES.includes(gameMode)) {
            return;
        }

        if (gameMode === 'vs-friend') {
            const playerXName = formatPlayerName(
                gameSettingsForm['player-x-name'].value.trim(),
                'Player 1'
            );
            const playerOName = formatPlayerName(
                gameSettingsForm['player-o-name'].value.trim(),
                'Player 2'
            );

            state.playerX = Player(playerXName, 'X');
            state.playerO = Player(playerOName, 'O');
        } else {
            const playerName = formatPlayerName(
                gameSettingsForm['player-name'].value.trim(),
                'Player 1'
            );
            let playerMark = gameSettingsForm['player-mark'].value.trim();
            if (!VALID_MARKS.includes(playerMark)) {
                playerMark = 'X';
            }

            let botDifficulty = gameSettingsForm['bot-difficulty'].value.trim();
            if (!VALID_BOT_DIFFICULTIES.includes(botDifficulty)) {
                botDifficulty = 'medium';
            }
            let botName = null;
            switch (botDifficulty) {
                case 'easy':
                    botName = 'Noobot';
                    break;
                case 'medium':
                    botName = 'Rubotium';
                    break;
                case 'impossible':
                    botName = 'Probot';
                    break;
                // no default
            }

            if (playerMark === 'X') {
                state.playerX = Player(playerName, playerMark);
                state.playerO = Bot(botName, 'O', botDifficulty);
            } else {
                state.playerX = Bot(botName, 'X', botDifficulty);
                state.playerO = Player(playerName, playerMark);
            }
        }

        let boardSideSize = +gameSettingsForm['board-size'].value.trim();
        if (Number.isNaN(boardSideSize) || !VALID_BOARD_SIDE_SIZES.includes(boardSideSize)) {
            boardSideSize = 3;
        }

        state.boardController = Board(boardSideSize);

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
        togglePlayerContainerEventListener();
        if (state.playerX.isBot()) {
            handleBotMove();
        } else {
            enableBoardCellSelection();
        }
    }

    function generateBoardCells() {
        const boardData = state.boardController.getBoard();
        let cellNumber = 0;
        boardData.forEach((rowData) => {
            const rowElement = document.createElement('div');
            rowElement.classList.add('row');
            rowData.forEach(() => {
                const cellElement = document.createElement('div');
                cellElement.classList.add('cell');
                cellElement.setAttribute('tabindex', '0');
                cellElement.dataset.cellNumber = cellNumber++;
                cellElement.innerHTML = `<span>&nbsp;<span>`;
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

    async function hideLandingElements() {
        const animationTasks = [
            gameSettingsForm.animate(
                SLIDE_ANIMATIONS.OUT.RIGHT,
                SLIDE_ANIMATIONS.TIMING
            ).finished
        ];

        if (mobileBreakpoint()) {
            animationTasks.push(
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

        const animations = await Promise.all(animationTasks);
        animations.forEach((animation) => hideElement(animation.effect.target));
    }

    async function showInGameElements() {
        const animationTasks = [
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
            animationTasks.push(
                gameContainerOptions.animate(
                    SLIDE_ANIMATIONS.IN.BOTTOM,
                    SLIDE_ANIMATIONS.TIMING
                ).finished
            );
        }

        showElement(gameContainer);
        adjustCellFontSize();
        await Promise.all(animationTasks);
        board.classList.add('active');
    }

    function enableBoardCellSelection() {
        board.addEventListener('click', handleBoardCellSelection);
        board.addEventListener('keydown', handleBoardCellSelection);
    }

    async function handleBotMove() {
        const coordinates = state.currentPlayer.makeMove(state.boardController);
        const cellNumber = state.boardController.coordinatesToCellNumber(coordinates);
        const targetCell = state.cellElements.find((cellElement) => {
            return +cellElement.dataset.cellNumber === cellNumber;
        });
        // TODO: Extract this into "sleep" utility function
        // https://stackoverflow.com/a/39914235
        // eslint-disable-next-line no-promise-executor-return
        await new Promise((resolve) => setTimeout(resolve, 500));
        markMove(targetCell, coordinates);
    }

    function handleBoardCellSelection(event) {
        if (event.type !== 'click' && (event.type !== 'keydown' || event.key !== 'Enter')) {
            return;
        }

        let targetCell = null;
        if (event.target.classList.contains('cell')) {
            targetCell = event.target;
        } else if (event.target.parentElement.classList.contains('cell')) {
            targetCell = event.target.parentElement;
        } else {
            return;
        }

        if (targetCell.classList.contains('marked')) {
            return;
        }

        const coordinates = state.boardController.cellNumberToCoordinates(
            targetCell.dataset.cellNumber
        );
        if (!coordinates
            || !state.boardController.makeMove(coordinates, state.currentPlayer.getMark())) {
            return;
        }

        disableBoardCellSelection();

        markMove(targetCell, coordinates);
    }

    function disableBoardCellSelection() {
        board.removeEventListener('click', handleBoardCellSelection);
        board.removeEventListener('keydown', handleBoardCellSelection);
    }

    async function markMove(cell, coordinates) {
        cell.classList.add('marked');

        const cellSpan = cell.children[0];
        cellSpan.textContent = state.currentPlayer.getMark();
        await cellSpan.animate(
            ZOOM_ANIMATIONS.IN,
            ZOOM_ANIMATIONS.TIMING
        ).finished;

        // TODO: Extract code belowo into a function

        const winningCoordinates = state.boardController.checkForWinner(
            coordinates,
            state.currentPlayer.getMark()
        );
        if (winningCoordinates) {
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
            showRoundStatusModal('DRAW!');
            return;
        }

        updateActivePlayer();
        if (state.currentPlayer.isBot()) {
            handleBotMove();
        } else {
            enableBoardCellSelection();
        }
    }

    function updatePlayerScore() {
        const newScore = state.currentPlayer.increaseScore();
        if (state.currentPlayer === state.playerX) {
            playerBottomScore.textContent = newScore;
        } else {
            playerTopScore.textContent = newScore;
        }
    }

    async function showRoundStatusModal(headerText) {
        roundStatusModalHeader.textContent = headerText;
        await openModal(roundStatusModal, roundStatusModalCard);
        roundStatusModalActionContinue.focus();
    }

    async function openModal(modal, modalCard) {
        root.classList.add('clipped');
        modal.classList.add('active');
        await Promise.all([
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
        closeModal(roundStatusModal, roundStatusModalCard);
        clearBoard();
        updateActivePlayer(true);
        if (state.currentPlayer.isBot()) {
            handleBotMove();
        } else {
            enableBoardCellSelection();
        }
    }

    async function closeModal(modal, modalCard) {
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
        state.boardController.clearBoard();
        state.cellElements.forEach((cellElement) => {
            const cellElementSpan = cellElement.children[0];
            cellElement.classList.remove('marked', 'win');
            cellElementSpan.animate(
                ZOOM_ANIMATIONS.OUT,
                ZOOM_ANIMATIONS.TIMING
            ).finished
                .then((animation) => animation.effect.target.innerHTML = '&nbsp;');
        });
    }

    function handleRoundStatusModalActionNewGame() {
        closeModal(roundStatusModal, roundStatusModalCard);
        endGame();
    }

    async function endGame() {
        await hideInGameElements();
        showLandingElements();
        tearDownBoard();
        state.boardController = null;
        state.playerX = null;
        state.playerO = null;
        state.currentPlayer = null;
    }

    async function hideInGameElements() {
        const animationTasks = [
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
            animationTasks.push(
                gameContainerOptions.animate(
                    SLIDE_ANIMATIONS.OUT.BOTTOM,
                    SLIDE_ANIMATIONS.TIMING
                ).finished
            );
        }

        clearBoard();
        board.classList.remove('active');
        await Promise.all(animationTasks);
        hideElement(gameContainer);
    }

    async function showLandingElements() {
        const animationTasks = [
            gameSettingsForm.animate(
                SLIDE_ANIMATIONS.IN.LEFT,
                SLIDE_ANIMATIONS.TIMING
            ).finished
        ];

        if (mobileBreakpoint()) {
            showElement(header);
            showElement(footer);
            animationTasks.push(
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
        Promise.all(animationTasks);
    }

    function tearDownBoard() {
        const rowElements = board.querySelectorAll('.row');
        rowElements.forEach((rowElement) => rowElement.remove());
        state.cellElements = [];
    }

    function handleGameContainerOptionResetBoard() {
        clearBoard();
        updateActivePlayer(true);
    }

    function handleGameContainerOptionNewGame() {
        endGame();
    }

    function handleInGameMenuModalActionResetBoard() {
        closeModal(inGameMenuModal, inGameMenuModalCard);
        clearBoard();
        updateActivePlayer(true);
    }

    function handleInGameMenuModalActionNewGame() {
        closeModal(inGameMenuModal, inGameMenuModalCard);
        endGame();
    }
}());

function Board(sideSize) {
    let turnCount = 0;
    const board = [];
    const totalSize = sideSize * sideSize;

    initializeBoard();

    const getSideSize = () => sideSize;
    const getBoard = () => board.slice(0);
    const getFlatBoard = () => board.flat();

    function getAvailableCoordinates() {
        const availableCoordinates = [];
        for (let i = 0; i < sideSize; ++i) {
            for (let j = 0; j < sideSize; ++j) {
                if (board[i][j] === '') {
                    availableCoordinates.push({ x: i, y: j });
                }
            }
        }
        return availableCoordinates;
    }

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
        getSideSize,
        getBoard,
        getFlatBoard,
        getAvailableCoordinates,
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

    const isBot = () => false;
    const getName = () => name;
    const getMark = () => mark;
    const getScore = () => score;
    const increaseScore = () => ++score;
    const resetScore = () => score = 0;
    const getFormatedString = () => `${name} (${mark})`;

    return {
        isBot,
        getName,
        getMark,
        getScore,
        increaseScore,
        resetScore,
        getFormatedString
    };
}

function Bot(name, mark, difficulty) {
    const isBot = () => true;
    const getDifficulty = () => difficulty;

    function makeMove(boardController) {
        const availableCoordinates = boardController.getAvailableCoordinates();
        if (availableCoordinates.length === 0) {
            return null;
        }

        let coordinates = null;

        if (availableCoordinates.length === 1) {
            // eslint-disable-next-line prefer-destructuring
            coordinates = availableCoordinates[0];
        } else {
            coordinates = availableCoordinates[getRandomNumber(availableCoordinates.length)];
        }

        boardController.makeMove(coordinates, mark);

        return coordinates;
    }

    function getRandomNumber(maxNum) {
        return Math.floor(Math.random() * maxNum);
    }

    const prototype = Player(name, mark);
    return Object.assign(
        {},
        prototype,
        {
            isBot,
            getDifficulty,
            makeMove
        }
    );
}
