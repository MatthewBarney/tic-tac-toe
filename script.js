// =====================================================================
// script.js - the BEHAVIOR of the game
// =====================================================================
// JavaScript is a programming language: a way of writing step-by-step
// instructions that the browser follows. index.html decides what is on the
// page and style.css decides how it looks. This file decides what HAPPENS:
// what a click does, whose turn it is, how the computer picks its move, and
// who has won.
//
// A few words you will see over and over:
//
//   * A "comment" is a note for humans. In JavaScript, everything after two
//     slashes (//) on a line is ignored by the browser. That is what you are
//     reading right now.
//   * A "variable" is a named box that holds a value, like a labeled jar.
//     "const" creates a jar whose label can never be moved to a different
//     jar. (The contents of the jar can sometimes still change, which you
//     will see later with lists and objects.) "let" creates a jar that can
//     be re-pointed later.
//   * A "function" is a reusable recipe: a named set of steps you can run
//     whenever you like by "calling" it, which means writing its name
//     followed by parentheses, like save(). A function can be given values
//     to work with, called "arguments" or "parameters", written inside the
//     parentheses, and it can "return" an answer.
//   * A "string" is text, written inside quote marks, like "X".
//   * A "boolean" is a value that is either true or false.
//   * An "array" (or "list") is an ordered collection of values written in
//     square brackets, like [10, 20, 30]. Each item has a position number
//     called an "index", and counting starts at 0, so 10 is at index 0.
//   * An "object" is a collection of labeled values written in curly
//     braces, like { name: "Sam", age: 7 }. Each label is called a
//     "property" (or "key"), and you read it with a dot: person.name.
//   * An "if" statement means "do this only when a condition is true".
//   * A "loop" repeats steps, for example once for every item in a list.
//   * An "event" is something that happens on the page, such as a click.
//     An "event listener" is a function you attach to an element so that it
//     runs whenever that event happens.
//   * The "DOM" (Document Object Model) is the browser's live, in-memory
//     copy of the page's HTML. JavaScript can look things up in the DOM and
//     change them, and the change instantly shows on screen.
//   * "===" means "is exactly equal to". "&&" means "and", "||" means "or",
//     and "!" means "not".
// =====================================================================

// The next line begins "(() => {" and the very last line of the file is
// "})();". Together they wrap the whole program in a function that runs
// once, immediately. Why? Everything we create inside it stays private to
// this file, so our variable names can never accidentally clash with names
// used by other code on the same page. (This pattern is called an "IIFE",
// short for "immediately invoked function expression".)
(() => {
  // ---------------------------------------------------------------
  // THE RULES OF WINNING
  // ---------------------------------------------------------------
  // The board has 9 squares, numbered 0 to 8, like this:
  //
  //     0 | 1 | 2
  //     ---------
  //     3 | 4 | 5
  //     ---------
  //     6 | 7 | 8
  //
  // There are exactly 8 ways to win: three in a row, three in a column, or
  // three on a diagonal. LINES is an array of 8 smaller arrays, and each
  // small array lists the three square numbers that make one winning line.
  // For example [0, 1, 2] is the top row. Checking for a winner later just
  // means checking whether any of these 8 lines is filled with the same
  // mark.
  const LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6],            // diagonals
  ];

  // ---------------------------------------------------------------
  // FINDING THE PIECES OF THE PAGE
  // ---------------------------------------------------------------
  // "document" is the browser's copy of the page (the DOM).
  // document.getElementById("board") means "find the one element in the
  // HTML whose id is board". We store each element in a variable so we can
  // change it later. The names end in "El" as a reminder that each one
  // holds an element. These ids match the ones written in index.html.
  const boardEl = document.getElementById("board");
  const statusEl = document.getElementById("status");
  const difficultyEl = document.getElementById("difficulty");
  const difficultyWrap = document.getElementById("difficultyWrap");
  const labelX = document.getElementById("labelX");
  const labelO = document.getElementById("labelO");
  // The three score numbers are grouped in one object so they can be
  // looked up by name later, for example scoreEls.X.
  const scoreEls = {
    X: document.getElementById("scoreX"),
    O: document.getElementById("scoreO"),
    draw: document.getElementById("scoreDraw"),
  };

  // ---- Saved settings (localStorage) ----
  // Scores are kept separately for each mode so switching modes doesn't wipe them.

  // "localStorage" is a small storage area built into every browser. A
  // website can save short pieces of text there, and they are still there
  // after the visitor refreshes the page or closes the browser. The data
  // stays on the visitor's own device and is not sent anywhere. We use it to
  // remember scores and settings. Each saved item needs a name (a "key") so
  // we can find it again, and STORAGE_KEY is that name. The ":v1" at the end
  // means "version 1", so if we ever change the format we can switch to a
  // new key without confusing old saved data.
  const STORAGE_KEY = "tictactoe:v1";
  // The only three difficulty settings that are allowed. Used later to check
  // that saved data has not been tampered with or damaged.
  const DIFFICULTIES = ["easy", "medium", "hard"];
  // A tiny function that gives back a fresh scoreboard with everything at
  // zero. The "=>" is a short way of writing a function: parameters on the
  // left, the answer on the right. Here there are no parameters, so the
  // left side is just (). The extra parentheses around the curly braces
  // tell JavaScript "this is an object to hand back", not the body of a
  // function.
  const emptyScores = () => ({ X: 0, O: 0, draw: 0 });
  // Checks that a value "n" is a safe score. Number.isInteger asks "is this
  // a whole number?". If it is a whole number that is 0 or more, we keep
  // it; otherwise we use 0. The "? :" pattern is a compact if/else called
  // the "ternary operator": condition ? valueIfTrue : valueIfFalse.
  const cleanCount = (n) => (Number.isInteger(n) && n >= 0 ? n : 0);
  // Uses cleanCount on each of the three numbers in a saved scoreboard. The
  // part "s && s.X" means "if s exists, use s.X"; this avoids a crash when
  // nothing was saved at all.
  const cleanScores = (s) => ({
    X: cleanCount(s && s.X),
    O: cleanCount(s && s.O),
    draw: cleanCount(s && s.draw),
  });

  // Reads previously saved settings from localStorage and hands them back.
  // If nothing was saved yet (the first visit), or the saved data is
  // damaged, it returns sensible starting values instead.
  function loadSaved() {
    // Start with the default settings. "cpu" means the computer plays
    // as O; "pvp" means two people play against each other ("player
    // versus player"). There is a separate scoreboard for each mode.
    const saved = {
      mode: "cpu",
      difficulty: "medium",
      scores: { cpu: emptyScores(), pvp: emptyScores() },
    };
    // "try { ... } catch { ... }" means "attempt these steps, and if
    // something goes wrong (an 'error'), jump to the catch part instead of
    // crashing the whole program". Reading storage can fail, for example if
    // the visitor has blocked it in a private window.
    try {
      // getItem returns the saved text, or nothing if there is none.
      // JSON.parse turns saved text back into real objects and arrays.
      // (JSON is a standard text format for storing structured data.)
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      // Only continue if we really got an object back.
      if (data && typeof data === "object") {
        // Copy over each saved value, but only if it is one of the allowed
        // choices. Anything unexpected is ignored and the default stays.
        if (data.mode === "cpu" || data.mode === "pvp") saved.mode = data.mode;
        if (DIFFICULTIES.includes(data.difficulty)) saved.difficulty = data.difficulty;
        saved.scores.cpu = cleanScores(data.scores && data.scores.cpu);
        saved.scores.pvp = cleanScores(data.scores && data.scores.pvp);
      }
    } catch (e) {
      // Storage unavailable or corrupted: fall back to defaults.
    }
    // Hand the settings back to whoever called this function.
    return saved;
  }

  // Writes the current mode, difficulty, and scores into localStorage. We
  // call this every time one of those things changes.
  function save() {
    try {
      // localStorage can only hold text, so JSON.stringify first turns our
      // object into text. setItem then stores that text under our key.
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        mode: state.mode,
        difficulty: difficultyEl.value,
        scores: scoresByMode,
      }));
    } catch (e) {
      // Storage blocked or full: the game still works, just without saving.
    }
  }

  // Run loadSaved() right now, once, as the page starts up.
  const saved = loadSaved();
  // The scoreboards for both modes, as loaded from storage.
  const scoresByMode = saved.scores;
  // Set the difficulty drop-down to the remembered choice.
  difficultyEl.value = saved.difficulty;

  // ---------------------------------------------------------------
  // THE GAME'S MEMORY ("state")
  // ---------------------------------------------------------------
  // "State" means everything the game needs to remember right now. This one
  // object holds it all, so the rest of the code can look here to know what
  // is going on.
  const state = {
    // The board: a list of 9 slots, one per square. Array(9).fill(null)
    // creates a list of 9 items that all start as "null", which is how
    // JavaScript says "nothing here". Later each slot becomes "X" or "O".
    board: Array(9).fill(null),
    // Whose turn it is right now: "X" or "O". X always begins the very
    // first round.
    turn: "X",
    // Has the current round finished (someone won, or it is a draw)?
    over: false,
    mode: saved.mode,       // "cpu" or "pvp"
    starter: "X",           // who moves first this round (alternates)
    // The scoreboard for the mode being played right now.
    scores: scoresByMode[saved.mode],
  };

  // ---------------------------------------------------------------
  // BUILDING THE BOARD
  // ---------------------------------------------------------------
  // Build the 9 cells once.
  // The HTML left the board empty on purpose. Here we create the nine
  // squares with code. Array.from({ length: 9 }, ...) runs the function
  // below once for each number i from 0 to 8, collecting the results into a
  // list we call "cells". The "_" is a conventional name for a parameter we
  // are not using.
  const cells = Array.from({ length: 9 }, (_, i) => {
    // Create a brand-new <button> element in memory (it is not on the page
    // yet).
    const btn = document.createElement("button");
    btn.type = "button";
    // Give it the class "cell" so style.css makes it look like a square.
    btn.className = "cell";
    // These next two lines describe the square to screen readers, which
    // read pages aloud for people who cannot see the screen. They will hear
    // for example "Square 5, empty". (Number i starts at 0, so we add 1 to
    // make people-friendly numbers starting at 1.) The backtick-quoted text
    // with ${...} is called a "template literal": it lets us drop a value
    // into the middle of a piece of text.
    btn.setAttribute("role", "gridcell");
    btn.setAttribute("aria-label", `Square ${i + 1}, empty`);
    // Attach an event listener: when this square is clicked, run humanMove
    // and tell it which square (i) was clicked. The function is written
    // later in this file, which is fine because it only runs after a click.
    btn.addEventListener("click", () => humanMove(i));
    // Put the finished button onto the page, inside the board box.
    boardEl.appendChild(btn);
    // Hand the button back so it is saved in the "cells" list. Now cells[4]
    // is the middle square, and so on.
    return btn;
  });

  // ---------------------------------------------------------------
  // CHECKING FOR A WINNER
  // ---------------------------------------------------------------
  // Looks at a board and answers one of three ways:
  //   * someone has won:    { player: "X" or "O", line: [the 3 squares] }
  //   * the board is full:  { player: null, line: [] }   (a draw)
  //   * the game goes on:   null                         (still playing)
  function winnerOf(board) {
    // "for ... of" is a loop: take each winning line from LINES, one at a
    // time, and run the steps inside.
    for (const line of LINES) {
      // "Destructuring": pull the three numbers out of the line and name
      // them a, b, and c. For the top row, a=0, b=1, c=2.
      const [a, b, c] = line;
      // Is square a filled, AND does it match square b, AND does it match
      // square c? If so, all three squares hold the same mark: a win.
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        // Report who won and which squares made the line.
        return { player: board[a], line };
      }
    }
    // No line was a winner. If every square is filled (board.every(Boolean)
    // checks that no slot is empty), it is a draw. Otherwise return null,
    // which means the game is still going.
    return board.every(Boolean) ? { player: null, line: [] } : null;
  }

  // Answers true when it is the computer's turn: we are in computer mode
  // and the current player is O. (The human always plays X against the
  // computer.)
  const isCpuTurn = () => state.mode === "cpu" && state.turn === "O";

  // ---------------------------------------------------------------
  // DRAWING THE GAME ON THE SCREEN
  // ---------------------------------------------------------------
  // "Rendering" means updating what you see so it matches the game's state.
  // This function reads the state and updates the page to match; it does
  // not decide anything about the game itself.
  function render() {
    // Go through every slot of the board, one at a time. "mark" is what is
    // in the slot ("X", "O", or null) and "i" is its position number.
    state.board.forEach((mark, i) => {
      const cell = cells[i];
      // Show the mark as text in the square (or nothing if it is empty).
      // "mark || ''" means "use mark if there is one, otherwise empty
      // text".
      cell.textContent = mark || "";
      // classList.toggle(name, condition) adds a class when the condition
      // is true and removes it when false. These control the X (orange) and
      // O (blue) colors that style.css defines.
      cell.classList.toggle("x", mark === "X");
      cell.classList.toggle("o", mark === "O");
      // "disabled" turns a button off so it cannot be clicked. A square
      // should be off when the round is over, when it is already filled,
      // or while the computer is taking its turn.
      cell.disabled = state.over || Boolean(mark) || isCpuTurn();
      // Keep the screen reader description up to date, for example
      // "Square 5, X".
      cell.setAttribute("aria-label", `Square ${i + 1}, ${mark || "empty"}`);
    });
    // Show the current scores. textContent sets the text of an element.
    scoreEls.X.textContent = state.scores.X;
    scoreEls.O.textContent = state.scores.O;
    scoreEls.draw.textContent = state.scores.draw;
  }

  // Gives the friendly name of a player for use in messages. Against the
  // computer, X is "You" and O is "Computer". With two people, it is
  // "Player X" or "Player O".
  function nameOf(player) {
    if (state.mode === "cpu") return player === "X" ? "You" : "Computer";
    return `Player ${player}`;
  }

  // Writes the message under the scoreboard that says whose turn it is.
  function setStatus() {
    // If the round is already over, leave the final message (such as "You
    // win!") alone. "return" stops the function immediately.
    if (state.over) return;
    if (state.mode === "cpu") {
      statusEl.textContent = state.turn === "X" ? "Your turn" : "Computer is thinking…";
    } else {
      statusEl.textContent = `Player ${state.turn}'s turn`;
    }
  }

  // ---------------------------------------------------------------
  // MAKING A MOVE
  // ---------------------------------------------------------------
  // Puts the current player's mark in square number i, then works out what
  // happens next: a win, a draw, or the other player's turn. Both humans
  // and the computer use this same function.
  function place(i) {
    // Record the move in the game's memory.
    state.board[i] = state.turn;
    // Restart the little "pop" animation on this square. We remove the
    // "placed" class, force the browser to notice (by reading offsetWidth,
    // a measurement that makes the browser update its layout), and then add
    // the class back. Without this trick, the animation would not replay.
    cells[i].classList.remove("placed");
    void cells[i].offsetWidth; // restart animation
    cells[i].classList.add("placed");

    // Ask winnerOf whether that move ended the game.
    const result = winnerOf(state.board);
    if (result) {
      // The round is over, so mark it finished.
      state.over = true;
      if (result.player) {
        // Someone won. "++" adds one to a number, so this adds one point
        // to the winner's score.
        state.scores[result.player]++;
        // Highlight each of the three winning squares by adding the "win"
        // class (style.css gives it a yellow background).
        result.line.forEach((idx) => cells[idx].classList.add("win"));
        // Show a message such as "You win!" or "Player O wins!".
        const who = nameOf(result.player);
        statusEl.textContent = who === "You" ? "You win! 🎉" : `${who} wins!`;
      } else {
        // No winner but the board is full: a draw.
        state.scores.draw++;
        statusEl.textContent = "It's a draw.";
      }
      // The scores changed, so remember them for next time.
      save();
    } else {
      // The game goes on, so hand the turn to the other player: if it was
      // X's turn it becomes O's, and the other way around.
      state.turn = state.turn === "X" ? "O" : "X";
      setStatus();
    }
    // Update the screen to match the new state.
    render();

    // If the game is not over and the computer is next, let it move.
    // setTimeout(function, 450) waits 450 milliseconds (a bit under half a
    // second) before running the function. The pause makes it feel like the
    // computer is thinking, instead of answering instantly.
    if (!state.over && isCpuTurn()) {
      setTimeout(cpuMove, 450);
    }
  }

  // Runs when a person clicks square number i.
  function humanMove(i) {
    // Ignore the click if the round is over, the square is already taken,
    // or it is the computer's turn. (The squares are also switched off in
    // those cases; this is a second layer of protection.)
    if (state.over || state.board[i] || isCpuTurn()) return;
    place(i);
  }

  // ---- Computer player ----

  // ---------------------------------------------------------------
  // THE COMPUTER'S BRAIN
  // ---------------------------------------------------------------
  // "minimax" is a classic strategy for two-player games. The computer
  // imagines every possible way the rest of the game could go: "if I move
  // here, then you move there, then I move..." until the game ends. It
  // gives each finished game a score: positive when the computer (O) wins,
  // negative when the human (X) wins, and zero for a draw. It assumes the
  // computer will always pick the best move for itself and the human will
  // always pick the best move for themself. Following the best path means
  // the computer on "Unbeatable" can never lose.
  //
  // This function calls itself, which is called "recursion": each call
  // looks one move deeper into the future. "depth" counts how many moves
  // ahead we are. Subtracting depth means quicker wins score higher and
  // slower losses score better, so the computer wins fast and delays
  // losing.
  function minimax(board, player, depth) {
    // First, check if the imagined game is already finished.
    const result = winnerOf(board);
    if (result) {
      // O (the computer) won: a good, positive score.
      if (result.player === "O") return { score: 10 - depth };
      // X (the human) won: a bad, negative score.
      if (result.player === "X") return { score: depth - 10 };
      // A draw is neutral.
      return { score: 0 };
    }
    // The game is not over, so try every possible move. "best" remembers
    // the best score found so far. It starts at the worst possible value
    // for whoever is moving (-Infinity or Infinity, JavaScript's way of
    // writing "smaller or bigger than any number"). "index" will hold the
    // square that led to that score. The computer (O) wants the highest
    // score; the human (X) wants the lowest.
    let best = { score: player === "O" ? -Infinity : Infinity, index: -1 };
    // A standard counting loop: start i at 0, keep going while i is less
    // than 9, and add one to i each time. So it visits all nine squares.
    for (let i = 0; i < 9; i++) {
      // Skip squares that are already taken. "continue" jumps straight to
      // the next square.
      if (board[i]) continue;
      // Pretend to make the move...
      board[i] = player;
      // ...and see how well the rest of the game would go. We switch
      // players ("X" becomes "O" and vice versa) and go one level deeper.
      // The curly braces on the left grab just the "score" out of the
      // answer.
      const { score } = minimax(board, player === "O" ? "X" : "O", depth + 1);
      // Undo the pretend move so the board is back to normal for the next
      // try.
      board[i] = null;
      // Is this the best result so far for the player who is moving? If
      // so, remember its score and the square that produced it.
      if (player === "O" ? score > best.score : score < best.score) {
        best = { score, index: i };
      }
    }
    // Report the best score found and the square that gets it.
    return best;
  }

  // Picks a completely random empty square. Used by the Easy level (and
  // sometimes by Medium) so the computer makes beatable mistakes.
  function randomMove(board) {
    // Build a list of the empty squares. "map" turns each slot into its
    // position number if it is empty, or -1 if it is taken. "filter" then
    // throws away the -1 entries, leaving only the open positions.
    const open = board.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
    // Math.random() gives a random decimal between 0 and 1. Multiplying by
    // the list length and rounding down with Math.floor gives a random
    // whole position in the list, which we use to pick one open square.
    return open[Math.floor(Math.random() * open.length)];
  }

  // Chooses which square the computer will play, depending on the
  // difficulty drop-down.
  function pickCpuMove() {
    // The word currently chosen in the menu: "easy", "medium", or "hard".
    const level = difficultyEl.value;
    // Make a copy of the board with .slice(), so that the computer's
    // "what if" experiments can never accidentally change the real board.
    const board = state.board.slice();
    // Easy: always random.
    if (level === "easy") return randomMove(board);
    // Medium: 40 percent of the time (when the random number is below 0.4)
    // play randomly, otherwise fall through to the smart move below.
    if (level === "medium" && Math.random() < 0.4) return randomMove(board);
    // Unbeatable (and the smart 60 percent of Medium): use minimax. We ask
    // it to pick a move for "O" starting at depth 0, and keep only the
    // chosen square number (".index").
    return minimax(board, "O", 0).index;
  }

  // The computer takes its turn.
  function cpuMove() {
    // Safety check: only move if the round is still going and it really is
    // the computer's turn. (This matters if, for example, someone presses
    // "New round" during the half-second pause.)
    if (state.over || !isCpuTurn()) return;
    place(pickCpuMove());
  }

  // ---- Round / mode management ----

  // ---------------------------------------------------------------
  // STARTING ROUNDS AND SWITCHING MODES
  // ---------------------------------------------------------------
  // Clears the board and starts a fresh round. By default the player who
  // starts switches each round so it is fair. The strange-looking
  // "{ alternate = true } = {}" means: this function can be given an
  // optional setting called "alternate", and if nobody provides it, it
  // counts as true.
  function newRound({ alternate = true } = {}) {
    // Swap the starting player between X and O, if asked to.
    if (alternate) state.starter = state.starter === "X" ? "O" : "X";
    // Empty the board and reset the turn and finished-flag.
    state.board = Array(9).fill(null);
    state.turn = state.starter;
    state.over = false;
    // Remove the highlight and animation classes left over from the last
    // round.
    cells.forEach((c) => c.classList.remove("win", "placed"));
    // Update the message and the screen.
    setStatus();
    render();
    // If the computer is the one who starts, let it make the first move
    // after a short pause.
    if (isCpuTurn()) setTimeout(cpuMove, 450);
  }

  // Switches between playing the computer ("cpu") and playing a friend
  // ("pvp").
  function setMode(mode) {
    state.mode = mode;
    // Update the two mode buttons so only the chosen one has the "active"
    // class (which makes it look selected). "b.dataset.mode" reads the
    // data-mode="..." note written in the HTML for each button.
    document.querySelectorAll(".mode").forEach((b) => {
      b.classList.toggle("active", b.dataset.mode === mode);
    });
    // Show the difficulty menu only when playing the computer. The "hidden"
    // class (see style.css) makes it invisible.
    difficultyWrap.classList.toggle("hidden", mode !== "cpu");
    // Change the names above the scores to fit the mode.
    labelX.textContent = mode === "cpu" ? "You (X)" : "Player X";
    labelO.textContent = mode === "cpu" ? "Computer (O)" : "Player O";
    // Switch to the scoreboard that belongs to this mode.
    state.scores = scoresByMode[mode];
    // Begin with X, remember the new mode, and start a clean board. We pass
    // alternate: false so that X starts this first round rather than
    // swapping.
    state.starter = "X";
    save();
    newRound({ alternate: false });
  }

  // ---------------------------------------------------------------
  // CONNECTING THE BUTTONS (event listeners)
  // ---------------------------------------------------------------
  // Find both mode buttons and attach a click listener to each one. When a
  // button is clicked, read its data-mode value ("cpu" or "pvp") and switch
  // to that mode.
  document.querySelectorAll(".mode").forEach((b) => {
    b.addEventListener("click", () => setMode(b.dataset.mode));
  });
  // When the difficulty menu changes, save the new choice. ("change" is the
  // event that fires when someone picks a different option.)
  difficultyEl.addEventListener("change", save);
  // "New round" starts a fresh board and keeps the scores.
  document.getElementById("newRound").addEventListener("click", () => newRound());
  // "Reset scores" sets the current mode's scores back to zero.
  document.getElementById("resetScores").addEventListener("click", () => {
    // Object.assign copies the zeros from a fresh scoreboard into the
    // current one, changing it in place so everything that uses it sees
    // the change.
    Object.assign(state.scores, emptyScores());
    state.starter = "X";
    save();
    newRound({ alternate: false });
  });

  // ---------------------------------------------------------------
  // GETTING STARTED
  // ---------------------------------------------------------------
  // Everything above only DEFINED recipes and listeners. This final line
  // actually starts the game, using the mode that was loaded from storage
  // (or "cpu" on a first visit). It builds the first round and draws it on
  // the screen.
  setMode(state.mode);
})();
