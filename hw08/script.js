// 取得元素
const boardEl = document.getElementById("board");
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
const btnResetScore = document.getElementById("reset-score"); // 取得新按鈕

// 遊戲狀態變數
let board;
let current;
let active;

// 分數紀錄
let scores = {
  x: 0,
  o: 0,
  draw: 0
};

const WIN_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

// 初始化 (只重置盤面，不重置分數)
function init(){
  board = Array(9).fill('');
  current = 'X';
  active = true;

  cells.forEach(c=>{
    c.textContent = '';
    c.className = "cell";
    c.disabled = false;
  });

  turnEl.textContent = current;
  stateEl.textContent = "";
  
  // 隱藏彈窗
  if(modal) modal.classList.remove("show");
}

function switchTurn(){
  current = (current === 'X') ? 'O' : 'X';
  turnEl.textContent = current;
}

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

function updateScoreboard() {
  if(scoreXEl) scoreXEl.textContent = scores.x;
  if(scoreOEl) scoreOEl.textContent = scores.o;
  if(scoreDrawEl) scoreDrawEl.textContent = scores.draw;
}

// 重置分數函式
function resetScores() {
  if(!confirm("確定要將戰績歸零嗎？")) return;
  scores = { x: 0, o: 0, draw: 0 };
  updateScoreboard();
}

// 結束遊戲
function endGame({winner, line}){
  active = false;
  let message = "";

  if(winner){
    message = `${winner} 勝利！`;
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

  cells.forEach(c => c.disabled = true);

  if(modal) {
    setTimeout(() => {
        if(modalMsg) modalMsg.textContent = message;
        modal.classList.add("show");
    }, 300);
  }
}

// 落子
function place(idx){
  if(!active || board[idx]) return;

  board[idx] = current;
  const cell = cells[idx];

  cell.textContent = current;
  cell.classList.add(current.toLowerCase());

  const result = evaluate();
  if(result.finished){
    endGame(result);
  }else{
    switchTurn();
  }
}

// 事件綁定
cells.forEach(cell=>{
  cell.addEventListener("click", ()=>{
    const idx = +cell.getAttribute("data-idx");
    place(idx);
  });
});

// ★ 安全綁定：先確認按鈕存在才綁定事件，避免報錯 ★
if(btnReset) {
    btnReset.addEventListener("click", init);
} else {
    console.error("錯誤：找不到 id='reset' 的按鈕");
}

if(modalBtn) {
    modalBtn.addEventListener("click", init);
}

if(btnResetScore) {
    btnResetScore.addEventListener("click", resetScores);
} else {
    console.warn("警告：找不到 id='reset-score' 的按鈕，重置分數功能無法使用");
}

// 啟動
init();
