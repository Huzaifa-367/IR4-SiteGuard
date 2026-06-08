// modules-b.jsx — Inventory + Staff + Payments + Reports

// ── Inventory list ──
function InventoryScreen({ t, sym, onScan, onOpenProduct }) {
  const [query, setQuery] = React.useState('');
  const lowCount = PRODUCTS.filter(p => p.low).length;
  const total = PRODUCTS.reduce((s, p) => s + p.stock * p.buy, 0);

  return (
    <div style={{ height: '100%', overflow: 'auto', paddingBottom: 110, background: t.bg }}>
      <ScreenHeader t={t} title="Inventory" subtitle={`${PRODUCTS.length} SKUs · ${fmt(total, { sym, compact: true })} stock value`}
        right={
          <Pressable onPress={onScan} scale={0.92} style={{
            width: 40, height: 40, borderRadius: 20,
            background: `linear-gradient(135deg, ${t.accent}, ${t.accent2})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 6px 18px ${t.accent}55`,
          }}>
            <Icon name="qr" size={18} color="#fff"/>
          </Pressable>
        }
      />

      {/* Low stock alert */}
      {lowCount > 0 && (
        <div style={{ padding: '0 20px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: 14, borderRadius: 18,
            background: t.warnSoft, border: `1px solid ${t.warn}44`,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: t.warn + '33',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="flag" size={18} color={t.warn}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{lowCount} products low on stock</div>
              <div style={{ fontSize: 11.5, color: t.text2 }}>AI suggests reorder · 1-tap purchase order</div>
            </div>
            <Pressable scale={0.95} style={{
              padding: '8px 12px', borderRadius: 999,
              background: t.warn, color: '#fff', fontSize: 11.5, fontWeight: 700,
            }}>Reorder</Pressable>
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ padding: '14px 20px 0' }}>
        <TextInput t={t} icon="search" placeholder="Search SKU, name…" value={query} onChange={setQuery}/>
      </div>

      {/* List */}
      <div style={{ padding: '14px 20px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {PRODUCTS.filter(p => p.name.toLowerCase().includes(query.toLowerCase())).map(p => (
          <ProductCard key={p.id} t={t} p={p} sym={sym} onClick={() => onOpenProduct && onOpenProduct(p)}/>
        ))}
      </div>
    </div>
  );
}

function ProductCard({ t, p, sym, onClick }) {
  const margin = ((p.sell - p.buy) / p.buy) * 100;
  return (
    <Pressable onPress={onClick} scale={0.98} style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: 12,
      borderRadius: 18, background: t.surface, border: `1px solid ${p.low ? t.warn + '44' : t.line}`,
    }}>
      <Thumb t={t} label={p.name.split(' ').slice(0, 2).map(w => w[0]).join('')} color={p.low ? t.warn : t.accent}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 10.5, color: t.text3, fontFamily: FONT_MONO }}>{p.sku}</span>
          <span style={{ fontSize: 10.5, color: t.pos, fontWeight: 600 }}>+{margin.toFixed(0)}% margin</span>
        </div>
        <div style={{ marginTop: 6 }}>
          <Sparkline data={p.sales7} color={t.accent} width={80} height={18} fill={false}/>
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0, whiteSpace: 'nowrap' }}>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 18, fontWeight: 700,
          color: p.low ? t.warn : t.text,
        }}>{p.stock}</div>
        <div style={{ fontSize: 9.5, color: t.text3, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase' }}>in stock</div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 11.5, color: t.text2, marginTop: 4 }}>{fmt(p.sell, { sym })}</div>
      </div>
    </Pressable>
  );
}

// ── Scanner overlay ──
function ScannerOverlay({ t, open, onClose, onResult }) {
  React.useEffect(() => {
    if (open) {
      const id = setTimeout(() => onResult && onResult(PRODUCTS[1]), 2400);
      return () => clearTimeout(id);
    }
  }, [open]);
  if (!open) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, background: '#000',
      zIndex: 80, display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between' }}>
        <Pressable onPress={onClose} style={{
          width: 40, height: 40, borderRadius: 20, background: 'rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="x" size={20} color="#fff"/>
        </Pressable>
        <div style={{ color: '#fff', fontSize: 14, fontWeight: 600, alignSelf: 'center' }}>Scan barcode</div>
        <Pressable style={{
          width: 40, height: 40, borderRadius: 20, background: 'rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="sliders" size={18} color="#fff"/>
        </Pressable>
      </div>

      {/* Viewfinder */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 280, height: 280, borderRadius: 32, position: 'relative',
          background: 'rgba(255,255,255,0.04)',
        }}>
          {/* corners */}
          {[
            { top: 0, left: 0, br: '0 0 0 16px' },
            { top: 0, right: 0, br: '0 0 16px 0' },
            { bottom: 0, left: 0, br: '0 16px 0 0' },
            { bottom: 0, right: 0, br: '16px 0 0 0' },
          ].map((c, i) => (
            <div key={i} style={{
              position: 'absolute', ...c, width: 40, height: 40,
              borderTop: c.top !== undefined ? `3px solid ${t.accent}` : 'none',
              borderBottom: c.bottom !== undefined ? `3px solid ${t.accent}` : 'none',
              borderLeft: c.left !== undefined ? `3px solid ${t.accent}` : 'none',
              borderRight: c.right !== undefined ? `3px solid ${t.accent}` : 'none',
              borderRadius: c.br,
            }}/>
          ))}
          {/* scan line */}
          <div style={{
            position: 'absolute', left: 14, right: 14, top: 0, height: 2,
            background: `linear-gradient(90deg, transparent, ${t.accent}, transparent)`,
            boxShadow: `0 0 16px ${t.accent}`,
            animation: 'scan 2s ease-in-out infinite',
          }}/>
          <style>{`@keyframes scan { 0%, 100% { top: 14px;} 50% { top: 264px;} }`}</style>
        </div>
      </div>
      <div style={{ padding: 30, textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
        Barcode pakar rahe hain…
      </div>
    </div>
  );
}

// ── Staff ──
function StaffScreen({ t, sym, onBack }) {
  const present = STAFF.filter(s => s.attendance === 'present').length;
  const due = STAFF.reduce((s, x) => s + x.due, 0);
  return (
    <div style={{ height: '100%', overflow: 'auto', paddingBottom: 110, background: t.bg }}>
      <ScreenHeader t={t} title="Staff" subtitle={`${STAFF.length} team members`}
        left={onBack ? <IconButton t={t} name="arrowLeft" onClick={onBack}/> : null}
        right={<IconButton t={t} name="plus"/>}
      />

      {/* Stats band */}
      <div style={{ padding: '0 20px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Card t={t} style={{ padding: 14 }}>
          <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>Today present</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
            <span style={{ fontFamily: FONT_MONO, fontSize: 22, fontWeight: 700, color: t.text }}>{present}</span>
            <span style={{ fontSize: 13, color: t.text3 }}>/ {STAFF.length}</span>
          </div>
          <div style={{ display: 'flex', gap: 3, marginTop: 8 }}>
            {STAFF.map((s, i) => (
              <div key={i} style={{
                flex: 1, height: 6, borderRadius: 3,
                background: s.attendance === 'present' ? t.pos : s.attendance === 'late' ? t.warn : t.line,
              }}/>
            ))}
          </div>
        </Card>
        <Card t={t} style={{ padding: 14 }}>
          <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>Payroll due</div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 22, fontWeight: 700, color: t.warn, marginTop: 6 }}>
            {fmt(due, { sym, compact: true })}
          </div>
          <div style={{ fontSize: 11, color: t.text3, marginTop: 8 }}>3 din mein clear karein</div>
        </Card>
      </div>

      {/* Staff list */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {STAFF.map(s => <StaffCard key={s.id} t={t} s={s} sym={sym}/>)}
      </div>
    </div>
  );
}

function StaffCard({ t, s, sym }) {
  const attMap = {
    present: { c: t.pos, l: 'Present' },
    late:    { c: t.warn, l: 'Late · 35m' },
    absent:  { c: t.neg, l: 'Absent' },
  };
  const a = attMap[s.attendance];
  return (
    <Pressable scale={0.98} style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: 14,
      borderRadius: 18, background: t.surface, border: `1px solid ${t.line}`,
    }}>
      <Avatar name={s.name} t={t} size={44} ring={a.c}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{s.name}</div>
        <div style={{ fontSize: 11.5, color: t.text2, marginTop: 2 }}>{s.role} · since {s.joined}</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <Pill t={t} color={a.c} style={{ fontSize: 10.5 }}>● {a.l}</Pill>
          {s.due > 0 && <Pill t={t} color={t.warn} style={{ fontSize: 10.5 }}>Due {fmt(s.due, { sym })}</Pill>}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0, whiteSpace: 'nowrap' }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 14, fontWeight: 700, color: t.text }}>
          {fmt(s.salary, { sym, compact: true })}
        </div>
        <div style={{ fontSize: 10, color: t.text3, marginTop: 2, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>/month</div>
      </div>
    </Pressable>
  );
}

// ── Reports ──
function ReportsScreen({ t, sym, onBack }) {
  const [tab, setTab] = React.useState('Financial');
  return (
    <div style={{ height: '100%', overflow: 'auto', paddingBottom: 110, background: t.bg }}>
      <ScreenHeader t={t} title="Reports" subtitle="Mar 1 — Mar 10 · 10 days"
        left={onBack ? <IconButton t={t} name="arrowLeft" onClick={onBack}/> : null}
        right={<IconButton t={t} name="calendar"/>}
      />
      <div style={{ padding: '0 20px' }}>
        <SegToggle t={t} options={['Financial', 'Inventory', 'Recovery']} value={tab} onChange={setTab}/>
      </div>

      {tab === 'Financial' && <FinancialReport t={t} sym={sym}/>}
      {tab === 'Inventory' && <InventoryReport t={t} sym={sym}/>}
      {tab === 'Recovery' && <RecoveryReport t={t} sym={sym}/>}
    </div>
  );
}

function FinancialReport({ t, sym }) {
  const revenue = CASHFLOW_30.reduce((s, d) => s + d.in, 0);
  const expense = CASHFLOW_30.reduce((s, d) => s + d.out, 0);
  const profit = revenue - expense;
  return (
    <div style={{ padding: '14px 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Card t={t} style={{ padding: 18 }}>
        <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>Net Profit</div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 30, fontWeight: 700, color: t.pos, marginTop: 6 }}>
          {fmt(profit, { sym, compact: true })}
        </div>
        <div style={{ marginTop: 14 }}>
          <BarChart t={t} data={CASHFLOW_30.slice(-14)} sym={sym}/>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Card t={t} style={{ padding: 14 }}>
          <div style={{ fontSize: 11, color: t.pos, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>Revenue</div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 18, fontWeight: 700, color: t.text, marginTop: 6 }}>{fmt(revenue, { sym, compact: true })}</div>
          <Sparkline data={CASHFLOW_30.map(d => d.in)} color={t.pos} width={130} height={28}/>
        </Card>
        <Card t={t} style={{ padding: 14 }}>
          <div style={{ fontSize: 11, color: t.neg, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>Expenses</div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 18, fontWeight: 700, color: t.text, marginTop: 6 }}>{fmt(expense, { sym, compact: true })}</div>
          <Sparkline data={CASHFLOW_30.map(d => d.out)} color={t.neg} width={130} height={28}/>
        </Card>
      </div>

      {/* Heatmap */}
      <Card t={t} style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: t.text2, letterSpacing: 0.4, textTransform: 'uppercase' }}>Sales heat · 30 days</span>
          <Pill t={t} color={t.accent}>Strongest: Sat</Pill>
        </div>
        <Heatmap t={t}/>
      </Card>
    </div>
  );
}

function BarChart({ t, data, sym }) {
  const max = Math.max(...data.map(d => Math.max(d.in, d.out)));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 90 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
            <div style={{
              width: '60%', height: (d.in / max) * 70,
              background: t.pos, borderRadius: '3px 3px 0 0',
              boxShadow: `0 0 6px ${t.pos}66`,
            }}/>
            <div style={{
              width: '60%', height: (d.out / max) * 70,
              background: t.neg, opacity: 0.6, borderRadius: '0 0 3px 3px',
            }}/>
          </div>
        </div>
      ))}
    </div>
  );
}

function Heatmap({ t }) {
  const cells = Array.from({ length: 30 }, () => Math.random());
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
      {cells.map((v, i) => (
        <div key={i} style={{
          aspectRatio: '1.6', borderRadius: 8,
          background: v > 0.8 ? t.pos :
                      v > 0.6 ? t.pos + 'cc' :
                      v > 0.4 ? t.pos + '88' :
                      v > 0.2 ? t.pos + '44' : t.pos + '22',
        }}/>
      ))}
    </div>
  );
}

function InventoryReport({ t, sym }) {
  return (
    <div style={{ padding: '14px 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Card t={t} style={{ padding: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: t.text2, letterSpacing: 0.4, textTransform: 'uppercase' }}>Fast Moving</div>
        {PRODUCTS.slice(0, 4).map((p, i) => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < 3 ? `1px solid ${t.line}` : 'none' }}>
            <div style={{ width: 22, fontFamily: FONT_MONO, fontSize: 13, fontWeight: 700, color: t.text3 }}>0{i + 1}</div>
            <div style={{ flex: 1, fontSize: 13, color: t.text, fontWeight: 500 }}>{p.name}</div>
            <Sparkline data={p.sales7} color={t.accent} width={60} height={20} fill={false}/>
            <div style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 700, color: t.text, minWidth: 30, textAlign: 'right' }}>{p.sales7.reduce((s, x) => s + x, 0)}</div>
          </div>
        ))}
      </Card>
      <Card t={t} style={{ padding: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: t.text2, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>Dead Stock</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Thumb t={t} label="JM" color={t.warn}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>Mitchells Jam 450g</div>
            <div style={{ fontSize: 11.5, color: t.text2 }}>Last sold 42 days ago · 12 in stock</div>
          </div>
          <GhostButton t={t} label="Discount"/>
        </div>
      </Card>
    </div>
  );
}

function RecoveryReport({ t, sym }) {
  const overdue = INVOICES.filter(i => i.status === 'overdue');
  return (
    <div style={{ padding: '14px 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Card t={t} style={{ padding: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: t.text2, letterSpacing: 0.4, textTransform: 'uppercase' }}>Collection Performance</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
          <span style={{ fontFamily: FONT_MONO, fontSize: 30, fontWeight: 700, color: t.text }}>72%</span>
          <span style={{ fontSize: 12, color: t.warn, fontWeight: 600 }}>↓ 22% vs last week</span>
        </div>
        <div style={{ marginTop: 14, height: 8, borderRadius: 4, background: t.line, overflow: 'hidden' }}>
          <div style={{ width: '72%', height: '100%', background: `linear-gradient(90deg, ${t.accent}, ${t.accent2})` }}/>
        </div>
      </Card>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: t.text2, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>Top Overdue</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {overdue.map(inv => <InvoiceCard key={inv.id} t={t} inv={inv} sym={sym}/>)}
        </div>
      </div>
    </div>
  );
}

// ── Payments / QR ──
function PaymentsScreen({ t, sym, onBack }) {
  const [tab, setTab] = React.useState('Request');
  return (
    <div style={{ height: '100%', overflow: 'auto', paddingBottom: 110, background: t.bg }}>
      <ScreenHeader t={t}
        left={onBack ? <IconButton t={t} name="arrowLeft" onClick={onBack}/> : null}
        title="Payments" subtitle="Wallet · QR · Bank"
      />

      {/* Wallet hero */}
      <div style={{ padding: '0 20px' }}>
        <div style={{
          position: 'relative', padding: 22, borderRadius: 24,
          background: t.dark
            ? `linear-gradient(135deg, #0d2a1f 0%, #102937 50%, #1b1838 100%)`
            : `linear-gradient(135deg, ${t.accent}, ${t.accent2})`,
          color: '#fff', overflow: 'hidden',
        }}>
          {/* mesh background */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `radial-gradient(circle at 20% 20%, ${t.accent}55, transparent 40%), radial-gradient(circle at 80% 80%, ${t.accent2}55, transparent 40%)`,
            pointerEvents: 'none',
          }}/>
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, opacity: 0.8, textTransform: 'uppercase' }}>Wallet Balance</div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 32, fontWeight: 700, marginTop: 4, letterSpacing: '-0.02em' }}>
              {fmt(184500, { sym })}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <Pressable scale={0.95} style={{
                flex: 1, padding: '12px 0', borderRadius: 14,
                background: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontSize: 13, fontWeight: 700,
              }}>
                <Icon name="arrowDown" size={16} color="#fff" stroke={2}/>Add
              </Pressable>
              <Pressable scale={0.95} style={{
                flex: 1, padding: '12px 0', borderRadius: 14,
                background: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontSize: 13, fontWeight: 700,
              }}>
                <Icon name="arrowUp" size={16} color="#fff" stroke={2}/>Send
              </Pressable>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
              <Bank logo="EP" name="Easypaisa"/>
              <Bank logo="JC" name="JazzCash"/>
              <Bank logo="MB" name="MeezanBnk"/>
              <Bank logo="+1" name=""/>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 20px 0' }}>
        <SegToggle t={t} options={['Request', 'QR', 'History']} value={tab} onChange={setTab}/>
      </div>

      {tab === 'Request' && <RequestForm t={t} sym={sym}/>}
      {tab === 'QR' && <QRDisplay t={t} sym={sym}/>}
      {tab === 'History' && <PaymentHistory t={t} sym={sym}/>}
    </div>
  );
}

function Bank({ logo, name }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '6px 10px', borderRadius: 999,
      background: 'rgba(255,255,255,0.14)',
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: 4, background: 'rgba(255,255,255,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: FONT_MONO, fontSize: 9, fontWeight: 700, color: '#fff',
      }}>{logo}</div>
      {name && <span style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>{name}</span>}
    </div>
  );
}

function RequestForm({ t, sym }) {
  const [amount, setAmount] = React.useState('25000');
  return (
    <div style={{ padding: '14px 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Field t={t} label="Request from">
        <Pressable scale={0.98} style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: 12,
          borderRadius: 14, background: t.surface, border: `1px solid ${t.line}`,
        }}>
          <Avatar name="Shahzad Cloth House" t={t} size={36}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: t.text }}>Shahzad Cloth House</div>
            <div style={{ fontSize: 11.5, color: t.text2 }}>0345 112 9870</div>
          </div>
          <Icon name="arrowRight" size={18} color={t.text2}/>
        </Pressable>
      </Field>
      <Field t={t} label="Amount">
        <TextInput t={t} value={amount} onChange={setAmount} big suffix={sym}/>
      </Field>
      <Card t={t} style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon name="sparkle" size={16} color={t.accent}/>
        <span style={{ fontSize: 12.5, color: t.text, lineHeight: 1.4 }}>
          Polite reminder draft: "AoA, Rs 25,000 ki payment ka link bhej raha hoon. Jaldi pay kar dein. Shukria."
        </span>
      </Card>
      <Pressable scale={0.97} style={{
        height: 52, borderRadius: 16,
        background: '#25D366', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap',
        boxShadow: '0 8px 22px rgba(37, 211, 102, 0.35)',
      }}>
        <Icon name="whatsapp" size={18} color="#fff" stroke={2}/>
        Send payment link
      </Pressable>
    </div>
  );
}

function QRDisplay({ t, sym }) {
  return (
    <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{
        padding: 18, borderRadius: 28, background: '#fff',
        boxShadow: t.dark ? `0 16px 40px ${t.accent}33` : '0 16px 40px rgba(0,0,0,0.12)',
        position: 'relative',
      }}>
        <QRPattern color="#0b1012"/>
        <div style={{
          position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
          width: 50, height: 50, borderRadius: 14,
          background: `linear-gradient(135deg, ${t.accent}, ${t.accent2})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
        }}>
          <Icon name="pkr" size={22} color="#fff" stroke={2.2}/>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: FONT_HEAD, fontSize: 18, fontWeight: 700, color: t.text }}>Adnan Hardware</div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: t.text2, marginTop: 4, letterSpacing: 0.6 }}>
          adnan@lixar · Scan to pay
        </div>
      </div>
      <GhostButton t={t} icon="share" label="Share QR"/>
    </div>
  );
}

function QRPattern({ color = '#0b1012', size = 200 }) {
  // Deterministic pseudo-QR generated from a hash pattern (decorative only)
  const cells = 17;
  const rng = (i) => {
    let x = (i * 9301 + 49297) % 233280;
    return x / 233280;
  };
  return (
    <svg width={size} height={size} viewBox={`0 0 ${cells} ${cells}`} style={{ display: 'block' }}>
      {Array.from({ length: cells * cells }, (_, i) => {
        const x = i % cells, y = Math.floor(i / cells);
        // skip corner positioning blocks
        const inCorner = (x < 4 && y < 4) || (x > cells - 5 && y < 4) || (x < 4 && y > cells - 5);
        if (inCorner) return null;
        const v = rng(i);
        if (v > 0.55) return <rect key={i} x={x} y={y} width="1" height="1" fill={color} rx={0.15}/>;
        return null;
      })}
      {/* Position markers */}
      {[[0,0],[cells-3,0],[0,cells-3]].map(([px, py], i) => (
        <g key={i}>
          <rect x={px} y={py} width="3" height="3" fill={color}/>
          <rect x={px + 0.5} y={py + 0.5} width="2" height="2" fill="#fff"/>
          <rect x={px + 1} y={py + 1} width="1" height="1" fill={color}/>
        </g>
      ))}
    </svg>
  );
}

function PaymentHistory({ t, sym }) {
  const items = [
    { who: 'Ali Karyana', amt: 12000, mode: 'Easypaisa', when: 'Today · 14:05' },
    { who: 'Rehana Salon', amt: 4500, mode: 'JazzCash', when: 'Today · 09:42' },
    { who: 'Mehboob Tea Stall', amt: 1200, mode: 'Cash', when: 'Yesterday' },
    { who: 'Imtiaz Wholesalers', amt: -15000, mode: 'Bank', when: 'Yesterday' },
  ];
  return (
    <div style={{ padding: '14px 20px 0' }}>
      <Card t={t} padded={false} style={{ padding: '0 16px' }}>
        {items.map((p, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0',
            borderBottom: i < items.length - 1 ? `1px solid ${t.line}` : 'none',
          }}>
            <Avatar name={p.who} t={t} size={36}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: t.text }}>{p.who}</div>
              <div style={{ fontSize: 11, color: t.text2 }}>{p.mode} · {p.when}</div>
            </div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 14, fontWeight: 600, color: p.amt > 0 ? t.pos : t.text, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {fmt(p.amt, { sym, sign: true })}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

Object.assign(window, {
  InventoryScreen, ScannerOverlay, StaffScreen, ReportsScreen, PaymentsScreen,
});
