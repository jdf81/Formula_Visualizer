// variation-studio.jsx — "Studio": polished, full controls panel below preview

const PATTERNS_A = [
  { id: 'grid',   label: 'Grid' },
  { id: 'rings',  label: 'Rings' },
  { id: 'spiral', label: 'Spiral' },
  { id: 'wave',   label: 'Waves' },
  { id: 'flow',   label: 'Flow' },
  { id: 'tile',   label: 'Tile' },
];

function StudioVariation() {
  const [tab, setTab] = useState('formula'); // formula | range | style
  const [showPresets, setShowPresets] = useState(false);
  const [toast, setToast] = useState(null);

  const s = useFormulaState({
    formula: 'sin(x*0.4) + cos(y*0.4)',
    range: [0, 40, 1],
    pattern: 'grid',
    paletteId: 'ember',
  });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  const onPickPreset = (p) => {
    s.setFormula(p.formula);
    s.setRange(p.range);
    s.setPattern(p.pattern);
    setShowPresets(false);
    setTab('formula');
    s.regenerate();
    showToast('Loaded · ' + p.name);
  };

  const onExportPng = () => {
    exportPng({ formula: s.formula, range: s.range, pattern: s.pattern, paletteId: s.paletteId });
    showToast('PNG saved');
  };

  const onShare = async () => {
    const url = shareUrl({ formula: s.formula, range: s.range, pattern: s.pattern, paletteId: s.paletteId });
    try { await navigator.clipboard.writeText(url); showToast('Link copied'); }
    catch { showToast('Link ready'); }
  };

  return (
    <div style={st.shell}>
      <Header onPresets={() => setShowPresets(true)} onShare={onShare} onExport={onExportPng} />

      <div style={st.canvasWrap}>
        <FormulaCanvas
          formula={s.formula}
          range={s.range}
          pattern={s.pattern}
          palette={s.palette}
          generation={s.generation}
          error={s.error}
          bg="#0c0a10"
        />
        <FormulaBadge formula={s.formula} pattern={s.pattern} />
      </div>

      <Tabs tab={tab} setTab={setTab} />

      <div style={st.body}>
        {tab === 'formula' && (
          <FormulaTab
            value={s.formula}
            onChange={s.setFormula}
            error={s.error}
            onGenerate={s.regenerate}
          />
        )}
        {tab === 'range' && (
          <RangeTab range={s.range} setRange={s.setRange} onGenerate={s.regenerate} />
        )}
        {tab === 'style' && (
          <StyleTab pattern={s.pattern} setPattern={s.setPattern} paletteId={s.paletteId} setPaletteId={s.setPaletteId} onGenerate={s.regenerate} />
        )}
      </div>

      {showPresets && <PresetsSheet onPick={onPickPreset} onClose={() => setShowPresets(false)} />}
      {toast && <Toast text={toast} />}
    </div>
  );
}

function Header({ onPresets, onShare, onExport }) {
  return (
    <div style={st.header}>
      <button style={st.iconBtn} onClick={onPresets} aria-label="Presets">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      </button>
      <div style={st.brand}>
        <div style={st.brandDot} />
        <div>
          <div style={st.brandTitle}>FIELD</div>
          <div style={st.brandSub}>formula visualizer</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button style={st.iconBtn} onClick={onShare} aria-label="Share">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
          </svg>
        </button>
        <button style={st.iconBtn} onClick={onExport} aria-label="Export">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function FormulaBadge({ formula, pattern }) {
  return (
    <div style={st.badge}>
      <div style={st.badgePattern}>{pattern}</div>
      <div style={st.badgeFormula}>ƒ = {formula}</div>
    </div>
  );
}

function Tabs({ tab, setTab }) {
  const items = [
    { id: 'formula', label: 'Formula' },
    { id: 'range',   label: 'Range' },
    { id: 'style',   label: 'Style' },
  ];
  return (
    <div style={st.tabs}>
      {items.map((it) => (
        <button
          key={it.id}
          style={{ ...st.tab, ...(tab === it.id ? st.tabActive : null) }}
          onClick={() => setTab(it.id)}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

function FormulaTab({ value, onChange, error, onGenerate }) {
  const ops = ['sin', 'cos', 'tan', 'sqrt', 'abs', 'mod', 'x', 'y', 'i', 'pi', '+', '-', '*', '/', '^', '(', ')'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label style={st.label}>ƒ(x, y, i)</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        style={{
          ...st.codeInput,
          borderColor: error ? '#ff5060' : 'rgba(255,255,255,0.08)',
        }}
        spellCheck={false}
      />
      <div style={{ fontSize: 11, color: error ? '#ff8080' : 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono, monospace' }}>
        {error || 'Variables: x, y, i · Constants: pi, e, tau · Functions: sin, cos, sqrt, mod, abs…'}
      </div>
      <div style={st.opGrid}>
        {ops.map((op) => (
          <button
            key={op}
            style={st.opBtn}
            onClick={() => {
              const v = value;
              const insert = (op === 'sin' || op === 'cos' || op === 'tan' || op === 'sqrt' || op === 'abs' || op === 'mod') ? `${op}()` : op;
              onChange(v + insert);
            }}
          >
            {op}
          </button>
        ))}
      </div>
      <button style={st.primary} onClick={onGenerate} disabled={!!error}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 12l5 5L20 7" />
        </svg>
        Generate
      </button>
    </div>
  );
}

function RangeTab({ range, setRange, onGenerate }) {
  const [lo, hi, step] = range;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <RangeRow label="From" value={lo} min={-100} max={100} step={1} onChange={(v) => setRange([v, hi, step])} />
      <RangeRow label="To"   value={hi} min={-100} max={100} step={1} onChange={(v) => setRange([lo, v, step])} />
      <RangeRow label="Step" value={step} min={0.5} max={5} step={0.5} onChange={(v) => setRange([lo, hi, v])} />
      <div style={st.rangeStat}>
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>samples</span>
        <span style={{ color: '#fff', fontFamily: 'JetBrains Mono, monospace' }}>
          {Math.max(2, Math.floor((hi - lo) / step) + 1)}
        </span>
      </div>
      <button style={st.primary} onClick={onGenerate}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 12l5 5L20 7" />
        </svg>
        Generate
      </button>
    </div>
  );
}

function RangeRow({ label, value, min, max, step, onChange }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={st.label}>{label}</span>
        <input
          type="number"
          value={value}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          style={st.numInput}
        />
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={st.slider}
      />
    </div>
  );
}

function StyleTab({ pattern, setPattern, paletteId, setPaletteId, onGenerate }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={st.label}>Pattern</div>
        <div style={st.patternGrid}>
          {PATTERNS_A.map((p) => (
            <button
              key={p.id}
              style={{ ...st.patternCard, ...(pattern === p.id ? st.patternCardActive : null) }}
              onClick={() => { setPattern(p.id); onGenerate(); }}
            >
              <PatternThumb id={p.id} active={pattern === p.id} />
              <div style={{ fontSize: 11, marginTop: 4 }}>{p.label}</div>
            </button>
          ))}
        </div>
      </div>
      <div>
        <div style={st.label}>Palette</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Object.entries(FE_PALETTES).map(([id, pal]) => (
            <button
              key={id}
              style={{ ...st.palRow, ...(paletteId === id ? st.palRowActive : null) }}
              onClick={() => { setPaletteId(id); onGenerate(); }}
            >
              <div style={{ display: 'flex', flex: 1, height: 18, borderRadius: 4, overflow: 'hidden' }}>
                {Array.from({ length: 12 }, (_, i) => (
                  <div key={i} style={{ flex: 1, background: paletteAt(pal, i / 11) }} />
                ))}
              </div>
              <span style={{ fontSize: 12, marginLeft: 12, color: paletteId === id ? '#fff' : 'rgba(255,255,255,0.6)' }}>{pal.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PatternThumb({ id, active }) {
  const stroke = active ? '#fff' : 'rgba(255,255,255,0.5)';
  const common = { width: 28, height: 28, viewBox: '0 0 28 28', fill: 'none', stroke, strokeWidth: 1.5 };
  switch (id) {
    case 'grid':   return <svg {...common}><rect x="4" y="4" width="6" height="6" /><rect x="11" y="4" width="6" height="6" /><rect x="18" y="4" width="6" height="6" /><rect x="4" y="11" width="6" height="6" /><rect x="11" y="11" width="6" height="6" /><rect x="18" y="11" width="6" height="6" /><rect x="4" y="18" width="6" height="6" /><rect x="11" y="18" width="6" height="6" /><rect x="18" y="18" width="6" height="6" /></svg>;
    case 'rings':  return <svg {...common}><circle cx="14" cy="14" r="10" /><circle cx="14" cy="14" r="6" /><circle cx="14" cy="14" r="2.5" /></svg>;
    case 'spiral': return <svg {...common}><path d="M14 14 m-2 0 a2 2 0 1 0 4 0 a4 4 0 1 0 -8 0 a6 6 0 1 0 12 0 a8 8 0 1 0 -16 0" /></svg>;
    case 'wave':   return <svg {...common}><path d="M3 9 q3.5 -5 7 0 t7 0 t7 0" /><path d="M3 19 q3.5 -5 7 0 t7 0 t7 0" /></svg>;
    case 'flow':   return <svg {...common}><path d="M5 8l4 4M11 5l4 4M17 8l4 4M5 16l4 4M11 19l4 4" strokeLinecap="round" /></svg>;
    case 'tile':   return <svg {...common}><rect x="4" y="4" width="8" height="8" transform="rotate(15 8 8)" /><rect x="16" y="4" width="8" height="8" transform="rotate(-15 20 8)" /><rect x="4" y="16" width="8" height="8" transform="rotate(-15 8 20)" /><rect x="16" y="16" width="8" height="8" transform="rotate(15 20 20)" /></svg>;
  }
  return null;
}

function PresetsSheet({ onPick, onClose }) {
  return (
    <div style={st.sheetBg} onClick={onClose}>
      <div style={st.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>Preset gallery</div>
          <button style={st.iconBtn} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {FE_PRESETS.map((p) => <PresetCard key={p.id} preset={p} onClick={() => onPick(p)} />)}
        </div>
      </div>
    </div>
  );
}

function PresetCard({ preset, onClick }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const W = 160, H = 110;
    c.width = W * dpr; c.height = H * dpr;
    c.style.width = W + 'px'; c.style.height = H + 'px';
    const ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0c0a10';
    ctx.fillRect(0, 0, W, H);
    const renderer = FE_RENDERERS[preset.pattern];
    renderer(ctx, { w: W, h: H, formula: preset.formula, range: preset.range, palette: FE_PALETTES.ember, progress: 1 });
  }, [preset]);
  return (
    <button style={st.presetCard} onClick={onClick}>
      <canvas ref={ref} style={{ display: 'block', borderRadius: 6 }} />
      <div style={{ marginTop: 8, fontSize: 12, color: '#fff', textAlign: 'left', fontWeight: 500 }}>{preset.name}</div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{preset.formula}</div>
    </button>
  );
}

function Toast({ text }) {
  return <div style={st.toast}>{text}</div>;
}

const st = {
  shell: { width: '100%', height: '100%', background: '#0c0a10', color: '#fff', display: 'flex', flexDirection: 'column', fontFamily: '"Space Grotesk", system-ui, sans-serif', overflow: 'hidden', position: 'relative' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px', flexShrink: 0 },
  brand: { display: 'flex', alignItems: 'center', gap: 10 },
  brandDot: { width: 10, height: 10, borderRadius: '50%', background: 'linear-gradient(135deg, #ff7a3d, #ffd06b)', boxShadow: '0 0 12px rgba(255,122,61,0.5)' },
  brandTitle: { fontSize: 13, fontWeight: 700, letterSpacing: '0.18em' },
  brandSub: { fontSize: 9, color: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em', marginTop: 1 },
  iconBtn: { width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  canvasWrap: { width: 'calc(100% - 32px)', aspectRatio: '1 / 1', margin: '0 16px 12px', borderRadius: 14, overflow: 'hidden', position: 'relative', border: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 },
  badge: { position: 'absolute', left: 10, bottom: 10, right: 10, display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 10px', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' },
  badgePattern: { fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', fontFamily: 'JetBrains Mono, monospace' },
  badgeFormula: { fontSize: 12, color: '#fff', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  tabs: { display: 'flex', gap: 4, padding: '0 16px 8px', flexShrink: 0 },
  tab: { flex: 1, padding: '8px 0', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', borderBottom: '1.5px solid transparent', fontWeight: 500 },
  tabActive: { color: '#fff', borderBottomColor: '#ff7a3d' },
  body: { padding: '14px 16px 18px', overflow: 'auto', flex: 1 },
  label: { fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', fontFamily: 'JetBrains Mono, monospace' },
  codeInput: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px 14px', color: '#fff', fontFamily: 'JetBrains Mono, monospace', fontSize: 14, resize: 'none', width: '100%', boxSizing: 'border-box', outline: 'none' },
  opGrid: { display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 4 },
  opBtn: { padding: '8px 0', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, color: 'rgba(255,255,255,0.85)', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 },
  primary: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 0', background: 'linear-gradient(135deg, #ff7a3d, #ffaa54)', border: 'none', borderRadius: 10, color: '#1a0e08', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, letterSpacing: '0.04em', marginTop: 4, boxShadow: '0 6px 24px rgba(255,122,61,0.25)' },
  numInput: { width: 70, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '4px 8px', color: '#fff', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, textAlign: 'right' },
  slider: { width: '100%', accentColor: '#ff7a3d' },
  rangeStat: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px dashed rgba(255,255,255,0.08)', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase' },
  patternGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 8 },
  patternCard: { padding: '12px 6px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'inherit' },
  patternCardActive: { background: 'rgba(255,122,61,0.12)', borderColor: '#ff7a3d', color: '#fff' },
  palRow: { display: 'flex', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' },
  palRowActive: { borderColor: '#ff7a3d', background: 'rgba(255,122,61,0.08)' },
  sheetBg: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', zIndex: 10, animation: 'fadeIn 0.2s ease' },
  sheet: { width: '100%', maxHeight: '80%', background: '#13111a', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: '16px 16px 24px', overflow: 'auto', borderTop: '1px solid rgba(255,255,255,0.08)' },
  presetCard: { padding: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit' },
  toast: { position: 'absolute', left: '50%', bottom: 24, transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.95)', color: '#0c0a10', padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, zIndex: 20, fontFamily: 'JetBrains Mono, monospace' },
};

window.StudioVariation = StudioVariation;
