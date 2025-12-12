// 取得元素
const cells = Array.from(document.querySelectorAll(".cell"));
const btnReset = document.getElementById("reset");
const turnEl = document.getElementById("turn");
const stateEl = document.getElementById("state");
const modal = document.getElementById("result-modal");
const modalMsg = document.getElementById("modal-msg");
const modalBtn = document.getElementById("modal-btn");
const scoreXEl = document.getElementById("score-x");
const scoreOEl = document.getElementById("score-o");
const scoreDrawEl = document.getElementById("score-draw");
const btnResetScore = document.getElementById("reset-score");

// 新增：取得難度選單
const difficultyEl = document.getElementById("difficulty");

// 遊戲狀態
let board;
let current; 
let active;  
let scores = { x: 0, o: 0, draw: 0 };

const WIN_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

function init(){
  board = Array(9).fill(''); 
  current = 'X';             
  active = true;

  cells.forEach(c=>{
    c.textContent = '';
    c.className = "cell";
    c.disabled = false;
  });

  updateStatus("輪到玩家 (X)"); 
  stateEl.textContent = "";
  if(modal) modal.classList.remove("show");
}

function updateStatus(msg) {
    turnEl.textContent = msg;
}

// 判斷勝負 (修改讓 Minimax 也能共用)
function checkWinner(currentBoard) {
  for(const line of WIN_LINES){
    const [a,b,c] = line;
    if(currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]){
      return currentBoard[a]; // 回傳 'X' 或 'O'
    }
  }
  return null;
}

// 判斷是否平手/結束
function evaluate(){
    const winner = checkWinner(board);
    const line = WIN_LINES.find(l => {
        const [a,b,c] = l;
        return board[a] && board[a] === board[b] && board[a] === board[c];
    });

    if(winner) return { finished:true, winner: winner, line: line };
    if(board.every(v=>v)) return { finished:true, winner:null };
    return { finished:false };
}

// --- 普通難度邏輯 (講義版) ---
function findWinningMove(player) {
    for (let line of WIN_LINES) {
        const [a, b, c] = line;
        const currentLine = [board[a], board[b], board[c]];
        if (currentLine.filter(v => v === player).length === 2 && currentLine.includes('')) {
            const emptyIndexInLine = currentLine.indexOf('');
            return line[emptyIndexInLine];
        }
    }
    return null; 
}

function getRandomMove() {
    const emptyIndices = board.map((v, i) => v === '' ? i : null).filter(v => v !== null);
    if (emptyIndices.length === 0) return null;
    return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
}

// --- 無敵難度邏輯 (Minimax) ---
// Minimax 核心演算法
function minimax(newBoard, depth, isMaximizing) {
    let winner = checkWinner(newBoard);
    if (winner === 'O') return 10 - depth; // 電腦贏 (分數越高越好，越快贏越好)
    if (winner === 'X') return depth - 10; // 玩家贏 (分數越低越好)
    if (!newBoard.includes('')) return 0;  // 平手

    if (isMaximizing) { // 電腦的回合 (找最大分)
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (newBoard[i] === '') {
                newBoard[i] = 'O';
                let score = minimax(newBoard, depth + 1, false);
                newBoard[i] = ''; // Backtrack (復原)
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else { // 玩家的回合 (模擬玩家會選對電腦最不利的，找最小分)
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (newBoard[i] === '') {
                newBoard[i] = 'X';
                let score = minimax(newBoard, depth + 1, true);
                newBoard[i] = ''; // Backtrack
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

// 取得 Minimax 最佳步
function getBestMoveMinimax() {
    let bestScore = -Infinity;
    let move = null;
    
    // 遍歷所有空格，計算 Minimax 分數
    for (let i = 0; i < 9; i++) {
        if (board[i] === '') {
            board[i] = 'O';
            let score = minimax(board, 0, false);
            board[i] = ''; // 復原
            
            if (score > bestScore) {
                bestScore = score;
                move = i;
            }
        }
    }
    return move;
}

// --- 電腦決策中心 ---
function computerMove() {
    if (!active) return;

    let move = null;
    const difficulty = difficultyEl.value; // 讀取選單值

    if (difficulty === 'hard') {
        // === 模式 2: 無敵 (Minimax) ===
        // 為了優化效能，第一步如果中間是空的直接搶中間，不用跑遞迴
        if (board.filter(x => x !== '').length <= 1 && board[4] === '') {
            move = 4;
        } else {
            move = getBestMoveMinimax();
        }

    } else {
        // === 模式 1: 普通 (講義邏輯) ===
        // 1. 贏
        move = findWinningMove('O');
        // 2. 擋
        if (move === null) move = findWinningMove('X');
        // 3. 隨機
        if (move === null) move = getRandomMove();
    }

    // 執行落子
    if (move !== null) {
        executeMove(move, 'O');
    }
}

// 執行落子 (共用)
function executeMove(idx, player) {
    board[idx] = player;
    const cell = cells[idx];
    cell.textContent = player;
    cell.classList.add(player.toLowerCase());
    cell.disabled = true; 

    const result = evaluate();

    if(result.finished){
        endGame(result);
    } else {
        current = (current === 'X') ? 'O' : 'X';
        
        if (current === 'O') {
            updateStatus("電腦思考中..."); 
            active = false; 
            // 根據難度決定思考時間，Minimax 運算需要一點時間，延遲可設短一點
            setTimeout(() => {
                active = true; 
                computerMove();
            }, 500); 
        } else {
            updateStatus("輪到玩家 (X)"); 
        }
    }
}

function place(idx){
    if(!active || board[idx] !== '' || current !== 'X') return;
    executeMove(idx, 'X');
}

function endGame({winner, line}){
  active = false;
  let message = "";

  if(winner){
    const winnerName = (winner === 'X') ? "玩家 (X)" : "電腦 (O)";
    message = `${winnerName} 勝利！`;
    stateEl.textContent = message;
    line.forEach(i => cells[i].classList.add("win"));
    
    if(winner === 'X') scores.x++;
    else scores.o++;
    
  }else{
    message = "平手！"; 
    stateEl.textContent = message;
    scores.draw++;
  }

  updateScoreboard();
  
  if(modal) {
    setTimeout(() => {
        if(modalMsg) modalMsg.textContent = message;
        modal.classList.add("show");
    }, 500);
  }
}

function updateScoreboard() {
  if(scoreXEl) scoreXEl.textContent = scores.x;
  if(scoreOEl) scoreOEl.textContent = scores.o;
  if(scoreDrawEl) scoreDrawEl.textContent = scores.draw;
}

function resetScores() {
  if(!confirm("確定要將戰績歸零嗎？")) return;
  scores = { x: 0, o: 0, draw: 0 };
  updateScoreboard();
}

cells.forEach(cell=>{
  cell.addEventListener("click", ()=>{
    const idx = +cell.getAttribute("data-idx");
    place(idx);
  });
});

if(btnReset) btnReset.addEventListener("click", init);
if(modalBtn) modalBtn.addEventListener("click", init);
if(btnResetScore) btnResetScore.addEventListener("click", resetScores);

// 當難度切換時，自動重開局，避免邏輯錯亂
difficultyEl.addEventListener("change", init);

init();
