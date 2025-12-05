// 取得元素
const boardEl = document.getElementById("board");
const cells = Array.from(document.querySelectorAll(".cell"));
const btnReset = document.getElementById("reset");
const turnEl = document.getElementById("turn");
const stateEl = document.getElementById("state");
const modal = document.getElementById("result-modal");
const modalMsg = document.getElementById("modal-msg");
const modalBtn = document.getElementById("modal-btn");

// 計分板與新按鈕
const scoreXEl = document.getElementById("score-x");
const scoreOEl = document.getElementById("score-o");
const scoreDrawEl = document.getElementById("score-draw");
const btnResetScore = document.getElementById("reset-score"); // <--- 新增：取得重置分數按鈕

// 遊戲狀態變數
let board;
let current;
let active;

// 分數紀錄 (這行必須放在 init 函式外面！)
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

// 初始化 (重開一局)
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
  
  // ★重要：請確認這裡面「沒有」重置 scores 的程式碼
}

// 切換玩家
function switchTurn(){
  current = (current === 'X') ? 'O' : 'X';
  turnEl.textContent = current;
}

// 判斷勝負
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

// 更新畫面上的分數
function updateScoreboard() {
  scoreXEl.textContent = scores.x;
  scoreOEl.textContent = scores.o;
  scoreDrawEl.textContent = scores.draw;
}

// ▼▼▼ 新增：專門用來重置分數的函式 ▼▼▼
function resetScores() {
  // 詢問玩家是否確定 (選用，避免誤按)
  if(!confirm("確定要將戰績歸零嗎？")) return;

  scores = { x: 0, o: 0, draw: 0 };
  updateScoreboard();
}
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

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

  setTimeout(() => {
    modalMsg.textContent = message;
    modal.classList.add("show");
  }, 300);
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

btnReset.addEventListener("click", init);
modalBtn.addEventListener("click", init);

// ▼▼▼ 新增：綁定重置分數按鈕 ▼▼▼
btnResetScore.addEventListener("click", resetScores);
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

// 啟動
init();
