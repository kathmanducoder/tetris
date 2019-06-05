/*
 * tetris.js
 * Author: anupkhadka
*/

const NUM_ROWS = 20; // total number of rows in game board
const NUM_COLUMNS = 10; // total number of columns in game board
const SQUARE_SIZE = 20; // size in pixel of each square in board
const GAME_OVER_COLOR = "WHITE"; // the color with which the text "Game Over"
                                 // is displayed at the end.
const GAME_OVER_FONT = "30px Verdana"
const DROP_INTERVAL = 1000; // Drop a tetrino every 1 second (1000 ms)
const TETRINO_START_ROW = 0; // Start first drop from the top of the board
const TETRINO_START_COLUMN = 4; // Place tetrino in 4th column at first drop
const EMPTY = "BLACK"; // Color of an empty block.
const STROKE_COLOR = "WHITE"; // Stroke color for all the squares.

//Tetromino Shapes
const O = [
  [1, 1],
  [1, 1]
]

const I = [
  [0, 1, 0, 0],
  [0, 1, 0, 0],
  [0, 1, 0, 0],
  [0, 1, 0, 0]
]

const T = [
  [0, 1, 0],
  [1, 1, 1],
  [0, 0, 0]
]

const J = [
  [1, 0, 0],
  [1, 1, 1],
  [0, 0, 0]
]

const L = [
  [0, 0, 1],
  [1, 1, 1],
  [0, 0, 0]
]

const S = [
  [0, 1, 1],
  [1, 1, 0],
  [0, 0, 0]
]

const Z = [
  [1, 1, 0],
  [0, 1, 1],
  [0, 0, 0]
]

const tetrominoShapes = [
  [O, "rgb(240,240,50)"],
  [I, "rgb(40, 240, 240)"],
  [T, "rgb(160, 35, 235)"],
  [J, "rgb(10, 35, 235)"],
  [L, "rgb(240, 160, 40)"],
  [S, "rgb(40, 240, 40)"],
  [Z, "rgb(240, 10, 25)"]
]

const board = new Array(NUM_ROWS); // game board
let score = 0; // game score
const canvas = document.getElementById("board"); // canvas
const ctx = canvas.getContext("2d");
let activeTetromino = null; // Active tetromino

//add event listener to listen for keydowns.
document.addEventListener('keydown', handleKeyDown);

function drawSquare(row, column, color) {
  ctx.fillStyle = color;
  ctx.fillRect(column * SQUARE_SIZE, row * SQUARE_SIZE,
    SQUARE_SIZE, SQUARE_SIZE);
  ctx.strokeStyle = STROKE_COLOR;
  ctx.strokeRect(column * SQUARE_SIZE, row * SQUARE_SIZE,
    SQUARE_SIZE, SQUARE_SIZE)
}

function clearSquare(row, column) {
  // Need to do some math to account for the 1px stroke that was added.
  ctx.clearRect(column * SQUARE_SIZE - 1, row * SQUARE_SIZE - 1,
    SQUARE_SIZE + 2, SQUARE_SIZE + 2)
}

function initializeBoard() {
  for(let row = 0; row < NUM_ROWS; row++) {
    board[row] = new Array(NUM_COLUMNS);
    for(let col = 0; col < NUM_COLUMNS; col++) {
      board[row][col] = EMPTY;
      drawSquare(row, col, EMPTY);
    }
  }
}

function drawBoard() {
  for(let r = 0; r < NUM_ROWS; r++) {
    for(let c = 0; c < NUM_COLUMNS; c++) {
      drawSquare(r, c, board[r][c])
    }
  }
}

function updateScoreHtml() {
  scoreDiv = document.getElementById("score");
  scoreDiv.innerHTML = `${score}`;
}

function rotateMatrix(matrix) {
  // First transpose the matrix
  transposedMatrix = new Array(matrix.length);
  for(let x = 0; x < matrix.length; x++) {
    transposedMatrix[x] = new Array(matrix.length);
  }

  for(let x = 0; x < matrix.length; x++) {
    for(let y = 0; y < matrix.length; y++) {
      transposedMatrix[y][x] = matrix[x][y];
    }
  }

  // Then reverse the newly transposed matrix
  reversedMatrix = new Array(matrix.length);
  for(let x = 0; x < matrix.length; x++) {
    reversedMatrix[x] = new Array(matrix.length);
  }

  for(let x= 0; x < matrix.length; x++) {
    for(let y = 0; y < matrix.length; y++) {
      reversedMatrix[x][y] = transposedMatrix[x][matrix.length-1-y]
    }
  }

  // reversedMatrix is now rotated 90 degrees from original matrix.
  return reversedMatrix;
}

// check to see if a row is full. Sweep the row and update the score if it is.
function sweep() {
  for(let row = 0; row < NUM_ROWS; row++) {
    const isRowFull = board[row].every(function(value) {
        return value != EMPTY;
      });

    if(isRowFull) {
      board.splice(row, 1);
      let newRow = new Array(NUM_COLUMNS)
      for(let col = 0; col < NUM_COLUMNS; col++) {
        newRow[col] = EMPTY;
      }
      board.unshift(newRow);
      drawBoard();

      // Increment score and update it in HTML.
      score += NUM_COLUMNS;
      updateScoreHtml();
    }
  }
}


class Tetromino {
  constructor(matrix, color, row, column) {
    this.matrix = matrix;
    this.color = color;
    this.row = row;
    this.column = column;
  }

  // draw tetromino on the canvas
  draw() {
    for(let x = 0; x < this.matrix.length; x++) {
      for(let y = 0; y < this.matrix.length; y++) {
        if(this.matrix[x][y] == 1) {
          drawSquare(this.row+x, this.column+y, this.color);
        }
      }
    }
  }

  // clears squares
  clear() {
    for(let x = 0; x < this.matrix.length; x++) {
      for(let y = 0; y < this.matrix.length; y++) {
        if(this.matrix[x][y]) {
          board[this.row+x][this.column+y] = EMPTY;
          drawSquare(this.row+x, this.column+y, EMPTY);
        }
      }
    }
  }

  // check to see if tetromino has reached the maximum bottom it can reach
  // This could be hitting the bottom wall, or hitting other locked tetrominoes.
  hasReachedMaximumBottom() {
    for(let x = 0; x < this.matrix.length; x++) {
      for(let y = 0; y < this.matrix.length; y++) {
        if(this.matrix[x][y]) {
          if(this.row+x+1 == NUM_ROWS ||
             board[this.row+x+1][this.column+y] != EMPTY) {
            return true;
          }
        }
      }
    }
  }

  // check to see if tetromino has reached the maximum left it can reach
  // This could be hitting the left wall, or hitting other locked tetrominoes
  // on left.
  hasReachedMaximumLeft() {
    for(let x = 0; x < this.matrix.length; x++) {
      for(let y = 0; y < this.matrix.length; y++){
        if(this.matrix[x][y] == 1) {
          if(this.column + y == 0) {
            //has hit left wall
            return true;
          }

          if(board[this.row+x][this.column + y -1] != EMPTY) {
            // has hit other tetromino on it's left.
            return true;
          }
        }
      }
    }
    return false;
  }


  // check to see if tetromino has reached the maximum right it can reach
  // This could be hitting the right wall, or hitting other locked tetrominoes
  // on left.
  hasReachedMaximumRight() {
    for(let x = 0; x < this.matrix.length; x++) {
      for(let y = 0; y < this.matrix.length; y++){
        if(this.matrix[x][y] == 1) {
          if(this.column + y + 1 == NUM_COLUMNS) {
            // hit the right wall
            return true;
          }

          if(board[this.row+x][this.column + y + 1] != EMPTY) {
            // hit another locked tetromino to it's right.
            return true;
          }
        }
      }
    }
    return false;
  }


  // locked the tetromino to the board
  lock() {
    for(let x = 0; x < this.matrix.length; x++) {
      for(let y = 0; y < this.matrix.length; y++) {
        if(this.matrix[x][y] == 1) {
          board[this.row+x][this.column+y] = this.color;
        }
      }
    }
  }

  // move the tetromino down if possible
  moveDown() {
    this.clear();
    this.row = this.row + 1;
    this.draw();
    if(this.hasReachedMaximumBottom()) {
      //lock tetromino to board
      this.lock();
      // sweep and update score if a row is full.
      sweep();
      //set active tetromino to null
      activeTetromino = null;
    }
  }

  // move the tetromino to the left if possible
  moveLeft() {
    if(!this.hasReachedMaximumLeft()) {
      this.clear();
      this.column = this.column - 1;
      this.draw();
    }
  }

  // move the tetromino to the right if possible
  moveRight() {
    if(!this.hasReachedMaximumRight()) {
      this.clear();
      this.column = this.column + 1;
      this.draw()
    }
  }

  // check to see if the matrix can be rotated without hitting
  // walls or other tetrominoes.
  canRotate(matrix) {
    for(let x = 0; x < matrix.length; x++) {
      for(let y = 0; y < matrix.length; y++) {
        if(matrix[x][y] == 1) {
          //check left wall
          if(this.column + y < 0) {
            // can't rotate because of left wall.
            return false;
          }
          if(this.column + y >= NUM_COLUMNS) {
            //can't rotate because of right wall.
            return false;
          }
          if(board[this.row+x][this.column+y] != EMPTY) {
            //can't rotate because the square required for rotation is already occupied.
            return false;
          }
        }
      }
    }
    return true;
  }

  rotate() {
    let rotatedMatrix = rotateMatrix(this.matrix);
    if(this.canRotate(rotatedMatrix)) {
      this.clear();
      this.matrix = rotatedMatrix;
      console.log(`matrix: ${this.matrix} rotatedMatrix: ${rotatedMatrix}`)
      this.draw();
    }
  }
}

function handleKeyDown(event) {
  if(activeTetromino) {
    if(event.keyCode == 37) {
      activeTetromino.moveLeft();
    } else if (event.keyCode == 38) {
      activeTetromino.rotate();
    } else if(event.keyCode == 39) {
      activeTetromino.moveRight();
    } else if(event.keyCode == 40) {
      activeTetromino.moveDown();
    }
  }
}

let lastDropTime = Date.now();
function gameLoop() {
  let now = Date.now();
  if (now - lastDropTime >= DROP_INTERVAL) {
    lastDropTime = now;
    if (activeTetromino) {
      //There is currently an active tetrino, just move it down.
      activeTetromino.moveDown();
    } else {
      //choose a random tetromino
      const index = Math.floor(Math.random() * tetrominoShapes.length);

      activeTetromino = new Tetromino(tetrominoShapes[index][0], tetrominoShapes[index][1],
        TETRINO_START_ROW, TETRINO_START_COLUMN);
      activeTetromino.draw();
      if(activeTetromino.hasReachedMaximumBottom()) {
        // game over
        ctx.fillStyle = GAME_OVER_COLOR;
        ctx.font = GAME_OVER_FONT;
        ctx.fillText('Game Over', 10, 200);
        cancelAnimationFrame(gameLoop);
        return;
      }
    }
  }
  requestAnimationFrame(gameLoop);
}

function main() {
  initializeBoard();
  gameLoop();
}

main();
