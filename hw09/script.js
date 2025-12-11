// 取得元素
const cells = Array.from(document.querySelectorAll(".cell"));
const btnReset = document.getElementById("reset");
const turnEl = document.getElementById("turn");
const stateEl = document.getElementById("state");
const modal = document.getElementById("result-modal");
const modalMsg = document.getElementById("modal-msg");
const modalBtn = document.getElementById("modal-btn");

// 計分板元素
const scoreXEl = document.getElementById("score-x");
const scoreOEl = document.getElementById("score-o");
const scoreDrawEl = document.getElementById("score-draw");
const btnResetScore = document.getElementById("reset-score");

// 遊戲狀態
let board;
let current; // 'X' 是玩家, 'O' 是電腦
let active;  // 控制遊戲是否進行中
let scores = { x: 0, o: 0, draw: 0 };

// 勝利線組合 [cite: 167-169]
const WIN_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

// 初始化
function init(){
  board = Array(9).fill(''); // [cite: 93]
  current = 'X';             // [cite: 94] 玩家先手
  active = true;

  cells.forEach(c=>{
    c.textContent = '';
    c.className = "cell";
    c.disabled = false;
  });

  updateStatus("輪到玩家 (X)"); // [cite: 159]
  stateEl.textContent = "";
  if(modal) modal.classList.remove("show");
}

function updateStatus(msg) {
    turnEl.textContent = msg;
}

// 判斷勝負 (保留原本寫法，因為它能回傳連線資訊供顯示)
function evaluate(){
  for(const line of WIN_LINES){
    const [a,b,c] = line;
    if(board[a] && board[a] === board[b] && board[a] === board[c]){
      return { finished:true, winner:board[a], line };
    }
  }
  if(board.every(v=>v)) return { finished:true, winner:null };
  return { finished:false };
}

// 尋找最佳的一步 (AI 核心邏輯) 
function findWinningMove(player) {
    for (let line of WIN_LINES) {
        const [a, b, c] = line;
        const currentLine = [board[a], board[b], board[c]];
        // 如果這一條線有 2 個是 player 且 1 個是空位 [cite: 172]
        if (currentLine.filter(v => v === player).length === 2 && currentLine.includes('')) {
            // 回傳那個空位的 index
            const emptyIndexInLine = currentLine.indexOf('');
            return line[emptyIndexInLine];
        }
    }
    return null; // [cite: 174]
}

// 取得隨機空格 [cite: 178]
function getRandomMove() {
    const emptyIndices = board.map((v, i) => v === '' ? i : null).filter(v => v !== null);
    if (emptyIndices.length === 0) return null;
    return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
}

// 電腦下棋 [cite: 138]
function computerMove() {
    if (!active) return;

    // 1. 嘗試自己獲勝 (找 O 的連線) [cite: 139-140]
    let move = findWinningMove('O');

    // 2. 嘗試阻止玩家獲勝 (找 X 的連線) [cite: 141-142]
    if (move === null) {
        move = findWinningMove('X');
    }

    // 3. 否則隨機下 [cite: 143-144]
    if (move === null) {
        move = getRandomMove();
    }

    // 電腦落子
    if (move !== null) {
        executeMove(move, 'O');
    }
}

// 執行落子動作 (玩家與電腦共用)
function executeMove(idx, player) {
    board[idx] = player;
    const cell = cells[idx];
    cell.textContent = player;
    cell.classList.add(player.toLowerCase());
    cell.disabled = true; // 下過的地方不能再點

    const result = evaluate();

    if(result.finished){
        endGame(result);
    } else {
        // 交換變數狀態
        current = (current === 'X') ? 'O' : 'X';
        
        if (current === 'O') {
            // 如果輪到電腦
            updateStatus("電腦思考中..."); // [cite: 133]
            active = false; // 鎖定盤面，避免玩家在電腦思考時亂點
            setTimeout(() => {
                active = true; // 解鎖
                computerMove();
            }, 700); // 延遲 700ms 
        } else {
            // 如果輪到玩家
            updateStatus("輪到玩家 (X)"); // [cite: 159]
        }
    }
}

// 玩家點擊事件 [cite: 121]
function place(idx){
    // 檢查: 遊戲是否進行中、格子是否為空、是否輪到玩家(X)
    if(!active || board[idx] !== '' || current !== 'X') return;
    
    executeMove(idx, 'X');
}

// 結束遊戲
function endGame({winner, line}){
  active = false;
  let message = "";

  if(winner){
    // [cite: 153] 電腦獲勝顯示邏輯
    const winnerName = (winner === 'X') ? "玩家 (X)" : "電腦 (O)";
    message = `${winnerName} 勝利！`;
    stateEl.textContent = message;
    line.forEach(i => cells[i].classList.add("win"));
    
    if(winner === 'X') scores.x++;
    else scores.o++;
    
  }else{
    message = "平手！"; // [cite: 156]
    stateEl.textContent = message;
    scores.draw++;
  }

  updateScoreboard();
  
  // 顯示彈窗
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

// 事件綁定
cells.forEach(cell=>{
  cell.addEventListener("click", ()=>{
    const idx = +cell.getAttribute("data-idx");
    place(idx);
  });
});

if(btnReset) btnReset.addEventListener("click", init);
if(modalBtn) modalBtn.addEventListener("click", init);
if(btnResetScore) btnResetScore.addEventListener("click", resetScores);

// 啟動
init();
