// onboarding.jsx — splash, 3-step onboarding, login (mobile + OTP), business setup

function SplashScreen({ t, onDone }) {
  React.useEffect(() => {
    const id = setTimeout(onDone, 1900);
    return () => clearTimeout(id);
  }, []);
  return (
    <div style={{
      height: '100%', background: t.dark
        ? `radial-gradient(70% 60% at 50% 40%, ${t.accent}28, ${t.bg} 70%)`
        : `radial-gradient(70% 60% at 50% 40%, ${t.accent}1c, ${t.bg} 70%)`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 20,
    }}>
      <Logo t={t} animated/>
      <div style={{ fontSize: 12, color: t.text3, fontFamily: FONT_MONO, letterSpacing: 2, textTransform: 'uppercase' }}>
        loading your khata
      </div>
    </div>
  );
}

function Logo({ t, size = 64, animated }) {
  // A custom abstract glyph: two interlocking ledger pages
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.32,
      background: `linear-gradient(135deg, ${t.accent}, ${t.accent2})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: `0 16px 40px ${t.accent}55`,
      position: 'relative', overflow: 'hidden',
    }}>
      {animated && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)`,
          animation: 'shimmer 1.8s linear infinite',
        }}/>
      )}
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 32 32">
        <path d="M6 4h11a4 4 0 0 1 4 4v20H10a4 4 0 0 1-4-4z" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinejoin="round"/>
        <path d="M6 22a4 4 0 0 1 4-4h11" fill="none" stroke="#fff" strokeWidth="2.4"/>
        <path d="M14 11h4M14 15h4" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"/>
      </svg>
      <style>{`@keyframes shimmer { 0% { transform: translateX(-100%);} 100% { transform: translateX(100%);} }`}</style>
    </div>
  );
}

function OnboardingScreen({ t, onDone }) {
  const [page, setPage] = React.useState(0);
  const pages = [
    {
      title: 'Apna business asaani se chalain',
      body: 'Khata, bills, stock — sab kuch ek jagah. Single thumb se manage karein.',
      visual: 'manage',
    },
    {
      title: 'Paisa wapas — jaldi se',
      body: 'Smart WhatsApp reminders aur QR payments se collections fast.',
      visual: 'recover',
    },
    {
      title: 'Real-time visibility',
      body: 'Live cashflow, AI insights aur predictive alerts. Hamesha aap ko pata ho.',
      visual: 'visibility',
    },
  ];
  const p = pages[page];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: t.bg }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 24px' }}>
        <Logo t={t} size={36}/>
        <Pressable onPress={onDone}>
          <span style={{ fontSize: 13, color: t.text2, fontWeight: 600 }}>Skip</span>
        </Pressable>
      </div>

      {/* Visual */}
      <div style={{ flex: 1, padding: '10px 24px 0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <OnboardingVisual t={t} kind={p.visual}/>
      </div>

      {/* Text */}
      <div style={{ padding: '0 26px 24px' }}>
        <h1 style={{
          fontFamily: FONT_HEAD, fontSize: 28, fontWeight: 600, color: t.text,
          letterSpacing: '-0.02em', lineHeight: 1.15, margin: 0, marginBottom: 12,
          textWrap: 'balance',
        }}>{p.title}</h1>
        <p style={{ fontSize: 15, color: t.text2, lineHeight: 1.5, margin: 0 }}>{p.body}</p>
      </div>

      {/* Dots + CTA */}
      <div style={{ padding: '0 24px 36px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {pages.map((_, i) => (
            <div key={i} style={{
              height: 6, width: i === page ? 22 : 6, borderRadius: 3,
              background: i === page ? t.accent : t.line,
              transition: 'all 300ms',
            }}/>
          ))}
        </div>
        <div style={{ flex: 1 }}/>
        <PrimaryButton t={t}
          label={page === pages.length - 1 ? 'Get Started' : 'Next'}
          icon="arrowRight"
          onClick={() => page === pages.length - 1 ? onDone() : setPage(page + 1)}
        />
      </div>
    </div>
  );
}

function OnboardingVisual({ t, kind }) {
  const box = {
    height: 320, borderRadius: 28,
    background: t.dark
      ? `linear-gradient(140deg, ${t.accent}1f, ${t.accent2}10)`
      : `linear-gradient(140deg, ${t.accent}14, ${t.accent2}08)`,
    border: `1px solid ${t.line}`,
    position: 'relative', overflow: 'hidden',
    padding: 20,
  };
  if (kind === 'manage') {
    return (
      <div style={box}>
        {/* Floating tiles */}
        {[
          { l: 'Khata',    icon: 'book',    x: 30, y: 30,  w: 130, h: 90, c: t.accent },
          { l: 'Invoices', icon: 'receipt', x: 180, y: 60, w: 130, h: 90, c: t.accent2 },
          { l: 'Stock',    icon: 'box',     x: 60, y: 160, w: 130, h: 90, c: t.warn },
          { l: 'Staff',    icon: 'users',   x: 200, y: 180, w: 110, h: 90, c: t.info },
        ].map((b, i) => (
          <div key={i} style={{
            position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h,
            borderRadius: 18, padding: 12, background: t.surface, border: `1px solid ${t.line}`,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            boxShadow: '0 10px 22px rgba(0,0,0,0.12)',
            animation: `float${i} 4s ease-in-out infinite`,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 10,
              background: t.dark ? `${b.c}28` : `${b.c}1c`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name={b.icon} size={16} color={b.c}/>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: t.text }}>{b.l}</span>
          </div>
        ))}
        <style>{`
          @keyframes float0 { 50% { transform: translateY(-6px);} }
          @keyframes float1 { 50% { transform: translateY(-8px);} }
          @keyframes float2 { 50% { transform: translateY(-4px);} }
          @keyframes float3 { 50% { transform: translateY(-7px);} }
        `}</style>
      </div>
    );
  }
  if (kind === 'recover') {
    return (
      <div style={box}>
        <div style={{
          position: 'absolute', left: 24, top: 30, right: 24,
          padding: 14, borderRadius: 16, background: t.surface, border: `1px solid ${t.line}`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Avatar name="Shahzad Cloth" t={t} size={36}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>Shahzad Cloth House</div>
            <div style={{ fontSize: 11, color: t.text2 }}>Reminder sent via WhatsApp</div>
          </div>
          <Icon name="whatsapp" size={20} color="#25D366"/>
        </div>
        <div style={{
          position: 'absolute', left: '50%', top: '54%', transform: 'translate(-50%, -50%)',
          fontFamily: FONT_MONO, fontSize: 34, fontWeight: 600, color: t.text,
        }}>Rs 76,800</div>
        <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24, display: 'flex', gap: 10 }}>
          <Pill t={t} color={t.warn} style={{ fontSize: 11 }}>● Overdue · 8 days</Pill>
          <Pill t={t} color={t.pos} style={{ fontSize: 11 }}>✓ Reminded</Pill>
        </div>
      </div>
    );
  }
  // visibility — mini cashflow
  return (
    <div style={box}>
      <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>
        Live Cashflow
      </div>
      <div style={{ marginTop: 14 }}>
        <Sparkline data={CASHFLOW_30.map(d => d.in)} color={t.pos} width={300} height={70} fill/>
        <Sparkline data={CASHFLOW_30.map(d => d.out)} color={t.neg} width={300} height={70} fill/>
      </div>
      <div style={{
        position: 'absolute', bottom: 22, left: 20, right: 20,
        padding: 14, borderRadius: 16, background: t.surface, border: `1px solid ${t.accent}55`,
        display: 'flex', gap: 10, alignItems: 'center',
      }}>
        <Icon name="sparkle" size={18} color={t.accent}/>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: t.text }}>Collections 22% niche</div>
          <div style={{ fontSize: 10.5, color: t.text2 }}>3 customers ko remind karein</div>
        </div>
      </div>
    </div>
  );
}

// ── Login: mobile number ──
function LoginScreen({ t, onDone }) {
  const [step, setStep] = React.useState('mobile'); // mobile | otp
  const [mobile, setMobile] = React.useState('');
  const [otp, setOtp] = React.useState(['', '', '', '']);
  const refs = React.useRef([]);

  React.useEffect(() => {
    if (step === 'otp') {
      // Auto-read OTP simulation
      const id = setTimeout(() => setOtp(['7','8','5','2']), 1400);
      return () => clearTimeout(id);
    }
  }, [step]);

  React.useEffect(() => {
    if (otp.every(d => d.length === 1)) {
      const id = setTimeout(onDone, 600);
      return () => clearTimeout(id);
    }
  }, [otp]);

  const valid = mobile.replace(/\D/g, '').length >= 10;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: t.bg, padding: '20px 26px 30px' }}>
      <Logo t={t} size={40}/>
      <div style={{ marginTop: 28 }}>
        <h1 style={{
          fontFamily: FONT_HEAD, fontSize: 30, fontWeight: 600, color: t.text,
          letterSpacing: '-0.02em', lineHeight: 1.1, margin: 0, marginBottom: 10,
        }}>{step === 'mobile' ? 'Apna mobile likhein' : 'OTP enter karein'}</h1>
        <p style={{ fontSize: 14, color: t.text2, margin: 0 }}>
          {step === 'mobile' ? 'Hum aap ko SMS code bhejenge.' : `Code bheja gaya ${mobile} pe. Auto-reading…`}
        </p>
      </div>

      {step === 'mobile' && (
        <div style={{ marginTop: 28 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 16px', borderRadius: 16,
            background: t.dark ? 'rgba(255,255,255,0.04)' : 'rgba(10,12,14,0.03)',
            border: `1px solid ${t.line}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 12, borderRight: `1px solid ${t.line}` }}>
              <span style={{ fontSize: 18 }}>🇵🇰</span>
              <span style={{ fontFamily: FONT_MONO, fontSize: 15, color: t.text, fontWeight: 600 }}>+92</span>
            </div>
            <input
              autoFocus value={mobile} onChange={e => setMobile(e.target.value)}
              placeholder="3XX XXX XXXX"
              inputMode="numeric"
              style={{
                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                color: t.text, fontFamily: FONT_MONO, fontSize: 18, fontWeight: 600, letterSpacing: 1,
              }}
            />
          </div>
          <div style={{ marginTop: 14, fontSize: 12, color: t.text3, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="shield" size={14} color={t.text3}/>
            Bank-grade encryption · Aapka data safe hai
          </div>
        </div>
      )}

      {step === 'otp' && (
        <div style={{ marginTop: 28 }}>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            {otp.map((d, i) => (
              <div key={i} style={{
                width: 64, height: 76, borderRadius: 18,
                background: t.surface, border: `2px solid ${d ? t.accent : t.line}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: FONT_MONO, fontSize: 30, fontWeight: 600, color: t.text,
                transition: 'all 200ms',
              }}>{d || ''}</div>
            ))}
          </div>
          <div style={{ marginTop: 22, textAlign: 'center', fontSize: 13, color: t.text2 }}>
            Code nahi mila? <span style={{ color: t.accent, fontWeight: 600 }}>Resend in 0:24</span>
          </div>
          <div style={{ marginTop: 30, padding: 14, borderRadius: 14,
            background: t.accentSoft, border: `1px solid ${t.accent}33`,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <Icon name="sparkle" size={16} color={t.accent}/>
            <span style={{ fontSize: 12, color: t.text }}>Auto-read enabled · SMS detect ho raha hai</span>
          </div>
        </div>
      )}

      <div style={{ flex: 1 }}/>

      {step === 'mobile' && (
        <PrimaryButton t={t} label="Send OTP" icon="arrowRight"
          onClick={() => setStep('otp')} disabled={!valid} full/>
      )}
    </div>
  );
}

// ── Business setup ──
function BusinessSetupScreen({ t, onDone }) {
  const [name, setName] = React.useState('Adnan Hardware');
  const [type, setType] = React.useState('Hardware');
  const [cur, setCur]   = React.useState('PKR');
  const types = ['Karyana', 'Hardware', 'Cloth', 'Salon', 'Restaurant', 'Pharmacy', 'Wholesale', 'Other'];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: t.bg, padding: '20px 24px 30px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Logo t={t} size={36}/>
        <div style={{ flex: 1 }}/>
        <div style={{ fontSize: 12, color: t.text3 }}>Step 2 of 2</div>
      </div>

      <h1 style={{
        marginTop: 22, fontFamily: FONT_HEAD, fontSize: 28, fontWeight: 600, color: t.text,
        letterSpacing: '-0.02em', lineHeight: 1.15,
      }}>Aapka business setup</h1>
      <p style={{ fontSize: 14, color: t.text2, margin: '6px 0 22px' }}>
        Sirf 30 seconds. Baad mein bhi badal sakte hain.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field t={t} label="Business name">
          <TextInput t={t} value={name} onChange={setName} placeholder="My Shop"/>
        </Field>

        <Field t={t} label="Business type">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {types.map(tp => (
              <Pressable key={tp} onPress={() => setType(tp)} style={{
                padding: '9px 14px', borderRadius: 999,
                background: type === tp ? t.accent : 'transparent',
                color: type === tp ? '#fff' : t.text2,
                border: `1px solid ${type === tp ? t.accent : t.line}`,
                fontSize: 12.5, fontWeight: 600,
              }}>{tp}</Pressable>
            ))}
          </div>
        </Field>

        <Field t={t} label="Currency">
          <div style={{ display: 'flex', gap: 8 }}>
            {['PKR', 'INR', 'AED', 'USD'].map(c => (
              <Pressable key={c} onPress={() => setCur(c)} style={{
                flex: 1, padding: 14, borderRadius: 14,
                background: cur === c ? t.accentSoft : t.surface,
                border: `1px solid ${cur === c ? t.accent : t.line}`,
                textAlign: 'center', fontFamily: FONT_MONO, fontSize: 14, fontWeight: 600,
                color: cur === c ? t.accent : t.text,
              }}>{c}</Pressable>
            ))}
          </div>
        </Field>

        <Field t={t} label="Language">
          <div style={{ display: 'flex', gap: 8 }}>
            {['English', 'Roman Urdu', 'اردو'].map(l => (
              <Pressable key={l} onPress={() => {}} style={{
                flex: 1, padding: 12, borderRadius: 12,
                background: l === 'Roman Urdu' ? t.accentSoft : t.surface,
                border: `1px solid ${l === 'Roman Urdu' ? t.accent : t.line}`,
                textAlign: 'center', fontSize: 13, fontWeight: 600,
                color: l === 'Roman Urdu' ? t.accent : t.text2,
              }}>{l}</Pressable>
            ))}
          </div>
        </Field>
      </div>

      <div style={{ flex: 1 }}/>
      <PrimaryButton t={t} label="Open my dashboard" icon="arrowRight" onClick={onDone} full/>
    </div>
  );
}

function Field({ t, label, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  );
}

Object.assign(window, { SplashScreen, OnboardingScreen, LoginScreen, BusinessSetupScreen, Logo, Field });
