// chrome.jsx — phone shell, top header, bottom nav, FAB, sheet/modal

// ── Custom phone shell (replaces Android frame's chrome with our own header) ──
function PhoneShell({ children, t, statusDark }) {
  // statusDark: should status bar text be light (for dark surface) or dark (for light surface)?
  const sd = statusDark !== undefined ? statusDark : t.dark;
  return (
    <div style={{
      width: 412, height: 892, borderRadius: 44, overflow: 'hidden',
      background: t.bg, color: t.text, fontFamily: FONT_BODY,
      border: `9px solid ${t.dark ? '#1a1d20' : '#cfcfca'}`,
      boxShadow: t.dark
        ? '0 40px 90px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.04)'
        : '0 40px 90px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(0,0,0,0.04)',
      display: 'flex', flexDirection: 'column', position: 'relative', boxSizing: 'border-box',
    }}>
      <StatusBar dark={sd} />
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {children}
      </div>
      <NavPill dark={sd} />
    </div>
  );
}

function StatusBar({ dark }) {
  const c = dark ? '#f3f6f5' : '#0b1012';
  return (
    <div style={{
      height: 38, padding: '0 22px 0 26px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'relative', flexShrink: 0,
    }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: c, letterSpacing: 0.2 }}>9:41</span>
      <div style={{
        position: 'absolute', left: '50%', top: 10, transform: 'translateX(-50%)',
        width: 100, height: 22, borderRadius: 14, background: '#000',
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: c }}>
        {/* signal */}
        <svg width="16" height="11" viewBox="0 0 16 11" fill={c}><rect x="0" y="7" width="3" height="4" rx="0.5"/><rect x="4.5" y="5" width="3" height="6" rx="0.5"/><rect x="9" y="2.5" width="3" height="8.5" rx="0.5"/><rect x="13.5" y="0" width="2.5" height="11" rx="0.5" opacity="0.4"/></svg>
        {/* battery */}
        <svg width="24" height="11" viewBox="0 0 24 11"><rect x="0.5" y="0.5" width="21" height="10" rx="2.5" fill="none" stroke={c} opacity="0.5"/><rect x="2" y="2" width="17" height="7" rx="1.5" fill={c}/><rect x="22" y="3.5" width="1.5" height="4" rx="0.5" fill={c} opacity="0.5"/></svg>
      </div>
    </div>
  );
}

function NavPill({ dark }) {
  return (
    <div style={{
      height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <div style={{
        width: 136, height: 5, borderRadius: 3,
        background: dark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)',
      }} />
    </div>
  );
}

// ── Top header bar (in-content) ──
function ScreenHeader({ t, title, subtitle, left, right, sticky }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 20px 10px',
      position: sticky ? 'sticky' : 'static', top: 0, zIndex: 10,
      background: sticky ? t.bg : 'transparent',
    }}>
      {left}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: FONT_HEAD, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em',
          color: t.text, lineHeight: 1.1,
        }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: t.text2, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

function IconButton({ t, name, onClick, badge, size = 40, soft, color }) {
  return (
    <Pressable onPress={onClick} style={{
      width: size, height: size, borderRadius: size / 2,
      background: soft ? t.accentSoft : (t.dark ? 'rgba(255,255,255,0.04)' : 'rgba(10,12,14,0.04)'),
      border: `1px solid ${t.line}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', color: color || t.text,
    }}>
      <Icon name={name} size={20} color={color || t.text}/>
      {badge && (
        <span style={{
          position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4,
          background: t.accent, boxShadow: `0 0 0 2px ${t.surface}`,
        }}/>
      )}
    </Pressable>
  );
}

// ── Bottom nav with floating FAB notch ──
function BottomNav({ t, current, onNav, onFab }) {
  // 4 tabs + center FAB. Stock/Cash Book/Staff/Reports/Payments accessible via More.
  const items = [
    { key: 'home',      icon: 'home',    label: 'Home' },
    { key: 'khata',     icon: 'book',    label: 'Khata' },
    null, // FAB gap
    { key: 'invoice',   icon: 'receipt', label: 'Bills' },
    { key: 'more',      icon: 'grid',    label: 'More' },
  ];
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      paddingBottom: 8, pointerEvents: 'none',
    }}>
      {/* FAB */}
      <div style={{
        position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)',
        pointerEvents: 'auto',
      }}>
        <Pressable onPress={onFab} scale={0.92} style={{
          width: 58, height: 58, borderRadius: 20,
          background: `linear-gradient(135deg, ${t.accent}, ${t.accent2})`,
          boxShadow: `0 12px 28px ${t.accent}55, 0 0 0 6px ${t.bg}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="plus" size={26} color="#fff" stroke={2.2}/>
        </Pressable>
      </div>
      {/* Nav bar */}
      <div style={{
        margin: '0 16px', height: 64, borderRadius: 26,
        background: t.dark ? 'rgba(20,25,28,0.85)' : 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${t.line}`,
        boxShadow: t.dark
          ? '0 10px 28px rgba(0,0,0,0.4)'
          : '0 10px 28px rgba(0,0,0,0.08)',
        display: 'grid', gridTemplateColumns: '1fr 1fr 70px 1fr 1fr',
        alignItems: 'center',
        pointerEvents: 'auto',
      }}>
        {items.map((it, i) => {
          if (!it) return <div key={'gap'+i}/>;
          const a = current === it.key;
          return (
            <Pressable key={it.key} onPress={() => onNav(it.key)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '8px 0',
            }}>
              <Icon name={it.icon} size={20} color={a ? t.accent : t.text2} stroke={a ? 2 : 1.6}/>
              <span style={{
                fontSize: 10, fontWeight: a ? 600 : 500,
                color: a ? t.accent : t.text2,
                letterSpacing: 0.2,
              }}>{it.label}</span>
            </Pressable>
          );
        })}
      </div>
    </div>
  );
}

// ── Bottom sheet ──
function Sheet({ t, open, onClose, children, height = 'auto', title }) {
  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity 220ms',
        zIndex: 50,
      }}/>
      {/* Sheet */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: t.surface,
        borderTopLeftRadius: 32, borderTopRightRadius: 32,
        border: `1px solid ${t.line}`, borderBottom: 'none',
        transform: open ? 'translateY(0)' : 'translateY(110%)',
        transition: 'transform 320ms cubic-bezier(0.2,0.9,0.2,1)',
        maxHeight: '85%', height,
        display: 'flex', flexDirection: 'column',
        zIndex: 51,
        boxShadow: '0 -20px 60px rgba(0,0,0,0.35)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: t.line }}/>
        </div>
        {title && (
          <div style={{
            padding: '6px 22px 14px', fontFamily: FONT_HEAD, fontSize: 18, fontWeight: 600,
            color: t.text, letterSpacing: '-0.01em',
          }}>{title}</div>
        )}
        <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
      </div>
    </>
  );
}

// ── Buttons ──
function PrimaryButton({ t, label, onClick, icon, disabled, full, style }) {
  return (
    <Pressable onPress={disabled ? null : onClick} scale={0.97} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      height: 52, padding: '0 22px', borderRadius: 16,
      background: disabled ? t.line : `linear-gradient(135deg, ${t.accent}, ${t.accent2})`,
      color: disabled ? t.text3 : '#fff',
      fontFamily: FONT_BODY, fontSize: 15, fontWeight: 600, letterSpacing: 0.1,
      whiteSpace: 'nowrap',
      boxShadow: disabled ? 'none' : `0 8px 22px ${t.accent}40`,
      width: full ? '100%' : 'auto',
      ...style,
    }}>
      {icon && <Icon name={icon} size={18} color="#fff" stroke={2}/>}
      {label}
    </Pressable>
  );
}

function GhostButton({ t, label, onClick, icon, full, style }) {
  return (
    <Pressable onPress={onClick} scale={0.97} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      height: 48, padding: '0 18px', borderRadius: 14,
      background: t.dark ? 'rgba(255,255,255,0.05)' : 'rgba(10,12,14,0.04)',
      color: t.text,
      border: `1px solid ${t.line}`,
      fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600,
      whiteSpace: 'nowrap',
      width: full ? '100%' : 'auto',
      ...style,
    }}>
      {icon && <Icon name={icon} size={18} color={t.text}/>}
      {label}
    </Pressable>
  );
}

// ── Avatar (initial-based with deterministic color) ──
function Avatar({ name, t, size = 44, ring }) {
  const hash = [...name].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 0);
  const hues = [160, 190, 220, 30, 280, 340, 130, 200, 50];
  const h = hues[hash % hues.length];
  const initials = name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2,
      background: `linear-gradient(135deg, oklch(0.58 0.12 ${h}), oklch(0.4 0.13 ${h - 30}))`,
      color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: FONT_HEAD, fontWeight: 600, fontSize: size * 0.36,
      letterSpacing: 0.5, flexShrink: 0,
      boxShadow: ring ? `0 0 0 2px ${ring}` : 'none',
    }}>{initials}</div>
  );
}

// ── Empty thumbs (placeholder) ──
function Thumb({ t, size = 56, label, color }) {
  const c = color || t.accent;
  return (
    <div style={{
      width: size, height: size, borderRadius: 16,
      background: `linear-gradient(135deg, ${c}22, ${c}08)`,
      border: `1px solid ${c}33`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: c, fontFamily: FONT_HEAD, fontSize: 18, fontWeight: 700, flexShrink: 0,
    }}>{label}</div>
  );
}

// ── Skinned input ──
function TextInput({ t, value, onChange, placeholder, icon, type = 'text', suffix, big, style }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      height: big ? 56 : 48, padding: '0 16px',
      background: t.dark ? 'rgba(255,255,255,0.04)' : 'rgba(10,12,14,0.03)',
      border: `1px solid ${t.line}`, borderRadius: 14,
      ...style,
    }}>
      {icon && <Icon name={icon} size={18} color={t.text2}/>}
      <input
        value={value} onChange={e => onChange && onChange(e.target.value)}
        placeholder={placeholder} type={type}
        style={{
          flex: 1, border: 'none', outline: 'none', background: 'transparent',
          color: t.text, fontFamily: big ? FONT_MONO : FONT_BODY,
          fontSize: big ? 22 : 15, fontWeight: big ? 600 : 500,
        }}
      />
      {suffix && <span style={{ fontSize: 13, color: t.text2 }}>{suffix}</span>}
    </div>
  );
}

Object.assign(window, {
  PhoneShell, ScreenHeader, IconButton, BottomNav, Sheet,
  PrimaryButton, GhostButton, Avatar, Thumb, TextInput,
});
