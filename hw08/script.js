// 取得元素
const boardEl = document.getElementById("board");
const cells = Array.from(document.querySelectorAll(".cell"));
const btnReset = document.getElementById("reset");
const turnEl = document.getElementById("turn");
const stateEl = document.getElementById("state");

// --- 新增：取得彈窗相關元素 ---
const modal = document.getElementById("result-modal");
const modalMsg = document.getElementById("modal-msg");
const modalBtn = document.getElementById("modal-btn");

// 遊戲狀態變數
let board;
let current;
let active;

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

  // --- 新增：確保彈窗關閉 ---
  modal.classList.remove("show");
}

// 換手
function switchTurn(){
  current = (current === 'X') ? 'O' : 'X';
  turnEl.textContent = current;
}

// 判斷勝負 (維持原樣)
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

// 結束遊戲
function endGame({winner, line}){
  active = false;
  let message = "";

  if(winner){
    message = `${winner} 勝利！`;
    //stateEl.textContent = message; // 原本的文字提示保留或是拿掉都可以
    line.forEach(i => cells[i].classList.add("win"));
  }else{
    message = "平手！";
    stateEl.textContent = message;
  }

  cells.forEach(c => c.disabled = true);

  // --- 新增：延遲一點點跳出彈窗，體驗較好 ---
  setTimeout(() => {
    modalMsg.textContent = message;
    modal.classList.add("show");
  }, 300); // 0.3秒後跳出
}

// 落子 (維持原樣)
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

// 事件
cells.forEach(cell=>{
  cell.addEventListener("click", ()=>{
    const idx = +cell.getAttribute("data-idx");
    place(idx);
  });
});

btnReset.addEventListener("click", init);

// --- 新增：彈窗按鈕事件 ---
modalBtn.addEventListener("click", init);

// 啟動
init();
