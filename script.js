(() => {
  const LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6],            // diagonals
  ];

  const boardEl = document.getElementById("board");
  const statusEl = document.getElementById("status");
  const difficultyEl = document.getElementById("difficulty");
  const difficultyWrap = document.getElementById("difficultyWrap");
  const labelX = document.getElementById("labelX");
  const labelO = document.getElementById("labelO");
  const scoreEls = {
    X: document.getElementById("scoreX"),
    O: document.getElementById("scoreO"),
    draw: document.getElementById("scoreDraw"),
  };

  // ---- Saved settings (localStorage) ----
  // Scores are kept separately for each mode so switching modes doesn't wipe them.

  const STORAGE_KEY = "tictactoe:v1";
  const DIFFICULTIES = ["easy", "medium", "hard"];
  const emptyScores = () => ({ X: 0, O: 0, draw: 0 });
  const cleanCount = (n) => (Number.isInteger(n) && n >= 0 ? n : 0);
  const cleanScores = (s) => ({
    X: cleanCount(s && s.X),
    O: cleanCount(s && s.O),
    draw: cleanCount(s && s.draw),
  });

  function loadSaved() {
    const saved = {
      mode: "cpu",
      difficulty: "medium",
      scores: { cpu: emptyScores(), pvp: emptyScores() },
    };
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (data && typeof data === "object") {
        if (data.mode === "cpu" || data.mode === "pvp") saved.mode = data.mode;
        if (DIFFICULTIES.includes(data.difficulty)) saved.difficulty = data.difficulty;
        saved.scores.cpu = cleanScores(data.scores && data.scores.cpu);
        saved.scores.pvp = cleanScores(data.scores && data.scores.pvp);
      }
    } catch (e) {
      // Storage unavailable or corrupted: fall back to defaults.
    }
    return saved;
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        mode: state.mode,
        difficulty: difficultyEl.value,
        scores: scoresByMode,
      }));
    } catch (e) {
      // Storage blocked or full: the game still works, just without saving.
    }
  }

  const saved = loadSaved();
  const scoresByMode = saved.scores;
  difficultyEl.value = saved.difficulty;

  const state = {
    board: Array(9).fill(null),
    turn: "X",
    over: false,
    mode: saved.mode,       // "cpu" or "pvp"
    starter: "X",           // who moves first this round (alternates)
    scores: scoresByMode[saved.mode],
  };

  // Build the 9 cells once.
  const cells = Array.from({ length: 9 }, (_, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cell";
    btn.setAttribute("role", "gridcell");
    btn.setAttribute("aria-label", `Square ${i + 1}, empty`);
    btn.addEventListener("click", () => humanMove(i));
    boardEl.appendChild(btn);
    return btn;
  });

  function winnerOf(board) {
    for (const line of LINES) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { player: board[a], line };
      }
    }
    return board.every(Boolean) ? { player: null, line: [] } : null;
  }

  const isCpuTurn = () => state.mode === "cpu" && state.turn === "O";

  function render() {
    state.board.forEach((mark, i) => {
      const cell = cells[i];
      cell.textContent = mark || "";
      cell.classList.toggle("x", mark === "X");
      cell.classList.toggle("o", mark === "O");
      cell.disabled = state.over || Boolean(mark) || isCpuTurn();
      cell.setAttribute("aria-label", `Square ${i + 1}, ${mark || "empty"}`);
    });
    scoreEls.X.textContent = state.scores.X;
    scoreEls.O.textContent = state.scores.O;
    scoreEls.draw.textContent = state.scores.draw;
  }

  function nameOf(player) {
    if (state.mode === "cpu") return player === "X" ? "You" : "Computer";
    return `Player ${player}`;
  }

  function setStatus() {
    if (state.over) return;
    if (state.mode === "cpu") {
      statusEl.textContent = state.turn === "X" ? "Your turn" : "Computer is thinking…";
    } else {
      statusEl.textContent = `Player ${state.turn}'s turn`;
    }
  }

  function place(i) {
    state.board[i] = state.turn;
    cells[i].classList.remove("placed");
    void cells[i].offsetWidth; // restart animation
    cells[i].classList.add("placed");

    const result = winnerOf(state.board);
    if (result) {
      state.over = true;
      if (result.player) {
        state.scores[result.player]++;
        result.line.forEach((idx) => cells[idx].classList.add("win"));
        const who = nameOf(result.player);
        statusEl.textContent = who === "You" ? "You win! 🎉" : `${who} wins!`;
      } else {
        state.scores.draw++;
        statusEl.textContent = "It's a draw.";
      }
      save();
    } else {
      state.turn = state.turn === "X" ? "O" : "X";
      setStatus();
    }
    render();

    if (!state.over && isCpuTurn()) {
      setTimeout(cpuMove, 450);
    }
  }

  function humanMove(i) {
    if (state.over || state.board[i] || isCpuTurn()) return;
    place(i);
  }

  // ---- Computer player ----

  function minimax(board, player, depth) {
    const result = winnerOf(board);
    if (result) {
      if (result.player === "O") return { score: 10 - depth };
      if (result.player === "X") return { score: depth - 10 };
      return { score: 0 };
    }
    let best = { score: player === "O" ? -Infinity : Infinity, index: -1 };
    for (let i = 0; i < 9; i++) {
      if (board[i]) continue;
      board[i] = player;
      const { score } = minimax(board, player === "O" ? "X" : "O", depth + 1);
      board[i] = null;
      if (player === "O" ? score > best.score : score < best.score) {
        best = { score, index: i };
      }
    }
    return best;
  }

  function randomMove(board) {
    const open = board.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
    return open[Math.floor(Math.random() * open.length)];
  }

  function pickCpuMove() {
    const level = difficultyEl.value;
    const board = state.board.slice();
    if (level === "easy") return randomMove(board);
    if (level === "medium" && Math.random() < 0.4) return randomMove(board);
    return minimax(board, "O", 0).index;
  }

  function cpuMove() {
    if (state.over || !isCpuTurn()) return;
    place(pickCpuMove());
  }

  // ---- Round / mode management ----

  function newRound({ alternate = true } = {}) {
    if (alternate) state.starter = state.starter === "X" ? "O" : "X";
    state.board = Array(9).fill(null);
    state.turn = state.starter;
    state.over = false;
    cells.forEach((c) => c.classList.remove("win", "placed"));
    setStatus();
    render();
    if (isCpuTurn()) setTimeout(cpuMove, 450);
  }

  function setMode(mode) {
    state.mode = mode;
    document.querySelectorAll(".mode").forEach((b) => {
      b.classList.toggle("active", b.dataset.mode === mode);
    });
    difficultyWrap.classList.toggle("hidden", mode !== "cpu");
    labelX.textContent = mode === "cpu" ? "You (X)" : "Player X";
    labelO.textContent = mode === "cpu" ? "Computer (O)" : "Player O";
    state.scores = scoresByMode[mode];
    state.starter = "X";
    save();
    newRound({ alternate: false });
  }

  document.querySelectorAll(".mode").forEach((b) => {
    b.addEventListener("click", () => setMode(b.dataset.mode));
  });
  difficultyEl.addEventListener("change", save);
  document.getElementById("newRound").addEventListener("click", () => newRound());
  document.getElementById("resetScores").addEventListener("click", () => {
    Object.assign(state.scores, emptyScores());
    state.starter = "X";
    save();
    newRound({ alternate: false });
  });

  setMode(state.mode);
})();
