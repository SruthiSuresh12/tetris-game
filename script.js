const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const levelDisplay = document.getElementById('level');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreDisplay = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');

const holdCanvas = document.getElementById('holdCanvas');
const holdCtx = holdCanvas.getContext('2d');
const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');
const holdBtn = document.getElementById('holdBtn');
const softDropBtn = document.getElementById('softDropBtn');
const hardDropBtn = document.getElementById('hardDropBtn');

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;

canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;

let board = [];
let score = 0;
let level = 1;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let gameOver = false;

let holdPiece = null;
let canSwap = true;

const COLORS = [
    '#90d6e6', // Cyan I
    '#f7e8a3', // Yellow O
    '#c394d6', // Purple T
    '#b4e3b7', // Green S
    '#f7a3a3', // Red Z
    '#a3b2f7', // Blue J
    '#f7c8a3', // Orange L
];

const PIECES = [
    [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[1, 1], [1, 1]],
    [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
    [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
    [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
    [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
    [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
];

let piece = null;
let nextPiece = getRandomPiece();

function initBoard() {
    for (let r = 0; r < ROWS; r++) {
        board[r] = [];
        for (let c = 0; c < COLS; c++) {
            board[r][c] = 0;
        }
    }
}

function getRandomPiece() {
    const pieceIndex = Math.floor(Math.random() * PIECES.length);
    const pieceShape = PIECES[pieceIndex];
    const pieceColor = COLORS[pieceIndex];
    return {
        shape: pieceShape,
        color: pieceColor,
        x: Math.floor(COLS / 2) - Math.floor(pieceShape[0].length / 2),
        y: 0
    };
}

function drawBoard() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (board[r][c]) {
                drawSquare(c, r, board[r][c]);
            } else {
                ctx.fillStyle = '#f0f0f0';
                ctx.fillRect(c * BLOCK_SIZE, r * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                ctx.strokeStyle = '#ccc';
                ctx.strokeRect(c * BLOCK_SIZE, r * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        }
    }
}

function drawSquare(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

function drawPiece() {
    if (!piece) return;
    for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
            if (piece.shape[r][c]) {
                drawSquare(piece.x + c, piece.y + r, piece.color);
            }
        }
    }
}

function drawNextAndHold() {
    const pieceSize = 30;

    // Draw Next Piece
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    const nextPieceShape = nextPiece.shape;
    const nextPieceColor = nextPiece.color;
    const nextOffsetX = (nextCanvas.width - nextPieceShape[0].length * pieceSize) / 2;
    const nextOffsetY = (nextCanvas.height - nextPieceShape.length * pieceSize) / 2;
    for (let r = 0; r < nextPieceShape.length; r++) {
        for (let c = 0; c < nextPieceShape[r].length; c++) {
            if (nextPieceShape[r][c]) {
                nextCtx.fillStyle = nextPieceColor;
                nextCtx.fillRect(nextOffsetX + c * pieceSize, nextOffsetY + r * pieceSize, pieceSize, pieceSize);
                nextCtx.strokeStyle = '#fff';
                nextCtx.strokeRect(nextOffsetX + c * pieceSize, nextOffsetY + r * pieceSize, pieceSize, pieceSize);
            }
        }
    }

    // Draw Hold Piece
    holdCtx.clearRect(0, 0, holdCanvas.width, holdCanvas.height);
    if (holdPiece) {
        const holdPieceShape = holdPiece.shape;
        const holdPieceColor = holdPiece.color;
        const holdOffsetX = (holdCanvas.width - holdPieceShape[0].length * pieceSize) / 2;
        const holdOffsetY = (holdCanvas.height - holdPieceShape.length * pieceSize) / 2;
        for (let r = 0; r < holdPieceShape.length; r++) {
            for (let c = 0; c < holdPieceShape[r].length; c++) {
                if (holdPieceShape[r][c]) {
                    holdCtx.fillStyle = holdPieceColor;
                    holdCtx.fillRect(holdOffsetX + c * pieceSize, holdOffsetY + r * pieceSize, pieceSize, pieceSize);
                    holdCtx.strokeStyle = '#fff';
                    holdCtx.strokeRect(holdOffsetX + c * pieceSize, holdOffsetY + r * pieceSize, pieceSize, pieceSize);
                }
            }
        }
    }
}

function collide() {
    for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
            if (piece.shape[r][c]) {
                let newX = piece.x + c;
                let newY = piece.y + r;
                if (newX < 0 || newX >= COLS || newY >= ROWS || (newY >= 0 && board[newY][newX])) {
                    return true;
                }
            }
        }
    }
    return false;
}

function hardDrop() {
    while (!collide()) {
        piece.y++;
    }
    piece.y--;
    lockPiece();
}

function lockPiece() {
    for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
            if (piece.shape[r][c]) {
                board[piece.y + r][piece.x + c] = piece.color;
            }
        }
    }
    clearLines();
    piece = nextPiece;
    nextPiece = getRandomPiece();
    canSwap = true;

    if (collide()) {
        endGame();
    }
}

function clearLines() {
    let linesCleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
        let isFull = true;
        for (let c = 0; c < COLS; c++) {
            if (!board[r][c]) {
                isFull = false;
                break;
            }
        }
        if (isFull) {
            linesCleared++;
            for (let y = r; y > 0; y--) {
                for (let c = 0; c < COLS; c++) {
                    board[y][c] = board[y - 1][c];
                }
            }
            for (let c = 0; c < COLS; c++) {
                board[0][c] = 0;
            }
            r++;
        }
    }
    if (linesCleared > 0) {
        score += linesCleared * 100;
        scoreDisplay.textContent = score;
        if (score >= level * 500) {
            level++;
            levelDisplay.textContent = level;
            dropInterval = Math.max(100, dropInterval - 100);
        }
    }
}

function drop() {
    piece.y++;
    if (collide()) {
        piece.y--;
        lockPiece();
    }
}

function holdCurrentPiece() {
    if (!canSwap) return;

    if (holdPiece) {
        let tempPiece = piece;
        piece = holdPiece;
        holdPiece = tempPiece;
        piece.x = Math.floor(COLS / 2) - Math.floor(piece.shape[0].length / 2);
        piece.y = 0;
    } else {
        holdPiece = piece;
        piece = nextPiece;
        nextPiece = getRandomPiece();
    }
    canSwap = false;
    
    if (collide()) {
        endGame();
    }
}

function rotatePiece(direction) {
    let rotatedShape = [];
    if (direction === 'right') {
        for (let c = 0; c < piece.shape[0].length; c++) {
            rotatedShape[c] = [];
            for (let r = piece.shape.length - 1; r >= 0; r--) {
                rotatedShape[c].push(piece.shape[r][c]);
            }
        }
    } else { // Rotate left
        for (let c = piece.shape[0].length - 1; c >= 0; c--) {
            rotatedShape[c] = [];
            for (let r = 0; r < piece.shape.length; r++) {
                rotatedShape[c].unshift(piece.shape[r][c]);
            }
        }
    }
    
    const originalShape = piece.shape;
    piece.shape = rotatedShape;
    if (collide()) {
        piece.shape = originalShape;
    }
}

// Keyboard controls
document.addEventListener('keydown', e => {
    if (gameOver) return;
    switch (e.key) {
        case 'ArrowLeft':
            piece.x--;
            if (collide()) piece.x++;
            break;
        case 'ArrowRight':
            piece.x++;
            if (collide()) piece.x--;
            break;
        case 'ArrowDown':
            drop();
            break;
        case 'ArrowUp':
            rotatePiece('right');
            break;
        case 'z': // rotate left with 'z' key
            rotatePiece('left');
            break;
        case ' ':
            hardDrop();
            break;
        case 'c':
            holdCurrentPiece();
            break;
    }
});

// Touch controls
let touchstartX = 0;
let touchendX = 0;
let touchstartY = 0;
let touchendY = 0;

const gameCanvas = document.getElementById('gameCanvas');

gameCanvas.addEventListener('touchstart', e => {
    e.preventDefault();
    touchstartX = e.changedTouches[0].screenX;
    touchstartY = e.changedTouches[0].screenY;
}, false);

gameCanvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const currentX = e.changedTouches[0].screenX;
    const deltaX = currentX - touchstartX;
    const threshold = 30;

    if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
            piece.x++;
            if (collide()) piece.x--;
        } else {
            piece.x--;
            if (collide()) piece.x++;
        }
        touchstartX = currentX;
    }
}, false);

gameCanvas.addEventListener('touchend', e => {
    touchendX = e.changedTouches[0].screenX;
    touchendY = e.changedTouches[0].screenY;
    handleGesture();
}, false);

function handleGesture() {
    const deltaY = touchendY - touchstartY;
    const threshold = 15;

    if (deltaY > threshold) {
        // Swipe down for rotate left
        rotatePiece('left');
    } else if (deltaY < -threshold) {
        // Swipe up for rotate right
        rotatePiece('right');
    }
}

// Button controls
holdBtn.addEventListener('click', () => {
    if (gameOver) return;
    holdCurrentPiece();
});

softDropBtn.addEventListener('click', () => {
    if (gameOver) return;
    drop();
});

hardDropBtn.addEventListener('click', () => {
    if (gameOver) return;
    hardDrop();
});

function gameLoop(time) {
    if (gameOver) return;

    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        drop();
        dropCounter = 0;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoard();
    drawPiece();
    drawNextAndHold();

    requestAnimationFrame(gameLoop);
}

function startGame() {
    initBoard();
    score = 0;
    level = 1;
    scoreDisplay.textContent = score;
    levelDisplay.textContent = level;
    dropInterval = 1000;
    gameOver = false;
    gameOverScreen.classList.add('hidden');
    
    piece = getRandomPiece();
    nextPiece = getRandomPiece();
    holdPiece = null;
    canSwap = true;

    lastTime = 0;
    requestAnimationFrame(gameLoop);
}

function endGame() {
    gameOver = true;
    finalScoreDisplay.textContent = score;
    gameOverScreen.classList.remove('hidden');
}

restartBtn.addEventListener('click', startGame);

startGame();
