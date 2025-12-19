// --- 常數設定 ---
const SIZE = 8;
const BLACK = 1;
const WHITE = 2;
const DIRS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1]
];

// --- 權重矩陣 (進階 AI 用) ---
// 角落分數最高，角落旁邊分數極低(因為容易讓對方佔角)
const WEIGHTS = [
  [ 100, -20,  10,   5,   5,  10, -20, 100],
  [ -20, -50,  -2,  -2,  -2,  -2, -50, -20],
  [  10,  -2,  -1,  -1,  -1,  -1,  -2,  10],
  [   5,  -2,  -1,  -1,  -1,  -1,  -2,   5],
  [   5,  -2,  -1,  -1,  -1,  -1,  -2,   5],
  [  10,  -2,  -1,  -1,  -1,  -1,  -2,  10],
  [ -20, -50,  -2,  -2,  -2,  -2, -50, -20],
  [ 100, -20,  10,   5,   5,  10, -20, 100]
];

// --- 遊戲狀態 ---
let board = [];
let currentPlayer = BLACK; // 黑先 (玩家)
let isGameActive = false;
let isAnimating = false; // 避免動畫時玩家亂點

// --- DOM 元素 ---
const boardEl = document.getElementById('board');
const scoreBlackEl = document.getElementById('score-black');
const scoreWhiteEl = document.getElementById('score-white');
const pBlackEl = document.getElementById('p-black');
const pWhiteEl = document.getElementById('p-white');
const msgEl = document.getElementById('msg-area');
const difficultyEl = document.getElementById('difficulty');
const modal = document.getElementById('result-modal');
const modalMsg = document.getElementById('modal-msg');

// --- 初始化 ---
function init() {
  // 建立 8x8 空棋盤
  board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  
  [cite_start]// 初始四顆子 [cite: 337-344]
  const m = SIZE / 2;
  board[m-1][m-1] = WHITE;
  board[m][m]     = WHITE;
  board[m-1][m]   = BLACK;
  board[m][m-1]   = BLACK;

  currentPlayer = BLACK;
  isGameActive = true;
  isAnimating = false;

  renderBoard(); // 繪製初始盤面
  updateUI();
  modal.classList.remove('show');
  
  // 計算並顯示初始合法步
  showLegalMoves();
}

// --- 繪製棋盤 (僅在初始化時完整繪製 HTML) ---
function renderBoard() {
  boardEl.innerHTML = '';
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.r = r;
      cell.dataset.c = c;
      cell.onclick = () => handleCellClick(r, c);
      
      // 如果該格有子，放入棋子 DOM
      if (board[r][c] !== 0) {
        addDiscToCell(cell, board[r][c]);
      }
      boardEl.appendChild(cell);
    }
  }
}

// 在格子裡產生 3D 棋子結構
function addDiscToCell(cell, type) {
  const disc = document.createElement('div');
  disc.className = `disc ${type === WHITE ? 'is-white' : 'is-black'}`;
  
  const front = document.createElement('div');
  front.className = 'face front'; // 黑面
  const back = document.createElement('div');
  back.className = 'face back';   // 白面
  
  disc.appendChild(front);
  disc.appendChild(back);
  cell.appendChild(disc);
}

// --- 邏輯核心 ---
function isValidPos(r, c) {
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE;
}

[cite_start]// 取得某步可翻轉的棋子列表 [cite: 353-370]
function getFlips(r, c, player) {
  if (board[r][c] !== 0) return []; // 已經有子
  const opponent = player === BLACK ? WHITE : BLACK;
  let flips = [];

  for (const [dr, dc] of DIRS) {
    let tr = r + dr, tc = c + dc;
    let line = [];
    while (isValidPos(tr, tc) && board[tr][tc] === opponent) {
      line.push({ r: tr, c: tc });
      tr += dr;
      tc += dc;
    }
    // 如果這條線的盡頭是己方棋子，則這條線有效
    if (line.length > 0 && isValidPos(tr, tc) && board[tr][tc] === player) {
      flips = flips.concat(line);
    }
  }
  return flips;
}

// 取得所有合法步
function getAllLegalMoves(player) {
  let moves = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const flips = getFlips(r, c, player);
      if (flips.length > 0) {
        moves.push({ r, c, flips });
      }
    }
  }
  return moves;
}

// --- 玩家點擊處理 ---
async function handleCellClick(r, c) {
  if (!isGameActive || isAnimating || currentPlayer !== BLACK) return;

  const flips = getFlips(r, c, BLACK);
  if (flips.length === 0) return; // 非法步

  await executeMove(r, c, BLACK, flips);
}

// --- 執行下棋動作 (含動畫) ---
async function executeMove(r, c, player, flips) {
  isAnimating = true;

  // 1. 放置新棋子
  board[r][c] = player;
  const cell = document.querySelector(`.cell[data-r='${r}'][data-c='${c}']`);
  // 移除所有提示點
  document.querySelectorAll('.cell.valid').forEach(el => el.classList.remove('valid'));
  
  addDiscToCell(cell, player);
  cell.querySelector('.disc').classList.add('new'); // 落子動畫

  // 2. 依序翻轉動畫 (題目要求)
  await flipPiecesSequentially(flips, player);

  // 3. 更新分數與換手
  updateUI();
  
  // 4. 檢查下一步
  const opponent = player === BLACK ? WHITE : BLACK;
  const opponentMoves = getAllLegalMoves(opponent);
  
  if (opponentMoves.length > 0) {
    currentPlayer = opponent;
    updateUI();
    isAnimating = false;
    
    // 如果輪到電腦，觸發電腦下棋
    if (currentPlayer === WHITE) {
      setTimeout(computerTurn, 800);
    } else {
      showLegalMoves(); // 輪回玩家，顯示提示
    }
  } else {
    // 對手沒步可走，檢查自己有沒有步
    const myMoves = getAllLegalMoves(player);
    if (myMoves.length > 0) {
      msgEl.textContent = `${opponent === BLACK ? "黑" : "白"}棋無步可走，繼續輪到${player === BLACK ? "黑" : "白"}棋`;
      isAnimating = false;
      if (player === WHITE) setTimeout(computerTurn, 1000); // 電腦連下
      else showLegalMoves();
    } else {
      // 雙方都沒步，結束
      endGame();
    }
  }
}

// --- 依序翻轉動畫函式 ---
async function flipPiecesSequentially(flips, player) {
  // 將邏輯盤面更新
  flips.forEach(pt => board[pt.r][pt.c] = player);

  // 視覺上一顆一顆翻
  for (const pt of flips) {
    const disc = document.querySelector(`.cell[data-r='${pt.r}'][data-c='${pt.c}'] .disc`);
    if (disc) {
      // 透過 class 控制 CSS rotateY
      if (player === WHITE) {
        disc.classList.remove('is-black');
        disc.classList.add('is-white');
      } else {
        disc.classList.remove('is-white');
        disc.classList.add('is-black');
      }
    }
    // 等待 150ms 再翻下一顆
    await new Promise(resolve => setTimeout(resolve, 150));
  }
}

// --- AI 電腦邏輯 ---
function computerTurn() {
  if (!isGameActive) return;

  const difficulty = difficultyEl.value;
  const moves = getAllLegalMoves(WHITE);
  
  if (moves.length === 0) return; // 理論上在 executeMove 已檢查過，這裡防呆

  let bestMove = null;

  if (difficulty === 'easy') {
    // === 基本棋力：貪婪 (找翻最多的) ===
    moves.sort((a, b) => b.flips.length - a.flips.length);
    bestMove = moves[0];
  } else {
    // === 進階棋力：Minimax (權重 + 預測) ===
    // 這裡為了效能，我們簡化為 "搜尋深度=1 + 位置權重評估"
    // 如果要更強，可以實作完整的 Minimax 遞迴
    let maxScore = -Infinity;
    
    for (const move of moves) {
      // 1. 基礎權重 (這個位置本身好不好)
      let score = WEIGHTS[move.r][move.c];
      
      // 2. 數量權重 (吃幾顆)
      score += move.flips.length;

      // 3. 安全性評估 (如果這一步讓對手能佔角落，扣大分)
      // (這裡做一個簡單模擬)
      // 假設我下這裡，對手下一輪有沒有可能佔角?
      // 略... 為了程式碼長度，先以權重表為主，權重表已經處理了 C-squares / X-squares 問題
      
      if (score > maxScore) {
        maxScore = score;
        bestMove = move;
      }
    }
  }

  // 執行電腦落子
  executeMove(bestMove.r, bestMove.c, WHITE, bestMove.flips);
}

// --- UI 更新輔助 ---
function showLegalMoves() {
  const moves = getAllLegalMoves(BLACK);
  moves.forEach(m => {
    const cell = document.querySelector(`.cell[data-r='${m.r}'][data-c='${m.c}']`);
    cell.classList.add('valid');
  });
}

function updateUI() {
  // 計算分數
  let b = 0, w = 0;
  for(let r=0; r<SIZE; r++)
    for(let c=0; c<SIZE; c++)
      if(board[r][c]===BLACK) b++;
      else if(board[r][c]===WHITE) w++;
  
  scoreBlackEl.innerText = b;
  scoreWhiteEl.innerText = w;

  // 亮起當前玩家
  if (currentPlayer === BLACK) {
    pBlackEl.classList.add('active');
    pWhiteEl.classList.remove('active');
    msgEl.textContent = "輪到玩家 (黑) 下棋";
  } else {
    pWhiteEl.classList.add('active');
    pBlackEl.classList.remove('active');
    msgEl.textContent = "電腦 (白) 思考中...";
  }
}

function endGame() {
  isGameActive = false;
  const b = parseInt(scoreBlackEl.innerText);
  const w = parseInt(scoreWhiteEl.innerText);
  
  let msg = `黑棋: ${b} - 白棋: ${w}<br>`;
  if (b > w) msg += "恭喜！你贏了！";
  else if (w > b) msg += "電腦獲勝，再接再厲！";
  else msg += "勢均力敵，平手！";

  modalMsg.innerHTML = msg;
  modal.classList.add('show');
}

// --- 事件綁定 ---
document.getElementById('reset').addEventListener('click', init);
document.getElementById('modal-btn').addEventListener('click', init);
// 切換難度重開
difficultyEl.addEventListener('change', init);

// 啟動遊戲
init();
