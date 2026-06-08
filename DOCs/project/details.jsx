// details.jsx — Invoice detail, Product detail, Staff detail

// ─── Invoice detail (PDF preview style) ───
function InvoiceDetailScreen({ t, sym, inv, onBack, onEdit }) {
  if (!inv) return null;
  const items = [
    { name: 'Sunridge Cooking Oil 5L', qty: 8, price: 2650 },
    { name: 'Ashrafi Basmati 5kg',     qty: 4, price: 2150 },
    { name: 'Sufi Atta 20kg',          qty: 6, price: 2280 },
    { name: 'Tapal Danedar 950g',      qty: 10, price: 1200 },
  ];
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const discount = 1500;
  const tax = Math.round((subtotal - discount) * 0.05);
  const total = subtotal - discount + tax;

  const statusColor = inv.status === 'paid' ? t.pos : inv.status === 'overdue' ? t.neg : t.warn;

  return (
    <div style={{ height: '100%', overflow: 'auto', paddingBottom: 130, background: t.bg }}>
      <ScreenHeader t={t}
        left={<IconButton t={t} name="arrowLeft" onClick={onBack}/>}
        title={inv.id}
        subtitle={inv.party}
        right={<IconButton t={t} name="moreV"/>}
      />

      {/* Status hero */}
      <div style={{ padding: '0 20px' }}>
        <div style={{
          padding: 22, borderRadius: 24,
          background: `linear-gradient(140deg, ${statusColor}22, ${statusColor}06)`,
          border: `1px solid ${statusColor}44`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <Pill t={t} color={statusColor} style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700 }}>
              ● {inv.status}
            </Pill>
            <span style={{ fontSize: 11, color: t.text3, fontFamily: FONT_MONO }}>Issued · {inv.date}</span>
          </div>
          <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>Total</div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 36, fontWeight: 700, color: t.text, marginTop: 4, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
            {fmt(total, { sym })}
          </div>
          {inv.status === 'overdue' && (
            <div style={{ fontSize: 12, color: t.neg, fontWeight: 600, marginTop: 4 }}>
              ● {Math.abs(inv.dueIn)} din se overdue
            </div>
          )}
          {inv.status === 'paid' && (
            <div style={{ fontSize: 12, color: t.pos, fontWeight: 600, marginTop: 4 }}>
              ✓ Paid in full · Easypaisa
            </div>
          )}
        </div>
      </div>

      {/* Action row */}
      <div style={{ padding: '14px 20px 0', display: 'flex', gap: 8 }}>
        <Pressable scale={0.97} style={{
          flex: 1, height: 48, borderRadius: 14,
          background: '#25D366', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
          boxShadow: '0 8px 22px rgba(37, 211, 102, 0.35)',
        }}>
          <Icon name="whatsapp" size={16} color="#fff" stroke={2}/>Share
        </Pressable>
        <GhostButton t={t} icon="pdf" label="PDF" onClick={() => {}}/>
        <GhostButton t={t} icon="edit" label="Edit" onClick={onEdit}/>
      </div>

      {/* Customer */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>Bill To</div>
        <Card t={t} style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar name={inv.party} t={t} size={42}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{inv.party}</div>
            <div style={{ fontSize: 11.5, color: t.text2, fontFamily: FONT_MONO }}>0345 112 9870</div>
          </div>
        </Card>
      </div>

      {/* Items */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>Items · {items.length}</div>
        <Card t={t} padded={false} style={{ padding: '4px 16px' }}>
          {items.map((it, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0',
              borderBottom: i < items.length - 1 ? `1px solid ${t.line}` : 'none',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: t.text }}>{it.name}</div>
                <div style={{ fontSize: 11, color: t.text2, marginTop: 2, fontFamily: FONT_MONO }}>
                  {it.qty} × {fmt(it.price, { sym })}
                </div>
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 14, fontWeight: 700, color: t.text, whiteSpace: 'nowrap', flexShrink: 0 }}>
                {fmt(it.qty * it.price, { sym })}
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Totals */}
      <div style={{ padding: '14px 20px 0' }}>
        <Card t={t} style={{ padding: 14 }}>
          <SummaryRow t={t} label="Subtotal"      value={subtotal} sym={sym}/>
          <SummaryRow t={t} label="Discount"      value={-discount} sym={sym}/>
          <SummaryRow t={t} label="Tax · 5%"      value={tax} sym={sym}/>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
            paddingTop: 12, marginTop: 8, borderTop: `1px solid ${t.line}`, gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: t.text2 }}>Total due</span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 22, fontWeight: 700, color: t.text, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
              {fmt(total, { sym })}
            </span>
          </div>
        </Card>
      </div>

      {/* Timeline */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10 }}>Activity</div>
        <div style={{ position: 'relative', paddingLeft: 22 }}>
          <div style={{ position: 'absolute', left: 8, top: 8, bottom: 8, width: 1, background: t.line }}/>
          {[
            { c: t.accent, t: 'Created', s: inv.date + ' · 11:24', n: 'You created this invoice' },
            { c: '#25D366', t: 'Sent on WhatsApp', s: inv.date + ' · 11:25', n: 'Delivered to ' + inv.party },
            { c: t.info, t: 'Viewed', s: inv.date + ' · 14:08', n: 'Customer opened invoice' },
            ...(inv.status === 'paid' ? [{ c: t.pos, t: 'Paid', s: '2 days ago · 16:42', n: 'Easypaisa · ' + fmt(total, { sym }) }] : []),
            ...(inv.status === 'overdue' ? [{ c: t.warn, t: 'Reminder sent', s: 'Yesterday · 10:00', n: 'WhatsApp polite reminder' }] : []),
          ].map((e, i) => (
            <div key={i} style={{ position: 'relative', paddingBottom: 16 }}>
              <div style={{
                position: 'absolute', left: -20, top: 6, width: 13, height: 13, borderRadius: 7,
                background: e.c, boxShadow: `0 0 8px ${e.c}`,
                border: `2px solid ${t.bg}`,
              }}/>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: t.text }}>{e.t}</span>
                <span style={{ fontSize: 10.5, color: t.text3, fontFamily: FONT_MONO }}>{e.s}</span>
              </div>
              <div style={{ fontSize: 12, color: t.text2, marginTop: 2 }}>{e.n}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div style={{ padding: '20px 20px 0' }}>
        <Card t={t} style={{ padding: 14, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <Icon name="receipt" size={16} color={t.text3}/>
          <div style={{ flex: 1, fontSize: 12.5, color: t.text2, lineHeight: 1.5 }}>
            <span style={{ fontWeight: 600, color: t.text }}>Note: </span>
            Goods once sold not returnable. Payment due in 7 days. For queries WhatsApp +92 301 234 5678.
          </div>
        </Card>
      </div>

      {/* Sticky bottom CTA */}
      {inv.status !== 'paid' && (
        <div style={{ padding: '20px 20px 0' }}>
          <PrimaryButton t={t} icon="qr" label={`Mark paid · ${fmt(total, { sym })}`} full/>
        </div>
      )}
    </div>
  );
}

// ─── Product detail ───
function ProductDetailScreen({ t, sym, product, onBack, onEdit }) {
  if (!product) return null;
  const margin = ((product.sell - product.buy) / product.buy) * 100;
  const stockValue = product.stock * product.buy;
  const sold7 = product.sales7.reduce((s, v) => s + v, 0);
  const movements = [
    { kind: 'sale',  at: 'Today · 14:05',     who: 'Ali Karyana',         qty: -2, note: 'Cash sale' },
    { kind: 'sale',  at: 'Today · 11:30',     who: 'Walk-in customer',    qty: -1, note: 'Card' },
    { kind: 'stock', at: 'Yesterday · 09:00', who: 'Faisal Distributors', qty: +24, note: 'Purchase order' },
    { kind: 'sale',  at: '2 days ago',        who: 'Rehana Salon',        qty: -2, note: 'Cash sale' },
    { kind: 'sale',  at: '3 days ago',        who: 'Mehboob Tea Stall',   qty: -3, note: 'Credit' },
  ];

  return (
    <div style={{ height: '100%', overflow: 'auto', paddingBottom: 130, background: t.bg }}>
      <ScreenHeader t={t}
        left={<IconButton t={t} name="arrowLeft" onClick={onBack}/>}
        title="Product"
        right={<IconButton t={t} name="edit" onClick={onEdit}/>}
      />

      {/* Product hero */}
      <div style={{ padding: '0 20px' }}>
        <div style={{
          padding: 20, borderRadius: 24, background: t.surface, border: `1px solid ${t.line}`,
          display: 'flex', gap: 14,
        }}>
          <div style={{
            width: 90, height: 90, borderRadius: 20,
            background: `linear-gradient(135deg, ${product.low ? t.warn : t.accent}28, ${product.low ? t.warn : t.accent}06)`,
            border: `1px solid ${(product.low ? t.warn : t.accent) + '33'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: product.low ? t.warn : t.accent, fontFamily: FONT_HEAD, fontSize: 26, fontWeight: 700,
            flexShrink: 0,
          }}>
            {product.name.split(' ').slice(0, 2).map(w => w[0]).join('')}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: FONT_HEAD, fontSize: 16, fontWeight: 700, color: t.text, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              {product.name}
            </div>
            <div style={{ fontSize: 11.5, color: t.text2, marginTop: 4, fontFamily: FONT_MONO }}>{product.sku}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <Pill t={t} color={t.pos}>+{margin.toFixed(0)}% margin</Pill>
              {product.low && <Pill t={t} color={t.warn}>● Low stock</Pill>}
            </div>
          </div>
        </div>
      </div>

      {/* Stock card */}
      <div style={{ padding: '14px 20px 0' }}>
        <Card t={t} style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>Current Stock</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                <span style={{ fontFamily: FONT_MONO, fontSize: 32, fontWeight: 700, color: product.low ? t.warn : t.text, whiteSpace: 'nowrap' }}>{product.stock}</span>
                <span style={{ fontSize: 14, color: t.text3, fontWeight: 600 }}>units</span>
              </div>
              <div style={{ fontSize: 11.5, color: t.text2, marginTop: 4, fontFamily: FONT_MONO, whiteSpace: 'nowrap' }}>
                ≈ {fmt(stockValue, { sym })} value
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <Pressable scale={0.92} style={{
                width: 40, height: 40, borderRadius: 12,
                background: t.negSoft, color: t.neg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 700, fontFamily: FONT_MONO,
              }}>−</Pressable>
              <Pressable scale={0.92} style={{
                width: 40, height: 40, borderRadius: 12,
                background: t.posSoft, color: t.pos,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 700, fontFamily: FONT_MONO,
              }}>+</Pressable>
            </div>
          </div>

          {product.low && (
            <div style={{
              marginTop: 14, padding: 12, borderRadius: 12,
              background: t.warnSoft, border: `1px solid ${t.warn}44`,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <Icon name="sparkle" size={16} color={t.warn}/>
              <div style={{ flex: 1, fontSize: 12, color: t.text }}>
                <strong>AI suggests:</strong> Reorder 30 units — covers next 12 days.
              </div>
              <Pressable scale={0.95} style={{
                padding: '6px 12px', borderRadius: 999, background: t.warn, color: '#fff',
                fontSize: 11, fontWeight: 700,
              }}>Order</Pressable>
            </div>
          )}
        </Card>
      </div>

      {/* Pricing + 7d */}
      <div style={{ padding: '14px 20px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Card t={t} style={{ padding: 14 }}>
          <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>Pricing</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
            <span style={{ fontSize: 12, color: t.text2 }}>Buy</span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 700, color: t.text, whiteSpace: 'nowrap' }}>{fmt(product.buy, { sym })}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 12, color: t.text2 }}>Sell</span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 700, color: t.pos, whiteSpace: 'nowrap' }}>{fmt(product.sell, { sym })}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, paddingTop: 8, borderTop: `1px solid ${t.line}` }}>
            <span style={{ fontSize: 12, color: t.text2 }}>Profit</span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 700, color: t.pos, whiteSpace: 'nowrap' }}>+{fmt(product.sell - product.buy, { sym })}</span>
          </div>
        </Card>
        <Card t={t} style={{ padding: 14 }}>
          <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>Last 7 days</div>
          <div style={{ marginTop: 8 }}>
            <Sparkline data={product.sales7} color={t.accent} width={130} height={42} fill/>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 11, color: t.text3 }}>Sold</span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 700, color: t.text }}>{sold7} units</span>
          </div>
        </Card>
      </div>

      {/* Movement history */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10 }}>Movement</div>
        <Card t={t} padded={false} style={{ padding: '0 16px' }}>
          {movements.map((m, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
              borderBottom: i < movements.length - 1 ? `1px solid ${t.line}` : 'none',
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 11,
                background: m.qty > 0 ? t.posSoft : t.negSoft,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon name={m.qty > 0 ? 'arrowDown' : 'arrowUp'} size={16} color={m.qty > 0 ? t.pos : t.neg}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: t.text }}>{m.who}</div>
                <div style={{ fontSize: 11.5, color: t.text2 }}>{m.note} · {m.at}</div>
              </div>
              <div style={{
                fontFamily: FONT_MONO, fontSize: 14, fontWeight: 700,
                color: m.qty > 0 ? t.pos : t.neg, whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                {m.qty > 0 ? '+' : ''}{m.qty}
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ─── Product edit (simple) ───
function ProductEditScreen({ t, sym, product, onBack, onSaved }) {
  const isNew = !product;
  const [name, setName] = React.useState(product?.name || '');
  const [sku, setSku] = React.useState(product?.sku || '');
  const [buy, setBuy] = React.useState(product?.buy || 0);
  const [sell, setSell] = React.useState(product?.sell || 0);
  const [stock, setStock] = React.useState(product?.stock || 0);
  const [unit, setUnit] = React.useState('piece');

  return (
    <div style={{ height: '100%', overflow: 'auto', paddingBottom: 30, background: t.bg }}>
      <ScreenHeader t={t}
        left={<IconButton t={t} name="arrowLeft" onClick={onBack}/>}
        title={isNew ? 'New product' : 'Edit product'}
        right={<IconButton t={t} name="qr"/>}
      />

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field t={t} label="Product name">
          <TextInput t={t} value={name} onChange={setName} placeholder="e.g. Sunridge Cooking Oil 5L"/>
        </Field>
        <Field t={t} label="SKU / Barcode">
          <TextInput t={t} value={sku} onChange={setSku} icon="qr" placeholder="Tap scanner to fill"/>
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field t={t} label="Buy price">
            <TextInput t={t} value={buy} onChange={v => setBuy(Number(v) || 0)} suffix={sym} big/>
          </Field>
          <Field t={t} label="Sell price">
            <TextInput t={t} value={sell} onChange={v => setSell(Number(v) || 0)} suffix={sym} big/>
          </Field>
        </div>
        <Card t={t} style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="trend" size={14} color={t.pos}/>
          <span style={{ fontSize: 12, color: t.text2 }}>
            Margin: <strong style={{ color: t.pos }}>
              {sell > 0 && buy > 0 ? ((sell - buy) / buy * 100).toFixed(0) : 0}%
            </strong> · Profit per unit: <strong style={{ color: t.text }}>{fmt(sell - buy, { sym })}</strong>
          </span>
        </Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field t={t} label="Opening stock">
            <TextInput t={t} value={stock} onChange={v => setStock(Number(v) || 0)} big/>
          </Field>
          <Field t={t} label="Unit">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['piece', 'kg', 'litre', 'box'].map(u => (
                <Pressable key={u} onPress={() => setUnit(u)} style={{
                  padding: '11px 14px', borderRadius: 14,
                  background: unit === u ? t.accent : 'transparent',
                  color: unit === u ? '#fff' : t.text2,
                  border: `1px solid ${unit === u ? t.accent : t.line}`,
                  fontSize: 13, fontWeight: 600,
                }}>{u}</Pressable>
              ))}
            </div>
          </Field>
        </div>
        <Field t={t} label="Low stock alert at">
          <TextInput t={t} value={5} suffix={unit + 's'}/>
        </Field>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <PrimaryButton t={t} icon="check" label={isNew ? 'Add product' : 'Save changes'} onClick={() => { onSaved && onSaved(); onBack(); }} full/>
      </div>
    </div>
  );
}

Object.assign(window, {
  InvoiceDetailScreen, ProductDetailScreen, ProductEditScreen,
});
