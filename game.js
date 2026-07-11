/* Minimal dependency-free test runner for the pure game core.
   Run with:  node test/game.test.js   */
var CORE = require("../www/game.js");

var pass = 0,
  fail = 0;

function eq(actual, expected, msg) {
  var a = JSON.stringify(actual);
  var e = JSON.stringify(expected);
  if (a === e) {
    pass++;
  } else {
    fail++;
    console.error("  ✗ " + msg + "\n      expected " + e + "\n      got      " + a);
  }
}
function ok(cond, msg) {
  if (cond) pass++;
  else {
    fail++;
    console.error("  ✗ " + msg);
  }
}

/* ---- baseScore (§4.3) ---- */
// delta 0 -> 900 / 0.4 = 2250
eq(CORE.baseScore(0), 2250, "baseScore(0) = 2250");
// delta 800ms (default) -> floor(900 / (0.8+0.4)) = 749 (IEEE-754: 0.8+0.4 = 1.2000…002)
eq(CORE.baseScore(800), 749, "baseScore(800) = 749");
// slow click floors at min 10
ok(CORE.baseScore(1000000) === 10, "baseScore floors at 10");

/* ---- multiplier (§4.4) ---- */
eq(CORE.multiplier(0), 1, "combo 0 -> x1");
eq(CORE.multiplier(3), 1, "combo 3 -> x1");
eq(CORE.multiplier(4), 2, "combo 4 -> x2");
eq(CORE.multiplier(8), 3, "combo 8 -> x3");
eq(CORE.multiplier(100), 5, "combo capped at COMBO_CAP (5)");

/* ---- drainRate (§4.5) ---- */
eq(CORE.drainRate(1), 7, "drain level 1 = START_DRAIN");
eq(CORE.drainRate(2), 9.2, "drain level 2 = 7 + 2.2");
eq(CORE.drainRate(5), 15.8, "drain level 5 = 7 + 4*2.2");

/* ---- timeGain (§4.5) ---- */
eq(CORE.timeGain(1), 9, "timeGain level 1 = 9");
eq(CORE.timeGain(3), 8, "timeGain level 3 = 9 - 1");
ok(CORE.timeGain(100) === 3, "timeGain floors at 3");

/* ---- shiftColumn (§2) ---- */
(function () {
  var rows = 4,
    cols = 2;
  var grid = [
    [1, 9],
    [2, 9],
    [3, 9],
    [4, 9],
  ];
  var special = [
    [null, null],
    [null, null],
    [null, "freeze"],
    [null, null],
  ];
  CORE.shiftColumn(grid, special, 0, rows, function () {
    return 7;
  });
  // column 0 shifts down; new 7 enters at top
  eq(
    [grid[0][0], grid[1][0], grid[2][0], grid[3][0]],
    [7, 1, 2, 3],
    "shiftColumn moves values down, new digit on top"
  );
  // special also shifts down; row0 special cleared
  eq(special[0][0], null, "shiftColumn clears new top special");
  // column 1 untouched
  eq([grid[0][1], grid[3][1]], [9, 9], "other columns unaffected");
})();

/* ---- countInBottom ---- */
(function () {
  var grid = [
    [0, 0, 0, 0, 0, 0],
    [3, 5, 3, 7, 3, 1],
  ];
  eq(CORE.countInBottom(grid, 3, 2, 6), 3, "counts target in bottom row");
  eq(CORE.countInBottom(grid, 9, 2, 6), 0, "counts zero when absent");
})();

/* ---- bottomValues ---- */
(function () {
  var grid = [
    [0, 0],
    [4, 8],
  ];
  eq(CORE.bottomValues(grid, 2, 2), [4, 8], "bottomValues returns bottom row");
})();

/* ---- pickForbidden (§4.7) ---- */
(function () {
  for (var i = 0; i < 500; i++) {
    var f = CORE.pickForbidden(5);
    if (f === 5 || f < 0 || f > 9) {
      fail++;
      console.error("  ✗ pickForbidden returned invalid: " + f);
      return;
    }
  }
  pass++;
})();

/* ---- config sanity (§5) ---- */
eq(CORE.CFG.COLS, 6, "COLS = 6");
eq(CORE.CFG.ROWS, 8, "ROWS = 8");
eq(CORE.CFG.TIME_MAX, 100, "TIME_MAX = 100");
eq(CORE.CFG.FREEZE_SPAWN_CHANCE, 0.18, "FREEZE_SPAWN_CHANCE = 0.18");
eq(CORE.CFG.COMBO_CAP, 5, "COMBO_CAP = 5");

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
