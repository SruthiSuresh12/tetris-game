const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const levelDisplay = document.getElementById('level');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreDisplay = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;

// Set the canvas dimensions based on the grid size
canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;

let board = [];
let score = 0;
let level = 1;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let gameOver = false;

// Pastel colors for the pieces
const COLORS = [
    '#FFADAD', // Reddish
    '#FFC8DD', // Pink
    '#FFD7A6', // Orangey
    '#CAFFC9', // Green
    '#A0D2EB', // Blue
    '#B5B9FF', // Purple
    '#F2EFEA'  // Pale Grey
];

const PIECES = [
    // I piece
    [[1, 1, 1, 1]],
    // J piece
    [[1, 0, 0], [1, 1, 1]],
    // L piece
    [[0, 0, 1], [1, 1, 1]],
    // O piece
    [[1, 1], [1, 1]],
    // S piece
    [[0, 1, 1], [1, 1, 0]],
    // T piece
    [[0, 1, 0], [1, 1, 1]],
    // Z piece
    [[1, 1, 0], [0, 1, 1]]
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
                // Clear the space if it's empty
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
            // Add a new empty row at the top
            for (let c = 0; c < COLS; c++) {
                board[0][c] = 0;
            }
            r++; // Check the same row again since the content shifted down
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

function rotatePiece() {
    let rotatedShape = [];
    for (let c = 0; c < piece.shape[0].length; c++) {
        rotatedShape[c] = [];
        for (let r = piece.shape.length - 1; r >= 0; r--) {
            rotatedShape[c].push(piece.shape[r][c]);
        }
    }
    const originalShape = piece.shape;
    piece.shape = rotatedShape;
    if (collide()) {
        piece.shape = originalShape; // Revert if collision
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
            rotatePiece();
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
    touchstartX = e.changedTouches[0].screenX;
    touchstartY = e.changedTouches[0].screenY;
}, false);

gameCanvas.addEventListener('touchend', e => {
    touchendX = e.changedTouches[0].screenX;
    touchendY = e.changedTouches[0].screenY;
    handleGesture();
}, false);

function handleGesture() {
    const deltaX = touchendX - touchstartX;
    const deltaY = touchendY - touchstartY;
    const threshold = 15;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
            piece.x++;
            if (collide()) piece.x--;
        } else {
            piece.x--;
            if (collide()) piece.x++;
        }
    } else if (Math.abs(deltaY) > threshold) {
        if (deltaY > 0) {
            drop();
        } else {
            rotatePiece();
        }
    }
}

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
    lastTime = 0;
    requestAnimationFrame(gameLoop);
}

function endGame() {
    gameOver = true;
    finalScoreDisplay.textContent = score;
    gameOverScreen.classList.remove('hidden');
}

restartBtn.addEventListener('click', startGame);

// Initialize the game for the first time
startGame();
