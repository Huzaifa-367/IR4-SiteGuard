// app.jsx — main App with navigation state, theme, Tweaks integration

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "mode": "dark",
  "palette": "emerald",
  "currency": "Rs"
}/*EDITMODE-END*/;

function StaffScreenWrap({ t, sym, onBack }) {
  return <StaffScreen t={t} sym={sym} onBack={onBack}/>;
}
function ReportsScreenWrap({ t, sym, onBack }) {
  return <ReportsScreen t={t} sym={sym} onBack={onBack}/>;
}

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const t = getTheme(tweaks.mode, tweaks.palette);
  const sym = tweaks.currency;

  // Navigation: stack of screens for back nav
  const [stack, setStack] = React.useState([
    { name: 'splash' },
  ]);
  const top = stack[stack.length - 1];

  // Sheets
  const [showAddEntry, setShowAddEntry] = React.useState(false);
  const [addEntryDefaults, setAddEntryDefaults] = React.useState({});
  const [showAssistant, setShowAssistant] = React.useState(false);
  const [showVoice, setShowVoice] = React.useState(false);
  const [showScanner, setShowScanner] = React.useState(false);
  const [showBizSwitcher, setShowBizSwitcher] = React.useState(false);
  const [activeBiz, setActiveBiz] = React.useState(BUSINESSES[0]);

  // Toast
  const [toast, setToast] = React.useState(null);
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  // Navigation helpers
  const push = (s) => setStack(st => [...st, typeof s === 'string' ? { name: s } : s]);
  const replace = (s) => setStack(st => [...st.slice(0, -1), typeof s === 'string' ? { name: s } : s]);
  const reset = (s) => setStack([typeof s === 'string' ? { name: s } : s]);
  const pop = () => setStack(st => st.length > 1 ? st.slice(0, -1) : st);

  // Bottom-nav main tabs
  const mainTab = ['home', 'khata', 'invoice', 'more'].includes(top.name) ? top.name : null;
  const switchTab = (k) => reset(k);

  // FAB
  const onFab = () => {
    if (top.name === 'inventory') { setShowScanner(true); return; }
    if (top.name === 'invoice') { push('invoice-builder'); return; }
    setAddEntryDefaults({ kind: 'gave', party: null });
    setShowAddEntry(true);
  };

  const sayBack = pop;
  const onOpenParty = (party) => push({ name: 'party', party });
  const onAddEntryFromParty = (kind, party) => { setAddEntryDefaults({ kind, party }); setShowAddEntry(true); };
  const onSaved = (entry) => {
    showToast(`Saved · ${entry.kind === 'gave' ? 'Gave' : 'Got'} ${sym} ${entry.amount.toLocaleString()}`);
  };

  // Render the current screen
  let screen;
  if (top.name === 'splash')       screen = <SplashScreen t={t} onDone={() => replace('onboarding')}/>;
  else if (top.name === 'onboarding') screen = <OnboardingScreen t={t} onDone={() => replace('login')}/>;
  else if (top.name === 'login')      screen = <LoginScreen t={t} onDone={() => replace('setup')}/>;
  else if (top.name === 'setup')      screen = <BusinessSetupScreen t={t} onDone={() => reset('home')}/>;
  else if (top.name === 'home')       screen = <HomeScreen t={t} sym={sym} onNav={push} onOpenAddEntry={() => setShowAddEntry(true)} onOpenAssistant={() => setShowAssistant(true)}/>;
  else if (top.name === 'khata')      screen = <KhataScreen t={t} sym={sym} onOpenParty={onOpenParty}/>;
  else if (top.name === 'party')      screen = <PartyDetail t={t} sym={sym} party={top.party} onBack={pop} onAddEntry={onAddEntryFromParty}/>;
  else if (top.name === 'invoice')    screen = <InvoiceScreen t={t} sym={sym} onOpenBuilder={() => push('invoice-builder')}/>;
  else if (top.name === 'invoice-builder') screen = <InvoiceBuilderScreen t={t} sym={sym} onBack={pop} onSaved={() => { pop(); showToast('Invoice sent on WhatsApp · INV-2043'); }}/>;
  else if (top.name === 'inventory')  screen = <InventoryScreen t={t} sym={sym} onScan={() => setShowScanner(true)}/>;
  else if (top.name === 'more')       screen = <MoreScreen t={t} sym={sym}
    onNav={(k) => { if (k === 'assistant') { setShowAssistant(true); } else { push(k); } }}
    mode={tweaks.mode}
    onToggleMode={() => setTweak('mode', tweaks.mode === 'dark' ? 'light' : 'dark')}/>;
  else if (top.name === 'cashbook')   screen = <CashBookScreen t={t} sym={sym} onBack={pop}/>;
  else if (top.name === 'staff')      screen = <StaffScreenWrap t={t} sym={sym} onBack={pop}/>;
  else if (top.name === 'reports')    screen = <ReportsScreenWrap t={t} sym={sym} onBack={pop}/>;
  else if (top.name === 'payments')   screen = <PaymentsScreen t={t} sym={sym} onBack={pop}/>;

  // Should we show the bottom nav?
  const showChrome = !['splash', 'onboarding', 'login', 'setup'].includes(top.name);

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: t.dark
        ? `radial-gradient(80% 60% at 50% 30%, ${t.bg} 0%, #050607 100%)`
        : `radial-gradient(80% 60% at 50% 30%, ${t.bg} 0%, #e8e8e1 100%)`,
      padding: 40,
      fontFamily: FONT_BODY,
      color: t.text,
    }}>
      <div data-screen-label={top.name}>
        <PhoneShell t={t}>
          <div style={{ height: '100%', position: 'relative' }}>
            {screen}
            {showChrome && <BottomNav t={t} current={mainTab} onNav={switchTab} onFab={onFab}/>}

            {/* Toast */}
            {toast && (
              <div style={{
                position: 'absolute', left: 20, right: 20, bottom: 100,
                padding: 14, borderRadius: 14,
                background: t.dark ? 'rgba(20,28,32,0.95)' : 'rgba(255,255,255,0.96)',
                backdropFilter: 'blur(16px)',
                border: `1px solid ${t.line}`,
                display: 'flex', alignItems: 'center', gap: 10,
                animation: 'toastIn 220ms cubic-bezier(0.2,0.9,0.2,1)',
                boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
                zIndex: 200,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 9,
                  background: t.posSoft, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name="check" size={14} color={t.pos}/>
                </div>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: t.text }}>{toast}</span>
                <style>{`@keyframes toastIn { from { transform: translateY(20px); opacity: 0;} to { transform: translateY(0); opacity: 1;} }`}</style>
              </div>
            )}

            {/* Sheets */}
            <AddEntrySheet t={t} sym={sym} open={showAddEntry}
              onClose={() => setShowAddEntry(false)}
              onSave={onSaved}
              defaults={addEntryDefaults}
            />
            <AssistantSheet t={t} sym={sym} open={showAssistant} onClose={() => setShowAssistant(false)}/>
            <VoiceEntrySheet t={t} sym={sym} open={showVoice} onClose={() => setShowVoice(false)} onResult={onSaved}/>
            <ScannerOverlay t={t} open={showScanner} onClose={() => setShowScanner(false)} onResult={(p) => { setShowScanner(false); showToast(`Stock updated · ${p.name}`); }}/>

            {/* Floating voice trigger when on home/khata */}
            {showChrome && top.name === 'home' && (
              <Pressable onPress={() => setShowVoice(true)} scale={0.9} style={{
                position: 'absolute', bottom: 100, right: 20, width: 50, height: 50, borderRadius: 25,
                background: t.surface, border: `1px solid ${t.line}`,
                boxShadow: '0 10px 24px rgba(0,0,0,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 30,
              }}>
                <Icon name="mic" size={20} color={t.accent} stroke={2}/>
                <span style={{
                  position: 'absolute', top: -4, right: -4, padding: '2px 6px',
                  borderRadius: 8, background: t.accent, color: '#fff',
                  fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
                }}>AI</span>
              </Pressable>
            )}
          </div>
        </PhoneShell>
      </div>

      {/* Tweaks panel */}
      <TweaksPanel>
        <TweakSection label="Theme"/>
        <TweakRadio label="Mode" value={tweaks.mode} onChange={v => setTweak('mode', v)}
          options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }]}/>
        <TweakSelect label="Accent palette" value={tweaks.palette} onChange={v => setTweak('palette', v)}
          options={Object.entries(PALETTES).map(([k, v]) => ({ value: k, label: v.name }))}/>

        <TweakSection label="Locale"/>
        <TweakSelect label="Currency symbol" value={tweaks.currency} onChange={v => setTweak('currency', v)}
          options={[
            { value: 'Rs', label: 'Rs (PKR)' },
            { value: '₹',  label: '₹ (INR)' },
            { value: 'Dh', label: 'Dh (AED)' },
            { value: '$',  label: '$ (USD)' },
          ]}/>

        <TweakSection label="Jump to screen"/>
        {[
          ['splash', 'Splash'],
          ['onboarding', 'Onboarding'],
          ['login', 'Login + OTP'],
          ['setup', 'Business setup'],
          ['home', 'Home dashboard'],
          ['khata', 'Khata list'],
          ['invoice', 'Invoices'],
          ['invoice-builder', 'Invoice builder'],
          ['inventory', 'Inventory'],
          ['cashbook', 'Cash book'],
          ['staff', 'Staff'],
          ['reports', 'Reports'],
          ['payments', 'Payments / QR'],
          ['more', 'More / Settings'],
        ].map(([k, l]) => (
          <TweakButton key={k} label={l} onClick={() => reset(k)}/>
        ))}

        <TweakSection label="Try a moment"/>
        <TweakButton label="Open AI Assistant" onClick={() => setShowAssistant(true)}/>
        <TweakButton label="Open Voice Entry" onClick={() => setShowVoice(true)}/>
        <TweakButton label="Open Add Entry" onClick={() => setShowAddEntry(true)}/>
        <TweakButton label="Open Barcode scanner" onClick={() => setShowScanner(true)}/>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
