// theme.jsx — design tokens, icons, shared primitives
// All exports attached to window for cross-file access in Babel scripts.

const PALETTES = {
  emerald: { a: '#10b981', b: '#06b6d4', name: 'Emerald · Cyan' },
  teal:    { a: '#22d3ee', b: '#a78bfa', name: 'Teal · Violet' },
  mint:    { a: '#34d399', b: '#f5f5f5', name: 'Mint · Bone' },
  amber:   { a: '#f59e0b', b: '#10b981', name: 'Amber · Emerald' },
};

// Theme tokens. Use via `useTheme()` or `getTheme(mode, palette)`.
function getTheme(mode, paletteKey) {
  const dark = mode === 'dark';
  const p = PALETTES[paletteKey] || PALETTES.emerald;
  return {
    mode,
    dark,
    accent: p.a,
    accent2: p.b,
    paletteName: p.name,
    // Surfaces
    bg:        dark ? '#07090a' : '#f7f7f4',
    bgDeep:    dark ? '#050607' : '#efefe9',
    surface:   dark ? '#0e1316' : '#ffffff',
    elevated:  dark ? '#151b1f' : '#ffffff',
    overlay:   dark ? 'rgba(10,12,14,0.78)' : 'rgba(247,247,244,0.78)',
    // Strokes
    line:      dark ? 'rgba(255,255,255,0.06)' : 'rgba(10,12,14,0.07)',
    lineStrong:dark ? 'rgba(255,255,255,0.12)' : 'rgba(10,12,14,0.12)',
    // Text
    text:      dark ? '#f3f6f5' : '#0b1012',
    text2:     dark ? 'rgba(243,246,245,0.66)' : 'rgba(11,16,18,0.62)',
    text3:     dark ? 'rgba(243,246,245,0.42)' : 'rgba(11,16,18,0.42)',
    // Signal
    pos:       '#10b981',
    posSoft:   dark ? 'rgba(16,185,129,0.14)' : 'rgba(16,185,129,0.10)',
    neg:       '#f43f5e',
    negSoft:   dark ? 'rgba(244,63,94,0.14)' : 'rgba(244,63,94,0.10)',
    warn:      '#f59e0b',
    warnSoft:  dark ? 'rgba(245,158,11,0.14)' : 'rgba(245,158,11,0.10)',
    info:      '#06b6d4',
    // Accent soft fills
    accentSoft:dark ? 'hexa' : 'hexa', // computed below
  };
}

// Precompute accent soft fills
(function () {
  const _orig = getTheme;
  window.getTheme = function (mode, palette) {
    const t = _orig(mode, palette);
    // Soft tint for accent
    const a = t.accent;
    t.accentSoft = t.dark ? `${a}24` : `${a}1a`;
    t.accent2Soft = t.dark ? `${t.accent2}24` : `${t.accent2}1a`;
    return t;
  };
})();

// ─── Fonts ───
const FONT_HEAD = "'Inter Tight', 'Inter', system-ui, sans-serif";
const FONT_BODY = "'Inter', system-ui, sans-serif";
const FONT_MONO = "'JetBrains Mono', ui-monospace, 'SF Mono', monospace";

// ─── Currency formatting ───
function fmt(n, { sym = 'Rs', sign = false, compact = false } = {}) {
  const v = Math.abs(n);
  let body;
  if (compact && v >= 100000) body = (v / 100000).toFixed(v >= 1e6 ? 1 : 1) + 'L';
  else if (compact && v >= 1000) body = (v / 1000).toFixed(v >= 10000 ? 0 : 1) + 'k';
  else body = v.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  const s = sign ? (n < 0 ? '−' : '+') : (n < 0 ? '−' : '');
  return `${s}${sym} ${body}`;
}

// ─── Icons (single-line, 1.6 stroke, 24px) ───
function Icon({ name, size = 22, color = 'currentColor', stroke = 1.6, style }) {
  const props = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round',
    style,
  };
  switch (name) {
    case 'home':       return <svg {...props}><path d="M3 11l9-8 9 8M5 10v10h14V10"/></svg>;
    case 'book':       return <svg {...props}><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/></svg>;
    case 'receipt':    return <svg {...props}><path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h4"/></svg>;
    case 'box':        return <svg {...props}><path d="M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7M12 11v10"/></svg>;
    case 'grid':       return <svg {...props}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>;
    case 'plus':       return <svg {...props}><path d="M12 5v14M5 12h14"/></svg>;
    case 'arrowRight': return <svg {...props}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case 'arrowLeft':  return <svg {...props}><path d="M19 12H5M11 6l-6 6 6 6"/></svg>;
    case 'arrowDown':  return <svg {...props}><path d="M12 5v14M6 13l6 6 6-6"/></svg>;
    case 'arrowUp':    return <svg {...props}><path d="M12 19V5M6 11l6-6 6 6"/></svg>;
    case 'check':      return <svg {...props}><path d="M5 12l5 5 9-11"/></svg>;
    case 'x':          return <svg {...props}><path d="M6 6l12 12M18 6L6 18"/></svg>;
    case 'bell':       return <svg {...props}><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6zM10 20a2 2 0 0 0 4 0"/></svg>;
    case 'search':     return <svg {...props}><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>;
    case 'filter':     return <svg {...props}><path d="M3 5h18M6 12h12M10 19h4"/></svg>;
    case 'mic':        return <svg {...props}><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>;
    case 'camera':     return <svg {...props}><path d="M4 8h3l2-2h6l2 2h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>;
    case 'qr':         return <svg {...props}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M21 14v3M14 18v3h3M21 21v-3"/></svg>;
    case 'wallet':     return <svg {...props}><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M16 14h2"/></svg>;
    case 'send':       return <svg {...props}><path d="M3 11l18-8-8 18-2-8-8-2z"/></svg>;
    case 'share':      return <svg {...props}><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8 11l8-4M8 13l8 4"/></svg>;
    case 'whatsapp':   return <svg {...props}><path d="M4 20l1.6-4.5A8 8 0 1 1 8.5 18.4z"/><path d="M9 10c.5 2 2 3.5 4 4l1.3-1 1.7.7c.2 1.4-.8 2.3-2 2.3-3 0-6-3-6-6 0-1.2.9-2.2 2.3-2l.7 1.7z"/></svg>;
    case 'pdf':        return <svg {...props}><path d="M7 3h8l4 4v14H7z"/><path d="M15 3v4h4"/><path d="M9 14h1.5a1 1 0 0 0 0-2H9zm0 0v3M13 12h2M13 12v5M13 14h1.5M17 12h2M17 12v5"/></svg>;
    case 'sparkle':    return <svg {...props}><path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6zM19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/></svg>;
    case 'ai':         return <svg {...props}><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"/><rect x="6" y="6" width="12" height="12" rx="3"/><circle cx="10" cy="11" r="1" fill={color}/><circle cx="14" cy="11" r="1" fill={color}/><path d="M10 15h4"/></svg>;
    case 'clock':      return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case 'calendar':   return <svg {...props}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>;
    case 'tag':        return <svg {...props}><path d="M3 12V4h8l10 10-8 8z"/><circle cx="8" cy="9" r="1.4" fill={color}/></svg>;
    case 'user':       return <svg {...props}><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></svg>;
    case 'users':      return <svg {...props}><circle cx="9" cy="8" r="3.5"/><path d="M2 20c.8-3 3.5-4.5 7-4.5s6.2 1.5 7 4.5"/><circle cx="17" cy="6.5" r="2.8"/><path d="M22 16c-.4-2-1.6-3.2-3.5-3.6"/></svg>;
    case 'more':       return <svg {...props}><circle cx="5" cy="12" r="1.4" fill={color}/><circle cx="12" cy="12" r="1.4" fill={color}/><circle cx="19" cy="12" r="1.4" fill={color}/></svg>;
    case 'moreV':      return <svg {...props}><circle cx="12" cy="5" r="1.4" fill={color}/><circle cx="12" cy="12" r="1.4" fill={color}/><circle cx="12" cy="19" r="1.4" fill={color}/></svg>;
    case 'sun':        return <svg {...props}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M5 19l1.4-1.4M17.6 6.4L19 5"/></svg>;
    case 'moon':       return <svg {...props}><path d="M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z"/></svg>;
    case 'trend':      return <svg {...props}><path d="M3 17l6-6 4 4 8-9"/><path d="M14 6h7v7"/></svg>;
    case 'trendDown':  return <svg {...props}><path d="M3 7l6 6 4-4 8 9"/><path d="M14 18h7v-7"/></svg>;
    case 'pkr':        return <svg {...props}><path d="M7 20V8a4 4 0 0 1 4-4h2a4 4 0 0 1 0 8H7M4 14h9M4 17h9"/></svg>;
    case 'lock':       return <svg {...props}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>;
    case 'shield':     return <svg {...props}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/></svg>;
    case 'eye':        return <svg {...props}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'edit':       return <svg {...props}><path d="M14 4l6 6L8 22H2v-6zM12 6l6 6"/></svg>;
    case 'trash':      return <svg {...props}><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6"/></svg>;
    case 'attach':     return <svg {...props}><path d="M15 7l-7 7a4 4 0 0 0 6 6l8-8a6 6 0 0 0-9-9L4 12a8 8 0 0 0 0 0"/></svg>;
    case 'sliders':    return <svg {...props}><path d="M4 7h10M18 7h2M4 12h2M10 12h10M4 17h14M20 17h0"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="12" r="2"/></svg>;
    case 'flag':       return <svg {...props}><path d="M5 21V4h12l-2 4 2 4H5"/></svg>;
    case 'cart':       return <svg {...props}><path d="M3 4h2l3 13h11l2-9H6"/><circle cx="9" cy="20" r="1.4" fill={color}/><circle cx="18" cy="20" r="1.4" fill={color}/></svg>;
    case 'pulse':      return <svg {...props}><path d="M3 12h4l2-6 4 12 2-6h6"/></svg>;
    default:           return <svg {...props}><circle cx="12" cy="12" r="8"/></svg>;
  }
}

// ─── Shared primitives ───
function Card({ children, t, style, padded = true, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: t.surface,
      border: `1px solid ${t.line}`,
      borderRadius: 24,
      padding: padded ? 18 : 0,
      cursor: onClick ? 'pointer' : 'default',
      ...style,
    }}>{children}</div>
  );
}

function Pill({ children, t, color, style }) {
  const c = color || t.accent;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 999,
      background: t.dark ? `${c}24` : `${c}1a`,
      color: c,
      fontSize: 12, fontWeight: 500, lineHeight: '16px',
      whiteSpace: 'nowrap', flexShrink: 0,
      ...style,
    }}>{children}</span>
  );
}

function Sparkline({ data, color, height = 32, width = 80, fill = true }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const pts = data.map((v, i) => [i * stepX, height - ((v - min) / range) * (height - 4) - 2]);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const dFill = d + ` L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {fill && <path d={dFill} fill={color} opacity={0.16}/>}
      <path d={d} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// Smooth number animation
function useAnimatedNumber(value, ms = 600) {
  const [v, setV] = React.useState(value);
  const prev = React.useRef(value);
  React.useEffect(() => {
    const start = prev.current, end = value, t0 = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / ms);
      const e = 1 - Math.pow(1 - p, 3);
      setV(start + (end - start) * e);
      if (p < 1) raf = requestAnimationFrame(tick);
      else prev.current = end;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return v;
}

// Press feedback
function Pressable({ children, onPress, style, scale = 0.97 }) {
  const [down, setDown] = React.useState(false);
  return (
    <div
      onPointerDown={() => setDown(true)}
      onPointerUp={() => setDown(false)}
      onPointerLeave={() => setDown(false)}
      onClick={onPress}
      style={{
        transform: down ? `scale(${scale})` : 'scale(1)',
        transition: 'transform 120ms cubic-bezier(0.2,0.8,0.2,1)',
        cursor: 'pointer', userSelect: 'none',
        ...style,
      }}
    >{children}</div>
  );
}

Object.assign(window, {
  PALETTES, getTheme, fmt,
  FONT_HEAD, FONT_BODY, FONT_MONO,
  Icon, Card, Pill, Sparkline, Pressable, useAnimatedNumber,
});
