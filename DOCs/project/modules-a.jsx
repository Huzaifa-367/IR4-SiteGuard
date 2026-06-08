// modules-a.jsx — Cash Book + Invoice list + Invoice builder

// ── Cash Book ──
function CashBookScreen({ t, sym, onBack }) {
  const opening = 142500;
  const ins  = ACTIVITY.filter(a => a.amt > 0).reduce((s, a) => s + a.amt, 0);
  const outs = -ACTIVITY.filter(a => a.amt < 0).reduce((s, a) => s + a.amt, 0);
  const closing = opening + ins - outs;

  // Group activity by day buckets (mock — all today)
  const sections = [
    { label: 'Today · 10 Mar', items: ACTIVITY.slice(0, 4) },
    { label: 'Yesterday · 9 Mar', items: ACTIVITY.slice(4) },
  ];

  return (
    <div style={{ height: '100%', overflow: 'auto', paddingBottom: 110, background: t.bg }}>
      <ScreenHeader t={t}
        left={<IconButton t={t} name="arrowLeft" onClick={onBack}/>}
        title="Cash Book"
        subtitle="Daily ledger"
        right={<IconButton t={t} name="calendar"/>}
      />

      {/* Opening / closing summary */}
      <div style={{ padding: '0 20px' }}>
        <div style={{
          padding: 20, borderRadius: 24,
          background: `linear-gradient(140deg, ${t.accent}22, ${t.accent2}10)`,
          border: `1px solid ${t.accent}33`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>Closing Balance</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 28, fontWeight: 600, color: t.text, marginTop: 4, whiteSpace: 'nowrap' }}>{fmt(closing, { sym })}</div>
            </div>
            <Pill t={t} color={t.pos}>↑ +{fmt(ins - outs, { sym, compact: true })}</Pill>
          </div>
          <div style={{
            marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4,
            paddingTop: 14, borderTop: `1px solid ${t.line}`,
          }}>
            <Stat t={t} label="Opening" value={fmt(opening, { sym })} color={t.text2}/>
            <Stat t={t} label="In"       value={fmt(ins, { sym })}    color={t.pos}/>
            <Stat t={t} label="Out"      value={fmt(outs, { sym })}   color={t.neg}/>
          </div>
        </div>
      </div>

      {/* Toggle: Cash / Bank */}
      <div style={{ padding: '14px 20px 0' }}>
        <SegToggle t={t} options={['Cash', 'Bank', 'Wallet']} value="Cash"/>
      </div>

      {/* Entries by section */}
      {sections.map((sec, i) => (
        <div key={i} style={{ padding: '14px 20px 0' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 10,
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: t.text2, letterSpacing: 0.4, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              {sec.label}
            </span>
            <span style={{ fontSize: 12, color: t.text3, fontFamily: FONT_MONO, whiteSpace: 'nowrap' }}>
              Net {fmt(sec.items.reduce((s, a) => s + a.amt, 0), { sym, sign: true })}
            </span>
          </div>
          <Card t={t} padded={false} style={{ padding: '0 16px' }}>
            {sec.items.map((a, j) => <ActivityRow key={j} t={t} a={a} sym={sym}/>)}
          </Card>
        </div>
      ))}
    </div>
  );
}

function Stat({ t, label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, color: t.text2, letterSpacing: 0.4, textTransform: 'uppercase', fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 14, fontWeight: 600, color: color || t.text, marginTop: 4, whiteSpace: 'nowrap' }}>{value}</div>
    </div>
  );
}

function SegToggle({ t, options, value, onChange }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: `repeat(${options.length}, 1fr)`, gap: 4,
      padding: 4, background: t.dark ? 'rgba(255,255,255,0.04)' : 'rgba(10,12,14,0.04)',
      borderRadius: 12, border: `1px solid ${t.line}`,
    }}>
      {options.map(o => {
        const a = o === value;
        return (
          <Pressable key={o} onPress={() => onChange && onChange(o)} scale={0.97} style={{
            padding: '9px 0', borderRadius: 9, textAlign: 'center',
            background: a ? t.surface : 'transparent',
            color: a ? t.text : t.text2,
            fontSize: 12.5, fontWeight: 600,
            boxShadow: a ? `0 1px 2px rgba(0,0,0,0.08)` : 'none',
          }}>{o}</Pressable>
        );
      })}
    </div>
  );
}

// ── Invoice list ──
function InvoiceScreen({ t, sym, onOpenBuilder, onOpenInvoice }) {
  const [tab, setTab] = React.useState('all');
  const filtered = INVOICES.filter(i => tab === 'all' ? true : i.status === tab);
  const totals = {
    all: INVOICES.reduce((s, i) => s + i.amount, 0),
    paid: INVOICES.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0),
    unpaid: INVOICES.filter(i => i.status === 'unpaid').reduce((s, i) => s + i.amount, 0),
    overdue: INVOICES.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0),
  };

  return (
    <div style={{ height: '100%', overflow: 'auto', paddingBottom: 110, background: t.bg }}>
      <ScreenHeader t={t} title="Invoices" subtitle={`${INVOICES.length} invoices · ${fmt(totals.all, { sym })}`}
        right={
          <Pressable onPress={onOpenBuilder} scale={0.95} style={{
            padding: '8px 14px', borderRadius: 999,
            background: `linear-gradient(135deg, ${t.accent}, ${t.accent2})`,
            color: '#fff', fontSize: 12.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Icon name="plus" size={14} color="#fff" stroke={2.5}/>
            New
          </Pressable>
        }
      />

      {/* Status summary */}
      <div style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <SummaryTile t={t} label="Paid"    value={totals.paid}    color={t.pos} sym={sym}/>
        <SummaryTile t={t} label="Unpaid"  value={totals.unpaid}  color={t.warn} sym={sym}/>
        <SummaryTile t={t} label="Overdue" value={totals.overdue} color={t.neg} sym={sym}/>
      </div>

      {/* Tabs */}
      <div style={{ padding: '14px 20px 0' }}>
        <SegToggle t={t} options={['all', 'paid', 'unpaid', 'overdue']} value={tab} onChange={setTab}/>
      </div>

      {/* List */}
      <div style={{ padding: '12px 20px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(inv => <InvoiceCard key={inv.id} t={t} inv={inv} sym={sym} onClick={() => onOpenInvoice && onOpenInvoice(inv)}/>)}
      </div>
    </div>
  );
}

function SummaryTile({ t, label, value, color, sym }) {
  return (
    <div style={{
      padding: 12, borderRadius: 16,
      background: t.dark ? `${color}1c` : `${color}12`,
      border: `1px solid ${color}33`,
    }}>
      <div style={{ fontSize: 10.5, color, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 14, fontWeight: 600, color: t.text, marginTop: 6 }}>
        {fmt(value, { sym, compact: true })}
      </div>
    </div>
  );
}

function InvoiceCard({ t, inv, sym, onClick }) {
  const c = inv.status === 'paid' ? t.pos : inv.status === 'overdue' ? t.neg : t.warn;
  return (
    <Pressable onPress={onClick} scale={0.98} style={{
      padding: 14, borderRadius: 18,
      background: t.surface, border: `1px solid ${t.line}`,
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 44, height: 56, borderRadius: 12,
        background: t.dark ? `${c}1f` : `${c}14`, border: `1px solid ${c}33`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="receipt" size={18} color={c}/>
        <div style={{ fontSize: 9, fontWeight: 700, color: c, marginTop: 2 }}>{inv.date.split(' ')[0]}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{inv.party}</div>
        <div style={{ fontSize: 11.5, color: t.text2, marginTop: 2, fontFamily: FONT_MONO }}>
          {inv.id} · {inv.date}
        </div>
        {inv.status === 'overdue' && (
          <div style={{ fontSize: 10.5, color: t.neg, marginTop: 4, fontWeight: 600 }}>
            ● {Math.abs(inv.dueIn)} din se overdue
          </div>
        )}
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0, whiteSpace: 'nowrap' }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 15, fontWeight: 600, color: t.text }}>
          {fmt(inv.amount, { sym })}
        </div>
        <Pill t={t} color={c} style={{ marginTop: 6, fontSize: 10.5, textTransform: 'capitalize' }}>{inv.status}</Pill>
      </div>
    </Pressable>
  );
}

// ── Invoice builder ──
function InvoiceBuilderScreen({ t, sym, onBack, onSaved }) {
  const [party, setParty] = React.useState(PARTIES[2]);
  const [items, setItems] = React.useState([
    { id: 1, name: 'Sunridge Cooking Oil 5L', qty: 2, price: 2650 },
    { id: 2, name: 'Ashrafi Basmati 5kg', qty: 1, price: 2150 },
  ]);
  const [discount, setDiscount] = React.useState(0);
  const [taxPct, setTaxPct] = React.useState(0);
  const [notes, setNotes] = React.useState('');

  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const tax = (subtotal - discount) * (taxPct / 100);
  const total = subtotal - discount + tax;

  const update = (id, k, v) => setItems(items.map(i => i.id === id ? { ...i, [k]: v } : i));
  const remove = id => setItems(items.filter(i => i.id !== id));
  const addItem = () => setItems([...items, { id: Date.now(), name: '', qty: 1, price: 0 }]);

  return (
    <div style={{ height: '100%', overflow: 'auto', paddingBottom: 130, background: t.bg }}>
      <ScreenHeader t={t}
        left={<IconButton t={t} name="arrowLeft" onClick={onBack}/>}
        title="New Invoice"
        subtitle="Draft · auto-saved"
        right={<IconButton t={t} name="eye"/>}
      />

      {/* Customer */}
      <div style={{ padding: '0 20px' }}>
        <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>Customer</div>
        <Pressable scale={0.98} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: 12, borderRadius: 16, background: t.surface, border: `1px solid ${t.line}`,
        }}>
          <Avatar name={party.name} t={t} size={36}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{party.name}</div>
            <div style={{ fontSize: 11.5, color: t.text2, fontFamily: FONT_MONO }}>{party.phone}</div>
          </div>
          <Icon name="arrowRight" size={18} color={t.text2}/>
        </Pressable>
      </div>

      {/* Items */}
      <div style={{ padding: '18px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 10 }}>
          <span style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Items · {items.length}</span>
          <Pressable onPress={addItem} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 12, color: t.accent, fontWeight: 600, whiteSpace: 'nowrap',
          }}>
            <Icon name="plus" size={14} color={t.accent} stroke={2}/>
            Add item
          </Pressable>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map(i => (
            <div key={i.id} style={{
              padding: 12, borderRadius: 16, background: t.surface, border: `1px solid ${t.line}`,
            }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  value={i.name}
                  onChange={e => update(i.id, 'name', e.target.value)}
                  placeholder="Product or service"
                  style={{
                    flex: 1, border: 'none', outline: 'none', background: 'transparent',
                    color: t.text, fontSize: 14, fontWeight: 600,
                  }}
                />
                <Pressable onPress={() => remove(i.id)}>
                  <Icon name="x" size={16} color={t.text3}/>
                </Pressable>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10, alignItems: 'center' }}>
                <StepperInput t={t} value={i.qty} onChange={v => update(i.id, 'qty', v)}/>
                <span style={{ fontSize: 12, color: t.text3 }}>×</span>
                <div style={{
                  flex: 1, display: 'flex', alignItems: 'center', gap: 4,
                  padding: '8px 12px', borderRadius: 10,
                  background: t.dark ? 'rgba(255,255,255,0.04)' : 'rgba(10,12,14,0.03)',
                  border: `1px solid ${t.line}`,
                }}>
                  <span style={{ fontSize: 12, color: t.text2 }}>{sym}</span>
                  <input
                    value={i.price}
                    onChange={e => update(i.id, 'price', Number(e.target.value.replace(/\D/g, '')) || 0)}
                    inputMode="numeric"
                    style={{
                      flex: 1, border: 'none', outline: 'none', background: 'transparent',
                      color: t.text, fontFamily: FONT_MONO, fontSize: 14, fontWeight: 600,
                    }}
                  />
                </div>
                <span style={{ fontFamily: FONT_MONO, fontSize: 14, fontWeight: 700, color: t.text, minWidth: 72, textAlign: 'right', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {fmt(i.qty * i.price, { sym })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tax + discount */}
      <div style={{ padding: '14px 20px 0' }}>
        <Card t={t} style={{ padding: 14 }}>
          <SummaryRow t={t} label="Subtotal" value={subtotal} sym={sym}/>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
            <span style={{ fontSize: 13, color: t.text2 }}>Discount</span>
            <input value={discount} onChange={e => setDiscount(Number(e.target.value.replace(/\D/g, '')) || 0)}
              inputMode="numeric"
              style={{ width: 90, textAlign: 'right', border: 'none', outline: 'none', background: 'transparent',
                color: t.text, fontFamily: FONT_MONO, fontSize: 14, fontWeight: 600 }}/>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
            <span style={{ fontSize: 13, color: t.text2 }}>Tax</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {[0, 5, 17].map(tp => (
                <Pressable key={tp} onPress={() => setTaxPct(tp)} style={{
                  padding: '4px 10px', borderRadius: 8,
                  background: taxPct === tp ? t.accentSoft : 'transparent',
                  border: `1px solid ${taxPct === tp ? t.accent : t.line}`,
                  color: taxPct === tp ? t.accent : t.text2,
                  fontSize: 11.5, fontWeight: 600, fontFamily: FONT_MONO,
                }}>{tp}%</Pressable>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
            paddingTop: 12, marginTop: 8, borderTop: `1px solid ${t.line}`, gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: t.text2 }}>Total</span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 22, fontWeight: 700, color: t.text, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
              {fmt(total, { sym })}
            </span>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div style={{ padding: '14px 20px 0', display: 'flex', gap: 8 }}>
        <GhostButton t={t} icon="pdf" label="Save draft" full/>
      </div>
      <div style={{ padding: '8px 20px 0', display: 'flex', gap: 8 }}>
        <Pressable scale={0.97} onPress={onSaved} style={{
          flex: 1, height: 52, borderRadius: 16,
          background: '#25D366', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap',
          boxShadow: '0 8px 22px rgba(37, 211, 102, 0.35)',
        }}>
          <Icon name="whatsapp" size={18} color="#fff" stroke={2}/>
          Send on WhatsApp
        </Pressable>
      </div>
    </div>
  );
}

function SummaryRow({ t, label, value, sym }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', gap: 10 }}>
      <span style={{ fontSize: 13, color: t.text2 }}>{label}</span>
      <span style={{ fontFamily: FONT_MONO, fontSize: 14, fontWeight: 600, color: t.text, whiteSpace: 'nowrap' }}>{fmt(value, { sym })}</span>
    </div>
  );
}

function StepperInput({ t, value, onChange }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      background: t.dark ? 'rgba(255,255,255,0.04)' : 'rgba(10,12,14,0.04)',
      borderRadius: 10, border: `1px solid ${t.line}`, overflow: 'hidden',
    }}>
      <Pressable onPress={() => onChange(Math.max(1, value - 1))} style={{
        width: 32, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="x" size={12} color={t.text2} style={{ transform: 'rotate(45deg)' }}/>
      </Pressable>
      <div style={{ width: 28, textAlign: 'center', fontFamily: FONT_MONO, fontSize: 14, fontWeight: 700, color: t.text }}>{value}</div>
      <Pressable onPress={() => onChange(value + 1)} style={{
        width: 32, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="plus" size={14} color={t.text2} stroke={2}/>
      </Pressable>
    </div>
  );
}

Object.assign(window, {
  CashBookScreen, InvoiceScreen, InvoiceBuilderScreen,
  SegToggle, SummaryRow, StepperInput,
});
