// 取得元素
const boardEl = document.getElementById("board");
const cells = Array.from(document.querySelectorAll(".cell"));
const btnReset = document.getElementById("reset");
const turnEl = document.getElementById("turn");
const stateEl = document.getElementById("state");

// 遊戲狀態變數
let board;
let current;
let active;

// 八種勝利線
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
}

// 換手
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

// 結束遊戲
function endGame({winner, line}){
  active = false;

  if(winner){
    stateEl.textContent = `${winner} 勝利！`;
    line.forEach(i => cells[i].classList.add("win"));
  }else{
    stateEl.textContent = `平手！`;
  }

  cells.forEach(c => c.disabled = true);
}

// 落子
function place(idx){
  if(!active || board[idx]) return;

  board[idx] = current;
  const cell = cells[idx];

  //cell.textContent = current;
  cell.setAttribute("data-mark", current);
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

// 啟動
init();
