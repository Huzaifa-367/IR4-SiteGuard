// settings.jsx — Business profile, Security, Notifications, Backup, Team management

// ─── Shared row component ───
function SettingsRow({ t, icon, label, supporting, value, onClick, danger, last }) {
  return (
    <Pressable onPress={onClick} scale={0.99} style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
      borderBottom: last ? 'none' : `1px solid ${t.line}`,
    }}>
      {icon && (
        <div style={{
          width: 36, height: 36, borderRadius: 11,
          background: danger ? t.negSoft : t.accentSoft,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={icon} size={18} color={danger ? t.neg : t.accent}/>
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: danger ? t.neg : t.text }}>{label}</div>
        {supporting && <div style={{ fontSize: 11.5, color: t.text2, marginTop: 2 }}>{supporting}</div>}
      </div>
      {value !== undefined && <div style={{ fontSize: 13, color: t.text2, whiteSpace: 'nowrap' }}>{value}</div>}
      <Icon name="arrowRight" size={16} color={t.text3}/>
    </Pressable>
  );
}

function SettingsToggleRow({ t, icon, label, supporting, value, onChange, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
      borderBottom: last ? 'none' : `1px solid ${t.line}`,
    }}>
      {icon && (
        <div style={{
          width: 36, height: 36, borderRadius: 11,
          background: t.accentSoft,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={icon} size={18} color={t.accent}/>
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{label}</div>
        {supporting && <div style={{ fontSize: 11.5, color: t.text2, marginTop: 2 }}>{supporting}</div>}
      </div>
      <Toggle t={t} value={value} onChange={onChange}/>
    </div>
  );
}

function Toggle({ t, value, onChange }) {
  return (
    <Pressable onPress={() => onChange && onChange(!value)} scale={0.93} style={{
      width: 44, height: 26, borderRadius: 13, padding: 2,
      background: value ? t.accent : t.line, transition: 'background 200ms',
      display: 'flex', alignItems: 'center',
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: 11, background: '#fff',
        transform: `translateX(${value ? 18 : 0}px)`,
        transition: 'transform 220ms cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }}/>
    </Pressable>
  );
}

// ─── Business Profile (view) ───
function BusinessProfileScreen({ t, sym, onBack, onEdit }) {
  return (
    <div style={{ height: '100%', overflow: 'auto', paddingBottom: 30, background: t.bg }}>
      <ScreenHeader t={t}
        left={<IconButton t={t} name="arrowLeft" onClick={onBack}/>}
        title="Business Profile"
        subtitle="Adnan Hardware"
        right={<IconButton t={t} name="edit" onClick={onEdit}/>}
      />

      {/* Hero */}
      <div style={{ padding: '0 20px' }}>
        <div style={{
          padding: 20, borderRadius: 24,
          background: `linear-gradient(140deg, ${t.accent}24, ${t.accent2}12)`,
          border: `1px solid ${t.accent}33`,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <Avatar name="Adnan Hardware" t={t} size={66}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: FONT_HEAD, fontSize: 19, fontWeight: 700, color: t.text, letterSpacing: '-0.01em' }}>
              Adnan Hardware
            </div>
            <div style={{ fontSize: 12, color: t.text2, marginTop: 3 }}>Hardware · Lahore</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <Pill t={t} color={t.accent}>● Premium</Pill>
              <Pill t={t} color={t.pos}>Verified</Pill>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: '14px 20px 0', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <MiniStat t={t} label="Customers" value="142" trend={+8}/>
        <MiniStat t={t} label="Suppliers" value="38"  trend={+2}/>
        <MiniStat t={t} label="Staff"     value="5"   trend={0}/>
      </div>

      {/* Details */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>Details</div>
        <Card t={t} padded={false}>
          <DetailRow t={t} icon="user"     label="Owner"           value="Muhammad Adnan"/>
          <DetailRow t={t} icon="receipt"  label="NTN"             value="3920457-8" mono/>
          <DetailRow t={t} icon="tag"      label="Tax registration" value="STRN 14920-LHR" mono/>
          <DetailRow t={t} icon="calendar" label="Established"     value="Jun 2018"/>
          <DetailRow t={t} icon="pkr"      label="Currency"        value={sym}/>
          <DetailRow t={t} icon="flag"     label="Country"         value="Pakistan" last/>
        </Card>
      </div>

      <div style={{ padding: '14px 20px 0' }}>
        <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>Contact</div>
        <Card t={t} padded={false}>
          <DetailRow t={t} icon="user"   label="Phone"   value="+92 301 234 5678" mono/>
          <DetailRow t={t} icon="send"   label="Email"   value="adnan@hardware.pk" mono/>
          <DetailRow t={t} icon="box"    label="Address" value="Shop 14, Hall Road, Lahore" wrap/>
          <DetailRow t={t} icon="qr"     label="UPI / IBAN" value="PK36 SCBL 0000 1112 ••••" mono last/>
        </Card>
      </div>

      <div style={{ padding: '14px 20px 0' }}>
        <PrimaryButton t={t} icon="edit" label="Edit business profile" onClick={onEdit} full/>
      </div>
      <div style={{ padding: '10px 20px 0' }}>
        <GhostButton t={t} icon="trash" label="Delete this business" full style={{ color: t.neg, borderColor: t.neg + '33' }}/>
      </div>
    </div>
  );
}

function MiniStat({ t, label, value, trend }) {
  return (
    <Card t={t} style={{ padding: 12 }}>
      <div style={{ fontSize: 10.5, color: t.text2, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{label}</div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 20, fontWeight: 700, color: t.text, marginTop: 4 }}>{value}</div>
      {trend !== 0 && (
        <div style={{ fontSize: 10.5, color: trend > 0 ? t.pos : t.neg, fontWeight: 600, marginTop: 2, whiteSpace: 'nowrap' }}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)} this month
        </div>
      )}
    </Card>
  );
}

function DetailRow({ t, icon, label, value, mono, wrap, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: wrap ? 'flex-start' : 'center', gap: 12,
      padding: '12px 16px',
      borderBottom: last ? 'none' : `1px solid ${t.line}`,
    }}>
      <Icon name={icon} size={16} color={t.text3}/>
      <span style={{ fontSize: 12.5, color: t.text2, minWidth: 90 }}>{label}</span>
      <span style={{
        flex: 1, fontSize: 13, fontWeight: 600, color: t.text, textAlign: 'right',
        fontFamily: mono ? FONT_MONO : FONT_BODY,
        wordBreak: wrap ? 'break-word' : 'normal',
      }}>{value}</span>
    </div>
  );
}

// ─── Business Profile Edit ───
function BusinessProfileEditScreen({ t, sym, onBack, onSaved }) {
  const [name, setName] = React.useState('Adnan Hardware');
  const [owner, setOwner] = React.useState('Muhammad Adnan');
  const [type, setType] = React.useState('Hardware');
  const [phone, setPhone] = React.useState('+92 301 234 5678');
  const [email, setEmail] = React.useState('adnan@hardware.pk');
  const [addr, setAddr] = React.useState('Shop 14, Hall Road, Lahore');
  const [ntn, setNtn] = React.useState('3920457-8');
  const types = ['Karyana', 'Hardware', 'Cloth', 'Salon', 'Restaurant', 'Pharmacy', 'Wholesale', 'Other'];

  return (
    <div style={{ height: '100%', overflow: 'auto', paddingBottom: 30, background: t.bg }}>
      <ScreenHeader t={t}
        left={<IconButton t={t} name="arrowLeft" onClick={onBack}/>}
        title="Edit profile"
        subtitle="Auto-saves as you type"
      />

      {/* Logo upload */}
      <div style={{ padding: '0 20px 18px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ position: 'relative' }}>
          <Avatar name={name} t={t} size={92}/>
          <Pressable scale={0.92} style={{
            position: 'absolute', bottom: -4, right: -4,
            width: 32, height: 32, borderRadius: 16,
            background: `linear-gradient(135deg, ${t.accent}, ${t.accent2})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `3px solid ${t.bg}`,
          }}>
            <Icon name="camera" size={14} color="#fff"/>
          </Pressable>
        </div>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field t={t} label="Business name">
          <TextInput t={t} value={name} onChange={setName}/>
        </Field>
        <Field t={t} label="Owner / Manager">
          <TextInput t={t} value={owner} onChange={setOwner} icon="user"/>
        </Field>
        <Field t={t} label="Business type">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {types.map(tp => (
              <Pressable key={tp} onPress={() => setType(tp)} style={{
                padding: '8px 13px', borderRadius: 999,
                background: type === tp ? t.accent : 'transparent',
                color: type === tp ? '#fff' : t.text2,
                border: `1px solid ${type === tp ? t.accent : t.line}`,
                fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
              }}>{tp}</Pressable>
            ))}
          </div>
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field t={t} label="Phone">
            <TextInput t={t} value={phone} onChange={setPhone}/>
          </Field>
          <Field t={t} label="Email">
            <TextInput t={t} value={email} onChange={setEmail}/>
          </Field>
        </div>
        <Field t={t} label="Address">
          <TextInput t={t} value={addr} onChange={setAddr}/>
        </Field>
        <Field t={t} label="NTN / Tax ID">
          <TextInput t={t} value={ntn} onChange={setNtn} suffix="PK"/>
        </Field>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <PrimaryButton t={t} icon="check" label="Save changes" onClick={() => { onSaved && onSaved(); onBack(); }} full/>
      </div>
    </div>
  );
}

// ─── Multi-business switcher ───
const BUSINESSES = [
  { id: 'b1', name: 'Adnan Hardware', type: 'Hardware · Lahore', balance: 184500, active: true,  members: 5 },
  { id: 'b2', name: 'Adnan Karyana',  type: 'Karyana · Lahore',  balance: 62800,  active: false, members: 3 },
  { id: 'b3', name: 'Sons Cloth Co.', type: 'Wholesale · Faisalabad', balance: 412000, active: false, members: 8 },
];

function BusinessSwitcherSheet({ t, sym, open, onClose, onSwitch }) {
  const [adding, setAdding] = React.useState(false);

  if (adding) {
    return (
      <Sheet t={t} open={open} onClose={() => { setAdding(false); onClose(); }} height={620} title="Add new business">
        <AddBusinessFlow t={t} sym={sym} onCancel={() => setAdding(false)} onDone={() => { setAdding(false); onClose(); }}/>
      </Sheet>
    );
  }

  return (
    <Sheet t={t} open={open} onClose={onClose} height={520} title="Switch business">
      <div style={{ padding: '0 22px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {BUSINESSES.map(b => (
          <Pressable key={b.id} onPress={() => { onSwitch && onSwitch(b); onClose(); }} scale={0.99} style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: 14,
            borderRadius: 18, background: b.active ? t.accentSoft : t.surface,
            border: `1px solid ${b.active ? t.accent + '55' : t.line}`,
          }}>
            <Avatar name={b.name} t={t} size={46} ring={b.active ? t.accent : null}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{b.name}</span>
                {b.active && <Pill t={t} color={t.accent} style={{ fontSize: 9, padding: '2px 7px' }}>ACTIVE</Pill>}
              </div>
              <div style={{ fontSize: 11.5, color: t.text2, marginTop: 2 }}>{b.type} · {b.members} members</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, whiteSpace: 'nowrap' }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 14, fontWeight: 700, color: t.text }}>
                {fmt(b.balance, { sym, compact: true })}
              </div>
              <div style={{ fontSize: 10, color: t.text3, marginTop: 2, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>wallet</div>
            </div>
          </Pressable>
        ))}

        <Pressable onPress={() => setAdding(true)} scale={0.99} style={{
          display: 'flex', alignItems: 'center', gap: 14, padding: 14,
          borderRadius: 18, border: `1.5px dashed ${t.line}`,
          color: t.accent,
        }}>
          <div style={{
            width: 46, height: 46, borderRadius: 23,
            background: t.accentSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="plus" size={20} color={t.accent} stroke={2.2}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: t.accent }}>Add new business</div>
            <div style={{ fontSize: 11.5, color: t.text2, marginTop: 2 }}>Manage another store under same account</div>
          </div>
        </Pressable>
      </div>
    </Sheet>
  );
}

function AddBusinessFlow({ t, sym, onCancel, onDone }) {
  const [step, setStep] = React.useState(0);
  const [name, setName] = React.useState('');
  const [type, setType] = React.useState('Karyana');
  const [city, setCity] = React.useState('');
  const types = ['Karyana', 'Hardware', 'Cloth', 'Salon', 'Restaurant', 'Pharmacy', 'Wholesale', 'Other'];

  if (step === 1) {
    return (
      <div style={{ padding: '0 22px 24px', display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
        <div style={{
          width: 80, height: 80, borderRadius: 24,
          background: `linear-gradient(135deg, ${t.accent}, ${t.accent2})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 16px 40px ${t.accent}66`,
          margin: '20px 0 10px',
        }}>
          <Icon name="check" size={36} color="#fff" stroke={2.4}/>
        </div>
        <div style={{ fontFamily: FONT_HEAD, fontSize: 22, fontWeight: 700, color: t.text, textAlign: 'center' }}>
          {name || 'New business'} ready
        </div>
        <div style={{ fontSize: 13.5, color: t.text2, textAlign: 'center', maxWidth: 280, lineHeight: 1.5 }}>
          Aap is business mein abhi switch kar sakte hain. Sample data automatically import ho gaya hai.
        </div>
        <PrimaryButton t={t} label="Switch & start" onClick={onDone} icon="arrowRight" full style={{ marginTop: 12 }}/>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 22px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Field t={t} label="Business name">
        <TextInput t={t} value={name} onChange={setName} placeholder="My second shop"/>
      </Field>
      <Field t={t} label="Business type">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {types.map(tp => (
            <Pressable key={tp} onPress={() => setType(tp)} style={{
              padding: '8px 13px', borderRadius: 999,
              background: type === tp ? t.accent : 'transparent',
              color: type === tp ? '#fff' : t.text2,
              border: `1px solid ${type === tp ? t.accent : t.line}`,
              fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
            }}>{tp}</Pressable>
          ))}
        </div>
      </Field>
      <Field t={t} label="City">
        <TextInput t={t} value={city} onChange={setCity} placeholder="e.g. Karachi"/>
      </Field>

      {/* Plan info */}
      <Card t={t} style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon name="sparkle" size={16} color={t.accent}/>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: t.text }}>Free with Premium plan</div>
          <div style={{ fontSize: 11, color: t.text2 }}>Up to 5 businesses · same login, separate data</div>
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 8 }}>
        <GhostButton t={t} label="Cancel" onClick={onCancel} full/>
        <PrimaryButton t={t} label="Create business" onClick={() => setStep(1)} disabled={!name} full/>
      </div>
    </div>
  );
}

// ─── Security & PIN ───
function SecurityScreen({ t, onBack }) {
  const [pinEnabled, setPinEnabled] = React.useState(true);
  const [faceId, setFaceId] = React.useState(true);
  const [fingerprint, setFingerprint] = React.useState(false);
  const [autoLock, setAutoLock] = React.useState(true);

  const sessions = [
    { device: 'Samsung Galaxy S24', loc: 'Lahore · Now',     current: true },
    { device: 'iPad Pro',          loc: 'Lahore · 2h ago',   current: false },
    { device: 'Web · Chrome',      loc: 'Lahore · Yesterday',current: false },
  ];

  return (
    <div style={{ height: '100%', overflow: 'auto', paddingBottom: 30, background: t.bg }}>
      <ScreenHeader t={t}
        left={<IconButton t={t} name="arrowLeft" onClick={onBack}/>}
        title="Security"
        subtitle="Apna data mehfooz rakhein"
      />

      {/* Shield hero */}
      <div style={{ padding: '0 20px' }}>
        <div style={{
          padding: '22px 20px', borderRadius: 24,
          background: `linear-gradient(140deg, ${t.pos}22, ${t.pos}06)`,
          border: `1px solid ${t.pos}44`,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 50, height: 50, borderRadius: 16,
            background: t.pos, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 24px ${t.pos}66`,
          }}>
            <Icon name="shield" size={26} color="#fff" stroke={2}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FONT_HEAD, fontSize: 17, fontWeight: 700, color: t.text }}>Account secure</div>
            <div style={{ fontSize: 12, color: t.text2, marginTop: 2 }}>2-factor auth · last login 2h ago</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>App Lock</div>
        <Card t={t} padded={false}>
          <SettingsToggleRow t={t} icon="lock"   label="App PIN"      supporting="6-digit code on app open"     value={pinEnabled} onChange={setPinEnabled}/>
          <SettingsToggleRow t={t} icon="user"   label="Face ID"      supporting="Use face to unlock"           value={faceId}     onChange={setFaceId}/>
          <SettingsToggleRow t={t} icon="check"  label="Fingerprint"  supporting="Use fingerprint to unlock"    value={fingerprint} onChange={setFingerprint}/>
          <SettingsToggleRow t={t} icon="clock"  label="Auto-lock"    supporting="Lock after 2 minutes idle"     value={autoLock} onChange={setAutoLock} last/>
        </Card>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>Account</div>
        <Card t={t} padded={false}>
          <SettingsRow t={t} icon="pkr"  label="Change PIN"     supporting="Last changed 32 days ago"/>
          <SettingsRow t={t} icon="send" label="Two-factor (SMS)" supporting="OTP to +92 ••• ••• 5678" value="On"/>
          <SettingsRow t={t} icon="shield" label="Login alerts"  supporting="WhatsApp message on new login" value="On" last/>
        </Card>
      </div>

      {/* Active sessions */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>Active sessions</span>
          <span style={{ fontSize: 12, color: t.neg, fontWeight: 600 }}>Sign out all</span>
        </div>
        <Card t={t} padded={false}>
          {sessions.map((s, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
              borderBottom: i < sessions.length - 1 ? `1px solid ${t.line}` : 'none',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 11,
                background: s.current ? t.posSoft : t.dark ? 'rgba(255,255,255,0.05)' : 'rgba(10,12,14,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="user" size={18} color={s.current ? t.pos : t.text2}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: t.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {s.device}
                  {s.current && <Pill t={t} color={t.pos} style={{ fontSize: 9, padding: '2px 7px' }}>THIS</Pill>}
                </div>
                <div style={{ fontSize: 11.5, color: t.text2 }}>{s.loc}</div>
              </div>
              {!s.current && (
                <Pressable scale={0.95} style={{ fontSize: 12, color: t.neg, fontWeight: 600 }}>End</Pressable>
              )}
            </div>
          ))}
        </Card>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <Card t={t} padded={false}>
          <SettingsRow t={t} icon="trash" label="Delete account" supporting="Permanently remove all data" danger last/>
        </Card>
      </div>
    </div>
  );
}

// ─── Notifications page ───
function NotificationsScreen({ t, sym, onBack, onOpenSettings }) {
  const [tab, setTab] = React.useState('all');

  const notifs = [
    { id: 'n1', kind: 'overdue', title: 'Shahzad Cloth se Rs 76,800 overdue', body: '8 din ho gaye. Polite reminder bhejein?', when: '14 min ago', icon: 'flag', color: t.warn, unread: true },
    { id: 'n2', kind: 'payment', title: 'Ali Karyana ne Rs 12,000 paid', body: 'Easypaisa se confirmed. Khata auto-update.', when: '2h ago', icon: 'arrowDown', color: t.pos, unread: true },
    { id: 'n3', kind: 'stock', title: 'Cooking Oil 5L low stock', body: 'Sirf 4 bottles bachi hain. AI suggested order: 30 bottles.', when: '4h ago', icon: 'box', color: t.warn, unread: true },
    { id: 'n4', kind: 'salary', title: 'Salary due — 3 staff', body: 'Imran, Kashif, Rabia · total Rs 24,500 due in 3 days.', when: 'Today · 09:00', icon: 'users', color: t.info, unread: false },
    { id: 'n5', kind: 'invoice', title: 'INV-2040 viewed', body: 'Rehana Beauty Salon ne invoice WhatsApp pe khoola.', when: 'Yesterday', icon: 'eye', color: t.accent, unread: false },
    { id: 'n6', kind: 'ai', title: 'AI Insight · Sales pattern detected', body: 'Saturday ki sales 38% zyada. Stock badhayein?', when: 'Yesterday', icon: 'sparkle', color: t.accent, unread: false },
    { id: 'n7', kind: 'invoice', title: 'INV-2037 paid by Imtiaz', body: 'Bank transfer · Rs 22,000', when: '2 days ago', icon: 'check', color: t.pos, unread: false },
  ];

  const filtered = notifs.filter(n => {
    if (tab === 'unread') return n.unread;
    if (tab === 'finance') return ['overdue', 'payment', 'invoice', 'salary'].includes(n.kind);
    if (tab === 'stock') return n.kind === 'stock';
    return true;
  });

  return (
    <div style={{ height: '100%', overflow: 'auto', paddingBottom: 30, background: t.bg }}>
      <ScreenHeader t={t}
        left={<IconButton t={t} name="arrowLeft" onClick={onBack}/>}
        title="Notifications"
        subtitle={`${notifs.filter(n => n.unread).length} unread`}
        right={<IconButton t={t} name="sliders" onClick={onOpenSettings}/>}
      />

      <div style={{ padding: '0 20px' }}>
        <SegToggle t={t} options={['all', 'unread', 'finance', 'stock']} value={tab} onChange={setTab}/>
      </div>

      {/* Today section */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10 }}>Today</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.slice(0, 4).map(n => <NotificationCard key={n.id} t={t} n={n}/>)}
        </div>
      </div>

      {filtered.length > 4 && (
        <div style={{ padding: '16px 20px 0' }}>
          <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10 }}>Earlier</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.slice(4).map(n => <NotificationCard key={n.id} t={t} n={n}/>)}
          </div>
        </div>
      )}

      {!filtered.length && (
        <div style={{ padding: 40, textAlign: 'center', color: t.text3, fontSize: 13 }}>
          Koi notification nahi.
        </div>
      )}
    </div>
  );
}

function NotificationCard({ t, n }) {
  return (
    <Pressable scale={0.99} style={{
      display: 'flex', gap: 12, padding: 14, borderRadius: 16,
      background: t.surface, border: `1px solid ${t.line}`,
      position: 'relative',
    }}>
      {n.unread && (
        <div style={{
          position: 'absolute', top: 14, right: 14,
          width: 8, height: 8, borderRadius: 4, background: n.color,
          boxShadow: `0 0 8px ${n.color}`,
        }}/>
      )}
      <div style={{
        width: 38, height: 38, borderRadius: 12,
        background: t.dark ? `${n.color}22` : `${n.color}14`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon name={n.icon} size={18} color={n.color}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: t.text, paddingRight: 18 }}>{n.title}</div>
        <div style={{ fontSize: 12, color: t.text2, marginTop: 4, lineHeight: 1.4 }}>{n.body}</div>
        <div style={{ fontSize: 10.5, color: t.text3, marginTop: 6, fontFamily: FONT_MONO, letterSpacing: 0.4 }}>{n.when}</div>
      </div>
    </Pressable>
  );
}

// ─── Notification settings ───
function NotificationSettingsScreen({ t, onBack }) {
  const [push, setPush] = React.useState(true);
  const [whatsapp, setWhatsapp] = React.useState(true);
  const [sms, setSms] = React.useState(false);
  const [email, setEmail] = React.useState(false);

  const [overdue, setOverdue] = React.useState(true);
  const [lowStock, setLowStock] = React.useState(true);
  const [salary, setSalary] = React.useState(true);
  const [aiInsights, setAiInsights] = React.useState(true);
  const [marketing, setMarketing] = React.useState(false);

  return (
    <div style={{ height: '100%', overflow: 'auto', paddingBottom: 30, background: t.bg }}>
      <ScreenHeader t={t}
        left={<IconButton t={t} name="arrowLeft" onClick={onBack}/>}
        title="Notifications"
        subtitle="Manage channels & types"
      />

      <div style={{ padding: '0 20px' }}>
        <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>Channels</div>
        <Card t={t} padded={false}>
          <SettingsToggleRow t={t} icon="bell" label="Push notifications" supporting="In-app + system push" value={push} onChange={setPush}/>
          <SettingsToggleRow t={t} icon="whatsapp" label="WhatsApp" supporting="Send updates to your business WhatsApp" value={whatsapp} onChange={setWhatsapp}/>
          <SettingsToggleRow t={t} icon="send" label="SMS" supporting="Rs 0.5 per message after free tier" value={sms} onChange={setSms}/>
          <SettingsToggleRow t={t} icon="receipt" label="Email digest" supporting="Daily summary at 9:00 AM" value={email} onChange={setEmail} last/>
        </Card>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>Notification types</div>
        <Card t={t} padded={false}>
          <SettingsToggleRow t={t} icon="flag"     label="Overdue payments"  supporting="When customer is late by 3+ days" value={overdue} onChange={setOverdue}/>
          <SettingsToggleRow t={t} icon="box"      label="Low stock alerts"   supporting="Below configured threshold" value={lowStock} onChange={setLowStock}/>
          <SettingsToggleRow t={t} icon="users"    label="Salary reminders"   supporting="3 days before payroll due" value={salary} onChange={setSalary}/>
          <SettingsToggleRow t={t} icon="sparkle"  label="AI insights"        supporting="Daily business intelligence" value={aiInsights} onChange={setAiInsights}/>
          <SettingsToggleRow t={t} icon="tag"      label="Tips & marketing"   supporting="Lixar product updates" value={marketing} onChange={setMarketing} last/>
        </Card>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>Quiet hours</div>
        <Card t={t} padded={false}>
          <SettingsRow t={t} icon="moon" label="Do not disturb" supporting="10:00 PM — 7:00 AM" value="On"/>
          <SettingsRow t={t} icon="calendar" label="Holiday schedule" supporting="Friday off" value="Off" last/>
        </Card>
      </div>
    </div>
  );
}

// ─── Backup & Sync ───
function BackupScreen({ t, onBack }) {
  const [autoBackup, setAutoBackup] = React.useState(true);
  const [wifiOnly, setWifiOnly] = React.useState(true);
  const [encrypted, setEncrypted] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  const startBackup = () => {
    setBusy(true); setProgress(0);
    const id = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(id); setBusy(false); return 0; }
        return p + 8;
      });
    }, 180);
  };

  return (
    <div style={{ height: '100%', overflow: 'auto', paddingBottom: 30, background: t.bg }}>
      <ScreenHeader t={t}
        left={<IconButton t={t} name="arrowLeft" onClick={onBack}/>}
        title="Backup & Sync"
        subtitle="Cloud · End-to-end encrypted"
      />

      {/* Status card */}
      <div style={{ padding: '0 20px' }}>
        <div style={{
          padding: 22, borderRadius: 24, position: 'relative', overflow: 'hidden',
          background: t.dark
            ? `linear-gradient(140deg, ${t.accent}28, ${t.accent2}12)`
            : `linear-gradient(140deg, ${t.accent}18, ${t.accent2}08)`,
          border: `1px solid ${t.accent}33`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 20px ${t.accent}66`,
            }}>
              <Icon name="lock" size={20} color="#fff" stroke={2}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FONT_HEAD, fontSize: 17, fontWeight: 700, color: t.text }}>
                {busy ? 'Backing up…' : 'Last backup · 2h ago'}
              </div>
              <div style={{ fontSize: 12, color: t.text2 }}>1,248 records · 8.4 MB · Encrypted</div>
            </div>
          </div>

          {busy ? (
            <>
              <div style={{ height: 8, borderRadius: 4, background: t.line, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${t.accent}, ${t.accent2})`, transition: 'width 180ms ease' }}/>
              </div>
              <div style={{ fontSize: 11, color: t.text2, marginTop: 8, fontFamily: FONT_MONO, letterSpacing: 0.4 }}>
                {progress}% · {Math.round(progress * 1.4)} of 140 records
              </div>
            </>
          ) : (
            <PrimaryButton t={t} icon="arrowUp" label="Backup now" onClick={startBackup} full/>
          )}
        </div>
      </div>

      {/* Storage usage */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>Cloud storage</div>
        <Card t={t} style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontFamily: FONT_MONO, fontSize: 20, fontWeight: 700, color: t.text }}>2.4 / 10 GB</span>
            <Pill t={t} color={t.accent}>Premium</Pill>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: t.line, overflow: 'hidden', marginTop: 12 }}>
            <div style={{ height: '100%', width: '24%', background: `linear-gradient(90deg, ${t.accent}, ${t.accent2})` }}/>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 12 }}>
            <UsageRow t={t} label="Photos"     value="1.4 GB" color={t.accent}/>
            <UsageRow t={t} label="Documents"  value="0.6 GB" color={t.accent2}/>
            <UsageRow t={t} label="Records"    value="0.4 GB" color={t.info}/>
          </div>
        </Card>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>Auto-backup</div>
        <Card t={t} padded={false}>
          <SettingsToggleRow t={t} icon="check"  label="Auto-backup"      supporting="Daily at 2:00 AM"  value={autoBackup} onChange={setAutoBackup}/>
          <SettingsToggleRow t={t} icon="qr"     label="Wi-Fi only"       supporting="Save mobile data"  value={wifiOnly} onChange={setWifiOnly}/>
          <SettingsToggleRow t={t} icon="shield" label="E2E encryption"   supporting="Your data, your keys" value={encrypted} onChange={setEncrypted} last/>
        </Card>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>Restore</div>
        <Card t={t} padded={false}>
          <SettingsRow t={t} icon="arrowDown" label="Restore from cloud" supporting="Choose a backup point"/>
          <SettingsRow t={t} icon="pdf"        label="Export all data"    supporting="Download as ZIP (.csv + .pdf)"/>
          <SettingsRow t={t} icon="trash"      label="Delete backup"      supporting="Permanently remove from cloud" danger last/>
        </Card>
      </div>
    </div>
  );
}

function UsageRow({ t, label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 8, height: 8, borderRadius: 4, background: color }}/>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10, color: t.text2, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{label}</div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 11.5, color: t.text, fontWeight: 600, whiteSpace: 'nowrap' }}>{value}</div>
      </div>
    </div>
  );
}

// ─── Team management ───
function TeamScreen({ t, onBack }) {
  const team = [
    { id: 'u1', name: 'Muhammad Adnan', role: 'Owner',    email: 'adnan@hardware.pk',  status: 'active', last: 'Now' },
    { id: 'u2', name: 'Sadia Bibi',     role: 'Manager',  email: 'sadia@hardware.pk',  status: 'active', last: '20m ago' },
    { id: 'u3', name: 'Imran Shah',     role: 'Cashier',  email: 'imran@hardware.pk',  status: 'active', last: '2h ago' },
    { id: 'u4', name: 'Kashif Ali',     role: 'Helper',   email: 'kashif@hardware.pk', status: 'invited', last: 'Pending' },
    { id: 'u5', name: 'Naveed Akhtar',  role: 'Delivery', email: 'naveed@hardware.pk', status: 'paused', last: '5d ago' },
  ];
  const roleColor = (r) => r === 'Owner' ? t.accent : r === 'Manager' ? t.info : t.text2;

  return (
    <div style={{ height: '100%', overflow: 'auto', paddingBottom: 30, background: t.bg }}>
      <ScreenHeader t={t}
        left={<IconButton t={t} name="arrowLeft" onClick={onBack}/>}
        title="Team"
        subtitle={`${team.length} members · 1 invite pending`}
        right={<IconButton t={t} name="plus"/>}
      />

      {/* Invite card */}
      <div style={{ padding: '0 20px' }}>
        <div style={{
          padding: 16, borderRadius: 20,
          background: `linear-gradient(140deg, ${t.accent}22, ${t.accent2}10)`,
          border: `1px solid ${t.accent}33`,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: `linear-gradient(135deg, ${t.accent}, ${t.accent2})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="users" size={20} color="#fff" stroke={2}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FONT_HEAD, fontSize: 15, fontWeight: 700, color: t.text }}>Invite team member</div>
            <div style={{ fontSize: 11.5, color: t.text2 }}>Send WhatsApp / SMS invite</div>
          </div>
          <Pressable scale={0.95} style={{
            padding: '9px 14px', borderRadius: 999,
            background: t.surface, fontSize: 12, fontWeight: 700, color: t.accent,
            border: `1px solid ${t.accent}55`,
          }}>Invite</Pressable>
        </div>
      </div>

      {/* Members list */}
      <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {team.map(m => (
          <Pressable key={m.id} scale={0.99} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: 12,
            borderRadius: 16, background: t.surface, border: `1px solid ${t.line}`,
            opacity: m.status === 'paused' ? 0.6 : 1,
          }}>
            <Avatar name={m.name} t={t} size={42}
              ring={m.status === 'active' ? t.pos : m.status === 'invited' ? t.warn : null}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{m.name}</span>
              </div>
              <div style={{ fontSize: 11.5, color: t.text2, marginTop: 2 }}>{m.email}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <Pill t={t} color={roleColor(m.role)} style={{ fontSize: 10 }}>{m.role}</Pill>
                {m.status === 'invited' && <Pill t={t} color={t.warn} style={{ fontSize: 10 }}>● Pending invite</Pill>}
                {m.status === 'paused' && <Pill t={t} color={t.text3} style={{ fontSize: 10 }}>● Paused</Pill>}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, whiteSpace: 'nowrap' }}>
              <div style={{ fontSize: 11, color: t.text2 }}>Last active</div>
              <div style={{ fontSize: 11.5, color: t.text, fontWeight: 600, marginTop: 2, fontFamily: FONT_MONO }}>{m.last}</div>
            </div>
          </Pressable>
        ))}
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>Permissions</div>
        <Card t={t} padded={false}>
          <SettingsRow t={t} icon="shield" label="Roles & access" supporting="Configure what each role can do"/>
          <SettingsRow t={t} icon="clock"  label="Activity log"   supporting="Track team actions" last/>
        </Card>
      </div>
    </div>
  );
}

// ─── Help & About ───
function HelpScreen({ t, onBack }) {
  return (
    <div style={{ height: '100%', overflow: 'auto', paddingBottom: 30, background: t.bg }}>
      <ScreenHeader t={t}
        left={<IconButton t={t} name="arrowLeft" onClick={onBack}/>}
        title="Help & Support"
      />
      <div style={{ padding: '0 20px' }}>
        <Card t={t} padded={false}>
          <SettingsRow t={t} icon="whatsapp" label="WhatsApp support" supporting="Reply within 10 minutes" value="24/7"/>
          <SettingsRow t={t} icon="ai"       label="Ask AI assistant" supporting="Instant answers"/>
          <SettingsRow t={t} icon="book"     label="Knowledge base"   supporting="Videos & guides"/>
          <SettingsRow t={t} icon="send"     label="Email us"         supporting="support@lixarkhata.com" last/>
        </Card>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <Card t={t} padded={false}>
          <SettingsRow t={t} icon="shield" label="Privacy policy"/>
          <SettingsRow t={t} icon="receipt" label="Terms of service"/>
          <SettingsRow t={t} icon="sparkle" label="What's new" value="v2.4.0" last/>
        </Card>
      </div>

      <div style={{ padding: '40px 20px 0', textAlign: 'center' }}>
        <Logo t={t} size={48}/>
        <div style={{ fontFamily: FONT_HEAD, fontSize: 16, fontWeight: 700, color: t.text, marginTop: 12 }}>
          Lixar Khata
        </div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: t.text3, marginTop: 4 }}>
          v2.4.0 (build 2412) · Made in Karachi
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  SettingsRow, SettingsToggleRow, Toggle, DetailRow, MiniStat,
  BusinessProfileScreen, BusinessProfileEditScreen,
  BUSINESSES, BusinessSwitcherSheet, AddBusinessFlow,
  SecurityScreen, NotificationsScreen, NotificationCard, NotificationSettingsScreen,
  BackupScreen, TeamScreen, HelpScreen,
});
