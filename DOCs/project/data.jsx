// data.jsx — sample data (Roman Urdu + English mix), PKR
// Used across screens. All exports on window.

const PARTIES = [
  { id: 'p1', name: 'Bilal Hardware', tag: 'Supplier', balance: -42500, lastAt: '2h ago', phone: '0301 234 5678', overdue: false, txns: [
    { id: 't1', kind: 'gave',  amt: 15000, note: 'Pipe fittings ka kharcha', at: 'Today · 11:20', cat: 'Inventory' },
    { id: 't2', kind: 'got',   amt: 8000,  note: 'Cash settlement', at: 'Yesterday · 18:42', cat: 'Cash' },
    { id: 't3', kind: 'gave',  amt: 35500, note: 'New stock — 12 items', at: 'Mon · 09:15', cat: 'Inventory' },
  ]},
  { id: 'p2', name: 'Ali Karyana', tag: 'Customer', balance: 18200, lastAt: '4h ago', phone: '0322 998 1245', overdue: true, txns: [
    { id: 't4', kind: 'gave',  amt: 12000, note: 'Atta + Chawal udhaar', at: 'Today · 14:05', cat: 'Sales' },
    { id: 't5', kind: 'gave',  amt: 6200,  note: 'Ghee + Cooking oil', at: 'Wed · 19:00', cat: 'Sales' },
  ]},
  { id: 'p3', name: 'Shahzad Cloth House', tag: 'Customer', balance: 76800, lastAt: '1d ago', phone: '0345 112 9870', overdue: true, txns: [
    { id: 't6', kind: 'gave',  amt: 50000, note: 'Bridal lawn — 8 piece', at: 'Mon · 10:30', cat: 'Sales' },
    { id: 't7', kind: 'gave',  amt: 26800, note: 'Khaadi suit set', at: 'Sun · 13:14', cat: 'Sales' },
  ]},
  { id: 'p4', name: 'Faisal Distributors', tag: 'Supplier', balance: -18000, lastAt: '2d ago', phone: '0300 555 6677', overdue: false, txns: [] },
  { id: 'p5', name: 'Rehana Beauty Salon', tag: 'Customer', balance: 4500, lastAt: '3d ago', phone: '0312 778 2200', overdue: false, txns: [] },
  { id: 'p6', name: 'Mehboob Tea Stall', tag: 'Customer', balance: 1200, lastAt: '3d ago', phone: '0333 871 4423', overdue: false, txns: [] },
  { id: 'p7', name: 'Adnan Electronics', tag: 'Customer', balance: 33400, lastAt: '5d ago', phone: '0307 991 3344', overdue: true, txns: [] },
  { id: 'p8', name: 'Imtiaz Wholesalers', tag: 'Supplier', balance: -8200, lastAt: '1w ago', phone: '0334 220 5566', overdue: false, txns: [] },
];

const INSIGHTS = [
  { tone: 'warn', title: 'Collections 22% niche', body: 'Is hafte ki recovery pichle hafte se kam hai. 3 customers overdue.' },
  { tone: 'pos',  title: 'Cooking oil stock kam', body: 'Sirf 4 bottles bachi hain. AI ne 30 boltles reorder suggest ki.' },
  { tone: 'info', title: 'Shahzad Cloth se 76,800 baqi', body: 'WhatsApp pe polite reminder bhejein?' },
];

const ACTIVITY = [
  { kind: 'sale',     who: 'Ali Karyana',         amt: 12000, when: 'Just now', note: 'Atta + Chawal' },
  { kind: 'expense',  who: 'Bijli Bill — K-Electric', amt: -8400, when: '11:20', note: 'November' },
  { kind: 'payment',  who: 'Imtiaz Wholesalers',  amt: -15000, when: '10:05', note: 'Bank transfer' },
  { kind: 'sale',     who: 'Rehana Salon',         amt: 4500,  when: '09:42', note: '2 products' },
  { kind: 'expense',  who: 'Petrol — Total',      amt: -2200, when: 'Yesterday', note: 'Delivery van' },
  { kind: 'sale',     who: 'Mehboob Tea Stall',   amt: 1200,  when: 'Yesterday', note: 'Sugar + dudh' },
];

const PRODUCTS = [
  { id: 'sku1', name: 'Sunridge Cooking Oil 5L', sku: 'OIL-5L-SR',  stock: 4,   buy: 2200, sell: 2650, sales7: [12,8,10,9,15,11,14], low: true },
  { id: 'sku2', name: 'Ashrafi Basmati 5kg',     sku: 'RICE-AS-5',  stock: 38,  buy: 1850, sell: 2150, sales7: [6,7,9,8,7,6,8], low: false },
  { id: 'sku3', name: 'Sufi Atta 20kg',          sku: 'ATTA-SF-20', stock: 22,  buy: 1980, sell: 2280, sales7: [10,11,9,12,10,11,13], low: false },
  { id: 'sku4', name: 'Tapal Danedar 950g',      sku: 'TEA-TPL-950',stock: 56,  buy: 950,  sell: 1200, sales7: [4,5,3,6,4,5,5], low: false },
  { id: 'sku5', name: 'Mitchells Jam 450g',      sku: 'JAM-MT-450', stock: 12,  buy: 380,  sell: 520,  sales7: [3,2,3,4,3,2,3], low: false },
  { id: 'sku6', name: 'Dalda Banaspati 5L',      sku: 'GHEE-DL-5',  stock: 3,   buy: 2400, sell: 2950, sales7: [8,9,7,10,9,8,11], low: true },
];

const INVOICES = [
  { id: 'INV-2042', party: 'Shahzad Cloth House', amount: 76800, status: 'overdue',  date: 'Mar 12', dueIn: -8 },
  { id: 'INV-2041', party: 'Ali Karyana',          amount: 18200, status: 'overdue',  date: 'Mar 14', dueIn: -3 },
  { id: 'INV-2040', party: 'Rehana Beauty Salon',  amount: 4500,  status: 'unpaid',   date: 'Mar 18', dueIn: 2 },
  { id: 'INV-2039', party: 'Mehboob Tea Stall',    amount: 1200,  status: 'paid',     date: 'Mar 17', dueIn: 0 },
  { id: 'INV-2038', party: 'Adnan Electronics',    amount: 33400, status: 'overdue',  date: 'Mar 11', dueIn: -9 },
  { id: 'INV-2037', party: 'Imtiaz Wholesalers',   amount: 22000, status: 'paid',     date: 'Mar 10', dueIn: 0 },
];

const STAFF = [
  { id: 's1', name: 'Imran Shah',     role: 'Cashier',   salary: 45000, attendance: 'present', joined: 'Jan 2024', due: 12000 },
  { id: 's2', name: 'Sadia Bibi',     role: 'Manager',   salary: 70000, attendance: 'present', joined: 'Jun 2023', due: 0 },
  { id: 's3', name: 'Kashif Ali',     role: 'Helper',    salary: 28000, attendance: 'late',    joined: 'Oct 2024', due: 4500 },
  { id: 's4', name: 'Naveed Akhtar',  role: 'Delivery',  salary: 32000, attendance: 'absent',  joined: 'Feb 2024', due: 0 },
  { id: 's5', name: 'Rabia Khanum',   role: 'Accountant',salary: 60000, attendance: 'present', joined: 'Mar 2022', due: 8000 },
];

// 30 days cashflow data for the river viz
const CASHFLOW_30 = Array.from({ length: 30 }, (_, i) => {
  const phase = i / 29;
  const wave = Math.sin(phase * 6.2) * 8000 + Math.sin(phase * 13) * 4500;
  return {
    day: i + 1,
    in:  Math.max(8000, 22000 + wave + Math.sin(i * 1.7) * 6000),
    out: Math.max(6000, 16000 + Math.cos(phase * 7) * 5500 + Math.sin(i * 0.9) * 4000),
  };
});

const CHAT_SEED = [
  { role: 'user', text: 'Aaj kitna paisa aaya?' },
  { role: 'ai',   text: 'Aaj 4 transactions huye — total Rs 35,700 aaya. Top customer: Ali Karyana (Rs 12,000).', chart: 'today' },
  { role: 'user', text: 'Top 3 customers by pending?' },
];

Object.assign(window, {
  PARTIES, INSIGHTS, ACTIVITY, PRODUCTS, INVOICES, STAFF, CASHFLOW_30, CHAT_SEED,
});
