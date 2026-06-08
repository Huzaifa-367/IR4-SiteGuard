// khata.jsx — Khata list, Party detail, Add Entry modal (multi-step)

function KhataScreen({ t, sym, onOpenParty }) {
  const [filter, setFilter] = React.useState('all'); // all, customers, suppliers, overdue
  const [query, setQuery] = React.useState('');

  const filtered = PARTIES.filter(p => {
    if (filter === 'customers' && p.tag !== 'Customer') return false;
    if (filter === 'suppliers' && p.tag !== 'Supplier') return false;
    if (filter === 'overdue' && !p.overdue) return false;
    if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const totalRecv = PARTIES.filter(p => p.balance > 0).reduce((s, p) => s + p.balance, 0);
  const totalPay = -PARTIES.filter(p => p.balance < 0).reduce((s, p) => s + p.balance, 0);

  return (
    <div style={{ height: '100%', overflow: 'auto', paddingBottom: 110, background: t.bg }}>
      <ScreenHeader t={t} title="Khata" subtitle="Customer & supplier ledger"
        right={<IconButton t={t} name="search"/>}
      />

      {/* Net summary band */}
      <div style={{ padding: '4px 20px 0' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: 16,
          borderRadius: 22, background: t.surface, border: `1px solid ${t.line}`,
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>You'll receive</div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 22, fontWeight: 600, color: t.pos, marginTop: 4, whiteSpace: 'nowrap' }}>{fmt(totalRecv, { sym })}</div>
            <div style={{ fontSize: 11, color: t.text3, marginTop: 2 }}>{PARTIES.filter(p => p.balance > 0).length} parties</div>
          </div>
          <div style={{ borderLeft: `1px solid ${t.line}`, paddingLeft: 14, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>You'll pay</div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 22, fontWeight: 600, color: t.neg, marginTop: 4, whiteSpace: 'nowrap' }}>{fmt(totalPay, { sym })}</div>
            <div style={{ fontSize: 11, color: t.text3, marginTop: 2 }}>{PARTIES.filter(p => p.balance < 0).length} parties</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '14px 20px 0' }}>
        <TextInput t={t} icon="search" placeholder="Search by name or phone" value={query} onChange={setQuery}/>
      </div>

      {/* Filter chips */}
      <div style={{
        display: 'flex', gap: 8, padding: '12px 20px 4px',
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {[
          { k: 'all', l: 'All ' + PARTIES.length },
          { k: 'customers', l: 'Customers' },
          { k: 'suppliers', l: 'Suppliers' },
          { k: 'overdue', l: 'Overdue · ' + PARTIES.filter(p => p.overdue).length, c: t.warn },
        ].map(c => {
          const a = filter === c.k;
          const col = c.c || t.accent;
          return (
            <Pressable key={c.k} onPress={() => setFilter(c.k)} style={{
              padding: '8px 14px', borderRadius: 999,
              background: a ? col : 'transparent',
              border: `1px solid ${a ? col : t.line}`,
              color: a ? '#fff' : t.text2,
              fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap',
            }}>{c.l}</Pressable>
          );
        })}
      </div>

      {/* List */}
      <div style={{ padding: '8px 20px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(p => <PartyCard key={p.id} t={t} p={p} sym={sym} onClick={() => onOpenParty(p)}/>)}
        {!filtered.length && (
          <div style={{ padding: 40, textAlign: 'center', color: t.text3, fontSize: 13 }}>
            Koi party nahi mili.
          </div>
        )}
      </div>
    </div>
  );
}

function PartyCard({ t, p, sym, onClick }) {
  const pos = p.balance > 0;
  return (
    <Pressable onPress={onClick} scale={0.98} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: 14, borderRadius: 18,
      background: t.surface, border: `1px solid ${p.overdue ? t.warn + '55' : t.line}`,
      position: 'relative',
    }}>
      <Avatar name={p.name} t={t} size={42}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
          {p.overdue && <span style={{ width: 6, height: 6, borderRadius: 3, background: t.warn, boxShadow: `0 0 8px ${t.warn}` }}/>}
        </div>
        <div style={{ fontSize: 11.5, color: t.text2, marginTop: 2 }}>{p.tag} · {p.lastAt}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0, whiteSpace: 'nowrap' }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 15, fontWeight: 600, color: pos ? t.pos : t.neg }}>
          {fmt(p.balance, { sym })}
        </div>
        <div style={{ fontSize: 10, color: t.text3, marginTop: 2, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          {pos ? 'will get' : 'will pay'}
        </div>
      </div>
    </Pressable>
  );
}

// ── Party detail screen ──
function PartyDetail({ t, party, sym, onBack, onAddEntry }) {
  if (!party) return null;
  const pos = party.balance > 0;
  return (
    <div style={{ height: '100%', overflow: 'auto', paddingBottom: 130, background: t.bg }}>
      <ScreenHeader t={t}
        left={<IconButton t={t} name="arrowLeft" onClick={onBack}/>}
        title={party.name}
        subtitle={party.tag + ' · ' + party.phone}
        right={<IconButton t={t} name="moreV"/>}
      />

      {/* Balance hero */}
      <div style={{ padding: '0 20px' }}>
        <div style={{
          padding: '22px 20px', borderRadius: 24,
          background: pos
            ? `linear-gradient(140deg, ${t.pos}28, ${t.pos}08)`
            : `linear-gradient(140deg, ${t.neg}28, ${t.neg}08)`,
          border: `1px solid ${pos ? t.pos : t.neg}44`,
        }}>
          <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase' }}>
            {pos ? 'You\'ll receive' : 'You\'ll pay'}
          </div>
          <div style={{
            fontFamily: FONT_MONO, fontSize: 32, fontWeight: 600,
            color: pos ? t.pos : t.neg, marginTop: 6, letterSpacing: '-0.02em', whiteSpace: 'nowrap',
          }}>{fmt(party.balance, { sym })}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <GhostButton t={t} icon="whatsapp" label="Remind" full/>
            <GhostButton t={t} icon="pdf" label="Share PDF" full/>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ padding: '14px 20px 0', display: 'flex', gap: 10 }}>
        <PrimaryButton t={t} icon="arrowDown" label="Got Payment" onClick={() => onAddEntry('got', party)} full/>
        <GhostButton t={t} icon="arrowUp" label="Gave Credit" onClick={() => onAddEntry('gave', party)} full/>
      </div>

      {/* Timeline */}
      <div style={{ padding: '22px 20px 0' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: t.text2, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 12 }}>
          Transaction Timeline
        </div>
        {party.txns.length ? (
          <div style={{ position: 'relative', paddingLeft: 24 }}>
            <div style={{ position: 'absolute', left: 8, top: 8, bottom: 8, width: 1, background: t.line }}/>
            {party.txns.map(tx => {
              const gave = tx.kind === 'gave';
              return (
                <div key={tx.id} style={{ position: 'relative', paddingBottom: 18 }}>
                  <div style={{
                    position: 'absolute', left: -22, top: 14, width: 17, height: 17, borderRadius: 9,
                    background: t.bg, border: `2px solid ${gave ? t.neg : t.pos}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{ width: 7, height: 7, borderRadius: 4, background: gave ? t.neg : t.pos }}/>
                  </div>
                  <Card t={t} style={{ padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: 11, color: t.text2 }}>{tx.at}</span>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 16, fontWeight: 600, color: gave ? t.neg : t.pos }}>
                        {fmt(gave ? -tx.amt : tx.amt, { sym, sign: true })}
                      </span>
                    </div>
                    <div style={{ fontSize: 13.5, color: t.text, marginTop: 6, fontWeight: 500 }}>{tx.note}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <Pill t={t} color={gave ? t.neg : t.pos}>{gave ? 'Gave Credit' : 'Got Payment'}</Pill>
                      <Pill t={t} color={t.text2}>{tx.cat}</Pill>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: 30, textAlign: 'center', color: t.text3, fontSize: 13 }}>
            Abhi koi transaction nahi.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Add Entry sheet (multi-step) ──
function AddEntrySheet({ t, sym, open, onClose, onSave, defaults = {} }) {
  const [step, setStep] = React.useState(0);
  const [kind, setKind] = React.useState(defaults.kind || 'gave');
  const [amount, setAmount] = React.useState('');
  const [party, setParty] = React.useState(defaults.party || null);
  const [note, setNote] = React.useState('');
  const [cat, setCat] = React.useState('Sales');

  React.useEffect(() => {
    if (open) {
      setStep(0); setAmount(''); setNote('');
      setKind(defaults.kind || 'gave');
      setParty(defaults.party || null);
    }
  }, [open]);

  const aiSuggest = note.length > 8 ? (
    /atta|chawal|ghee|oil|rice|tea/i.test(note) ? 'Inventory' :
    /bill|bijli|gas|petrol/i.test(note) ? 'Utilities' :
    /salary|tankhwa|payroll/i.test(note) ? 'Payroll' :
    'Sales'
  ) : null;
  React.useEffect(() => { if (aiSuggest) setCat(aiSuggest); }, [aiSuggest]);

  const num = Number(amount.replace(/[^\d]/g, '')) || 0;
  const cats = ['Sales', 'Inventory', 'Utilities', 'Payroll', 'Rent', 'Other'];

  const headerColor = kind === 'gave' ? t.neg : t.pos;

  return (
    <Sheet t={t} open={open} onClose={onClose} height={620}
      title="New Entry"
    >
      <div style={{ padding: '0 22px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Kind toggle */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
          padding: 4, background: t.dark ? 'rgba(255,255,255,0.04)' : 'rgba(10,12,14,0.04)',
          borderRadius: 14, border: `1px solid ${t.line}`,
        }}>
          {[
            { k: 'gave', l: 'Gave Credit', c: t.neg, i: 'arrowUp' },
            { k: 'got',  l: 'Got Payment', c: t.pos, i: 'arrowDown' },
          ].map(o => {
            const a = kind === o.k;
            return (
              <Pressable key={o.k} onPress={() => setKind(o.k)} scale={0.97} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '12px 0', borderRadius: 11,
                background: a ? o.c : 'transparent',
                color: a ? '#fff' : t.text2,
                fontSize: 13, fontWeight: 600,
                transition: 'all 200ms',
              }}>
                <Icon name={o.i} size={16} color={a ? '#fff' : o.c}/>
                {o.l}
              </Pressable>
            );
          })}
        </div>

        {/* Amount input */}
        <div style={{
          padding: '20px 18px', borderRadius: 20,
          background: t.dark ? `${headerColor}14` : `${headerColor}0e`,
          border: `1px solid ${headerColor}33`,
          display: 'flex', alignItems: 'baseline', gap: 8,
        }}>
          <span style={{ fontFamily: FONT_MONO, fontSize: 15, color: t.text2, fontWeight: 500 }}>{sym}</span>
          <input
            autoFocus
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0"
            inputMode="numeric"
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              color: t.text, fontFamily: FONT_MONO, fontSize: 38, fontWeight: 600,
              letterSpacing: '-0.02em',
            }}
          />
          <Pressable scale={0.92}>
            <Icon name="mic" size={20} color={t.text2}/>
          </Pressable>
        </div>

        {/* Party */}
        <div>
          <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>Party</div>
          {party ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              borderRadius: 14, background: t.dark ? 'rgba(255,255,255,0.04)' : 'rgba(10,12,14,0.03)',
              border: `1px solid ${t.line}`,
            }}>
              <Avatar name={party.name} t={t} size={32}/>
              <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: t.text }}>{party.name}</div>
              <Pressable onPress={() => setParty(null)}>
                <Icon name="x" size={18} color={t.text2}/>
              </Pressable>
            </div>
          ) : (
            <div style={{
              display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none',
              paddingBottom: 4,
            }}>
              {PARTIES.slice(0, 6).map(p => (
                <Pressable key={p.id} onPress={() => setParty(p)} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  minWidth: 64,
                }}>
                  <Avatar name={p.name} t={t} size={42}/>
                  <span style={{ fontSize: 10.5, color: t.text2, textAlign: 'center', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                    {p.name.split(' ')[0]}
                  </span>
                </Pressable>
              ))}
            </div>
          )}
        </div>

        {/* Note + AI category */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>Note</span>
            {aiSuggest && (
              <span style={{ fontSize: 10.5, color: t.accent, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon name="sparkle" size={12} color={t.accent}/>
                AI · {aiSuggest}
              </span>
            )}
          </div>
          <TextInput t={t} value={note} onChange={setNote} placeholder="e.g. Atta + Chawal udhaar"/>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            {cats.map(c => (
              <Pressable key={c} onPress={() => setCat(c)} style={{
                padding: '6px 12px', borderRadius: 999,
                background: cat === c ? t.accentSoft : 'transparent',
                border: `1px solid ${cat === c ? t.accent : t.line}`,
                color: cat === c ? t.accent : t.text2,
                fontSize: 11.5, fontWeight: 600,
              }}>{c}</Pressable>
            ))}
          </div>
        </div>

        {/* Attachment row */}
        <div style={{ display: 'flex', gap: 8 }}>
          <GhostButton t={t} icon="camera" label="Receipt scan" full/>
          <GhostButton t={t} icon="attach" label="Attach"/>
        </div>

        {/* Save */}
        <PrimaryButton t={t}
          label={`Save ${kind === 'gave' ? 'Credit' : 'Payment'} · ${fmt(num, { sym })}`}
          onClick={() => { onSave && onSave({ kind, amount: num, party, note, cat }); onClose(); }}
          disabled={!num || !party}
          full
          style={{ marginTop: 6 }}
        />
      </div>
    </Sheet>
  );
}

Object.assign(window, { KhataScreen, PartyDetail, AddEntrySheet });
