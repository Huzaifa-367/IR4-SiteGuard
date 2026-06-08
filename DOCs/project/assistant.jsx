// assistant.jsx — AI chat with streaming + voice entry sheet + More screen

// ── AI Assistant Sheet ──
function AssistantSheet({ t, open, onClose, sym }) {
  const [messages, setMessages] = React.useState([
    { role: 'ai', text: 'Salam Adnan bhai! Aaj kya dekhna hai? Khata, sales, ya stock?', quick: ['Aaj kitna paisa aaya?', 'Top customers?', 'Kya stock kam hai?'] },
  ]);
  const [input, setInput] = React.useState('');
  const [streaming, setStreaming] = React.useState(false);
  const scrollRef = React.useRef();

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, streaming]);

  const ask = (q) => {
    const userMsg = { role: 'user', text: q };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setStreaming(true);

    // Generate fake reply
    let reply;
    if (/paisa|cash|sale|aaya/i.test(q)) {
      reply = { role: 'ai', text: 'Aaj 4 transactions complete huye. Total cash in: Rs 35,700 · Cash out: Rs 25,600 · Net +Rs 10,100.', viz: 'today' };
    } else if (/top|customer|party/i.test(q)) {
      reply = { role: 'ai', text: 'Top 3 customers by pending:', viz: 'topCustomers' };
    } else if (/stock|kam|low/i.test(q)) {
      reply = { role: 'ai', text: '2 products critical hain: Cooking Oil (4 left) · Dalda Ghee (3 left). Reorder suggest karoon?', quick: ['Haan, order karo', 'Baad mein dekho'] };
    } else {
      reply = { role: 'ai', text: 'Main aap ka business data check kar raha hoon. Specific sawal poochein — sales, customers, stock ya invoices?' };
    }

    // Simulate streaming
    let i = 0;
    const fullText = reply.text;
    setMessages(m => [...m, { ...reply, text: '' }]);
    const id = setInterval(() => {
      i += 2;
      setMessages(m => {
        const last = m[m.length - 1];
        return [...m.slice(0, -1), { ...last, text: fullText.slice(0, i) }];
      });
      if (i >= fullText.length) {
        clearInterval(id);
        setStreaming(false);
      }
    }, 22);
  };

  return (
    <Sheet t={t} open={open} onClose={onClose} height={760}>
      {/* Header */}
      <div style={{ padding: '0 22px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 14,
          background: `linear-gradient(135deg, ${t.accent}, ${t.accent2})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 8px 24px ${t.accent}44`,
        }}>
          <Icon name="sparkle" size={20} color="#fff" stroke={2.2}/>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: FONT_HEAD, fontSize: 16, fontWeight: 700, color: t.text }}>Khata AI</div>
          <div style={{ fontSize: 11, color: t.pos, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: t.pos, boxShadow: `0 0 6px ${t.pos}` }}/>
            Online · trained on your business
          </div>
        </div>
        <Pressable onPress={onClose}>
          <Icon name="x" size={20} color={t.text2}/>
        </Pressable>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{
        flex: 1, overflow: 'auto', padding: '0 22px 8px',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {messages.map((m, i) => <ChatBubble key={i} t={t} m={m} onQuick={ask} sym={sym}/>)}
        {streaming && (
          <div style={{ display: 'flex', gap: 4, padding: '4px 14px' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: 3, background: t.accent,
                animation: `bounce 1.2s ease-in-out ${i * 0.18}s infinite`,
              }}/>
            ))}
            <style>{`@keyframes bounce { 0%, 100% { transform: translateY(0); opacity: 0.4;} 50% { transform: translateY(-5px); opacity: 1;} }`}</style>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: '10px 22px 24px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 8px 8px 18px', borderRadius: 18,
          background: t.dark ? 'rgba(255,255,255,0.05)' : 'rgba(10,12,14,0.04)',
          border: `1px solid ${t.line}`,
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && input.trim() && ask(input.trim())}
            placeholder="Apna business kuch bhi pucho…"
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              color: t.text, fontSize: 14, fontFamily: FONT_BODY,
            }}
          />
          <Pressable scale={0.92} onPress={() => input.trim() && ask(input.trim())} style={{
            width: 38, height: 38, borderRadius: 13,
            background: input.trim() ? `linear-gradient(135deg, ${t.accent}, ${t.accent2})` : t.line,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name={input.trim() ? 'send' : 'mic'} size={16} color={input.trim() ? '#fff' : t.text2} stroke={2}/>
          </Pressable>
        </div>
      </div>
    </Sheet>
  );
}

function ChatBubble({ t, m, onQuick, sym }) {
  const user = m.role === 'user';
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: user ? 'flex-end' : 'flex-start',
      gap: 6,
    }}>
      <div style={{
        maxWidth: '85%',
        padding: '10px 14px', borderRadius: 18,
        background: user
          ? `linear-gradient(135deg, ${t.accent}, ${t.accent2})`
          : t.dark ? 'rgba(255,255,255,0.05)' : 'rgba(10,12,14,0.04)',
        color: user ? '#fff' : t.text,
        fontSize: 13.5, lineHeight: 1.5,
        borderBottomRightRadius: user ? 4 : 18,
        borderBottomLeftRadius: user ? 18 : 4,
        border: user ? 'none' : `1px solid ${t.line}`,
      }}>{m.text}</div>

      {/* Viz attachments */}
      {m.viz === 'today' && (
        <div style={{
          maxWidth: '85%', padding: 14, borderRadius: 16,
          background: t.surface, border: `1px solid ${t.line}`,
        }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: t.text3, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>In</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 16, color: t.pos, fontWeight: 700, marginTop: 2 }}>+{fmt(35700, { sym })}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: t.text3, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>Out</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 16, color: t.neg, fontWeight: 700, marginTop: 2 }}>−{fmt(25600, { sym })}</div>
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <Sparkline data={[2, 4, 3, 6, 4, 7, 8]} color={t.accent} width={240} height={36}/>
          </div>
        </div>
      )}
      {m.viz === 'topCustomers' && (
        <div style={{
          maxWidth: '85%', borderRadius: 16, padding: 12,
          background: t.surface, border: `1px solid ${t.line}`,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          {PARTIES.filter(p => p.balance > 0).sort((a, b) => b.balance - a.balance).slice(0, 3).map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar name={p.name} t={t} size={28}/>
              <div style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: t.text }}>{p.name}</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 12.5, fontWeight: 700, color: t.pos }}>{fmt(p.balance, { sym })}</div>
            </div>
          ))}
        </div>
      )}

      {/* Quick reply chips */}
      {m.quick && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: user ? 0 : 4 }}>
          {m.quick.map((q, i) => (
            <Pressable key={i} onPress={() => onQuick(q)} style={{
              padding: '6px 12px', borderRadius: 999,
              background: t.accentSoft, color: t.accent,
              fontSize: 11.5, fontWeight: 600,
              border: `1px solid ${t.accent}33`,
            }}>{q}</Pressable>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Voice entry sheet (signature) ──
function VoiceEntrySheet({ t, open, onClose, onResult, sym }) {
  const [phase, setPhase] = React.useState('listen'); // listen, transcribe, parsed
  const [transcript, setTranscript] = React.useState('');
  const [parsed, setParsed] = React.useState(null);

  React.useEffect(() => {
    if (!open) return;
    setPhase('listen'); setTranscript(''); setParsed(null);
    const phrases = ['Ali ko ', 'Ali ko 5000 ', 'Ali ko 5000 udhaar ', 'Ali ko 5000 udhaar diya'];
    let i = 0;
    const id = setInterval(() => {
      setTranscript(phrases[i]);
      i++;
      if (i >= phrases.length) {
        clearInterval(id);
        setTimeout(() => {
          setPhase('parsed');
          setParsed({
            kind: 'gave', amount: 5000,
            partyName: 'Ali Karyana',
            note: 'Cash udhaar — voice entry',
            cat: 'Sales',
          });
        }, 600);
      }
    }, 700);
    return () => clearInterval(id);
  }, [open]);

  return (
    <Sheet t={t} open={open} onClose={onClose} height={620}>
      <div style={{ padding: '0 22px 24px', display: 'flex', flexDirection: 'column', gap: 18, height: '100%' }}>
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 12,
            background: `linear-gradient(135deg, ${t.accent}, ${t.accent2})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="mic" size={18} color="#fff" stroke={2.2}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FONT_HEAD, fontSize: 17, fontWeight: 700, color: t.text }}>Voice Entry</div>
            <div style={{ fontSize: 11.5, color: t.text2 }}>Roman Urdu, Urdu ya English — bolein</div>
          </div>
        </div>

        {/* Visualizer */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <WaveformBars t={t} active={phase === 'listen'}/>
          <div style={{
            marginTop: 24, fontFamily: FONT_HEAD, fontSize: 22, fontWeight: 600,
            color: t.text, textAlign: 'center', minHeight: 56, padding: '0 12px',
            letterSpacing: '-0.01em',
          }}>
            {transcript || (phase === 'listen' ? 'Sun raha hoon…' : '')}
            {phase === 'listen' && transcript && (
              <span style={{ display: 'inline-block', width: 2, height: 22, background: t.accent, marginLeft: 4, animation: 'blink 0.8s steps(2) infinite', verticalAlign: 'middle' }}/>
            )}
            <style>{`@keyframes blink { 50% { opacity: 0;} }`}</style>
          </div>
        </div>

        {/* Parsed entry preview */}
        {phase === 'parsed' && parsed && (
          <div style={{
            padding: 16, borderRadius: 18,
            background: t.accentSoft, border: `1px solid ${t.accent}33`,
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="sparkle" size={14} color={t.accent}/>
              <span style={{ fontSize: 10.5, color: t.accent, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>AI Parsed</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 14px', fontSize: 13 }}>
              <span style={{ color: t.text2 }}>Type</span>
              <span style={{ color: parsed.kind === 'gave' ? t.neg : t.pos, fontWeight: 700 }}>{parsed.kind === 'gave' ? 'Gave Credit' : 'Got Payment'}</span>
              <span style={{ color: t.text2 }}>Party</span>
              <span style={{ color: t.text, fontWeight: 600 }}>{parsed.partyName}</span>
              <span style={{ color: t.text2 }}>Amount</span>
              <span style={{ color: t.text, fontWeight: 600, fontFamily: FONT_MONO }}>{fmt(parsed.amount, { sym })}</span>
              <span style={{ color: t.text2 }}>Category</span>
              <span style={{ color: t.text, fontWeight: 600 }}>{parsed.cat}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <GhostButton t={t} label="Edit" full/>
              <PrimaryButton t={t} icon="check" label="Save" onClick={() => { onResult && onResult(parsed); onClose(); }} full/>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}

function WaveformBars({ t, active, count = 36 }) {
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setTick(x => x + 1), 80);
    return () => clearInterval(id);
  }, [active]);
  // Generate heights based on tick
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 90 }}>
      {Array.from({ length: count }, (_, i) => {
        const phase = (i / count) * Math.PI * 4 + tick * 0.4;
        const base = active ? 0.3 + Math.abs(Math.sin(phase)) * 0.7 : 0.15;
        const h = base * 80;
        const c = i < count / 2 ? t.accent : t.accent2;
        return (
          <div key={i} style={{
            width: 4, height: h, borderRadius: 2, background: c,
            opacity: 0.55 + base * 0.45,
            boxShadow: active ? `0 0 8px ${c}88` : 'none',
            transition: 'height 90ms ease',
          }}/>
        );
      })}
    </div>
  );
}

// ── More screen ──
function MoreScreen({ t, sym, onNav, mode, onToggleMode }) {
  const sections = [
    { title: 'Tools', items: [
      { i: 'box',      l: 'Inventory',       k: 'inventory' },
      { i: 'wallet',   l: 'Cash Book',     k: 'cashbook' },
      { i: 'users',    l: 'Staff & Payroll', k: 'staff' },
      { i: 'pulse',    l: 'Reports',       k: 'reports' },
      { i: 'qr',       l: 'Payments & QR', k: 'payments' },
      { i: 'ai',       l: 'AI Assistant',  k: 'assistant' },
    ]},
    { title: 'Settings', items: [
      { i: 'user',     l: 'Business profile', k: '' },
      { i: 'shield',   l: 'Security & PIN',   k: '' },
      { i: 'bell',     l: 'Notifications',    k: '' },
      { i: 'lock',     l: 'Backup & Sync',    k: '' },
    ]},
  ];
  return (
    <div style={{ height: '100%', overflow: 'auto', paddingBottom: 110, background: t.bg }}>
      <ScreenHeader t={t} title="More" subtitle="Everything else"/>

      {/* Profile band */}
      <div style={{ padding: '0 20px' }}>
        <Card t={t} style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar name="Adnan Hardware" t={t} size={48}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FONT_HEAD, fontSize: 16, fontWeight: 700, color: t.text }}>Adnan Hardware</div>
            <div style={{ fontSize: 11.5, color: t.text2 }}>Premium plan · 3 team · Lahore</div>
          </div>
          <Pressable onPress={onToggleMode} scale={0.92} style={{
            width: 40, height: 40, borderRadius: 14,
            background: t.dark ? 'rgba(255,255,255,0.06)' : 'rgba(10,12,14,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${t.line}`,
          }}>
            <Icon name={mode === 'dark' ? 'sun' : 'moon'} size={18} color={t.text}/>
          </Pressable>
        </Card>
      </div>

      {sections.map((s, si) => (
        <div key={si} style={{ padding: '18px 20px 0' }}>
          <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>{s.title}</div>
          <Card t={t} padded={false} style={{ padding: '4px 0', overflow: 'hidden' }}>
            {s.items.map((it, i) => (
              <Pressable key={it.l} onPress={() => it.k && onNav(it.k)} scale={0.99} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                borderBottom: i < s.items.length - 1 ? `1px solid ${t.line}` : 'none',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 12,
                  background: t.accentSoft,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name={it.i} size={18} color={t.accent}/>
                </div>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: t.text }}>{it.l}</span>
                <Icon name="arrowRight" size={16} color={t.text3}/>
              </Pressable>
            ))}
          </Card>
        </div>
      ))}

      <div style={{ padding: '24px 20px 0', textAlign: 'center' }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: t.text3, letterSpacing: 0.6 }}>
          Lixar Khata · v2.4.0 · Bilt karachi mein
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AssistantSheet, VoiceEntrySheet, MoreScreen, WaveformBars });
