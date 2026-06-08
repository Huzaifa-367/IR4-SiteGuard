// home.jsx — Home dashboard. Signature: animated cashflow "river" canvas.

// ── Cashflow River — particles flow from left (IN) and right (OUT) into a central pulsing balance.
function CashflowRiver({ t, cashIn, cashOut, height = 200 }) {
  const canvasRef = React.useRef(null);
  const dataRef = React.useRef({ cashIn, cashOut, t });
  dataRef.current = { cashIn, cashOut, t };

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    let W, H;
    const resize = () => {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // Particle pools
    const particles = [];
    const spawn = (dir) => {
      // dir = 1 (IN, left→right) or -1 (OUT, right→left)
      const y0 = H / 2 + (Math.random() - 0.5) * 30;
      particles.push({
        dir,
        x: dir === 1 ? -10 : W + 10,
        y: y0,
        baseY: y0,
        speed: 0.7 + Math.random() * 1.3,
        size: 1.6 + Math.random() * 2.2,
        life: 0,
        wob: Math.random() * Math.PI * 2,
        wobSp: 0.04 + Math.random() * 0.03,
      });
    };

    let lastSpawn = 0;
    let raf;
    const draw = (now) => {
      const { t } = dataRef.current;
      const inColor = t.pos;
      const outColor = t.neg;
      ctx.clearRect(0, 0, W, H);

      // ── Background field: faint horizontal current ──
      const grd = ctx.createLinearGradient(0, 0, W, 0);
      grd.addColorStop(0, t.dark ? 'rgba(16,185,129,0.10)' : 'rgba(16,185,129,0.10)');
      grd.addColorStop(0.5, 'rgba(0,0,0,0)');
      grd.addColorStop(1, t.dark ? 'rgba(244,63,94,0.10)' : 'rgba(244,63,94,0.10)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, H * 0.32, W, H * 0.36);

      // ── Spawn ──
      const rateIn = Math.min(0.07, cashIn  / 1500000);
      const rateOut = Math.min(0.07, cashOut / 1500000);
      if (Math.random() < rateIn * 3) spawn(1);
      if (Math.random() < rateOut * 3) spawn(-1);

      // ── Center hub ──
      const cx = W / 2, cy = H / 2;
      const breath = 1 + Math.sin(now / 700) * 0.04;
      const hubR = 56 * breath;

      // halo rings
      for (let i = 3; i >= 1; i--) {
        const r = hubR + i * 8 + Math.sin(now / 600 + i) * 3;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = t.dark
          ? `rgba(255,255,255,${0.04 - i * 0.008})`
          : `rgba(0,0,0,${0.04 - i * 0.008})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // ── Particles ──
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += 1;
        p.x += p.dir * p.speed * 1.4;
        p.wob += p.wobSp;
        p.y = p.baseY + Math.sin(p.wob) * 6;

        // distance to hub center along x
        const dx = p.x - cx;
        const dist = Math.hypot(dx, p.y - cy);
        // arc pull as particle nears hub
        const pull = Math.max(0, 1 - dist / (W * 0.4));
        const arcY = cy + (p.baseY - cy) * (1 - pull * 0.85);
        p.y = arcY + Math.sin(p.wob) * (1 - pull) * 6;

        // remove if entering hub
        if (dist < hubR - 4) {
          particles.splice(i, 1);
          continue;
        }
        if (p.x < -30 || p.x > W + 30) {
          particles.splice(i, 1);
          continue;
        }

        const c = p.dir === 1 ? inColor : outColor;
        const alpha = Math.min(1, p.life / 30) * (0.55 + pull * 0.45);

        // glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = c + Math.floor(alpha * 60).toString(16).padStart(2, '0');
        ctx.fill();
        // core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = c;
        ctx.globalAlpha = alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // ── Hub disc ──
      const hubGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, hubR);
      hubGrad.addColorStop(0, t.dark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,1)');
      hubGrad.addColorStop(0.6, t.dark ? 'rgba(20,30,32,0.95)' : 'rgba(255,255,255,0.92)');
      hubGrad.addColorStop(1, t.dark ? 'rgba(20,30,32,1)' : 'rgba(247,247,244,1)');
      ctx.beginPath();
      ctx.arc(cx, cy, hubR, 0, Math.PI * 2);
      ctx.fillStyle = hubGrad;
      ctx.fill();

      // hub border
      ctx.beginPath();
      ctx.arc(cx, cy, hubR, 0, Math.PI * 2);
      ctx.strokeStyle = t.dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <div style={{ position: 'relative', height, borderRadius: 24, overflow: 'hidden',
      background: t.dark
        ? `radial-gradient(120% 80% at 50% 50%, ${t.surface} 60%, ${t.bg} 100%)`
        : `radial-gradient(120% 80% at 50% 50%, ${t.surface} 60%, ${t.bg} 100%)`,
      border: `1px solid ${t.line}`,
    }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }}/>
      {/* Overlay: hub text */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
      }}>
        <span style={{
          fontSize: 10, fontWeight: 600, color: t.text2, letterSpacing: 1.4,
          textTransform: 'uppercase',
        }}>Net · Today</span>
        <span style={{
          fontFamily: FONT_MONO, fontSize: 26, fontWeight: 600, color: t.text, marginTop: 4,
          letterSpacing: '-0.02em',
        }}>{fmt(cashIn - cashOut, { sym: 'Rs', sign: true })}</span>
      </div>
      {/* Live tag */}
      <div style={{
        position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '4px 10px', borderRadius: 999,
        background: t.dark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.85)',
        border: `1px solid ${t.line}`,
        fontFamily: FONT_MONO, fontSize: 10, color: t.text2, letterSpacing: 0.6,
        whiteSpace: 'nowrap',
      }}>
        <span style={{
          width: 5, height: 5, borderRadius: 3, background: t.pos,
          boxShadow: `0 0 8px ${t.pos}`,
          animation: 'lpulse 1.6s ease-in-out infinite',
        }}/>
        LIVE · 14:42 PKT
        <style>{`@keyframes lpulse { 50% { opacity: 0.3;} }`}</style>
      </div>
      {/* Bottom: legend */}
      <div style={{
        position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex',
        justifyContent: 'space-between', padding: '0 18px', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 700, color: t.pos, letterSpacing: 0.8, textTransform: 'uppercase' }}>
          <span style={{ width: 5, height: 5, borderRadius: 3, background: t.pos, boxShadow: `0 0 6px ${t.pos}` }}/>
          In
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 700, color: t.neg, letterSpacing: 0.8, textTransform: 'uppercase' }}>
          Out
          <span style={{ width: 5, height: 5, borderRadius: 3, background: t.neg, boxShadow: `0 0 6px ${t.neg}` }}/>
        </div>
      </div>
    </div>
  );
}

function FlowChip({ t, dir, amount, sym }) {
  const positive = dir === 'in';
  const c = positive ? t.pos : t.neg;
  return (
    <div style={{
      padding: '12px 14px', borderRadius: 16,
      background: t.dark ? `${c}14` : `${c}0e`,
      border: `1px solid ${c}33`,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: 10,
        background: c, display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 14px ${c}66`,
      }}>
        <Icon name={positive ? 'arrowDown' : 'arrowUp'} size={14} color="#fff" stroke={2.4}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: c, letterSpacing: 0.8, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          {positive ? 'Cash In' : 'Cash Out'}
        </div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 16, fontWeight: 700, color: t.text, marginTop: 2, whiteSpace: 'nowrap' }}>
          {fmt(amount, { sym })}
        </div>
      </div>
    </div>
  );
}

// ── Stat tile for receivables / payables ──
function StatTile({ t, label, value, deltaPct, icon, color, onClick }) {
  return (
    <Pressable onPress={onClick} scale={0.98} style={{
      flex: 1, padding: 14, borderRadius: 20,
      background: t.surface, border: `1px solid ${t.line}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 9,
          background: t.dark ? `${color}28` : `${color}1c`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={icon} size={16} color={color}/>
        </div>
        <span style={{ fontSize: 12, fontWeight: 500, color: t.text2, letterSpacing: 0.2 }}>{label}</span>
      </div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 18, fontWeight: 600, color: t.text, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
        {fmt(value, { sym: 'Rs' })}
      </div>
      {deltaPct !== undefined && (
        <div style={{ marginTop: 4, fontSize: 11, color: deltaPct >= 0 ? t.pos : t.neg, fontWeight: 600, whiteSpace: 'nowrap' }}>
          {deltaPct >= 0 ? '↑' : '↓'} {Math.abs(deltaPct)}% vs last wk
        </div>
      )}
    </Pressable>
  );
}

function QuickAction({ t, label, icon, color, onClick }) {
  return (
    <Pressable onPress={onClick} scale={0.95} style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      padding: '12px 6px', borderRadius: 18,
      background: t.dark ? 'rgba(255,255,255,0.03)' : 'rgba(10,12,14,0.025)',
      border: `1px solid ${t.line}`,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 12,
        background: t.dark ? `${color}28` : `${color}1c`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icon} size={18} color={color}/>
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: t.text, textAlign: 'center', lineHeight: 1.15 }}>{label}</span>
    </Pressable>
  );
}

function InsightCard({ t, insight }) {
  const colorByTone = { warn: t.warn, pos: t.pos, info: t.info };
  const c = colorByTone[insight.tone] || t.accent;
  return (
    <div style={{
      minWidth: 260, padding: 16, borderRadius: 20,
      background: t.dark ? `linear-gradient(140deg, ${c}26, ${c}08)` : `linear-gradient(140deg, ${c}16, ${c}06)`,
      border: `1px solid ${c}33`,
      display: 'flex', flexDirection: 'column', gap: 8,
      scrollSnapAlign: 'start',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon name="sparkle" size={16} color={c}/>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.4, color: c, textTransform: 'uppercase' }}>
          AI Insight
        </span>
      </div>
      <div style={{ fontFamily: FONT_HEAD, fontSize: 16, fontWeight: 600, color: t.text, letterSpacing: '-0.01em' }}>
        {insight.title}
      </div>
      <div style={{ fontSize: 12.5, color: t.text2, lineHeight: 1.45 }}>{insight.body}</div>
    </div>
  );
}

function ActivityRow({ t, a, sym }) {
  const pos = a.amt > 0;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
      borderBottom: `1px solid ${t.line}`,
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 11,
        background: pos ? t.posSoft : t.negSoft,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={a.kind === 'sale' ? 'arrowDown' : a.kind === 'expense' ? 'arrowUp' : 'send'} size={16} color={pos ? t.pos : t.neg}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.who}</div>
        <div style={{ fontSize: 11.5, color: t.text2 }}>{a.note} · {a.when}</div>
      </div>
      <div style={{
        fontFamily: FONT_MONO, fontSize: 14, fontWeight: 600,
        color: pos ? t.pos : t.text,
        whiteSpace: 'nowrap', flexShrink: 0,
      }}>{fmt(a.amt, { sym, sign: true })}</div>
    </div>
  );
}

function HomeScreen({ t, onNav, onOpenAddEntry, onOpenAssistant, sym }) {
  // Aggregate today
  const cashIn  = ACTIVITY.filter(a => a.amt > 0).reduce((s, a) => s + a.amt, 0);
  const cashOut = -ACTIVITY.filter(a => a.amt < 0).reduce((s, a) => s + a.amt, 0);
  const receivables = PARTIES.filter(p => p.balance > 0).reduce((s, p) => s + p.balance, 0);
  const payables    = -PARTIES.filter(p => p.balance < 0).reduce((s, p) => s + p.balance, 0);

  return (
    <div style={{ height: '100%', overflow: 'auto', paddingBottom: 110, background: t.bg }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px 10px' }}>
        <Avatar name="Adnan Hardware" t={t} size={42} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: t.text2, fontWeight: 500 }}>Assalam-o-Alaikum</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontFamily: FONT_HEAD, fontSize: 17, fontWeight: 600,
              color: t.text, letterSpacing: '-0.01em',
            }}>Adnan Hardware</span>
            <Icon name="arrowDown" size={14} color={t.text2}/>
          </div>
        </div>
        <IconButton t={t} name="ai" onClick={onOpenAssistant} soft/>
        <IconButton t={t} name="bell" badge/>
      </div>

      {/* Signature cashflow */}
      <div style={{ padding: '6px 20px 0' }}>
        <CashflowRiver t={t} cashIn={cashIn} cashOut={cashOut} height={230}/>
        {/* Cash in/out summary strip below */}
        <div style={{
          marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
        }}>
          <FlowChip t={t} dir="in" amount={cashIn} sym={sym}/>
          <FlowChip t={t} dir="out" amount={cashOut} sym={sym}/>
        </div>
      </div>

      {/* Stat tiles */}
      <div style={{ display: 'flex', gap: 10, padding: '14px 20px 0' }}>
        <StatTile t={t} label="Receivables" value={receivables} deltaPct={12} icon="arrowDown" color={t.pos} onClick={() => onNav('khata')}/>
        <StatTile t={t} label="Payables"    value={payables}    deltaPct={-4} icon="arrowUp"   color={t.neg} onClick={() => onNav('khata')}/>
      </div>

      {/* Quick actions */}
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: t.text2, letterSpacing: 0.4, textTransform: 'uppercase' }}>Quick Actions</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <QuickAction t={t} label="Gave Credit"     icon="arrowUp"   color={t.neg}    onClick={onOpenAddEntry}/>
          <QuickAction t={t} label="Got Payment"     icon="arrowDown" color={t.pos}    onClick={onOpenAddEntry}/>
          <QuickAction t={t} label="New Invoice"     icon="receipt"   color={t.accent} onClick={() => onNav('invoice')}/>
          <QuickAction t={t} label="QR · Request"    icon="qr"        color={t.accent2}onClick={() => onNav('payments')}/>
        </div>
      </div>

      {/* AI Insights */}
      <div style={{ marginTop: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px 10px' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: t.text2, letterSpacing: 0.4, textTransform: 'uppercase' }}>Smart Insights</span>
          <span style={{ fontSize: 12, color: t.accent, fontWeight: 600 }}>See all</span>
        </div>
        <div style={{
          display: 'flex', gap: 10, overflowX: 'auto',
          padding: '0 20px 4px', scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
        }}>
          {INSIGHTS.map((i, n) => <InsightCard key={n} t={t} insight={i}/>)}
        </div>
      </div>

      {/* Recent activity */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: t.text2, letterSpacing: 0.4, textTransform: 'uppercase' }}>Today's Activity</span>
          <span style={{ fontSize: 12, color: t.accent, fontWeight: 600 }} onClick={() => onNav('cashbook')}>Cash book →</span>
        </div>
        <Card t={t} padded={false} style={{ padding: '0 16px' }}>
          {ACTIVITY.map((a, i) => <ActivityRow key={i} t={t} a={a} sym={sym}/>)}
        </Card>
      </div>
    </div>
  );
}

Object.assign(window, { HomeScreen, CashflowRiver, ActivityRow, StatTile, QuickAction, InsightCard, FlowChip });
