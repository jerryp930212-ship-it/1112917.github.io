// 取得元素
const boardEl = document.getElementById("board");
const cells = Array.from(document.querySelectorAll(".cell"));
const btnReset = document.getElementById("reset");
const turnEl = document.getElementById("turn");
const stateEl = document.getElementById("state");
const modal = document.getElementById("result-modal");
const modalMsg = document.getElementById("modal-msg");
const modalBtn = document.getElementById("modal-btn");

// --- 新增：取得計分板元素 ---
const scoreXEl = document.getElementById("score-x");
const scoreOEl = document.getElementById("score-o");
const scoreDrawEl = document.getElementById("score-draw");

// 遊戲狀態變數
let board;
let current;
let active;

// --- 新增：紀錄分數變數 ---
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

// 初始化
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
  modal.classList.remove("show");
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

// --- 修改：更新分數邏輯 ---
function updateScoreboard() {
  scoreXEl.textContent = scores.x;
  scoreOEl.textContent = scores.o;
  scoreDrawEl.textContent = scores.draw;
}

// 結束遊戲
function endGame({winner, line}){
  active = false;
  let message = "";

  if(winner){
    message = `${winner} 勝利！`;
    stateEl.textContent = message;
    line.forEach(i => cells[i].classList.add("win"));
    
    // --- 新增：更新勝利者分數 ---
    if(winner === 'X') scores.x++;
    else scores.o++;
    
  }else{
    message = "平手！";
    stateEl.textContent = message;
    
    // --- 新增：更新平手分數 ---
    scores.draw++;
  }

  // --- 新增：呼叫更新畫面函數 ---
  updateScoreboard();

  cells.forEach(c => c.disabled = true);

  setTimeout(() => {
    modalMsg.textContent = message;
    modal.classList.add("show");
  }, 300);
}

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

cells.forEach(cell=>{
  cell.addEventListener("click", ()=>{
    const idx = +cell.getAttribute("data-idx");
    place(idx);
  });
});

btnReset.addEventListener("click", init);
modalBtn.addEventListener("click", init);

init();
