// visualizer-core.jsx — Shared FormulaCanvas + useFormulaState

const { useState, useEffect, useRef, useCallback, useMemo } = React;

function useFormulaState(initial) {
  const [formula, setFormula] = useState(initial.formula);
  const [range, setRange] = useState(initial.range);
  const [pattern, setPattern] = useState(initial.pattern);
  const [paletteId, setPaletteId] = useState(initial.paletteId || 'ember');
  const [error, setError] = useState(null);
  const [generation, setGeneration] = useState(0); // bumps to trigger re-render

  // validate formula
  useEffect(() => {
    try {
      const fn = feCompile(formula);
      fn({ x: 1, y: 1, i: 1, t: 0, n: 1 });
      setError(null);
    } catch (e) {
      setError(e.message || 'Invalid formula');
    }
  }, [formula]);

  const regenerate = useCallback(() => setGeneration((g) => g + 1), []);

  return {
    formula, setFormula,
    range, setRange,
    pattern, setPattern,
    paletteId, setPaletteId,
    palette: FE_PALETTES[paletteId],
    error,
    generation, regenerate,
  };
}

// ─────────────────────────────────────────────────────────────
// FormulaCanvas — renders to <canvas>, handles reveal animation
// triggered by `generation` bumps. Bg is dark (variant by theme).
// ─────────────────────────────────────────────────────────────
function FormulaCanvas({ formula, range, pattern, palette, generation, error, bg = '#0b0a0d', onRender, style, dpr }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const startRef = useRef(0);
  const [size, setSize] = useState({ w: 320, h: 320 });
  const wrapRef = useRef(null);

  // observe size — measure synchronously on mount AND watch for changes,
  // so a remount (e.g. interface switch) paints with the correct dims
  // instead of being stuck on default 320×320 until the RO catches up.
  useEffect(() => {
    if (!wrapRef.current) return;
    const measure = () => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const w = Math.max(80, Math.floor(r.width));
      const h = Math.max(80, Math.floor(r.height));
      setSize((cur) => (cur.w === w && cur.h === h) ? cur : { w, h });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrapRef.current);
    // safety pass after first paint in case layout settles late
    const raf = requestAnimationFrame(measure);
    return () => { ro.disconnect(); cancelAnimationFrame(raf); };
  }, []);

  // animate
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    if (error) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const px = dpr || (window.devicePixelRatio || 1);
    canvas.width = size.w * px;
    canvas.height = size.h * px;
    canvas.style.width = size.w + 'px';
    canvas.style.height = size.h + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(px, 0, 0, px, 0, 0);
    const renderer = FE_RENDERERS[pattern] || FE_RENDERERS.grid;
    const DURATION = 900;
    startRef.current = performance.now();

    const tick = () => {
      const elapsed = performance.now() - startRef.current;
      const p = Math.min(1, elapsed / DURATION);
      // ease-out
      const eased = 1 - Math.pow(1 - p, 3);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, size.w, size.h);
      try {
        renderer(ctx, { w: size.w, h: size.h, formula, range, palette, progress: eased });
      } catch (e) {
        ctx.fillStyle = '#ff6464';
        ctx.font = '12px JetBrains Mono, monospace';
        ctx.fillText('render error', 12, 24);
      }
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else if (onRender) onRender();
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [formula, range[0], range[1], range[2], pattern, palette, generation, size.w, size.h, bg, error]);

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', height: '100%', background: bg, ...style }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
      {error && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#ff8080', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, padding: 24, textAlign: 'center',
        }}>
          {error}
        </div>
      )}
    </div>
  );
}

// Helper: download canvas-equivalent PNG by rendering offscreen at higher res
async function exportPng(state, filename = 'formula.png') {
  const W = 1600, H = 1600;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0b0a0d';
  ctx.fillRect(0, 0, W, H);
  const renderer = FE_RENDERERS[state.pattern] || FE_RENDERERS.grid;
  renderer(ctx, { w: W, h: H, formula: state.formula, range: state.range, palette: FE_PALETTES[state.paletteId], progress: 1 });
  const url = c.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
}

function shareUrl(state) {
  const enc = feEncodeState(state);
  const u = new URL(location.href);
  u.searchParams.set('v', enc);
  return u.toString();
}

Object.assign(window, { useFormulaState, FormulaCanvas, exportPng, shareUrl });
