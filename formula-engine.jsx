// formula-engine.jsx
// Shared engine: tiny safe expression parser, palettes, presets,
// and the 6 pattern renderers (canvas-based). Exports to window.

// ─────────────────────────────────────────────────────────────
// Expression evaluator (recursive descent, supports + - * / %, ^,
// parens, unary -, identifiers x, y, i, t, n, and Math.* funcs).
// ─────────────────────────────────────────────────────────────
const FE_FNS = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan,
  asin: Math.asin, acos: Math.acos, atan: Math.atan, atan2: Math.atan2,
  sqrt: Math.sqrt, abs: Math.abs, exp: Math.exp, log: Math.log,
  floor: Math.floor, ceil: Math.ceil, round: Math.round,
  min: Math.min, max: Math.max, pow: Math.pow,
  sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
  sign: Math.sign, hypot: Math.hypot, mod: (a, b) => ((a % b) + b) % b,
};
const FE_CONSTS = { pi: Math.PI, PI: Math.PI, e: Math.E, E: Math.E, tau: Math.PI * 2, TAU: Math.PI * 2 };

function feTokenize(src) {
  const tokens = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < src.length && /[0-9.]/.test(src[j])) j++;
      tokens.push({ t: 'num', v: parseFloat(src.slice(i, j)) });
      i = j; continue;
    }
    if (/[a-zA-Z_]/.test(c)) {
      let j = i;
      while (j < src.length && /[a-zA-Z0-9_]/.test(src[j])) j++;
      tokens.push({ t: 'id', v: src.slice(i, j) });
      i = j; continue;
    }
    if ('+-*/%^(),'.includes(c)) {
      tokens.push({ t: c }); i++; continue;
    }
    throw new Error('Unexpected character: ' + c);
  }
  return tokens;
}

function feParse(src) {
  const tokens = feTokenize(src);
  let pos = 0;
  const peek = () => tokens[pos];
  const eat = (t) => {
    const tk = tokens[pos];
    if (!tk || tk.t !== t) throw new Error('Expected ' + t);
    pos++; return tk;
  };
  // Pratt-ish: expr -> term (+/- term)*
  function parseExpr() { return parseAdd(); }
  function parseAdd() {
    let left = parseMul();
    while (peek() && (peek().t === '+' || peek().t === '-')) {
      const op = peek().t; pos++;
      const right = parseMul();
      left = { op, left, right };
    }
    return left;
  }
  function parseMul() {
    let left = parsePow();
    while (peek() && (peek().t === '*' || peek().t === '/' || peek().t === '%')) {
      const op = peek().t; pos++;
      const right = parsePow();
      left = { op, left, right };
    }
    return left;
  }
  function parsePow() {
    const left = parseUnary();
    if (peek() && peek().t === '^') {
      pos++;
      const right = parsePow(); // right-assoc
      return { op: '^', left, right };
    }
    return left;
  }
  function parseUnary() {
    if (peek() && peek().t === '-') { pos++; return { op: 'neg', child: parseUnary() }; }
    if (peek() && peek().t === '+') { pos++; return parseUnary(); }
    return parseAtom();
  }
  function parseAtom() {
    const tk = peek();
    if (!tk) throw new Error('Unexpected end');
    if (tk.t === 'num') { pos++; return { num: tk.v }; }
    if (tk.t === '(') { pos++; const e = parseExpr(); eat(')'); return e; }
    if (tk.t === 'id') {
      pos++;
      if (peek() && peek().t === '(') {
        pos++;
        const args = [];
        if (peek() && peek().t !== ')') {
          args.push(parseExpr());
          while (peek() && peek().t === ',') { pos++; args.push(parseExpr()); }
        }
        eat(')');
        return { call: tk.v, args };
      }
      return { id: tk.v };
    }
    throw new Error('Unexpected token');
  }
  const ast = parseExpr();
  if (pos !== tokens.length) throw new Error('Trailing input');
  return ast;
}

function feEval(ast, ctx) {
  if ('num' in ast) return ast.num;
  if ('id' in ast) {
    if (ast.id in ctx) return ctx[ast.id];
    if (ast.id in FE_CONSTS) return FE_CONSTS[ast.id];
    throw new Error('Unknown id ' + ast.id);
  }
  if ('call' in ast) {
    const fn = FE_FNS[ast.call];
    if (!fn) throw new Error('Unknown fn ' + ast.call);
    return fn(...ast.args.map((a) => feEval(a, ctx)));
  }
  if (ast.op === 'neg') return -feEval(ast.child, ctx);
  const l = feEval(ast.left, ctx), r = feEval(ast.right, ctx);
  switch (ast.op) {
    case '+': return l + r;
    case '-': return l - r;
    case '*': return l * r;
    case '/': return l / r;
    case '%': return ((l % r) + r) % r;
    case '^': return Math.pow(l, r);
  }
  throw new Error('bad op');
}

function feCompile(src) {
  const ast = feParse(src);
  return (ctx) => {
    try { return feEval(ast, ctx); } catch { return 0; }
  };
}

// ─────────────────────────────────────────────────────────────
// Palettes — share chroma; vary hue. Each is a function t∈[0,1] → rgb hex.
// ─────────────────────────────────────────────────────────────
function lerp(a, b, t) { return a + (b - a) * t; }
function oklchToHex(L, C, H) {
  // Approximate oklch→sRGB. Good enough for pattern coloring.
  const Hr = H * Math.PI / 180;
  const a = C * Math.cos(Hr), b = C * Math.sin(Hr);
  // OKLab → linear sRGB
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  let r =  4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  let bl = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
  // Linear → sRGB
  const toSrgb = (x) => {
    const c = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(Math.max(x, 0), 1/2.4) - 0.055;
    return Math.max(0, Math.min(1, c));
  };
  r = toSrgb(r); g = toSrgb(g); bl = toSrgb(bl);
  const h = (n) => Math.round(n * 255).toString(16).padStart(2, '0');
  return '#' + h(r) + h(g) + h(bl);
}

const FE_PALETTES = {
  ember:    { name: 'Ember',    stops: [[0.18, 0.04, 25], [0.55, 0.18, 35], [0.78, 0.20, 60], [0.92, 0.16, 90]] },
  lagoon:   { name: 'Lagoon',   stops: [[0.15, 0.04, 250], [0.45, 0.16, 220], [0.70, 0.18, 190], [0.90, 0.12, 150]] },
  neon:     { name: 'Neon',     stops: [[0.20, 0.06, 300], [0.50, 0.22, 320], [0.70, 0.24, 200], [0.92, 0.20, 140]] },
  mono:     { name: 'Mono',     stops: [[0.10, 0, 0], [0.35, 0, 0], [0.65, 0, 0], [0.95, 0, 0]] },
  sunset:   { name: 'Sunset',   stops: [[0.18, 0.05, 280], [0.45, 0.18, 350], [0.68, 0.20, 30], [0.92, 0.18, 70]] },
};

function paletteAt(palette, t) {
  const stops = palette.stops;
  t = Math.max(0, Math.min(1, t));
  const seg = t * (stops.length - 1);
  const i = Math.floor(seg);
  const f = seg - i;
  const a = stops[i], b = stops[Math.min(stops.length - 1, i + 1)];
  return oklchToHex(lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2], b[2], f));
}

// ─────────────────────────────────────────────────────────────
// Presets
// ─────────────────────────────────────────────────────────────
const FE_PRESETS = [
  { id: 'interference', name: 'Interference',  formula: 'sin(x*0.4) + cos(y*0.4)',                    range: [0, 40, 1], pattern: 'grid' },
  { id: 'rings',        name: 'Standing waves', formula: 'sin(sqrt(x*x + y*y)*0.5)',                  range: [-20, 20, 1], pattern: 'rings' },
  { id: 'spiral',       name: 'Phyllotaxis',    formula: 'sin(i*0.1) * cos(i*0.137)',                 range: [0, 600, 1], pattern: 'spiral' },
  { id: 'wave',         name: 'Beat frequency', formula: 'sin(x*0.3) * cos(x*0.05)',                  range: [0, 200, 1], pattern: 'wave' },
  { id: 'flow',         name: 'Curl noise',     formula: 'sin(x*0.1) + cos(y*0.1)',                   range: [0, 60, 2], pattern: 'flow' },
  { id: 'tile',         name: 'Quasicrystal',   formula: 'cos(x*0.5) + cos(y*0.5) + cos((x+y)*0.4)',  range: [0, 30, 1], pattern: 'tile' },
  { id: 'modulus',      name: 'Modulus field',  formula: 'mod(x*x + y*y, 17)',                        range: [-15, 15, 1], pattern: 'grid' },
  { id: 'saddle',       name: 'Saddle bloom',   formula: 'x*x - y*y',                                 range: [-10, 10, 1], pattern: 'grid' },
];

// ─────────────────────────────────────────────────────────────
// Renderers — all canvas-based. Each takes (ctx, opts):
//   { w, h, formula(string), range:[min,max,step], palette, progress (0..1) }
// progress is the reveal animation 0→1.
// ─────────────────────────────────────────────────────────────
function feSampleField(formula, range) {
  // Build a 2D grid of values for renderers that want it.
  const fn = feCompile(formula);
  const [lo, hi, step] = range;
  const n = Math.max(2, Math.min(80, Math.floor((hi - lo) / step) + 1));
  const vals = new Float32Array(n * n);
  let vmin = Infinity, vmax = -Infinity;
  for (let yi = 0; yi < n; yi++) {
    const y = lo + yi * step;
    for (let xi = 0; xi < n; xi++) {
      const x = lo + xi * step;
      const i = yi * n + xi;
      const v = fn({ x, y, i, t: 0, n: i });
      vals[yi * n + xi] = v;
      if (Number.isFinite(v)) {
        if (v < vmin) vmin = v;
        if (v > vmax) vmax = v;
      }
    }
  }
  if (vmin === vmax) { vmax = vmin + 1; }
  return { vals, n, vmin, vmax };
}

function feSample1D(formula, range) {
  const fn = feCompile(formula);
  const [lo, hi, step] = range;
  const n = Math.max(2, Math.min(2000, Math.floor((hi - lo) / step) + 1));
  const vals = new Float32Array(n);
  let vmin = Infinity, vmax = -Infinity;
  for (let i = 0; i < n; i++) {
    const x = lo + i * step;
    const v = fn({ x, y: 0, i, t: 0, n: i });
    vals[i] = v;
    if (Number.isFinite(v)) {
      if (v < vmin) vmin = v;
      if (v > vmax) vmax = v;
    }
  }
  if (vmin === vmax) { vmax = vmin + 1; }
  return { vals, n, vmin, vmax };
}

const FE_RENDERERS = {
  grid(ctx, { w, h, formula, range, palette, progress }) {
    const { vals, n, vmin, vmax } = feSampleField(formula, range);
    const cell = Math.min(w, h) / n;
    const offX = (w - cell * n) / 2;
    const offY = (h - cell * n) / 2;
    const totalCells = n * n;
    const reveal = Math.floor(totalCells * progress);
    for (let yi = 0; yi < n; yi++) {
      for (let xi = 0; xi < n; xi++) {
        // diagonal sweep order
        const order = (xi + yi) * n + Math.min(xi, yi);
        if (order > reveal * 2) continue;
        const v = vals[yi * n + xi];
        const t = (v - vmin) / (vmax - vmin);
        ctx.fillStyle = paletteAt(palette, t);
        const pad = cell * 0.06;
        ctx.fillRect(offX + xi * cell + pad, offY + yi * cell + pad, cell - pad * 2, cell - pad * 2);
      }
    }
  },

  rings(ctx, { w, h, formula, range, palette, progress }) {
    const fn = feCompile(formula);
    const [lo, hi, step] = range;
    const cx = w / 2, cy = h / 2;
    const rmax = Math.min(w, h) / 2 - 6;
    const count = Math.max(8, Math.min(120, Math.floor((hi - lo) / step) + 1));
    // sample values
    const vals = []; let vmin = Infinity, vmax = -Infinity;
    for (let i = 0; i < count; i++) {
      const x = lo + (hi - lo) * (i / (count - 1));
      const v = fn({ x, y: x, i, t: 0, n: i });
      vals.push(v); if (v < vmin) vmin = v; if (v > vmax) vmax = v;
    }
    if (vmin === vmax) vmax = vmin + 1;
    const visible = Math.floor(count * progress);
    for (let i = count - 1; i >= 0; i--) {
      if (i > visible) continue;
      const r = (i + 1) / count * rmax;
      const t = (vals[i] - vmin) / (vmax - vmin);
      ctx.fillStyle = paletteAt(palette, t);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  spiral(ctx, { w, h, formula, range, palette, progress }) {
    const fn = feCompile(formula);
    const [lo, hi, step] = range;
    const count = Math.max(20, Math.min(2000, Math.floor((hi - lo) / step) + 1));
    const cx = w / 2, cy = h / 2;
    const rmax = Math.min(w, h) / 2 - 8;
    const phi = Math.PI * (3 - Math.sqrt(5));
    const vals = []; let vmin = Infinity, vmax = -Infinity;
    for (let i = 0; i < count; i++) {
      const x = lo + i * step;
      const v = fn({ x, y: x, i, t: 0, n: i });
      vals.push(v); if (v < vmin) vmin = v; if (v > vmax) vmax = v;
    }
    if (vmin === vmax) vmax = vmin + 1;
    const visible = Math.floor(count * progress);
    const dotR = Math.max(1.5, rmax / Math.sqrt(count) * 0.6);
    for (let i = 0; i < visible; i++) {
      const r = Math.sqrt(i / count) * rmax;
      const a = i * phi;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      const t = (vals[i] - vmin) / (vmax - vmin);
      ctx.fillStyle = paletteAt(palette, t);
      ctx.beginPath();
      ctx.arc(px, py, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  wave(ctx, { w, h, formula, range, palette, progress }) {
    const { vals, n, vmin, vmax } = feSample1D(formula, range);
    const strips = 12;
    const stripH = h / strips;
    const visible = progress;
    for (let s = 0; s < strips; s++) {
      const baseY = s * stripH + stripH / 2;
      const t = s / (strips - 1);
      ctx.strokeStyle = paletteAt(palette, t);
      ctx.lineWidth = Math.max(1.5, stripH * 0.18);
      ctx.lineCap = 'round';
      ctx.beginPath();
      const cutoff = Math.floor(n * visible);
      for (let i = 0; i < cutoff; i++) {
        const x = (i / (n - 1)) * w;
        const v = (vals[i] - vmin) / (vmax - vmin);
        const phase = s * 0.5;
        const y = baseY + Math.sin(v * Math.PI * 2 + phase) * stripH * 0.45;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  },

  flow(ctx, { w, h, formula, range, palette, progress }) {
    const fn = feCompile(formula);
    const [lo, hi, step] = range;
    const cols = Math.max(8, Math.min(40, Math.floor((hi - lo) / step) + 1));
    const cellW = w / cols, cellH = h / cols;
    // sample angles
    const angles = []; let vmin = Infinity, vmax = -Infinity;
    for (let yi = 0; yi < cols; yi++) {
      for (let xi = 0; xi < cols; xi++) {
        const x = lo + xi * step, y = lo + yi * step;
        const v = fn({ x, y, i: yi * cols + xi, t: 0, n: yi * cols + xi });
        angles.push(v);
        if (v < vmin) vmin = v;
        if (v > vmax) vmax = v;
      }
    }
    if (vmin === vmax) vmax = vmin + 1;
    const total = cols * cols;
    const visible = Math.floor(total * progress);
    for (let idx = 0; idx < visible; idx++) {
      const xi = idx % cols, yi = Math.floor(idx / cols);
      const cx = xi * cellW + cellW / 2;
      const cy = yi * cellH + cellH / 2;
      const v = angles[idx];
      const t = (v - vmin) / (vmax - vmin);
      const ang = v * Math.PI;
      const len = Math.min(cellW, cellH) * 0.5;
      ctx.strokeStyle = paletteAt(palette, t);
      ctx.lineWidth = Math.max(1.2, len * 0.18);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - Math.cos(ang) * len * 0.5, cy - Math.sin(ang) * len * 0.5);
      ctx.lineTo(cx + Math.cos(ang) * len * 0.5, cy + Math.sin(ang) * len * 0.5);
      ctx.stroke();
      // dot at head
      ctx.fillStyle = paletteAt(palette, t);
      ctx.beginPath();
      ctx.arc(cx + Math.cos(ang) * len * 0.5, cy + Math.sin(ang) * len * 0.5, ctx.lineWidth * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  tile(ctx, { w, h, formula, range, palette, progress }) {
    const { vals, n, vmin, vmax } = feSampleField(formula, range);
    const cell = Math.min(w, h) / n;
    const offX = (w - cell * n) / 2;
    const offY = (h - cell * n) / 2;
    const total = n * n;
    const visible = Math.floor(total * progress);
    let drawn = 0;
    for (let yi = 0; yi < n; yi++) {
      for (let xi = 0; xi < n; xi++) {
        if (drawn++ > visible) continue;
        const v = vals[yi * n + xi];
        const t = (v - vmin) / (vmax - vmin);
        ctx.fillStyle = paletteAt(palette, t);
        const cx = offX + xi * cell + cell / 2;
        const cy = offY + yi * cell + cell / 2;
        const rot = t * Math.PI * 2;
        const size = cell * 0.5 * (0.5 + t * 0.6);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.fillRect(-size, -size, size * 2, size * 2);
        ctx.restore();
      }
    }
  },
};

// ─────────────────────────────────────────────────────────────
// URL state codec (compact)
// ─────────────────────────────────────────────────────────────
function feEncodeState(s) {
  try {
    return btoa(encodeURIComponent(JSON.stringify(s)));
  } catch { return ''; }
}
function feDecodeState(str) {
  try {
    return JSON.parse(decodeURIComponent(atob(str)));
  } catch { return null; }
}

Object.assign(window, {
  feCompile, feSampleField, feSample1D,
  FE_PALETTES, FE_PRESETS, FE_RENDERERS,
  paletteAt, feEncodeState, feDecodeState,
});
