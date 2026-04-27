// variation-gallery.jsx — "Gallery": immersive, full-bleed canvas, gesture-driven controls

function GalleryVariation() {
  const [drawer, setDrawer] = useState(null); // 'formula' | 'range' | 'style' | null
  const [presetIdx, setPresetIdx] = useState(0);
  const [toast, setToast] = useState(null);
  const initial = FE_PRESETS[0];
  const s = useFormulaState({
    formula: initial.formula,
    range: initial.range,
    pattern: initial.pattern,
    paletteId: 'neon',
  });
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 1500); };

  const swipePreset = (dir) => {
    const next = (presetIdx + dir + FE_PRESETS.length) % FE_PRESETS.length;
    const p = FE_PRESETS[next];
    setPresetIdx(next);
    s.setFormula(p.formula); s.setRange(p.range); s.setPattern(p.pattern);
    s.regenerate();
  };

  return (
    <div style={gs.shell}>
      <div style={gs.bg}>
        <FormulaCanvas formula={s.formula} range={s.range} pattern={s.pattern} palette={s.palette} generation={s.generation} error={s.error} bg="#000" />
      </div>

      {/* Top overlay */}
      <div style={gs.top}>
        <div style={gs.galleryLabel}>
          <div style={gs.idx}>{String(presetIdx + 1).padStart(2, '0')} / {String(FE_PRESETS.length).padStart(2, '0')}</div>
          <div style={gs.title}>{FE_PRESETS[presetIdx]?.name || 'Custom'}</div>
        </div>
        <button style={gs.menuBtn} onClick={() => setDrawer('formula')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Side swipers */}
      <button style={{ ...gs.swipe, left: 0 }} onClick={() => swipePreset(-1)} aria-label="prev">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 6l-6 6 6 6" /></svg>
      </button>
      <button style={{ ...gs.swipe, right: 0 }} onClick={() => swipePreset(1)} aria-label="next">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
      </button>

      {/* Bottom dock */}
      <div style={gs.dock}>
        <div style={gs.formulaPill} onClick={() => setDrawer('formula')}>
          <span style={gs.formulaSymbol}>ƒ</span>
          <span style={gs.formulaText}>{s.formula}</span>
        </div>
        <div style={gs.dockRow}>
          <DockBtn label="Formula" active={drawer === 'formula'} onClick={() => setDrawer(drawer === 'formula' ? null : 'formula')} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 4h6a3 3 0 013 3v2M5 12h12M9 20l-2-8M15 20l2-8" /></svg>} />
          <DockBtn label="Range"   active={drawer === 'range'}   onClick={() => setDrawer(drawer === 'range' ? null : 'range')}   icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12h16M6 8v8M18 8v8M10 6v12M14 6v12" /></svg>} />
          <DockBtn label="Style"   active={drawer === 'style'}   onClick={() => setDrawer(drawer === 'style' ? null : 'style')}   icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><circle cx="8" cy="9" r="1" fill="currentColor" /><circle cx="14" cy="8" r="1" fill="currentColor" /><circle cx="16" cy="13" r="1" fill="currentColor" /></svg>} />
          <DockBtn label="Save"    onClick={() => { exportPng({ formula: s.formula, range: s.range, pattern: s.pattern, paletteId: s.paletteId }); showToast('Saved'); }} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 3h11l3 3v14a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z" /><path d="M8 3v6h7V3" /></svg>} />
          <DockBtn label="Share"   onClick={async () => { const url = shareUrl({ formula: s.formula, range: s.range, pattern: s.pattern, paletteId: s.paletteId }); try { await navigator.clipboard.writeText(url); showToast('Link copied'); } catch { showToast('Link ready'); } }} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" /></svg>} />
        </div>
      </div>

      {/* Drawers */}
      {drawer === 'formula' && (
        <Drawer title="Formula" onClose={() => setDrawer(null)}>
          <textarea
            value={s.formula}
            onChange={(e) => s.setFormula(e.target.value)}
            rows={2}
            style={gs.code}
            spellCheck={false}
          />
          {s.error && <div style={{ color: '#ff8080', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>{s.error}</div>}
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>QUICK INSERT</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4 }}>
            {['sin', 'cos', 'tan', 'sqrt', 'mod', 'abs', 'x', 'y', 'i', 'pi', '*', '^'].map((t) => (
              <button key={t} style={gs.opBtn} onClick={() => s.setFormula(s.formula + (t.length > 1 && !'pi'.includes(t) && t !== 'x' && t !== 'y' && t !== 'i' ? `${t}()` : t))}>{t}</button>
            ))}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', marginTop: 8 }}>PRESETS</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {FE_PRESETS.map((p, i) => (
              <button key={p.id} style={{ ...gs.presetChip, ...(i === presetIdx ? gs.presetChipActive : null) }} onClick={() => { setPresetIdx(i); s.setFormula(p.formula); s.setRange(p.range); s.setPattern(p.pattern); s.regenerate(); }}>
                {p.name}
              </button>
            ))}
          </div>
          <button style={gs.primary} onClick={() => { s.regenerate(); setDrawer(null); }}>Generate</button>
        </Drawer>
      )}

      {drawer === 'range' && (
        <Drawer title="Range" onClose={() => setDrawer(null)}>
          <RangeBlock label="Min" value={s.range[0]} min={-100} max={s.range[1] - 1} onChange={(v) => s.setRange([v, s.range[1], s.range[2]])} />
          <RangeBlock label="Max" value={s.range[1]} min={s.range[0] + 1} max={100} onChange={(v) => s.setRange([s.range[0], v, s.range[2]])} />
          <RangeBlock label="Step" value={s.range[2]} min={0.5} max={5} step={0.5} onChange={(v) => s.setRange([s.range[0], s.range[1], v])} />
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.5)', borderTop: '1px solid rgba(255,255,255,0.08)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em' }}>
            <span>SAMPLES</span>
            <span style={{ color: '#fff' }}>{Math.max(2, Math.floor((s.range[1] - s.range[0]) / s.range[2]) + 1)}</span>
          </div>
          <button style={gs.primary} onClick={() => { s.regenerate(); setDrawer(null); }}>Generate</button>
        </Drawer>
      )}

      {drawer === 'style' && (
        <Drawer title="Style" onClose={() => setDrawer(null)}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>PATTERN</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {['grid', 'rings', 'spiral', 'wave', 'flow', 'tile'].map((p) => (
              <button key={p} style={{ ...gs.tileBtn, ...(s.pattern === p ? gs.tileBtnActive : null) }} onClick={() => { s.setPattern(p); s.regenerate(); }}>
                {p}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', marginTop: 8 }}>PALETTE</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Object.entries(FE_PALETTES).map(([id, pal]) => (
              <button key={id} style={{ ...gs.palBar, ...(s.paletteId === id ? gs.palBarActive : null) }} onClick={() => { s.setPaletteId(id); s.regenerate(); }}>
                <div style={{ display: 'flex', flex: 1, height: 16, borderRadius: 3, overflow: 'hidden' }}>
                  {Array.from({ length: 12 }, (_, i) => <div key={i} style={{ flex: 1, background: paletteAt(pal, i / 11) }} />)}
                </div>
                <span style={{ marginLeft: 10, fontSize: 11, color: '#fff', minWidth: 60, textAlign: 'right' }}>{pal.name}</span>
              </button>
            ))}
          </div>
        </Drawer>
      )}

      {toast && <div style={gs.toast}>{toast}</div>}
    </div>
  );
}

function DockBtn({ label, active, onClick, icon }) {
  return (
    <button style={{ ...gs.dockBtn, ...(active ? gs.dockBtnActive : null) }} onClick={onClick}>
      {icon}
      <span style={{ fontSize: 9, marginTop: 2, letterSpacing: '0.08em' }}>{label}</span>
    </button>
  );
}

function Drawer({ title, onClose, children }) {
  return (
    <div style={gs.drawerBg} onClick={onClose}>
      <div style={gs.drawer} onClick={(e) => e.stopPropagation()}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)', margin: '0 auto 14px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '0.05em' }}>{title}</div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 4 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
      </div>
    </div>
  );
}

function RangeBlock({ label, value, min, max, step = 1, onChange }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 10, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)', fontFamily: 'JetBrains Mono, monospace' }}>{label.toUpperCase()}</span>
        <input type="number" value={value} step={step} onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          style={{ width: 60, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '2px 6px', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, textAlign: 'right' }} />
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#a78bfa' }} />
    </div>
  );
}

const gs = {
  shell: { width: '100%', height: '100%', background: '#000', color: '#fff', position: 'relative', overflow: 'hidden', fontFamily: '"Space Grotesk", system-ui, sans-serif' },
  bg: { position: 'absolute', inset: 0 },
  top: { position: 'absolute', top: 0, left: 0, right: 0, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 5, background: 'linear-gradient(180deg, rgba(0,0,0,0.5), transparent)' },
  galleryLabel: {},
  idx: { fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.2em', fontFamily: 'JetBrains Mono, monospace' },
  title: { fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em', marginTop: 2 },
  menuBtn: { width: 36, height: 36, borderRadius: 18, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' },
  swipe: { position: 'absolute', top: '40%', width: 40, height: 60, background: 'rgba(0,0,0,0.2)', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4 },
  dock: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: '12px 14px 16px', background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 30%, rgba(0,0,0,0.4) 80%, transparent)', zIndex: 5, display: 'flex', flexDirection: 'column', gap: 10 },
  formulaPill: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)', borderRadius: 30, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' },
  formulaSymbol: { fontFamily: 'JetBrains Mono, monospace', fontSize: 14, color: '#a78bfa', fontWeight: 700 },
  formulaText: { fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 },
  dockRow: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 },
  dockBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 0', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontFamily: 'inherit' },
  dockBtnActive: { background: 'rgba(167,139,250,0.18)', borderColor: '#a78bfa', color: '#fff' },
  drawerBg: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10, display: 'flex', alignItems: 'flex-end' },
  drawer: { width: '100%', maxHeight: '80%', background: '#13111a', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: '12px 16px 22px', overflow: 'auto', borderTop: '1px solid rgba(167,139,250,0.2)' },
  code: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 12, color: '#fff', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, resize: 'none', width: '100%', boxSizing: 'border-box', outline: 'none' },
  opBtn: { padding: '8px 0', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: '#fff', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, cursor: 'pointer' },
  primary: { padding: '12px 0', background: 'linear-gradient(135deg, #a78bfa, #ec4899)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, letterSpacing: '0.04em', marginTop: 6 },
  presetChip: { padding: '6px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, color: 'rgba(255,255,255,0.7)', fontFamily: 'inherit', fontSize: 11, cursor: 'pointer' },
  presetChipActive: { background: 'rgba(167,139,250,0.18)', borderColor: '#a78bfa', color: '#fff' },
  tileBtn: { padding: '14px 0', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: 'rgba(255,255,255,0.7)', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, cursor: 'pointer' },
  tileBtnActive: { background: 'rgba(167,139,250,0.18)', borderColor: '#a78bfa', color: '#fff' },
  palBar: { display: 'flex', alignItems: 'center', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' },
  palBarActive: { borderColor: '#a78bfa', background: 'rgba(167,139,250,0.1)' },
  toast: { position: 'absolute', left: '50%', bottom: 130, transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.95)', color: '#000', padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, zIndex: 20, fontFamily: 'JetBrains Mono, monospace' },
};

window.GalleryVariation = GalleryVariation;
