// variation-console.jsx — "Console": terminal/lab-instrument styled, command-line feel

function ConsoleVariation() {
  const [toast, setToast] = useState(null);
  const [showPresets, setShowPresets] = useState(false);
  const s = useFormulaState({
    formula: 'sin(sqrt(x*x + y*y)*0.5)',
    range: [-20, 20, 1],
    pattern: 'rings',
    paletteId: 'lagoon',
  });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 1600); };

  const PATS = ['grid', 'rings', 'spiral', 'wave', 'flow', 'tile'];
  const PALS = Object.keys(FE_PALETTES);

  return (
    <div style={cs.shell}>
      <div style={cs.topBar}>
        <div style={cs.dotRow}>
          <span style={{ ...cs.dot, background: '#ff5f57' }} />
          <span style={{ ...cs.dot, background: '#febc2e' }} />
          <span style={{ ...cs.dot, background: '#28c840' }} />
        </div>
        <div style={cs.topTitle}>field.console — v0.4</div>
        <div style={cs.topRight}>{s.error ? 'ERR' : 'OK'}</div>
      </div>

      <div style={cs.canvasWrap}>
        <FormulaCanvas formula={s.formula} range={s.range} pattern={s.pattern} palette={s.palette} generation={s.generation} error={s.error} bg="#06070a" />
        <div style={cs.crosshair}>
          <div style={{ position: 'absolute', left: 0, top: '50%', right: 0, height: 1, background: 'rgba(120,200,255,0.08)' }} />
          <div style={{ position: 'absolute', top: 0, left: '50%', bottom: 0, width: 1, background: 'rgba(120,200,255,0.08)' }} />
          <div style={cs.corner('tl')} />
          <div style={cs.corner('tr')} />
          <div style={cs.corner('bl')} />
          <div style={cs.corner('br')} />
        </div>
        <div style={cs.readout}>
          <div><span style={cs.lbl}>n</span> {Math.max(2, Math.floor((s.range[1] - s.range[0]) / s.range[2]) + 1)}</div>
          <div><span style={cs.lbl}>p</span> {s.pattern}</div>
          <div><span style={cs.lbl}>c</span> {s.paletteId}</div>
        </div>
      </div>

      <div style={cs.panel}>
        <div style={cs.row}>
          <span style={cs.prompt}>ƒ&gt;</span>
          <input
            value={s.formula}
            onChange={(e) => s.setFormula(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') s.regenerate(); }}
            style={cs.input}
            spellCheck={false}
          />
        </div>
        {s.error && <div style={cs.errLine}>! {s.error}</div>}

        <div style={cs.rangeRow}>
          <RangeField label="lo" value={s.range[0]} onChange={(v) => s.setRange([v, s.range[1], s.range[2]])} />
          <RangeField label="hi" value={s.range[1]} onChange={(v) => s.setRange([s.range[0], v, s.range[2]])} />
          <RangeField label="dx" value={s.range[2]} onChange={(v) => s.setRange([s.range[0], s.range[1], Math.max(0.1, v)])} />
        </div>

        <div style={cs.sliderRow}>
          <input type="range" min={-100} max={s.range[1] - 1} step={1} value={s.range[0]}
            onChange={(e) => s.setRange([parseFloat(e.target.value), s.range[1], s.range[2]])} style={cs.slider} />
          <input type="range" min={s.range[0] + 1} max={100} step={1} value={s.range[1]}
            onChange={(e) => s.setRange([s.range[0], parseFloat(e.target.value), s.range[2]])} style={cs.slider} />
        </div>

        <div style={cs.chips}>
          {PATS.map((p) => (
            <button key={p} onClick={() => { s.setPattern(p); s.regenerate(); }} style={{ ...cs.chip, ...(s.pattern === p ? cs.chipActive : null) }}>
              {p}
            </button>
          ))}
        </div>
        <div style={cs.chips}>
          {PALS.map((p) => (
            <button key={p} onClick={() => { s.setPaletteId(p); s.regenerate(); }} style={{ ...cs.chip, ...(s.paletteId === p ? cs.chipActive : null) }}>
              <span style={{ display: 'inline-flex', height: 6, width: 18, marginRight: 6, verticalAlign: 'middle', borderRadius: 2, overflow: 'hidden' }}>
                {[0, 0.33, 0.66, 1].map((t, i) => <span key={i} style={{ flex: 1, background: paletteAt(FE_PALETTES[p], t), display: 'inline-block', width: '25%', height: '100%' }} />)}
              </span>
              {p}
            </button>
          ))}
        </div>

        <div style={cs.actions}>
          <button style={cs.btnGhost} onClick={() => setShowPresets(true)}>./presets</button>
          <button style={cs.btnGhost} onClick={async () => {
            const url = shareUrl({ formula: s.formula, range: s.range, pattern: s.pattern, paletteId: s.paletteId });
            try { await navigator.clipboard.writeText(url); showToast('link → clipboard'); } catch { showToast('link ready'); }
          }}>./share</button>
          <button style={cs.btnGhost} onClick={() => { exportPng({ formula: s.formula, range: s.range, pattern: s.pattern, paletteId: s.paletteId }); showToast('saved.png'); }}>./export</button>
          <button style={cs.btnRun} onClick={s.regenerate}>RUN ▸</button>
        </div>
      </div>

      {showPresets && (
        <div style={cs.sheetBg} onClick={() => setShowPresets(false)}>
          <div style={cs.sheet} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#7ec4d6', marginBottom: 12, letterSpacing: '0.1em' }}>$ ls ./presets</div>
            {FE_PRESETS.map((p) => (
              <button key={p.id} style={cs.presetRow} onClick={() => { s.setFormula(p.formula); s.setRange(p.range); s.setPattern(p.pattern); s.regenerate(); setShowPresets(false); showToast('loaded ' + p.id); }}>
                <span style={{ color: '#7ec4d6', width: 14 }}>›</span>
                <span style={{ width: 110, color: '#fff' }}>{p.name}</span>
                <span style={{ flex: 1, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.formula}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {toast && <div style={cs.toast}>{toast}</div>}
    </div>
  );
}

function RangeField({ label, value, onChange }) {
  return (
    <div style={cs.field}>
      <span style={cs.fieldLbl}>{label}</span>
      <input type="number" value={value} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} style={cs.fieldInput} />
    </div>
  );
}

const cs = {
  shell: { width: '100%', height: '100%', background: '#06070a', color: '#cfe6ee', display: 'flex', flexDirection: 'column', fontFamily: '"JetBrains Mono", monospace', overflow: 'hidden', position: 'relative' },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid rgba(126,196,214,0.12)', flexShrink: 0 },
  dotRow: { display: 'flex', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: '50%' },
  topTitle: { fontSize: 11, color: 'rgba(207,230,238,0.6)', letterSpacing: '0.1em' },
  topRight: { fontSize: 10, color: '#7ec4d6', letterSpacing: '0.1em', padding: '2px 6px', border: '1px solid rgba(126,196,214,0.3)', borderRadius: 3 },
  canvasWrap: { width: 'calc(100% - 24px)', aspectRatio: '1 / 1', margin: '12px 12px 8px', position: 'relative', border: '1px solid rgba(126,196,214,0.2)', flexShrink: 0 },
  crosshair: { position: 'absolute', inset: 0, pointerEvents: 'none' },
  corner: (pos) => ({
    position: 'absolute',
    width: 10, height: 10,
    borderColor: 'rgba(126,196,214,0.5)',
    [pos[0] === 't' ? 'top' : 'bottom']: -1,
    [pos[1] === 'l' ? 'left' : 'right']: -1,
    borderTopWidth: pos[0] === 't' ? 1 : 0,
    borderBottomWidth: pos[0] === 'b' ? 1 : 0,
    borderLeftWidth: pos[1] === 'l' ? 1 : 0,
    borderRightWidth: pos[1] === 'r' ? 1 : 0,
    borderStyle: 'solid',
  }),
  readout: { position: 'absolute', top: 8, left: 8, display: 'flex', flexDirection: 'column', gap: 2, fontSize: 9, color: '#7ec4d6', letterSpacing: '0.1em', background: 'rgba(6,7,10,0.7)', padding: '6px 8px', backdropFilter: 'blur(6px)' },
  lbl: { color: 'rgba(126,196,214,0.5)', marginRight: 6 },
  panel: { padding: '8px 12px 14px', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto', flex: 1 },
  row: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(126,196,214,0.06)', border: '1px solid rgba(126,196,214,0.18)', borderRadius: 4 },
  prompt: { color: '#7ec4d6', fontSize: 13, fontWeight: 700 },
  input: { flex: 1, background: 'transparent', border: 'none', color: '#fff', fontFamily: 'inherit', fontSize: 13, outline: 'none' },
  errLine: { fontSize: 11, color: '#ff7a85', padding: '0 4px' },
  rangeRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 },
  field: { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'rgba(126,196,214,0.05)', border: '1px solid rgba(126,196,214,0.15)', borderRadius: 3 },
  fieldLbl: { color: 'rgba(126,196,214,0.7)', fontSize: 10, letterSpacing: '0.1em' },
  fieldInput: { flex: 1, width: '100%', minWidth: 0, background: 'transparent', border: 'none', color: '#fff', fontFamily: 'inherit', fontSize: 12, outline: 'none', textAlign: 'right' },
  sliderRow: { display: 'flex', flexDirection: 'column', gap: 2 },
  slider: { width: '100%', accentColor: '#7ec4d6', height: 16 },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 4 },
  chip: { padding: '6px 10px', background: 'transparent', border: '1px solid rgba(126,196,214,0.2)', color: 'rgba(207,230,238,0.6)', fontFamily: 'inherit', fontSize: 11, cursor: 'pointer', borderRadius: 3 },
  chipActive: { background: 'rgba(126,196,214,0.15)', borderColor: '#7ec4d6', color: '#fff' },
  actions: { display: 'flex', gap: 6, marginTop: 4 },
  btnGhost: { flex: 1, padding: '8px 0', background: 'transparent', border: '1px solid rgba(126,196,214,0.2)', color: 'rgba(207,230,238,0.7)', fontFamily: 'inherit', fontSize: 11, cursor: 'pointer', borderRadius: 3 },
  btnRun: { flex: 1.4, padding: '8px 0', background: '#7ec4d6', border: 'none', color: '#06070a', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, cursor: 'pointer', borderRadius: 3, letterSpacing: '0.08em' },
  sheetBg: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 10, display: 'flex', alignItems: 'flex-end' },
  sheet: { width: '100%', maxHeight: '70%', background: '#0a0c10', padding: '14px', overflow: 'auto', borderTop: '1px solid rgba(126,196,214,0.3)' },
  presetRow: { width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', background: 'transparent', border: 'none', borderBottom: '1px dashed rgba(126,196,214,0.1)', color: 'inherit', fontFamily: 'inherit', fontSize: 12, cursor: 'pointer', textAlign: 'left' },
  toast: { position: 'absolute', left: '50%', bottom: 16, transform: 'translateX(-50%)', background: '#7ec4d6', color: '#06070a', padding: '6px 12px', borderRadius: 3, fontSize: 11, fontWeight: 700, zIndex: 20, fontFamily: 'inherit' },
};

window.ConsoleVariation = ConsoleVariation;
