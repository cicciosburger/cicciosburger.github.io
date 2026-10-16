/* Burger Run — Ciccio's Burger
 *
 * A short-session runner built to fill the wait for a delivery.
 *
 * Variability comes from four places, so no two runs feel alike:
 *   1. patterns   — obstacles arrive as composed shapes, not one at a time
 *   2. power-ups  — magnet, shield and turbo change the rules for a while
 *   3. missions   — three active goals, kept between sessions
 *   4. trails     — ingredient lines come in arcs, waves and diagonals
 *
 * Custom artwork drops in by replacing drawBurger() and drawObstacle();
 * physics, spawning, scoring and pacing stay untouched.
 */
(function () {
  'use strict';

  var TAU = Math.PI * 2;

  /* ---------- world ----------
     The playfield is always 300 units tall; the width follows the viewport, so
     the game plays identically on a phone and on a desktop. */
  var VH = 300;
  var GROUND_Y = 252;
  var PLAYER_X = 42;
  var PLAYER_W = 38;
  var PLAYER_H = 36;

  /* ---------- physics ---------- */
  var GRAVITY = 2600;       // units / s^2
  var JUMP_V = -840;        // initial jump velocity
  var MIN_RISE = 105;       // a tap always lifts at least this high: both jump
                            // styles clear every obstacle with room to spare
  var JUMP_CUT = 2.0;       // extra gravity once a released jump has risen enough

  var SLIDE_H = 16;         // collision height while sliding
  var SLIDE_DRAW_H = 14;    // squashed burger
  var SLIDE_TIME = 0.5;

  /* ---------- pacing ---------- */
  var SPEED_START = 250;
  var SPEED_MAX = 560;      // capped well below eye-strain territory, and low
                            // enough that the shorter window still leaves 0.71s
                            // of warning at top speed
  var DIFFICULTY_START = 0.35;
  var RAMP_CALM = 0.014;    // difficulty per second while cruising
  var RAMP_PRESSED = 0.005; // difficulty per second while under pressure
  var CALM_AFTER = 5;       // seconds of clean play that count as "cruising"

  var STAGE_SECONDS = 22;
  var PHASES_PER_DELIVERY = 4;
  var DELIVERY_BONUS = 1000;
  var LAYERS_PER_BURGER = 6;
  var BURGER_BONUS = 300;
  var CLOSE_CALL = 14;      // world units of clearance that count as a near miss

  /* ---------- power-ups ---------- */
  var MAGNET_TIME = 8;
  var MAGNET_RANGE = 230;
  var MAGNET_PULL = 460;
  var TURBO_TIME = 5;
  var TURBO_SPEED = 1.6;
  var TURBO_POINTS = 2;
  var SHIELD_TIME = 12;     // the bubble expires if it is never used
  var INVULN_TIME = 0.9;    // grace after a shield breaks
  var POWER_FIRST = 20;
  var POWER_EVERY = [24, 42];

  var STORAGE_BEST = 'ciccio.burgerrun.best';
  var STORAGE_MUTE = 'ciccio.burgerrun.muted';
  var STORAGE_DELIVERIES = 'ciccio.burgerrun.deliveries';
  var STORAGE_MISSIONS = 'ciccio.burgerrun.missions';

  /* ---------- palette ----------
     Muted on purpose. Saturated colours on a near-black background is what
     makes a runner tiring: every sprite sits at a lower chroma and the
     background is lifted off pure black. */
  var P = {
    line: '#2f2f36',
    pebble: '#232329',
    shadow: 'rgba(0,0,0,.35)',
    bun: '#c49a63',
    bunTop: '#cda86f',
    patty: '#4d3625',
    cheese: '#c9a961',
    lettuce: '#5f8f5a',
    seed: 'rgba(240,235,220,.55)',
    ketchup: '#a85048',
    ketchupCap: '#33333a',
    ketchupNeck: '#8e423b',
    label: '#d3cec4',
    fries: '#c2a463',
    friesBox: '#9c4a45',
    plate: '#8f9196',
    plateIn: '#b9babd',
    flyBody: '#3a3a40',
    flyHead: '#2c2c31',
    flyEye: '#b8564a',
    wing: 'rgba(190,205,225,.28)',
    cable: '#2a2a30',
    shade: '#4a4a52',
    shadeIn: '#585860',
    magnet: '#8fa8bd',
    shield: '#7f9ec0',
    turbo: '#d9913f',
    shieldShell: 'rgba(127,158,192,.22)',
    turboTrail: 'rgba(217,145,63,.16)'
  };

  /* ---------- kitchen phases ----------
     Low-contrast tints: enough to signal that something changed, not enough to
     glare. They cycle, so a long session always has a next phase coming. */
  var STAGES = [
    { name: 'In cucina',        bg: '#131316', tint: 'rgba(255,255,255,.020)' },
    { name: 'In cottura',       bg: '#151210', tint: 'rgba(255,150,70,.045)' },
    { name: 'In impiattamento', bg: '#111417', tint: 'rgba(120,190,255,.038)' },
    { name: 'In consegna',      bg: '#131214', tint: 'rgba(255,205,140,.042)' }
  ];

  var INGREDIENTS = [
    { name: 'Pane',      color: '#c49a63' },
    { name: 'Carne',     color: '#7a5537' },
    { name: 'Formaggio', color: '#c9a961' },
    { name: 'Insalata',  color: '#5f8f5a' },
    { name: 'Pomodoro',  color: '#a85048' },
    { name: 'Salsa',     color: '#cbbfa6' }
  ];

  var POWERS = {
    magnet: { color: P.magnet, label: 'MAGNETE' },
    shield: { color: P.shield, label: 'SCUDO' },
    turbo:  { color: P.turbo,  label: 'TURBO' }
  };

  /* ---------- obstacle vocabulary ----------
     ground — jump over it
     air    — hovers at body height: jump over it OR slide under it
     hang   — hangs from the ceiling: sliding is the only way through
     pit    — a hole in the ground with fries standing in it: NOTHING clears it
              but a jump, because both the standing and the sliding box sit low
              enough to drop straight in */
  var HANG_TOP = -6;
  var PIT_TIME = 0.22;      // width of a pit, as seconds of travel: verified to
                            // fit inside the jump window with ~8 frames to spare
  var PIT_RISE = 12;        // how far the lethal lip reaches above the ground
  var PIT_DEPTH = 28;

  var TYPES = {
    ketchup: { kind: 'ground', w: 22, h: 50,            unlock: 0 },
    fries:   { kind: 'ground', w: 32, h: 42,            unlock: 0 },
    plate:   { kind: 'ground', w: 46, h: 18,            unlock: 0.20 },
    fly:     { kind: 'air',    w: 30, h: 26,            unlock: 0.40 },
    // a hanging obstacle must leave a gap a sliding player fits through but a
    // standing one does not: bottom at GROUND_Y - 20 / -22
    lamp:    { kind: 'hang',   w: 34, h: GROUND_Y - 14, unlock: 0.55 },
    board:   { kind: 'hang',   w: 56, h: GROUND_Y - 16, unlock: 0.72 },
    pit:     { kind: 'pit',    w: 100, h: PIT_DEPTH + PIT_RISE, unlock: 0.30 }
  };

  /* Two ways a group of obstacles can be safe, and the middle ground is a trap:
       JOIN  — the pieces touch, so the group reads as ONE wider obstacle and a
               player jumps it once without thinking.
       WIDE  — far enough apart to land and jump again.
     A small numeric gap is the worst of both worlds: too far to look like one
     thing, too close to land between. That is exactly the "two rows with a
     minuscule space that you cannot jump" case. */
  var JOIN = 'join';        // dx becomes the previous piece's own width
  var WIDE = 0.85;          // land, then deal with the next one

  /* keys: '?' any unlocked obstacle, '~' any unlocked ground obstacle */
  var SINGLE_DEF = { id: 'single', unlock: 0, weight: 8, keys: ['?'], gaps: [] };
  var PATTERNS = [
    SINGLE_DEF,
    { id: 'breather', unlock: 0,    weight: 1, keys: [],                 gaps: [] },
    { id: 'plate2',   unlock: 0.20, weight: 3, keys: ['plate', 'plate'], gaps: [JOIN] },
    { id: 'pit',      unlock: 0.30, weight: 3, keys: ['pit'],            gaps: [] },
    { id: 'flyby',    unlock: 0.40, weight: 3, keys: ['fly'],            gaps: [] },
    { id: 'fries2',   unlock: 0.45, weight: 3, keys: ['fries', 'fries'], gaps: [JOIN] },
    { id: 'mixpair',  unlock: 0.50, weight: 3, keys: ['plate', 'fries'], gaps: [JOIN] },
    { id: 'hangpair', unlock: 0.60, weight: 2, keys: ['lamp', 'board'],  gaps: [WIDE], needsHang: true },
    { id: 'tunnel',   unlock: 0.65, weight: 2, keys: ['lamp', 'plate'],  gaps: [WIDE], needsHang: true }
  ];

  /* ---------- missions ---------- */
  var MISSION_DEFS = {
    ingredients: { text: 'Raccogli {n} ingredienti',          mode: 'sum', steps: [10, 18, 28, 40] },
    slides:      { text: 'Scivola sotto {n} ostacoli',         mode: 'sum', steps: [5, 9, 14, 20] },
    closeCalls:  { text: 'Fai {n} passaggi millimetrici',      mode: 'sum', steps: [4, 7, 11] },
    deliveries:  { text: 'Completa {n} consegne',              mode: 'sum', steps: [1, 2, 3] },
    multiplier:  { text: 'Arriva al moltiplicatore x5',        mode: 'sum', steps: [1] },
    powers:      { text: 'Usa {n} power-up',                   mode: 'sum', steps: [2, 4, 6] },
    score:       { text: 'Fai {n} punti in una partita',       mode: 'max', steps: [4000, 7000, 11000] }
  };
  var MISSION_REWARD = 500;
  var MISSION_COUNT = 3;

  /* ---------- achievements ----------
     Everything here is derived from counters that already exist, so nothing new
     has to be tracked during a run — only accumulated at the end of one. */
  var STORAGE_STATS = 'ciccio.burgerrun.stats';
  var ACHIEVEMENTS = [
    { text: 'Prima partita',            goal: 1,     of: function () { return stats.runs; } },
    { text: 'Prima consegna',           goal: 1,     of: function () { return deliveries; } },
    { text: 'Primo panino',             goal: 1,     of: function () { return stats.burgers; } },
    { text: '25 scivolate',             goal: 25,    of: function () { return stats.slides; } },
    { text: '10 power-up',              goal: 10,    of: function () { return stats.powers; } },
    { text: '100 ingredienti',          goal: 100,   of: function () { return stats.ingredients; } },
    { text: '10 consegne',              goal: 10,    of: function () { return deliveries; } },
    { text: '10 panini',                goal: 10,    of: function () { return stats.burgers; } },
    { text: '20 passaggi millimetrici', goal: 20,    of: function () { return stats.closeCalls; } },
    { text: '5 000 punti',              goal: 5000,  of: function () { return best; } },
    { text: '10 000 punti',             goal: 10000, of: function () { return best; } }
  ];

  var PICKUP_R = 9;
  var PICKUP_FORGIVE = 24;

  /* ---------- hero sprite ----------
     ciccios_personaggio.png is a big square with a transparent background and a
     single running pose. Three things happen once, at load:
       1. the artwork box is measured from the alpha channel, so anchoring uses
          the FEET instead of the image edge (otherwise he floats);
       2. it is downscaled by repeated halving (a box filter) rather than being
          crushed 19:1, which would alias badly — the source was not resized on
          a whole-pixel grid, so no integer factor recovers it;
       3. a second frame is built by mirroring the LEG BAND around the gap
          between the legs, giving a two-pose run cycle out of a single frame.
     The gap is found from the silhouette alone (no colour assumptions): the
     corridor that stays transparent to the bottom of the artwork while parts of
     the character sit on BOTH sides of it. Anything that fails just leaves a
     static sprite, and a total failure leaves the drawn burger. */
  var HERO_H = 40;           // drawn artwork height, in world units
  var HERO_SQUASH = 0.55;    // vertical squash while sliding
  var HERO_BITMAP_H = 120;   // working resolution of the cropped sprite
  var HERO_STRIDE = 95;      // world units travelled per run-cycle pose

  var HERO = {
    src: '/gioco/ciccios_personaggio.png',
    img: null, frames: null, aspect: 0.86, ready: false,
    animated: false, hipFrame: 0, axisFrame: 0
  };

  function makeCanvas(w, h) {
    var c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  function heroImageData(img) {
    var w = img.naturalWidth, h = img.naturalHeight;
    if (!w || !h) return null;
    var g = makeCanvas(w, h).getContext('2d');
    if (!g) return null;
    g.drawImage(img, 0, 0);
    return { w: w, h: h, data: g.getImageData(0, 0, w, h).data };
  }

  /* tight box around the non-transparent pixels of the whole image */
  function heroSourceBox(id) {
    var minX = id.w, minY = id.h, maxX = -1, maxY = -1;
    for (var y = 0; y < id.h; y++) {
      for (var x = 0; x < id.w; x++) {
        if (id.data[(y * id.w + x) * 4 + 3] > 128) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0) return null;                      // fully transparent
    return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
  }

  /* the corridor between the legs: transparent down to the artwork bottom, with
     parts of the silhouette on both sides at that height */
  function heroLegGap(id, box) {
    var bottom = box.y + box.h - 1;
    var rows = box.h;
    var rowMin = new Array(rows);
    var rowMax = new Array(rows);
    var r, x, y, c;
    for (r = 0; r < rows; r++) { rowMin[r] = Infinity; rowMax[r] = -1; }

    for (y = box.y; y <= bottom; y++) {
      for (x = box.x; x < box.x + box.w; x++) {
        if (id.data[(y * id.w + x) * 4 + 3] > 128) {
          r = y - box.y;
          if (x < rowMin[r]) rowMin[r] = x;
          if (x > rowMax[r]) rowMax[r] = x;
        }
      }
    }

    var top = new Array(box.w);
    for (c = 0; c < box.w; c++) {
      top[c] = Infinity;
      x = box.x + c;
      var lastOpaque = -1;
      for (y = box.y; y <= bottom; y++) {
        if (id.data[(y * id.w + x) * 4 + 3] > 128) lastOpaque = y;
      }
      if (lastOpaque < 0) continue;                 // column outside the artwork
      var bandTop = lastOpaque + 1;
      if (bandTop > bottom) continue;

      var hasLeft = false, hasRight = false;
      for (y = bandTop; y <= bottom && !(hasLeft && hasRight); y++) {
        r = y - box.y;
        if (rowMin[r] < x) hasLeft = true;
        if (rowMax[r] > x) hasRight = true;
      }
      if (!hasLeft || !hasRight) continue;
      top[c] = bandTop;
    }

    var bestTop = Infinity, bestC = -1;
    for (c = 0; c < box.w; c++) if (top[c] < bestTop) { bestTop = top[c]; bestC = c; }
    if (bestC < 0) return null;
    if (bottom - bestTop + 1 < box.h * 0.10) return null;

    var tol = Math.max(2, Math.round(box.h * 0.012));
    var lo = bestC, hi = bestC;
    while (lo > 0 && top[lo - 1] <= bestTop + tol) lo--;
    while (hi < box.w - 1 && top[hi + 1] <= bestTop + tol) hi++;

    var relTop = (bestTop - box.y) / box.h;
    var relW = (hi - lo + 1) / box.w;
    if (relTop < 0.45 || relTop > 0.94) return null;
    if (relW < 0.015 || relW > 0.45) return null;

    return { hipY: bestTop, axisX: box.x + (lo + hi) / 2 };
  }

  function heroBitmap(img, box) {
    var targetW = Math.max(1, Math.round(box.w * HERO_BITMAP_H / box.h));
    var targetH = HERO_BITMAP_H;

    var cur = makeCanvas(box.w, box.h);
    cur.getContext('2d').drawImage(img, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);

    var cw = box.w, ch = box.h;
    while (cw > targetW * 2 && ch > targetH * 2) {
      var nw = Math.max(targetW, Math.floor(cw / 2));
      var nh = Math.max(targetH, Math.floor(ch / 2));
      var next = makeCanvas(nw, nh);
      var ng = next.getContext('2d');
      ng.imageSmoothingEnabled = true;
      ng.imageSmoothingQuality = 'high';
      ng.drawImage(cur, 0, 0, cw, ch, 0, 0, nw, nh);
      cur = next;
      cw = nw;
      ch = nh;
    }

    var out = makeCanvas(targetW, targetH);
    var og = out.getContext('2d');
    og.imageSmoothingEnabled = true;
    og.imageSmoothingQuality = 'high';
    og.drawImage(cur, 0, 0, cw, ch, 0, 0, targetW, targetH);
    return { canvas: out, w: targetW, h: targetH };
  }

  /* second pose: keep everything, mirror only the leg band around the gap axis */
  function heroMirrorLegs(base, hipOffset, axisOffset) {
    var w = base.width, h = base.height;
    var out = makeCanvas(w, h);
    var g = out.getContext('2d');
    g.drawImage(base, 0, 0);
    g.save();
    g.beginPath();
    g.rect(0, hipOffset, w, h - hipOffset);
    g.clip();
    g.clearRect(0, hipOffset, w, h - hipOffset);
    g.translate(axisOffset, 0);
    g.scale(-1, 1);
    g.translate(-axisOffset, 0);
    g.drawImage(base, 0, 0);
    g.restore();
    return out;
  }

  function loadHero() {
    if (typeof Image !== 'function') return;        // headless / no DOM
    var img = new Image();
    img.onload = function () {
      try {
        var id = heroImageData(img);
        if (!id) { HERO.ready = false; return; }
        var box = heroSourceBox(id);
        if (!box) { HERO.ready = false; return; }

        var base = heroBitmap(img, box);
        HERO.img = img;
        HERO.aspect = base.w / base.h;

        var gap = heroLegGap(id, box);
        if (gap) {
          var hipOffset = Math.round((gap.hipY - box.y) * base.h / box.h);
          var axisOffset = Math.round((gap.axisX - box.x) * base.w / box.w);
          HERO.frames = [base.canvas, heroMirrorLegs(base.canvas, hipOffset, axisOffset)];
          HERO.hipFrame = hipOffset;
          HERO.axisFrame = axisOffset;
          HERO.animated = true;
        } else {
          HERO.frames = [base.canvas];              // static, but still the sprite
          HERO.animated = false;
        }
        HERO.ready = true;
      } catch (e) {
        HERO.ready = false;
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('Burger Run: sprite non disponibile, uso il fallback disegnato.', e);
        }
      }
    };
    img.onerror = function () { HERO.ready = false; };
    img.src = HERO.src;
  }

  /* ---------- DOM ---------- */
  var stageEl = document.getElementById('stage');
  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var scoreEl = document.getElementById('score');
  var multEl = document.getElementById('mult');
  var bestEl = document.getElementById('best');
  var statusBar = document.getElementById('statusBar');
  var deliveriesEl = document.getElementById('deliveries');
  var trophyCountEl = document.getElementById('trophyCount');
  var trophyNextEl = document.getElementById('trophyNext');
  var ovTrophiesEl = document.getElementById('ovTrophies');
  var powersEl = document.getElementById('powers');
  var slideBtn = document.getElementById('slideBtn');
  var jumpBtn = document.getElementById('jumpBtn');
  var bannerEl = document.getElementById('banner');
  var overlay = document.getElementById('overlay');
  var ovTitle = document.getElementById('ovTitle');
  var ovText = document.getElementById('ovText');
  var ovMissions = document.getElementById('ovMissions');
  var ovBtn = document.getElementById('ovBtn');
  var muteBtn = document.getElementById('muteBtn');

  var burgerSegs = [];
  for (var s = 0; s < LAYERS_PER_BURGER; s++) {
    var seg = document.createElement('span');
    seg.className = 'seg';
    statusBar.insertBefore(seg, deliveriesEl);
    burgerSegs.push(seg);
  }

  /* ---------- storage (private mode safe) ---------- */
  function read(key, fallback) {
    try { var v = localStorage.getItem(key); return v === null ? fallback : v; }
    catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* storage blocked */ }
  }

  /* ---------- audio: oscillators only, no asset files ---------- */
  var audioCtx = null;
  var muted = read(STORAGE_MUTE, '0') === '1';

  function ensureAudio() {
    if (audioCtx) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { audioCtx = new AC(); } catch (e) { audioCtx = null; }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  }

  function beep(from, to, duration, type, level) {
    if (muted || !audioCtx) return;
    try {
      var t = audioCtx.currentTime;
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(from, t);
      if (to && to !== from) osc.frequency.exponentialRampToValueAtTime(to, t + duration);
      gain.gain.setValueAtTime(level, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + duration + 0.02);
    } catch (e) { /* audio unavailable */ }
  }

  var sfx = {
    jump: function () { beep(420, 660, 0.08, 'square', 0.035); },
    slide: function () { beep(300, 180, 0.1, 'triangle', 0.03); },
    hit: function () { beep(190, 60, 0.26, 'sawtooth', 0.06); },
    pickup: function () { beep(680, 900, 0.07, 'triangle', 0.03); },
    power: function () { beep(500, 980, 0.18, 'triangle', 0.045); },
    shield: function () { beep(300, 260, 0.2, 'sine', 0.05); },
    bonus: function () { beep(620, 940, 0.16, 'triangle', 0.04); },
    stage: function () { beep(520, 700, 0.12, 'sine', 0.035); },
    mission: function () { beep(760, 1180, 0.2, 'sine', 0.045); }
  };

  /* ---------- viewport ----------
     The scale is anchored to the WIDTH, never the height. What decides whether
     an obstacle can be seen in time is how many world units sit ahead of the
     player, and that must not change with the shape of the screen: on a tall
     phone the game used to end up showing a 200-unit corridor, leaving 0.19s of
     warning at top speed. The world is also grown past WORLD_W on very wide
     screens, and the ground is pinned near the bottom so the extra room becomes
     sky rather than emptiness. */
  var WORLD_W = 480;          // world units visible ahead, always. Smaller here
                              // means a bigger character but less warning: 480
                              // gives ~30px on a phone and 0.71s of runway at
                              // top speed, against 0.19s in the broken build.
                              // The app caps its own width, so the scale never
                              // has to be clamped as well — one mechanism, and
                              // the playfield always fills the aspect-ratio box.

  var view = { dpr: 1, scale: 1, offsetY: 0, top: 0, bottom: 0 };
  var worldW = WORLD_W;

  function resize() {
    var rect = stageEl.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    view.dpr = dpr;

    view.scale = rect.width / WORLD_W;
    worldW = rect.width / view.scale;

    // The stage is given the world's own aspect ratio by the stylesheet, so the
    // playfield should fill it exactly. Anchoring the world's BOTTOM to the
    // stage bottom is what keeps a taller box from opening a band of dead sky,
    // and it still behaves if the ratio is ever clamped.
    view.offsetY = rect.height - VH * view.scale;
    view.top = -view.offsetY / view.scale;
    view.bottom = (rect.height - view.offsetY) / view.scale;

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
  }

  /* ---------- missions ---------- */
  var missions = [];

  function missionText(m) {
    return MISSION_DEFS[m.track].text.replace('{n}', m.target);
  }

  function rollMission(taken) {
    var keys = Object.keys(MISSION_DEFS).filter(function (k) { return taken.indexOf(k) < 0; });
    if (!keys.length) keys = Object.keys(MISSION_DEFS);
    var track = keys[(Math.random() * keys.length) | 0];
    var steps = MISSION_DEFS[track].steps;
    return { track: track, target: steps[(Math.random() * steps.length) | 0], progress: 0 };
  }

  function loadMissions() {
    var raw = null;
    try { raw = JSON.parse(read(STORAGE_MISSIONS, '[]')); } catch (e) { raw = null; }
    if (!Array.isArray(raw)) raw = [];
    raw = raw.filter(function (m) {
      return m && MISSION_DEFS[m.track] && typeof m.target === 'number' && typeof m.progress === 'number';
    });
    while (raw.length > MISSION_COUNT) raw.pop();
    while (raw.length < MISSION_COUNT) {
      raw.push(rollMission(raw.map(function (m) { return m.track; })));
    }
    return raw;
  }

  function saveMissions() { write(STORAGE_MISSIONS, JSON.stringify(missions)); }

  function bumpMission(track, amount, mode) {
    for (var i = 0; i < missions.length; i++) {
      var m = missions[i];
      if (m.track !== track) continue;
      if (m.progress >= m.target) return;
      m.progress = mode === 'max' ? Math.max(m.progress, amount) : m.progress + amount;
      if (m.progress >= m.target) {
        points += MISSION_REWARD;
        score = Math.floor(points);
        showBanner('Missione completata!  +' + MISSION_REWARD, 2.6);
        sfx.mission();
        renderScore();
        missions[i] = rollMission(missions.map(function (x) { return x.track; }));
        saveMissions();
      }
      return;
    }
  }

  /* ---------- game state ---------- */
  var state = 'ready';        // ready | running | paused | over
  var player = {
    x: PLAYER_X, y: GROUND_Y - PLAYER_H, w: PLAYER_W, h: PLAYER_H,
    vy: 0, onGround: true, sliding: false, slideUntil: 0, diving: false
  };
  var obstacles = [];
  var pickups = [];

  var speed = SPEED_START;
  var difficulty = DIFFICULTY_START;
  var calm = 0;
  var distance = 0;
  var elapsed = 0;
  var points = 0;
  var score = 0;
  var streak = 0;
  var multiplier = 1;
  var burger = 0;
  var stageIndex = 0;
  var phaseCount = 0;
  var spawnCount = 0;
  var wasHanging = false;
  var newRecord = false;
  var jumpHeld = false;
  var time = 0;
  var spawnCountdown = 0;
  var bannerUntil = 0;
  var best = parseInt(read(STORAGE_BEST, '0'), 10) || 0;
  var deliveries = parseInt(read(STORAGE_DELIVERIES, '0'), 10) || 0;

  var stats = (function () {
    var raw = null;
    try { raw = JSON.parse(read(STORAGE_STATS, '{}')); } catch (e) { raw = null; }
    if (!raw || typeof raw !== 'object') raw = {};
    return {
      runs: raw.runs | 0,
      ingredients: raw.ingredients | 0,
      slides: raw.slides | 0,
      closeCalls: raw.closeCalls | 0,
      powers: raw.powers | 0,
      burgers: raw.burgers | 0
    };
  })();

  /* active power-ups */
  var magnetUntil = 0;
  var turboUntil = 0;
  var shieldUntil = 0;
  var shieldArmed = false;
  var invulnUntil = 0;
  var nextPowerAt = POWER_FIRST;

  var counters = { ingredients: 0, slides: 0, closeCalls: 0, powers: 0, burgers: 0 };

  /* ---------- hud ---------- */
  function pad5(n) {
    var s = String(Math.max(0, Math.floor(n)));
    while (s.length < 5) s = '0' + s;
    return s;
  }

  function renderScore() {
    scoreEl.textContent = pad5(score);
    multEl.textContent = multiplier > 1 ? 'x' + multiplier : '';
    multEl.classList.toggle('on', multiplier > 1);
    bestEl.textContent = 'RECORD ' + pad5(best);
  }

  function renderBurger() {
    for (var i = 0; i < burgerSegs.length; i++) {
      burgerSegs[i].classList.toggle('on', i < burger);
    }
  }

  function renderDeliveries() {
    deliveriesEl.textContent = 'CONSEGNE ' + deliveries;
  }

  function renderTrophies() {
    var unlocked = 0;
    var closest = null;
    var closestRatio = -1;
    var html = '';

    for (var i = 0; i < ACHIEVEMENTS.length; i++) {
      var a = ACHIEVEMENTS[i];
      var value = Math.max(0, Math.min(a.goal, a.of() | 0));
      var on = value >= a.goal;
      if (on) unlocked++;
      else {
        var ratio = value / a.goal;
        if (ratio > closestRatio) { closestRatio = ratio; closest = { a: a, v: value }; }
      }
      html += '<span class="trophy' + (on ? ' on' : '') + '">' +
        '<i>' + value + '/' + a.goal + '</i>' + a.text + '</span>';
    }

    trophyCountEl.textContent = unlocked + '/' + ACHIEVEMENTS.length;
    trophyNextEl.textContent = closest
      ? closest.a.text + ' ' + closest.v + '/' + closest.a.goal
      : 'tutti sbloccati';
    ovTrophiesEl.innerHTML = html;
  }

  function renderMute() {
    muteBtn.classList.toggle('is-muted', muted);
    muteBtn.setAttribute('aria-pressed', muted ? 'true' : 'false');
    muteBtn.setAttribute('aria-label', muted ? 'Attiva audio' : 'Disattiva audio');
  }

  var powersSignature = '';
  function renderPowers() {
    var active = [];
    if (shieldArmed) active.push(['shield', (shieldUntil - time) / SHIELD_TIME, shieldUntil - time]);
    if (time < magnetUntil) active.push(['magnet', (magnetUntil - time) / MAGNET_TIME, magnetUntil - time]);
    if (time < turboUntil) active.push(['turbo', (turboUntil - time) / TURBO_TIME, turboUntil - time]);

    var sig = active.map(function (a) { return a[0]; }).join(',');
    if (sig !== powersSignature) {
      powersSignature = sig;
      powersEl.textContent = '';
      for (var i = 0; i < active.length; i++) {
        var chip = document.createElement('span');
        chip.className = 'power';
        chip.dataset.power = active[i][0];
        var fill = document.createElement('i');
        chip.appendChild(fill);
        var label = document.createElement('b');
        chip.appendChild(label);
        powersEl.appendChild(chip);
      }
    }

    var chips = powersEl.children;
    for (var k = 0; k < active.length && k < chips.length; k++) {
      var bar = chips[k].firstChild;
      bar.style.width = Math.max(0, Math.min(1, active[k][1])) * 100 + '%';

      // the seconds read-out is the clearest "this is still on" signal
      var secs = Math.max(1, Math.ceil(active[k][2]));
      var label = chips[k].lastChild;
      var text = POWERS[active[k][0]].label + ' ' + secs;
      if (label.textContent !== text) label.textContent = text;
    }
  }

  function missionsHtml() {
    var out = '';
    for (var i = 0; i < missions.length; i++) {
      var m = missions[i];
      var pct = Math.min(100, (m.progress / m.target) * 100);
      out += '<span class="mission"><span class="mission-text">' + missionText(m) +
        '</span><span class="mission-bar"><i style="width:' + pct.toFixed(1) + '%"></i></span>' +
        '<b>' + Math.min(m.progress, m.target) + '/' + m.target + '</b></span>';
    }
    return out;
  }

  function showBanner(text, seconds, tone) {
    bannerEl.textContent = text;
    bannerEl.className = 'banner on' + (tone ? ' banner-' + tone : '');
    bannerUntil = time + (seconds || 2.4);
  }

  /* ---------- overlay ---------- */
  function showOverlay(kind) {
    ovText.className = kind === 'over' ? 'ov-score' : '';

    if (kind === 'paused') {
      ovTitle.textContent = 'In pausa';
      ovText.textContent = 'Il gioco riparte da dove l\'hai lasciato.';
      ovBtn.textContent = 'Riprendi';
      ovMissions.hidden = true;
    } else if (kind === 'over') {
      ovTitle.textContent = newRecord ? 'Nuovo record!' : 'Game over';
      ovText.innerHTML = 'Punteggio <strong>' + pad5(score) + '</strong> &middot; Record <strong>' + pad5(best) + '</strong>';
      ovBtn.textContent = 'Riprova';
      ovMissions.innerHTML = missionsHtml();
      ovMissions.hidden = false;
      ovTrophiesEl.hidden = false;      // the full list, where there is room
    } else {
      ovTitle.textContent = 'Burger Run';
      ovText.innerHTML = 'Usa i tasti in basso: <strong>SALTA</strong> e <strong>SCIVOLA</strong>.';
      ovBtn.textContent = 'Gioca';
      ovMissions.innerHTML = missionsHtml();
      ovMissions.hidden = false;
      ovTrophiesEl.hidden = true;       // keep the start screen uncluttered
      ovTrophiesEl.innerHTML = '';
    }
    overlay.hidden = false;
  }

  function hideOverlay() { overlay.hidden = true; }

  /* ---------- collision boxes ---------- */
  /* the player box is derived from the slide state, never from a duplicated y,
     so the visual and the hitbox can never drift apart */
  function playerBox() {
    if (player.sliding) {
      return { x: player.x + 5, y: GROUND_Y - SLIDE_H + 2, w: player.w - 10, h: SLIDE_H - 4 };
    }
    return { x: player.x + 5, y: player.y + 4, w: player.w - 10, h: player.h - 6 };
  }

  function obstacleBox(o) {
    return { x: o.x + 3, y: o.y + 3, w: o.w - 6, h: o.h - 6 };
  }

  /* separation on one axis; negative means the boxes overlap on that axis */
  function axisGap(aMin, aSize, bMin, bSize) {
    return Math.max(bMin - (aMin + aSize), aMin - (bMin + bSize));
  }

  /* ---------- game flow ---------- */
  function reset() {
    obstacles.length = 0;
    pickups.length = 0;
    speed = SPEED_START + (SPEED_MAX - SPEED_START) * DIFFICULTY_START;
    difficulty = DIFFICULTY_START;
    calm = 0;
    distance = 0;
    elapsed = 0;
    points = 0;
    score = 0;
    streak = 0;
    multiplier = 1;
    burger = 0;
    stageIndex = 0;
    phaseCount = 0;
    spawnCount = 0;
    wasHanging = false;
    newRecord = false;
    jumpHeld = false;
    player.y = GROUND_Y - PLAYER_H;
    player.vy = 0;
    player.onGround = true;
    player.sliding = false;
    player.diving = false;
    player.slideUntil = 0;
    spawnCountdown = speed * 1.7;
    bannerUntil = 0;
    magnetUntil = 0;
    turboUntil = 0;
    shieldArmed = false;
    shieldUntil = 0;
    invulnUntil = 0;
    nextPowerAt = POWER_FIRST;
    counters.ingredients = 0;
    counters.slides = 0;
    counters.closeCalls = 0;
    counters.powers = 0;
    counters.burgers = 0;
    bannerEl.className = 'banner';
    slideBtn.classList.remove('is-down');
    jumpBtn.classList.remove('is-down');
    powersSignature = '';
    powersEl.textContent = '';
    renderScore();
    renderBurger();
    renderDeliveries();
  }

  function start() {
    ensureAudio();
    reset();
    state = 'running';
    hideOverlay();
  }

  function pause() {
    if (state !== 'running') return;
    state = 'paused';
    jumpHeld = false;
    player.sliding = false;
    slideBtn.classList.remove('is-down');
    jumpBtn.classList.remove('is-down');
    showOverlay('paused');
  }

  function resume() {
    if (state !== 'paused') return;
    state = 'running';
    hideOverlay();
  }

  function gameOver() {
    state = 'over';
    jumpHeld = false;
    player.sliding = false;
    invulnUntil = 0;
    slideBtn.classList.remove('is-down');
    jumpBtn.classList.remove('is-down');
    sfx.hit();
    if (score > best) {
      best = score;
      newRecord = true;
      write(STORAGE_BEST, String(best));
    }
    saveMissions();

    // fold this run into the lifetime counters the achievements read from
    stats.runs++;
    stats.ingredients += counters.ingredients;
    stats.slides += counters.slides;
    stats.closeCalls += counters.closeCalls;
    stats.powers += counters.powers;
    stats.burgers += counters.burgers;
    write(STORAGE_STATS, JSON.stringify(stats));
    renderTrophies();

    renderScore();
    showOverlay('over');
  }

  function jump() {
    if (state !== 'running' || !player.onGround) return;
    player.sliding = false;
    player.diving = false;
    slideBtn.classList.remove('is-down');
    player.vy = JUMP_V;
    player.onGround = false;
    sfx.jump();
  }

  function startSlide() {
    player.sliding = true;
    player.diving = false;
    player.slideUntil = time + SLIDE_TIME;
    slideBtn.classList.add('is-down');
    counters.slides++;
    bumpMission('slides', 1, 'sum');
    sfx.slide();
  }

  /* Slide does something in every state. In the air it becomes a dive that slams
     the player down and rolls straight into a slide, because a button that
     silently does nothing reads as a broken button. */
  function slide() {
    if (state !== 'running') return;
    if (!player.onGround) {
      player.diving = true;
      if (player.vy < 340) player.vy = 340;
      slideBtn.classList.add('is-down');
      return;
    }
    if (player.sliding) return;
    startSlide();
  }

  function collectIngredient(node) {
    counters.ingredients++;
    bumpMission('ingredients', 1, 'sum');
    burger++;
    sfx.pickup();
    if (burger >= LAYERS_PER_BURGER) {
      burger = 0;
      counters.burgers++;
      points += BURGER_BONUS;
      score = Math.floor(points);
      showBanner('Panino pronto!  +' + BURGER_BONUS, 2.4);
      sfx.bonus();
      renderScore();
    }
    renderBurger();
  }

  function collectPower(kind) {
    if (kind === 'magnet') {
      magnetUntil = time + MAGNET_TIME;
    } else if (kind === 'shield') {
      shieldArmed = true;
      shieldUntil = time + SHIELD_TIME;
    } else {
      turboUntil = time + TURBO_TIME;
      invulnUntil = Math.max(invulnUntil, turboUntil);
    }
    counters.powers++;
    bumpMission('powers', 1, 'sum');
    showBanner(POWERS[kind].label + '!', 1.8, kind);
    sfx.power();
    renderPowers();
  }

  function bumpMultiplier() {
    var m = Math.min(5, 1 + Math.floor(streak / 12));
    if (m !== multiplier) {
      multiplier = m;
      if (m >= 5) bumpMission('multiplier', 1, 'sum');
      renderScore();
    }
  }

  /* a clearance tight enough to be a near miss: reward it, and use it as the
     signal that the player is being pushed */
  function closeCall() {
    streak += 5;
    bumpMultiplier();
    points += 25;
    counters.closeCalls++;
    bumpMission('closeCalls', 1, 'sum');
    if (calm < 1) difficulty = Math.max(0.3, difficulty - 0.02);
    calm = 0;
  }

  function deliveryComplete() {
    points += DELIVERY_BONUS;
    score = Math.floor(points);
    deliveries++;
    write(STORAGE_DELIVERIES, String(deliveries));
    bumpMission('deliveries', 1, 'sum');
    showBanner('Consegna completata!  +' + DELIVERY_BONUS, 3);
    sfx.bonus();
    renderScore();
    renderDeliveries();
    spawnCountdown = Math.max(spawnCountdown, speed * 1.4);   // short breather
  }

  /* ---------- spawning ---------- */
  function unlockedTypes(kind) {
    var out = [];
    for (var key in TYPES) {
      if (!Object.prototype.hasOwnProperty.call(TYPES, key)) continue;
      if (TYPES[key].unlock > difficulty) continue;
      if (kind && TYPES[key].kind !== kind) continue;
      out.push(key);
    }
    return out.length ? out : ['ketchup'];
  }

  function anyGround() {
    var pool = unlockedTypes('ground');
    return pool[(Math.random() * pool.length) | 0];
  }

  function anyType() {
    var pool = unlockedTypes();
    return pool[(Math.random() * pool.length) | 0];
  }

  /* every shape is spaced in seconds of travel, so it means the same thing at
     every speed. `forced` exists so the test suite can exercise one shape. */
  function spawnPattern(forced) {
    var canHang = spawnCount >= 2 && !wasHanging;
    var def = null;
    var i;
    for (i = 0; i < PATTERNS.length; i++) {
      if (PATTERNS[i].id === forced) def = PATTERNS[i];
    }
    if (!def) {
      if (forced) {
        def = SINGLE_DEF;
      } else {
        var pool = [];
        for (i = 0; i < PATTERNS.length; i++) {
          var cand = PATTERNS[i];
          if (cand.unlock > difficulty) continue;
          if (cand.needsHang && !canHang) continue;
          for (var w = 0; w < cand.weight; w++) pool.push(cand);
        }
        def = pool[(Math.random() * pool.length) | 0] || SINGLE_DEF;
      }
    }
    if (def.needsHang && !canHang) def = SINGLE_DEF;

    var keys = [];
    for (i = 0; i < def.keys.length; i++) {
      var k = def.keys[i];
      if (k === '?') k = canHang ? anyType() : anyGround();
      else if (k === '~') k = anyGround();
      if (TYPES[k].kind === 'hang' && !canHang) k = anyGround();
      keys.push(k);
    }

    var base = worldW + 20;
    var span = 0;
    var dx = 0;
    var prevW = 0;
    var hanging = false;

    for (i = 0; i < keys.length; i++) {
      if (i > 0) {
        var g = def.gaps[i - 1];
        dx += (g === JOIN) ? prevW : speed * g;
      }
      var item = makeObstacle(keys[i], base + dx);
      obstacles.push(item);
      span = Math.max(span, dx + item.w);
      prevW = item.w;
      if (TYPES[keys[i]].kind === 'hang') hanging = true;
    }

    wasHanging = hanging;
    spawnCount++;

    /* Obstacle spacing breathes with a slow wave on top of the difficulty
       curve, so the run has calm stretches instead of constant pressure. */
    var pulse = 0.5 + 0.5 * Math.sin(elapsed * 0.22);
    var baseGap = 1.55 - 0.75 * difficulty;
    var spread = 0.75 - 0.40 * difficulty;
    var gap = baseGap + pulse * 0.22 + Math.random() * spread;
    if (hanging || wasHanging) gap = Math.max(gap, 1.0);

    /* A power-up takes over the whole gap and sits in the MIDDLE of it. The
       landing zone right after an obstacle is the one place a pickup can never
       be reached: the player is back on the ground there, at rise ~0. */
    var powerDue = time >= nextPowerAt;
    var wantTrail = !powerDue && !hanging && Math.random() < 0.6;
    if (powerDue || wantTrail) gap += 0.55;

    if (wantTrail) spawnTrail(base + span, speed * gap);
    if (powerDue) {
      nextPowerAt = time + POWER_EVERY[0] + Math.random() * (POWER_EVERY[1] - POWER_EVERY[0]);
      spawnPower(base + span + speed * gap * 0.5);
    }

    spawnCountdown = span + speed * gap;
  }

  function makeObstacle(key, x) {
    var t = TYPES[key];
    var y, w = t.w;
    if (t.kind === 'hang') y = HANG_TOP;
    else if (t.kind === 'air') y = GROUND_Y - (18 + Math.random() * 6) - t.h;
    else if (t.kind === 'pit') {
      w = speed * PIT_TIME;                     // a pit has to scale with speed
      y = GROUND_Y - PIT_RISE;
    } else y = GROUND_Y - t.h;

    return {
      type: key, kind: t.kind,
      x: x, y: y, w: w, h: t.h,
      phase: Math.random() * TAU,
      passed: false,
      minClear: Infinity
    };
  }

  /* trails come in shapes, so a line of ingredients is also a route choice */
  function spawnTrail(fromX, usable) {
    var shapes = ['row', 'row', 'arc', 'wave', 'rise'];
    var shape = shapes[(Math.random() * shapes.length) | 0];
    var tiers = [68, 96, 124];
    var baseY = GROUND_Y - tiers[(Math.random() * tiers.length) | 0];
    var count = shape === 'row' ? 3 : 4;
    var spacing = 30;
    var rowW = (count - 1) * spacing;
    var startX = Math.max(fromX + 54, fromX + (usable - rowW) / 2);

    for (var i = 0; i < count; i++) {
      var t = count > 1 ? i / (count - 1) : 0.5;
      var dy = 0;
      if (shape === 'arc') dy = -Math.sin(t * Math.PI) * 22;
      else if (shape === 'wave') dy = Math.sin(t * Math.PI * 2) * 18;
      else if (shape === 'rise') dy = -t * 22;

      pickups.push({
        type: 'ingredient',
        kind: (burger + i) % LAYERS_PER_BURGER,
        x: startX + i * spacing,
        y: baseY + dy,
        r: PICKUP_R,
        t: Math.random() * TAU
      });
    }
  }

  function spawnPower(x) {
    var keys = Object.keys(POWERS);
    var kind = keys[(Math.random() * keys.length) | 0];
    /* tiers chosen so a plain TAP reaches them: the band a power of radius
       r + 24 covers is rise in (tier - 54, tier + 18), and a tap peaks at 116 */
    var tiers = [96, 112];
    pickups.push({
      type: 'power',
      power: kind,
      x: x,
      y: GROUND_Y - tiers[(Math.random() * tiers.length) | 0],
      r: PICKUP_R + 3,
      t: Math.random() * TAU
    });
  }

  /* ---------- update ---------- */
  function update(dt) {
    time += dt;
    elapsed += dt;

    /* ---- pacing: difficulty follows how comfortably the player is playing ---- */
    calm += dt;
    var rate = calm > CALM_AFTER ? RAMP_CALM : RAMP_PRESSED;
    difficulty = Math.min(1, difficulty + rate * dt);

    var turbo = time < turboUntil;
    var targetSpeed = (SPEED_START + (SPEED_MAX - SPEED_START) * difficulty) * (turbo ? TURBO_SPEED : 1);
    speed += (targetSpeed - speed) * Math.min(1, dt * 1.2);

    var nextStage = Math.floor(elapsed / STAGE_SECONDS) % STAGES.length;
    if (nextStage !== stageIndex) {
      stageIndex = nextStage;
      phaseCount++;
      showBanner(STAGES[stageIndex].name, 2.4);
      sfx.stage();
      if (phaseCount % PHASES_PER_DELIVERY === 0) deliveryComplete();
    }

    if (bannerUntil && time >= bannerUntil) {
      bannerUntil = 0;
      bannerEl.className = 'banner';
    }

    if (shieldArmed && time >= shieldUntil) shieldArmed = false;
    renderPowers();

    distance += speed * dt;
    points += (speed * dt / 10) * multiplier * (turbo ? TURBO_POINTS : 1);

    var nextScore = Math.floor(points);
    if (nextScore !== score) {
      score = nextScore;
      bumpMission('score', score, 'max');
      renderScore();
    }

    /* ---- player: slide first, then airborne physics ---- */
    if (player.sliding) {
      if (time >= player.slideUntil) {
        player.sliding = false;
        slideBtn.classList.remove('is-down');
      }
    } else if (player.vy !== 0 || !player.onGround) {
      /* releasing early shortens the jump, but never below MIN_RISE, so every
         obstacle stays clearable with a simple tap */
      var cut = !jumpHeld && player.vy < 0 && player.y <= GROUND_Y - PLAYER_H - MIN_RISE;
      var g = cut ? GRAVITY * JUMP_CUT : GRAVITY;
      if (player.diving) g *= 2.6;
      player.vy += g * dt;
      player.y += player.vy * dt;
      if (player.y >= GROUND_Y - PLAYER_H) {
        player.y = GROUND_Y - PLAYER_H;
        player.vy = 0;
        player.onGround = true;
        if (player.diving) startSlide();
      } else {
        player.onGround = false;
      }
    }

    /* ---- obstacles: scroll, score the pass, track how close it was ---- */
    var hb = playerBox();
    var i;
    for (i = obstacles.length - 1; i >= 0; i--) {
      var o = obstacles[i];
      o.x -= speed * dt;

      var ob = obstacleBox(o);
      var dx = axisGap(hb.x, hb.w, ob.x, ob.w);
      if (dx < 0) {
        var dy = axisGap(hb.y, hb.h, ob.y, ob.h);
        if (dy < o.minClear) o.minClear = dy;
      }

      if (!o.passed && o.x + o.w < player.x) {
        o.passed = true;
        if (o.minClear < CLOSE_CALL) closeCall();
        else { streak++; bumpMultiplier(); }
      }
      if (o.x + o.w < -30) obstacles.splice(i, 1);
    }

    /* ---- pickups: circular test with extra forgiveness, so a trail reads as
       collectable rather than as a pixel-perfect target ---- */
    var pcx = player.x + player.w / 2;
    var pcy = hb.y + hb.h / 2;
    var reach = PICKUP_R + PICKUP_FORGIVE;
    var magnet = time < magnetUntil;

    for (i = pickups.length - 1; i >= 0; i--) {
      var pk = pickups[i];
      pk.x -= speed * dt;

      if (magnet) {
        var mx = pcx - pk.x;
        var my = pcy - pk.y;
        var md = Math.sqrt(mx * mx + my * my);
        if (md < MAGNET_RANGE && md > 0.001) {
          var pull = MAGNET_PULL * dt;
          pk.x += (mx / md) * pull;
          pk.y += (my / md) * pull;
        }
      }

      if (pk.x + pk.r < -30) { pickups.splice(i, 1); continue; }

      var ddx = pcx - pk.x;
      var ddy = pcy - pk.y;
      var r = pk.r + PICKUP_FORGIVE;
      if (ddx * ddx + ddy * ddy < r * r) {
        pickups.splice(i, 1);
        if (pk.type === 'power') collectPower(pk.power);
        else collectIngredient(pk);
      }
    }

    spawnCountdown -= speed * dt;
    if (spawnCountdown <= 0) spawnPattern();

    /* ---- collision: hitboxes are inset, so near misses feel fair ---- */
    var invuln = turbo || time < invulnUntil;
    for (i = 0; i < obstacles.length; i++) {
      var ob2 = obstacleBox(obstacles[i]);
      if (!(hb.x < ob2.x + ob2.w && hb.x + hb.w > ob2.x &&
            hb.y < ob2.y + ob2.h && hb.y + hb.h > ob2.y)) continue;

      if (invuln) continue;

      if (shieldArmed) {
        shieldArmed = false;
        invulnUntil = time + INVULN_TIME;
        obstacles.splice(i, 1);
        i--;
        sfx.shield();
        showBanner('Scudo!', 1.2);
        renderPowers();
        continue;
      }

      gameOver();
      return;
    }
  }

  /* ---------- drawing helpers ---------- */
  function roundRect(x, y, w, h, r) {
    var rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  }

  /* ---------- player ---------- */
  /* the bitmap is already cropped to the artwork, so this is a plain rect with
     the BOTTOM-CENTRE pinned to the ground — standing, mid-jump and sliding all
     use the same anchor */
  function drawHeroSprite(feetY, centreX, squash, pose) {
    var h = HERO_H;
    var w = h * HERO.aspect;
    var bmp = HERO.frames[pose && HERO.animated ? 1 : 0];
    ctx.save();
    ctx.translate(centreX, feetY);
    ctx.scale(1, squash);
    ctx.drawImage(bmp, -w / 2, -h, w, h);
    ctx.restore();
  }

  function drawBurger(x, y, w, h) {
    roundRect(x + w * 0.07, y + h * 0.74, w * 0.86, h * 0.26, w * 0.13);
    ctx.fillStyle = P.bun;
    ctx.fill();

    roundRect(x + w * 0.02, y + h * 0.54, w * 0.96, h * 0.22, w * 0.1);
    ctx.fillStyle = P.patty;
    ctx.fill();

    roundRect(x + w * 0.05, y + h * 0.45, w * 0.9, h * 0.11, w * 0.05);
    ctx.fillStyle = P.cheese;
    ctx.fill();

    var lx = x + w * 0.03, ly = y + h * 0.45, lw = w * 0.94, seg = lw / 4, k;
    ctx.fillStyle = P.lettuce;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    for (k = 0; k < 4; k++) {
      ctx.quadraticCurveTo(lx + seg * k + seg / 2, ly + h * 0.1, lx + seg * (k + 1), ly);
    }
    ctx.lineTo(lx + lw, ly - h * 0.09);
    ctx.lineTo(lx, ly - h * 0.09);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = P.bunTop;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.03, y + h * 0.4);
    ctx.quadraticCurveTo(x + w * 0.03, y + h * 0.02, x + w * 0.5, y + h * 0.02);
    ctx.quadraticCurveTo(x + w * 0.97, y + h * 0.02, x + w * 0.97, y + h * 0.4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = P.seed;
    seedDot(x + w * 0.32, y + h * 0.21);
    seedDot(x + w * 0.5, y + h * 0.13);
    seedDot(x + w * 0.66, y + h * 0.25);
  }

  function seedDot(cx, cy) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, 1.9, 1.2, -0.4, 0, TAU);
    ctx.fill();
  }

  /* ---------- obstacles ---------- */
  function drawKetchup(o) {
    var x = o.x, y = o.y, w = o.w, h = o.h;
    roundRect(x + w * 0.22, y, w * 0.56, h * 0.18, w * 0.12);
    ctx.fillStyle = P.ketchupCap;
    ctx.fill();

    ctx.fillStyle = P.ketchupNeck;
    ctx.fillRect(x + w * 0.3, y + h * 0.16, w * 0.4, h * 0.1);

    roundRect(x, y + h * 0.24, w, h * 0.76, w * 0.26);
    ctx.fillStyle = P.ketchup;
    ctx.fill();

    roundRect(x + w * 0.12, y + h * 0.44, w * 0.76, h * 0.26, w * 0.08);
    ctx.fillStyle = P.label;
    ctx.fill();
  }

  function drawFries(o) {
    var x = o.x, y = o.y, w = o.w, h = o.h;
    var fw = w * 0.16, gap = w * 0.06, startX = x + w * 0.2, i;

    ctx.fillStyle = P.fries;
    for (i = 0; i < 3; i++) {
      roundRect(startX + i * (fw + gap), y + (i === 1 ? 0 : h * 0.09), fw, h * 0.6, fw * 0.35);
      ctx.fill();
    }

    roundRect(x, y + h * 0.42, w, h * 0.58, w * 0.08);
    ctx.fillStyle = P.friesBox;
    ctx.fill();

    ctx.fillStyle = P.label;
    ctx.fillRect(x, y + h * 0.57, w, h * 0.15);
  }

  function drawPlate(o) {
    var cx = o.x + o.w / 2, cy = o.y + o.h / 2;
    ctx.fillStyle = P.plate;
    ctx.beginPath();
    ctx.ellipse(cx, cy, o.w / 2, o.h / 2, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = P.plateIn;
    ctx.beginPath();
    ctx.ellipse(cx, cy - o.h * 0.1, o.w * 0.36, o.h * 0.28, 0, 0, TAU);
    ctx.fill();
  }

  function drawFly(o) {
    var cx = o.x + o.w / 2, cy = o.y + o.h / 2;
    var flap = (Math.sin(time * 18 + o.phase) * 0.5 + 0.5) * 2.5;

    ctx.fillStyle = P.wing;
    ctx.beginPath();
    ctx.ellipse(cx + o.w * 0.06, cy - o.h * 0.32 - flap, o.w * 0.4, o.h * 0.2, -0.4, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx - o.w * 0.06, cy - o.h * 0.32 - flap, o.w * 0.4, o.h * 0.2, 0.4, 0, TAU);
    ctx.fill();

    ctx.fillStyle = P.flyBody;
    ctx.beginPath();
    ctx.ellipse(cx, cy, o.w * 0.34, o.h * 0.4, 0, 0, TAU);
    ctx.fill();

    // head points left, towards the player
    ctx.fillStyle = P.flyHead;
    ctx.beginPath();
    ctx.arc(cx - o.w * 0.3, cy - o.h * 0.08, o.h * 0.22, 0, TAU);
    ctx.fill();

    ctx.fillStyle = P.flyEye;
    ctx.beginPath();
    ctx.arc(cx - o.w * 0.36, cy - o.h * 0.14, o.h * 0.07, 0, TAU);
    ctx.fill();
  }

  /* a pendant lamp: cable off the top of the playfield, wide shade at the
     bottom, sitting just too low to run under upright */
  function drawLamp(o) {
    var cx = o.x + o.w / 2;
    var bottom = o.y + o.h;

    ctx.strokeStyle = P.cable;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, o.y - 20);
    ctx.lineTo(cx, bottom - o.h * 0.22);
    ctx.stroke();

    ctx.fillStyle = P.shade;
    ctx.beginPath();
    ctx.moveTo(cx - o.w * 0.16, bottom - o.h * 0.22);
    ctx.lineTo(cx + o.w * 0.16, bottom - o.h * 0.22);
    ctx.lineTo(cx + o.w * 0.5, bottom);
    ctx.lineTo(cx - o.w * 0.5, bottom);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = P.shadeIn;
    roundRect(cx - o.w * 0.42, bottom - 5, o.w * 0.84, 4, 2);
    ctx.fill();
  }

  /* a hanging menu board, same idea with a squarer silhouette */
  function drawBoard(o) {
    var cx = o.x + o.w / 2;
    var bottom = o.y + o.h;

    ctx.strokeStyle = P.cable;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - o.w * 0.3, o.y - 20);
    ctx.lineTo(cx - o.w * 0.3, bottom - o.h * 0.34);
    ctx.moveTo(cx + o.w * 0.3, o.y - 20);
    ctx.lineTo(cx + o.w * 0.3, bottom - o.h * 0.34);
    ctx.stroke();

    roundRect(o.x, bottom - o.h * 0.34, o.w, o.h * 0.34, 4);
    ctx.fillStyle = P.shade;
    ctx.fill();

    ctx.fillStyle = P.label;
    roundRect(o.x + o.w * 0.16, bottom - o.h * 0.24, o.w * 0.68, 2.5, 1);
    ctx.fill();
    roundRect(o.x + o.w * 0.16, bottom - o.h * 0.16, o.w * 0.46, 2.5, 1);
    ctx.fill();
  }

  /* a hole in the ground with fries standing in it. It reopens the floor by
     painting the stage background back over the ground line, so the gap reads
     as an actual hole instead of a sprite parked on top of the road */
  function drawPit(o) {
    var x = o.x, w = o.w;
    var lip = o.y;                        // GROUND_Y - PIT_RISE
    var floor = o.y + o.h;

    ctx.fillStyle = STAGES[stageIndex].bg;
    ctx.fillRect(x, GROUND_Y - 3, w, floor - GROUND_Y + 6);

    ctx.fillStyle = '#08080a';
    ctx.fillRect(x, lip + 3, w, floor - lip - 3);

    ctx.strokeStyle = P.line;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, GROUND_Y + 1);
    ctx.lineTo(x, lip + 2);
    ctx.moveTo(x + w, GROUND_Y + 1);
    ctx.lineTo(x + w, lip + 2);
    ctx.stroke();

    // fries standing on the bottom, tips just clear of the ground line
    var n = Math.max(3, Math.round(w / 20));
    var slot = w / n;
    var fw = Math.max(3.5, Math.min(9, slot * 0.45));
    for (var i = 0; i < n; i++) {
      var fx = x + slot * (i + 0.5) - fw / 2;
      var fh = (floor - GROUND_Y) + 6 + (i % 2) * 5;
      roundRect(fx, floor - fh, fw, fh, fw * 0.4);
      ctx.fillStyle = P.fries;
      ctx.fill();
      ctx.strokeStyle = P.ketchupCap;
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
  }

  function drawObstacle(o) {
    if (o.type === 'ketchup') drawKetchup(o);
    else if (o.type === 'fries') drawFries(o);
    else if (o.type === 'plate') drawPlate(o);
    else if (o.type === 'fly') drawFly(o);
    else if (o.type === 'lamp') drawLamp(o);
    else if (o.type === 'pit') drawPit(o);
    else drawBoard(o);
  }

  /* ---------- pickups ---------- */
  function drawIngredient(pk) {
    var float = Math.sin(time * 2.4 + pk.t) * 2.5;
    var y = pk.y + float;

    ctx.fillStyle = 'rgba(255,255,255,.05)';
    ctx.beginPath();
    ctx.arc(pk.x, y, pk.r + 5, 0, TAU);
    ctx.fill();

    ctx.fillStyle = INGREDIENTS[pk.kind].color;
    ctx.beginPath();
    ctx.arc(pk.x, y, pk.r, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,.14)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }

  function drawPower(pk) {
    var float = Math.sin(time * 2.6 + pk.t) * 3;
    var y = pk.y + float;
    var color = POWERS[pk.power].color;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pk.x, y, pk.r + 5, 0, TAU);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,.05)';
    ctx.beginPath();
    ctx.arc(pk.x, y, pk.r + 4, 0, TAU);
    ctx.fill();

    ctx.fillStyle = color;
    var r = pk.r;
    if (pk.power === 'magnet') {
      // horseshoe
      ctx.lineWidth = 4;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.arc(pk.x, y + 1, r * 0.55, Math.PI, 0);
      ctx.moveTo(pk.x - r * 0.55, y + 1);
      ctx.lineTo(pk.x - r * 0.55, y + r * 0.55);
      ctx.moveTo(pk.x + r * 0.55, y + 1);
      ctx.lineTo(pk.x + r * 0.55, y + r * 0.55);
      ctx.stroke();
    } else if (pk.power === 'shield') {
      ctx.beginPath();
      ctx.moveTo(pk.x, y - r * 0.72);
      ctx.lineTo(pk.x + r * 0.62, y - r * 0.34);
      ctx.lineTo(pk.x + r * 0.5, y + r * 0.42);
      ctx.lineTo(pk.x, y + r * 0.8);
      ctx.lineTo(pk.x - r * 0.5, y + r * 0.42);
      ctx.lineTo(pk.x - r * 0.62, y - r * 0.34);
      ctx.closePath();
      ctx.fill();
    } else {
      // double chevron
      ctx.lineWidth = 3.4;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(pk.x - r * 0.5, y + r * 0.1);
      ctx.lineTo(pk.x, y - r * 0.5);
      ctx.lineTo(pk.x + r * 0.5, y + r * 0.1);
      ctx.moveTo(pk.x - r * 0.5, y + r * 0.6);
      ctx.lineTo(pk.x, y);
      ctx.lineTo(pk.x + r * 0.5, y + r * 0.6);
      ctx.stroke();
    }
  }

  /* ---------- scene ---------- */
  function drawGround() {
    ctx.strokeStyle = P.line;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 1);
    ctx.lineTo(worldW, GROUND_Y + 1);
    ctx.stroke();

    // a single calm line of dashes: a two-row pattern flickers at speed
    ctx.strokeStyle = P.pebble;
    ctx.beginPath();
    var step = 64;
    var off = distance % step;
    for (var x = -off; x < worldW + step; x += step) {
      ctx.moveTo(x, GROUND_Y + 10);
      ctx.lineTo(x + 16, GROUND_Y + 10);
    }
    ctx.stroke();
  }

  function render() {
    var st = STAGES[stageIndex];
    var sc = view.dpr * view.scale;
    ctx.setTransform(sc, 0, 0, sc, 0, view.dpr * view.offsetY);
    ctx.imageSmoothingEnabled = false;        // keep the pixel art crisp

    // flood the WHOLE canvas, including whatever sits above the world when the
    // screen is taller than the playfield
    ctx.fillStyle = st.bg;
    ctx.fillRect(-4, view.top, worldW + 8, view.bottom - view.top);

    // flat, low-contrast horizon band instead of a glowing gradient
    ctx.fillStyle = st.tint;
    ctx.fillRect(0, GROUND_Y - 96, worldW, 96);

    // a very soft warm wash while turbo is running: motion cue without glare
    if (time < turboUntil) {
      ctx.fillStyle = P.turboTrail;
      ctx.fillRect(-4, view.top, worldW + 8, view.bottom - view.top);
    }

    drawGround();

    // pits go down first: they repaint the floor, so nothing else may be under them
    var i;
    for (i = 0; i < obstacles.length; i++) {
      if (obstacles[i].kind === 'pit') drawPit(obstacles[i]);
    }

    for (i = 0; i < pickups.length; i++) {
      if (pickups[i].type === 'power') drawPower(pickups[i]);
      else drawIngredient(pickups[i]);
    }
    for (i = 0; i < obstacles.length; i++) {
      if (obstacles[i].kind !== 'pit') drawObstacle(obstacles[i]);
    }

    /* Run cycle. The pose is tied to the ground actually covered, so the stride
       speeds up with the game instead of looking like a moonwalk, and only the
       grounded running state animates. */
    var bob = 0;
    var pose = 0;
    if (state === 'ready') {
      bob = Math.sin(time * 4) * 1.5 - 1.5;
    } else if (state === 'running' && player.onGround && !player.sliding) {
      var cyc = distance / HERO_STRIDE;
      pose = Math.floor(cyc) % 2;
      bob = -Math.abs(Math.sin(cyc * Math.PI)) * 2.4;
    }

    var air = Math.max(0, (GROUND_Y - PLAYER_H - player.y) / 130);
    ctx.fillStyle = P.shadow;
    ctx.beginPath();
    ctx.ellipse(player.x + player.w / 2, GROUND_Y + 2, (player.w / 2) * (1 - air * 0.45), 3.5, 0, 0, TAU);
    ctx.fill();

    // a skid mark, so a slide is unmistakable even on a small screen
    if (player.sliding) {
      ctx.strokeStyle = 'rgba(255,255,255,.16)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(player.x - 12, GROUND_Y + 1);
      ctx.lineTo(player.x + player.w + 4, GROUND_Y + 1);
      ctx.stroke();
    }

    drawAuras();

    if (HERO.ready) {
      // pixel art: nearest-neighbour, anchored at the feet
      drawHeroSprite(player.y + player.h + bob, player.x + player.w / 2,
        player.sliding ? HERO_SQUASH : 1, pose);
    } else if (player.sliding) {
      drawBurger(player.x, GROUND_Y - SLIDE_DRAW_H, player.w, SLIDE_DRAW_H);
    } else {
      drawBurger(player.x, player.y + bob, player.w, player.h);
    }
  }

  /* One ring per active power-up. The clearest possible "something is on" cue,
     and it travels with the player instead of sitting in a screen corner. */
  function drawAuras() {
    var cx = player.x + player.w / 2;
    var cy = player.y + player.h / 2;
    var rings = [];
    if (shieldArmed) rings.push({ color: P.shield, r: 29, fill: P.shieldShell });
    if (time < magnetUntil) rings.push({ color: P.magnet, r: 35 });
    if (time < turboUntil) rings.push({ color: P.turbo, r: 41 });

    for (var i = 0; i < rings.length; i++) {
      var r = rings[i].r + Math.sin(time * 3 + i) * 1.5;
      if (rings[i].fill) {
        ctx.fillStyle = rings[i].fill;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, TAU);
        ctx.fill();
      }
      ctx.strokeStyle = rings[i].color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, TAU);
      ctx.stroke();
    }
  }

  /* ---------- loop ---------- */
  var lastTime = 0;

  function frame(ts) {
    window.requestAnimationFrame(frame);

    if (!lastTime) lastTime = ts;
    var dt = (ts - lastTime) / 1000;
    lastTime = ts;

    // clamp after a tab switch or a long frame, so nothing teleports
    if (dt > 1 / 20) dt = 1 / 20;
    if (dt < 0) dt = 0;

    if (state === 'running' && dt > 0) update(dt);
    else if (state === 'ready') time += dt;

    render();
  }

  /* ---------- input ---------- */
  function primary() {
    ensureAudio();

    if (state === 'running') jump();
    else if (state === 'paused') resume();
    else start();          // covers both 'ready' and 'over'
  }

  ovBtn.addEventListener('click', primary);

  /* The pad below the screen. Jump keeps hold-to-go-higher, so it is a real
     press and release rather than a tap. */
  function releaseJump() {
    jumpHeld = false;
    jumpBtn.classList.remove('is-down');
  }

  /* One press helper for both pad buttons: pointer events where they exist, and
     a touch/mouse pair where they do not, so the pad cannot end up dead on an
     older mobile browser. */
  function onPress(el, handler) {
    if (typeof window.PointerEvent === 'function') {
      el.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        handler();
      });
    } else {
      el.addEventListener('touchstart', function (e) {
        e.preventDefault();
        handler();
      }, { passive: false });
      el.addEventListener('mousedown', function (e) {
        e.preventDefault();
        handler();
      });
    }
  }

  onPress(jumpBtn, function () {
    primary();
    jumpHeld = true;
    jumpBtn.classList.add('is-down');
  });
  jumpBtn.addEventListener('pointerup', releaseJump);
  jumpBtn.addEventListener('pointercancel', releaseJump);
  jumpBtn.addEventListener('pointerleave', releaseJump);

  onPress(slideBtn, function () {
    ensureAudio();
    slideBtn.classList.add('is-down');
    if (state === 'running') slide();
  });
  // safety: never leave a button stuck highlighted
  slideBtn.addEventListener('pointerup', function () { slideBtn.classList.remove('is-down'); });
  slideBtn.addEventListener('pointercancel', function () { slideBtn.classList.remove('is-down'); });
  slideBtn.addEventListener('pointerleave', function () { slideBtn.classList.remove('is-down'); });

  window.addEventListener('pointerup', releaseJump);
  window.addEventListener('pointercancel', releaseJump);
  stageEl.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  window.addEventListener('keydown', function (e) {
    // let a focused button handle its own Enter / Space activation
    if (e.target && e.target.tagName === 'BUTTON') return;
    if (e.repeat) return;

    var code = e.code;
    if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW' || code === 'Enter') {
      e.preventDefault();
      primary();
      jumpHeld = true;
      jumpBtn.classList.add('is-down');
      return;
    }
    if (code === 'ArrowDown' || code === 'KeyS') {
      e.preventDefault();
      if (state === 'running') slide();
    }
  });

  window.addEventListener('keyup', function (e) {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Enter') {
      releaseJump();
    }
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      saveMissions();
      pause();
    }
  });

  /* iOS Safari ignores user-scalable=no, and touch-action does not cover its
     pinch on older versions: the gesture events are the only reliable hook. */
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (name) {
    document.addEventListener(name, function (e) { e.preventDefault(); }, { passive: false });
  });

  muteBtn.addEventListener('click', function () {
    muted = !muted;
    write(STORAGE_MUTE, muted ? '1' : '0');
    renderMute();
    if (!muted) {
      ensureAudio();
      sfx.stage();
    }
  });

  /* ---------- boot ---------- */
  function onResize() { resize(); render(); }

  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);
  if (window.ResizeObserver) new ResizeObserver(onResize).observe(stageEl);

  missions = loadMissions();
  saveMissions();
  loadHero();

  resize();
  renderScore();
  renderBurger();
  renderDeliveries();
  renderTrophies();
  renderMute();
  showOverlay('ready');
  window.requestAnimationFrame(frame);
})();
