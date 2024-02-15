
const canvas = document.getElementById('puissance4');
const context = canvas.getContext('2d');
const restartButton = document.getElementById('restartButton');

const ROWS = 6;
const COLUMNS = 7;
const CELL_SIZE = 100;
const PADDING = 10;
const PLAYER = 1;
const AI = -1;
const MAX_DEPTH = 5;
let board;
let currentPlayer;
let gameActive;

function initializeGame() {
    board = Array(ROWS).fill(null).map(() => Array(COLUMNS).fill(0));
    currentPlayer = PLAYER;
    gameActive = true;
    drawBoard();
}

function drawBoard() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLUMNS; col++) {
            context.beginPath();
            context.arc(col * CELL_SIZE + CELL_SIZE / 2, row * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 2 - PADDING, 0, 2 * Math.PI);
            context.fillStyle = board[row][col] === PLAYER ? 'red' : board[row][col] === AI ? 'green' : 'white';
            context.fill();
            context.stroke();
        }
    }
}


function animatePawnDrop(column, row, player, callback) {
    let animRow = 0;
    let animFrame = () => {
        if (animRow < row) {
            drawBoard();
            context.beginPath();
            context.arc(column * CELL_SIZE + CELL_SIZE / 2, animRow * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 2 - PADDING, 0, 2 * Math.PI);
            context.fillStyle = player === PLAYER ? 'red' : 'green';
            context.fill();
            context.stroke();
            animRow++;

            setTimeout(() => {
                requestAnimationFrame(animFrame);
            }, 20);  

        } else {
            callback();
        }
    };
    animFrame();
}

function playMove(column) {

    if (!gameActive) return;

    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row][column] === 0) {

            board[row][column] = currentPlayer;
            animatePawnDrop(column, row, currentPlayer, () => {
                drawBoard();
        
                if (checkWinner(currentPlayer)) {
                    gameActive = false;
                    let winner = currentPlayer === PLAYER ? 'Player 1' : 'AI';
                    setTimeout(() => {
                        alert(`${winner} wins!`);
                    }, 150);
                }

                currentPlayer = currentPlayer === PLAYER ? AI : PLAYER;

                if (currentPlayer === AI && gameActive) {
                    let bestMove = findBestMove();
                    setTimeout(() => playMove(bestMove), 500);
                }


            });
            return;
        }
    }
}


function checkWinner(player) {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLUMNS - 3; col++) {
            if (board[row][col] === player && board[row][col + 1] === player && board[row][col + 2] === player && board[row][col + 3] === player) {
                return true;
            }
        }
    }

    for (let col = 0; col < COLUMNS; col++) {
        for (let row = 0; row < ROWS - 3; row++) {
            if (board[row][col] === player && board[row + 1][col] === player && board[row + 2][col] === player && board[row + 3][col] === player) {
                return true;
            }
        }
    }


    for (let row = 3; row < ROWS; row++) {
        for (let col = 0; col < COLUMNS - 3; col++) {
            if (board[row][col] === player && board[row - 1][col + 1] === player && board[row - 2][col + 2] === player && board[row - 3][col + 3] === player) {
                return true;
            }
        }
    }


    for (let row = 3; row < ROWS; row++) {
        for (let col = 3; col < COLUMNS; col++) {
            if (board[row][col] === player && board[row - 1][col - 1] === player && board[row - 2][col - 2] === player && board[row - 3][col - 3] === player) {
                return true;
            }
        }
    }

    return false;
}

function findBestMove() {
    let bestScore = -Infinity;
    let bestMove = 0;
    let alpha = -Infinity;
    let beta = Infinity;

    for (let col = 0; col < COLUMNS; col++) {
        let row = getFirstOpenRow(col);
        if (row !== -1) {
            board[row][col] = AI;
            let score = minimax(board, 0, alpha, beta, false);
            board[row][col] = 0;
            if (score > bestScore) {
                bestScore = score;
                bestMove = col;
            }
        }
    }

    return bestMove;
}

function minimax(board, depth, alpha, beta, isMaximizing) {
    if (depth === MAX_DEPTH || checkWinner(PLAYER) || checkWinner(AI)) {
        return evaluateBoard();
    }

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let col = 0; col < COLUMNS; col++) {
            let row = getFirstOpenRow(col);
            if (row !== -1) {
                board[row][col] = AI;
                let score = minimax(board, depth + 1, alpha, beta, false);
                board[row][col] = 0;
                bestScore = Math.max(score, bestScore);
                alpha = Math.max(alpha, bestScore);
                if (beta <= alpha) {
                    break;
                }
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let col = 0; col < COLUMNS; col++) {
            let row = getFirstOpenRow(col);
            if (row !== -1) {
                board[row][col] = PLAYER;
                let score = minimax(board, depth + 1, alpha, beta, true);
                board[row][col] = 0;
                bestScore = Math.min(score, bestScore);
                beta = Math.min(beta, bestScore);
                if (beta <= alpha) {
                    break;
                }
            }
        }
        return bestScore;
    }
}


function evaluateBoard() {
    const WIN_SCORE = 10000;
    const AI_3_SERIES_SCORE = 5;
    const AI_2_SERIES_SCORE = 2;
    const PLAYER_3_SERIES_SCORE = 4;
    const PLAYER_2_SERIES_SCORE = 1;

    if (countSeries(AI, 4) > 0) return WIN_SCORE;
    if (countSeries(PLAYER, 4) > 0) return -WIN_SCORE;

    let score = 0;
    score += countSeries(AI, 3) * AI_3_SERIES_SCORE;
    score += countSeries(AI, 2) * AI_2_SERIES_SCORE;
    score -= countSeries(PLAYER, 3) * PLAYER_3_SERIES_SCORE;
    score -= countSeries(PLAYER, 2) * PLAYER_2_SERIES_SCORE;

    return score;
}


function countSeries(player, length) {
    let count = 0;

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLUMNS; col++) {
            if (col <= COLUMNS - length && checkLine(player, length, row, col, 0, 1)) count++;
            if (row <= ROWS - length && checkLine(player, length, row, col, 1, 0)) count++;
            if (row <= ROWS - length && col <= COLUMNS - length && checkLine(player, length, row, col, 1, 1)) count++;
            if (row >= length - 1 && col <= COLUMNS - length && checkLine(player, length, row, col, -1, 1)) count++;
        }
    }

    return count;
}


function checkLine(player, length, row, col, dRow, dCol) {
    for (let i = 0; i < length; i++) {
        let checkRow = row + i * dRow;
        let checkCol = col + i * dCol;


        if (checkRow < 0 || checkRow >= ROWS || checkCol < 0 || checkCol >= COLUMNS) {
            return false;
        }

        if (board[checkRow][checkCol] !== player) return false;
    }
    return true;
}

function getFirstOpenRow(col) {
    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row][col] === 0) {
            return row;
        }
    }
    return -1;
}

canvas.addEventListener('click', (event) => {
    if (currentPlayer === PLAYER) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const col = Math.floor(x / CELL_SIZE);
        playMove(col);
    }
});

restartButton.addEventListener('click', initializeGame);

initializeGame();


function dynamicDepthAdjustment(board) {
    if (isCriticalSituation(board)) {
        return MAX_DEPTH + 4;
    } else if (isLessComplexSituation(board)) {
        return MAX_DEPTH - 2;
    }
    return MAX_DEPTH;
}

function isCriticalSituation() {
    if (countSeries(AI, 3) > 0 || countSeries(PLAYER, 3) > 0) {
        return true;
    }
    return false;
}

function isLessComplexSituation(board) {
    let totalTokens = 0;
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLUMNS; col++) {
            if (board[row][col] !== 0) {
                totalTokens++;
            }
        }
    }
    return totalTokens < 10;
}


