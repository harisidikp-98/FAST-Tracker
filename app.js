/* =========================================================
   FAST TERRITORY TRACKER — Dashboard Monitoring KPI DSR
   ---------------------------------------------------------
   Setiap DT punya file data sendiri di folder /data.
   Upload ulang file DT tertentu → hanya tab DT itu yang berubah.
   Bagian bertanda "UBAH" boleh Anda sesuaikan.
   ========================================================= */

/* ===== 1. KONFIGURASI UMUM — UBAH ===== */
const CONFIG = {
  appName: 'FAST Territory Tracker',
  userRole: 'AASM',                     // UBAH: jabatan
  userName: 'HARI SIDIK PRAMONO',       // UBAH: nama user
  // UBAH: libur nasional (YYYY-MM-DD) — dikecualikan dari hari kerja (Senin–Sabtu)
  holidays: ['2026-12-25'],
  // UBAH: file Perfect Store (1 file untuk semua DT, template "TABLE PERFECT STORE BY STORE")
  psFile: 'data/perfect_store.xlsx',
  // UBAH: Digitization di halaman Outlet dianggap CAPAI (hijau) bila ≥ angka ini
  digiTarget: 0.4,
  greenMin: 1.0,   // pencapaian ≥ 100% laju waktu → hijau
  yellowMin: 0.8   // 80–99% laju waktu → kuning; di bawahnya merah
};

/* ===== 2. DAFTAR DT — UBAH =====
   salesFile : file export "UID Extract Secondary Sale Data Report" (.xlsx) atau .csv
   targetFile: file target per DSR (format lihat data/target_naicom.csv)
   excludeDsr: kode salesman yang BUKAN DSR (tidak tampil di daftar DSR,
               tapi angkanya tetap masuk total DT), contoh Shopsales = '00'  */
const DTS = [
  { code: 'CAS', distCode: '15480165',    name: 'CV. Citra Anugrah Sejahtera', short: 'Citra Anugrah', salesFile: 'data/citra_anugrah.xlsx', targetFile: 'data/target_citra_anugrah.csv', excludeDsr: ['00'] },
  { code: 'NAICOM', distCode: '15153832', name: 'CV. Naicom Mandiri',          short: 'Naicom',        salesFile: 'data/naicom.xlsx',        targetFile: 'data/target_naicom.csv',        excludeDsr: ['00'],
    // UBAH: tipe DSR. Nama harus sama dengan kolom SalesmaneNama (huruf besar/kecil bebas).
    // DSR yang tidak tercantum otomatis dianggap GT.
    dsrType: {
      MT: ['M. SAM UN HCPC', 'SUPRI BWNUT'],
      GT: ['ISWATI', 'MINA M. MNUMUMES', 'AGUS TRIYADI', 'VIVI ZAYANTI', 'LIUS', 'SUWARMIN33']
    },
    // UBAH: salesman split (KHUSUS KPI Omset). Omset BU dialihkan ke DSR pemegang BU tsb.
    split: [
      { PC: 'AGUS TRIYADI', BW: 'AGUS TRIYADI', HC: 'LIUS', FOODS: 'LIUS' }
    ]
  },
  { code: 'ACP', distCode: '15168386',    name: 'PT. Aditama Citra Papua',     short: 'Aditama',       salesFile: 'data/aditama.xlsx',       targetFile: 'data/target_aditama.csv',       excludeDsr: ['00'] },
  { code: 'KKK', distCode: '15420177',    name: 'CV. Karya Kasih Karunia',     short: 'Karya Kasih',   salesFile: 'data/karya_kasih.xlsx',   targetFile: 'data/target_karya_kasih.csv',   excludeDsr: ['00'] }
];
/* Tipe DSR (urutan tampil) */
const TYPES = [
  { code: 'GT', name: 'GT' },
  { code: 'MT', name: 'MT' }
];
const up = s => String(s ?? '').trim().toUpperCase();
function typeOfDsr(dt, name) {
  const t = dt.dsrType || {};
  for (const k of Object.keys(t)) if ((t[k] || []).some(n => up(n) === up(name))) return k;
  return 'GT';
}

/* ===== 3. DAFTAR KPI — UBAH =====
   code     : harus sama dengan kolom KPI di file target
   source   : 'omset' / 'bills' = dihitung dari file sales
              null = sumber data belum ada → kartu "Data belum tersedia"
   incentive: insentif per DSR (Rp) jika pencapaian ≥ incentiveMin. 0 = belum diatur */
const KPIS = [
  { code: 'OMSET', name: 'Omset (SSV)',        source: 'omset', money: true,  unit: '',     basis: 'Dasar: GSV (retur mengurangi omset) · target omset DSR 100%', incentive: 0, incentiveMin: 1.0 },
  { code: 'BILLS', name: 'Bills Productivity', source: 'bills', money: false, unit: 'bill', basis: 'Dasar: 1 bill = 1 toko unik belanja per hari',                 incentive: 0, incentiveMin: 1.0 },
  { code: 'AVAIL', name: 'Availability',       source: 'avail',   money: false, unit: 'toko panel', basis: 'Dasar: toko Perfect Availability ÷ total store panel (DSR GT)', incentive: 0, incentiveMin: 0.4 },
  { code: 'DIGI',  name: 'Digitization',       source: 'digi',    money: false, unit: 'toko panel', basis: 'Dasar: toko Perfect Digitization ÷ total store panel (DSR GT)', incentive: 0, incentiveMin: 0.4 },
  { code: 'PS',    name: 'Perfect Store',      source: 'perfect', money: false, unit: 'toko panel', basis: 'PS FULL (TOP 30K): Avail + Visib + Digi · PS LITE (TOP 100K): Avail + Visib atau Avail + Digi', incentive: 0, incentiveMin: 0.5 },
  { code: 'HYG',   name: 'Hygiene (DSR)',      source: null,    money: false, unit: '',     basis: 'KPI DSS: Hygiene Factor DSR ≥ 75%',                             incentive: 0, incentiveMin: 0.75 }
];

const PS_SRC = ['avail', 'digi', 'perfect'];   // KPI dari file Perfect Store

/* ===== 3b. DAFTAR BU — UBAH =====
   BU dibaca dari kolom "Sub_division" di file export.
   match: pola awal nama BU di data (huruf besar). */
const BUS = [
  { code: 'BW',    name: 'Beauty & Wellbeing', short: 'B&W',   match: /^BEAUTY/ },
  { code: 'PC',    name: 'Personal Care',      short: 'PC',    match: /^PERSONAL/ },
  { code: 'HC',    name: 'Home Care',          short: 'HC',    match: /^HOME/ },
  { code: 'FOODS', name: 'Foods',              short: 'Foods', match: /^FOOD/ }
];
function normBU(v) {
  const s = String(v ?? '').trim().toUpperCase();
  const b = BUS.find(x => x.match.test(s) || x.code === s || x.short.toUpperCase() === s);
  return b ? b.code : 'OTHER';
}

/* ===== 4. STATE & UTIL ===== */
const state = { page: 'Dashboard', outlet: { tab: 'perf', q: '', psStatus: 'all', psDsr: 'ALL', psFilter: {}, psHidden: new Set(), limit: 200, sort: { perf: { key: 'gsv', dir: -1 }, ps: { key: 'dsr', dir: 1 } } }, data: {}, ps: { status: 'none', rows: [], date: null }, dt: 'ALL', dsr: 'ALL', showIncentive: false, laju: 0, loading: false };
const $ = id => document.getElementById(id);
const nf = new Intl.NumberFormat('id-ID');
const fmtNum = n => nf.format(Math.round(n || 0));
const fmtJt = n => { const a = Math.abs(n || 0), sg = n < 0 ? '-' : ''; return a >= 1e9 ? sg + (a / 1e9).toLocaleString('id-ID', { maximumFractionDigits: 2 }) + ' M' : sg + (a / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' jt'; };
const fmtRp = n => (n < 0 ? '-Rp' : 'Rp') + fmtNum(Math.abs(n));
const fmtPct = r => (isFinite(r) ? r * 100 : 0).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const HARI = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const BLN3 = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const shortDate = d => d ? `${d.getDate()} ${BLN3[d.getMonth()]}` : '-';
const dtByCode = c => DTS.find(d => d.code === c);

/* Angka: mendukung "143,892.00" (format export) maupun "143.892,00" */
function toNum(v) {
  if (typeof v === 'number') return v;
  let s = String(v ?? '').trim().replace(/[^\d.,-]/g, '');
  if (!s) return 0;
  const lc = s.lastIndexOf(','), ld = s.lastIndexOf('.');
  if (lc > ld) s = s.replace(/\./g, '').replace(',', '.');   // 1.234,56
  else s = s.replace(/,/g, '');                              // 1,234.56
  const n = parseFloat(s);
  return isFinite(n) ? n : 0;
}
/* Tanggal: DD/MM/YYYY, YYYY-MM-DD, atau serial Excel */
function toDate(v) {
  const s = String(v ?? '').trim();
  let m = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/.exec(s);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  if (/^\d{5}(\.\d+)?$/.test(s)) { const d = new Date(Math.round((+s - 25569) * 864e5)); return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()); }
  return null;
}
function isWorkday(d) { return d.getDay() !== 0 && !CONFIG.holidays.includes(ymd(d)); }
function statusOf(ratio) {
  if (ratio == null) return 's-none';
  if (state.laju <= 0) return 's-green';
  const r = ratio / state.laju;
  if (r >= CONFIG.greenMin) return 's-green';
  if (r >= CONFIG.yellowMin) return 's-yellow';
  return 's-red';
}
function toast(msg) {
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2400);
}

/* ===== 5. BACA FILE EXCEL (tanpa library besar) =====
   File export UID berisi 1 kolom teks dipisah titik koma (;).
   Parser ini juga mendukung xlsx biasa (banyak kolom) dan CSV.  */
const decodeXml = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16))).replace(/&amp;/g, '&');
const textOf = xml => { let out = '', m; const re = /<(?:\w+:)?t\b[^>]*>([\s\S]*?)<\/(?:\w+:)?t>/g; while ((m = re.exec(xml))) out += m[1]; return decodeXml(out); };
const colIndex = ref => { const l = (/^[A-Z]+/.exec(ref || 'A') || ['A'])[0]; let n = 0; for (const ch of l) n = n * 26 + ch.charCodeAt(0) - 64; return n - 1; };

async function xlsxToRows(buf) {
  const zip = await JSZip.loadAsync(buf);
  const sheetPath = Object.keys(zip.files).filter(p => /^xl\/worksheets\/sheet\d+\.xml$/.test(p)).sort()[0];
  if (!sheetPath) throw new Error('Sheet tidak ditemukan');
  let shared = [];
  if (zip.file('xl/sharedStrings.xml')) {
    const ss = await zip.file('xl/sharedStrings.xml').async('string');
    const re = /<(?:\w+:)?si\b[^>]*>([\s\S]*?)<\/(?:\w+:)?si>/g; let m;
    while ((m = re.exec(ss))) shared.push(textOf(m[1]));
  }
  const xml = await zip.file(sheetPath).async('string');
  const rows = [];
  const rowRe = /<(?:\w+:)?row\b[^>]*>([\s\S]*?)<\/(?:\w+:)?row>/g, cellRe = /<(?:\w+:)?c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:\w+:)?c>)/g;
  let rm;
  while ((rm = rowRe.exec(xml))) {
    const row = []; let cm, auto = 0;
    cellRe.lastIndex = 0;
    while ((cm = cellRe.exec(rm[1]))) {
      const attrs = cm[1], body = cm[2] || '';
      const ref = (/\br="([A-Z]+)\d*"/.exec(attrs) || [])[1];
      const idx = ref ? colIndex(ref) : auto; auto = idx + 1;
      const type = (/\bt="(\w+)"/.exec(attrs) || [])[1];
      let val = '';
      if (type === 'inlineStr') val = textOf(body);
      else { const v = (/<(?:\w+:)?v>([\s\S]*?)<\/(?:\w+:)?v>/.exec(body) || [])[1] || ''; val = type === 's' ? (shared[+v] || '') : decodeXml(v); }
      row[idx] = val;
    }
    if (row.some(v => String(v ?? '').trim() !== '')) rows.push(Array.from(row, v => v ?? ''));
  }
  return rows;
}

/* Ubah baris mentah → objek, otomatis pecah kolom jika format titik koma */
function normalizeTable(rows) {
  if (!rows.length) return [];
  const semi = rows[0].filter(v => v !== '').length === 1 && String(rows[0][0]).includes(';');
  const table = semi ? rows.map(r => String(r[0]).split(';')) : rows;
  const header = table[0].map(h => String(h).trim().toLowerCase());
  return table.slice(1).map(r => { const o = {}; header.forEach((h, i) => { o[h] = r[i] ?? ''; }); return o; });
}
const pick = (o, ...keys) => { for (const k of keys) if (o[k] !== undefined && o[k] !== '') return o[k]; return ''; };

async function fetchFile(url) {
  const res = await fetch(url + '?v=' + Date.now(), { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res;
}

async function loadSales(dt) {
  const res = await fetchFile(dt.salesFile);
  if (!res) return null;
  let raw;
  if (/\.csv$/i.test(dt.salesFile)) {
    const text = await res.text();
    raw = Papa.parse(text, { skipEmptyLines: true, delimiter: '' }).data;
  } else raw = await xlsxToRows(await res.arrayBuffer());
  const objs = normalizeTable(raw);
  const rows = [];
  objs.forEach(o => {
    const date = toDate(pick(o, 'invdate', 'tanggal'));
    const dsr = String(pick(o, 'salesman', 'kode_dsr')).trim();
    if (!date || !dsr) return;
    rows.push({
      date, day: ymd(date), dsr,
      dsrName: String(pick(o, 'salesmanenama', 'salesmanname', 'salesmannama', 'nama_dsr')).trim(),
      outlet: String(pick(o, 'outlet')).trim(),
      outletName: String(pick(o, 'outlet name')).trim(),
      sub: String(pick(o, 'subchannel')).trim(),
      ret: /return|retur/i.test(pick(o, 'billing type')),
      bu: normBU(pick(o, 'sub_division', 'bu')),
      gsv: toNum(pick(o, 'gsv'))
    });
  });
  if (!rows.length) throw new Error('Format file tidak dikenali');
  return rows;
}

async function loadTargets(dt) {
  const res = await fetchFile(dt.targetFile).catch(() => null);
  const map = new Map();
  if (!res) return map;
  const parsed = Papa.parse(await res.text(), { header: true, skipEmptyLines: true });
  const buSum = new Map();
  parsed.data.forEach(r => {
    const code = String(r.Kode_DSR ?? '').trim(), kpi = String(r.KPI ?? '').trim().toUpperCase();
    const buRaw = String(r.BU ?? '').trim();
    const t = toNum(r.Target);
    if (!code || !kpi || !(t > 0)) return;
    if (buRaw) {
      const bu = normBU(buRaw);
      map.set(code + '|' + kpi + '|' + bu, (map.get(code + '|' + kpi + '|' + bu) || 0) + t);
      buSum.set(code + '|' + kpi, (buSum.get(code + '|' + kpi) || 0) + t);
    } else map.set(code + '|' + kpi, t);
  });
  // Jika target total tidak diisi, total = jumlah target per BU
  buSum.forEach((v, k) => { if (!map.has(k)) map.set(k, v); });
  return map;
}

/* ===== 5b. PERFECT STORE (1 file untuk semua DT) =====
   Kolom: Month, Distributor Code&Name, Outlet Code&Name, DSR Name,
   Status Panel - PS Type, Total Store Panel, Perfect Availability,
   Perfect Visibility, Perfect Digitization                              */
function parsePsDsr(s) {
  // "15153832-28 - AGUS TRIYADI & 15153832-29 - LIUS" → [{code:'28', name:'AGUS TRIYADI'}, ...]
  return String(s || '').split(/\s*&\s*(?=\d+-)/).map(p => {
    const m = /^\s*\d+-(\w+)\s*-\s*(.+?)\s*$/.exec(p);
    return m ? { code: m[1], name: m[2] } : null;
  }).filter(Boolean);
}
async function loadPerfectStore() {
  const res = await fetchFile(CONFIG.psFile);
  if (!res) return { status: 'none', rows: [], date: null };
  const lm = res.headers.get('Last-Modified');
  const objs = normalizeTable(await xlsxToRows(await res.arrayBuffer()));
  const rows = [];
  objs.forEach(o => {
    const outlet = String(pick(o, 'outlet code&name')).trim();
    const dist = String(pick(o, 'distributor code&name')).trim();
    if (!outlet || !dist) return;                       // lewati baris Total & keterangan filter
    const one = k => toNum(pick(o, k)) >= 1;
    const om = /^\s*(\S+)\s*-\s*(.*)$/.exec(outlet);
    rows.push({
      distCode: (/^\d+/.exec(dist) || [''])[0],
      outlet,
      outletCode: om ? om[1] : outlet,
      outletName: om ? om[2].trim() : outlet,
      sub: String(pick(o, 'sub element description')).trim(),
      pjp: String(pick(o, 'pjp day')).trim(),
      dsrs: parsePsDsr(pick(o, 'dsr name')),
      full: /FULL/i.test(pick(o, 'status panel - ps type')),
      panel: toNum(pick(o, 'total store panel')),
      pa: one('perfect availability'),
      pv: one('perfect visibility'),
      pd: one('perfect digitization'),
      asTarget: toNum(pick(o, 'aassortment target', 'assortment target')),   // header asli memang "Aassortment"
      asAch: toNum(pick(o, 'assortment achieve'))
    });
  });
  if (!rows.length) throw new Error('Format file Perfect Store tidak dikenali');
  return { status: 'ok', rows, date: lm ? new Date(lm) : new Date() };
}
function psAchieved(r, src) {
  if (src === 'avail') return r.pa;
  if (src === 'digi') return r.pd;
  return r.full ? (r.pa && r.pv && r.pd) : (r.pa && (r.pv || r.pd));   // perfect store
}
/* Tempelkan data PS ke tiap DT + tambahkan DSR yang hanya ada di file PS */
function attachPerfectStore(dt) {
  const D = state.data[dt.code] || (state.data[dt.code] = { status: 'none' });
  D.dsrs = D.dsrs || [];
  D.ps = state.ps.rows.filter(r => r.distCode === dt.distCode);
  const byName = new Map(D.dsrs.map(s => [up(s.name), s]));
  D.ps.forEach(r => r.dsrs.forEach(x => {
    if (!byName.has(up(x.name)) && !D.dsrs.some(s => s.code === x.code)) {
      const s = { code: x.code, name: x.name, dt: dt.code, type: typeOfDsr(dt, x.name), psOnly: true };
      D.dsrs.push(s); byName.set(up(x.name), s);
    }
  }));
  D.ps.forEach(r => { r.codes = [...new Set(r.dsrs.map(x => (byName.get(up(x.name)) || D.dsrs.find(s => s.code === x.code))?.code).filter(Boolean))]; });
  D.dsrs.sort((a, b) => a.code.localeCompare(b.code, 'id', { numeric: true }));
}
const hasAny = D => !!D && (D.status === 'ok' || (D.ps && D.ps.length > 0));

/* ===== 6. MUAT SEMUA DT (per DT terpisah) ===== */
function showBanner(title, pct) {
  $('loadTitle').textContent = title;
  $('loadFill').style.width = Math.max(0, Math.min(100, pct)) + '%';
  $('loadBanner').classList.add('show');
}
const hideBanner = () => $('loadBanner').classList.remove('show');

function renderSkeleton() {
  $('kpiGrid').innerHTML = KPIS.map(() => `
    <div class="card">
      <div class="sk sk-line" style="width:55%"></div>
      <div class="sk sk-line" style="width:30%"></div>
      <div class="sk sk-big"></div>
      <div class="sk sk-line" style="width:80%"></div>
      <div class="sk sk-line" style="height:7px"></div>
      <div class="sk sk-line" style="height:30px"></div>
    </div>`).join('');
}

async function loadAll() {
  if (state.loading) return;
  state.loading = true;
  $('refreshBtn').classList.add('spin');
  $('syncDot').className = 'sync-dot';
  $('loadBadge').className = 'badge'; $('loadBadge').textContent = '⏳ Memuat…';
  renderSkeleton();

  const N = DTS.length;
  showBanner('Memuat data Perfect Store…', 3);
  try { state.ps = await loadPerfectStore(); }
  catch (e) { console.error('Perfect Store', e); state.ps = { status: 'err', rows: [], date: null, error: e.message }; }
  for (let i = 0; i < N; i++) {
    const dt = DTS[i];
    showBanner(`Memuat data DT ${i + 1} dari ${N}: ${dt.name}…`, (i / N) * 100 + 5);
    $('loadBadge').textContent = `⏳ Memuat ${i + 1}/${N} DT`;
    await sleep(30);
    try {
      const rows = await loadSales(dt);
      if (!rows) { state.data[dt.code] = { status: 'none' }; continue; }
      const targets = await loadTargets(dt);
      const dsrMap = new Map();
      rows.forEach(r => { if (!dt.excludeDsr.includes(r.dsr) && !dsrMap.has(r.dsr)) dsrMap.set(r.dsr, r.dsrName); });
      const dsrs = [...dsrMap.entries()].map(([code, name]) => ({ code, name, dt: dt.code, type: typeOfDsr(dt, name) }))
        .sort((a, b) => a.code.localeCompare(b.code, 'id', { numeric: true }));
      const lastDate = rows.reduce((m, r) => (r.date > m ? r.date : m), new Date(0));
      state.data[dt.code] = { status: 'ok', rows, targets, dsrs, lastDate };
    } catch (e) {
      console.error(dt.name, e);
      state.data[dt.code] = { status: 'err', error: e.message };
    }
  }
  DTS.forEach(attachPerfectStore);
  showBanner('Selesai memuat data', 100);

  computeTime();
  if (state.dt !== 'ALL' && !dtByCode(state.dt)) state.dt = 'ALL';
  renderTabs(); renderDsrSelect(); renderDataDates(); render(false);

  const ok = DTS.filter(d => state.data[d.code].status === 'ok').length;
  const err = DTS.filter(d => state.data[d.code].status === 'err').length + (state.ps.status === 'err' ? 1 : 0);
  $('loadBadge').className = 'badge done';
  $('loadBadge').textContent = `✓ ${ok} dari ${N} DT punya data` + (err ? ` · ${err} gagal` : '')
    + ` · Perfect Store ${state.ps.status === 'ok' ? '✓' : state.ps.status === 'err' ? 'gagal' : 'belum ada'}`;
  const now = new Date();
  $('syncTime').textContent = `${String(now.getHours()).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')}`;
  $('syncDot').className = 'sync-dot ' + (err ? 'err' : 'ok');
  if (err) toast('Ada file DT yang gagal dibaca — cek format file');
  setTimeout(hideBanner, 500);
  state.loading = false;
  $('refreshBtn').classList.remove('spin');
}

/* ===== 7. KALENDER & LAJU WAKTU ===== */
function computeTime() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dates = DTS.map(d => state.data[d.code]).filter(x => x && x.status === 'ok').map(x => x.lastDate);
  const last = dates.length ? new Date(Math.max(...dates)) : today;
  const sameMonth = last.getFullYear() === today.getFullYear() && last.getMonth() === today.getMonth();
  const ref = sameMonth ? (today > last ? today : last) : last;
  const y = ref.getFullYear(), mo = ref.getMonth(), dim = new Date(y, mo + 1, 0).getDate();
  let total = 0, passed = 0;
  for (let d = 1; d <= dim; d++) { const dt = new Date(y, mo, d); if (isWorkday(dt)) { total++; if (d <= ref.getDate()) passed++; } }
  state.laju = total ? passed / total : 0;
  $('lajuValue').textContent = fmtPct(state.laju);
  $('lajuSub').textContent = `hari kerja ke-${passed} dari ${total}`;
  $('sisaValue').textContent = `${total - passed} hari`;
  $('pageDate').textContent = `${HARI[today.getDay()]}, ${today.getDate()} ${BULAN[today.getMonth()]} ${today.getFullYear()} · Periode ${BULAN[mo]} ${y}`;
}

/* ===== 8. PERHITUNGAN KPI ===== */
function scopeDts() { return state.dt === 'ALL' ? DTS : DTS.filter(d => d.code === state.dt); }
function scopeDsrKey() { return state.dsr === 'ALL' ? null : state.dsr; } // format "DT|kode"

function emptyAgg() {
  const o = { actual: 0, target: 0, bills: new Set(), bu: {} };
  BUS.forEach(b => { o.bu[b.code] = { actual: 0, target: 0 }; });
  return o;
}
function finishAgg(o, isBills) {
  if (isBills) o.actual = o.bills.size;
  o.ratio = o.target ? o.actual / o.target : null;
  BUS.forEach(b => { const x = o.bu[b.code]; x.ratio = x.target ? x.actual / x.target : null; });
  delete o.bills;
  return o;
}

function computeSalesKpi(kpi) {
  const isBills = kpi.source === 'bills', isOmset = kpi.source === 'omset';
  const total = emptyAgg();
  const groups = {}; TYPES.forEach(t => { groups[t.code] = emptyAgg(); });
  const result = { list: [], nonDsr: 0, lastDate: null, hasData: false };
  const sel = scopeDsrKey();
  let totalTargetOverride = 0, overrideUsed = true;

  scopeDts().forEach(dt => {
    const D = state.data[dt.code];
    if (!D || D.status !== 'ok') return;
    if (sel && !sel.startsWith(dt.code + '|')) return;
    result.hasData = true;
    if (!result.lastDate || D.lastDate > result.lastDate) result.lastDate = D.lastDate;

    const codeByName = new Map(D.dsrs.map(s => [up(s.name), s.code]));
    const dsrInfo = new Map(D.dsrs.map(s => [s.code, s]));
    // Pemilik transaksi: untuk Omset, salesman split dialihkan sesuai BU
    const ownerOf = r => {
      if (isOmset && dt.split) {
        for (const g of dt.split) {
          const names = Object.values(g).map(up);
          if (names.includes(up(r.dsrName))) {
            const target = g[r.bu];
            const c = target && codeByName.get(up(target));
            return c || r.dsr;
          }
        }
      }
      return r.dsr;
    };

    const per = new Map();
    const getP = c => { let p = per.get(c); if (!p) { p = emptyAgg(); per.set(c, p); } return p; };
    let dtNonDsr = 0;
    const selCode = sel ? sel.split('|')[1] : null;

    D.rows.forEach(r => {
      const owner = ownerOf(r);
      if (selCode && owner !== selCode) return;
      const info = dsrInfo.get(owner);            // undefined = non-DSR (Shopsales)
      const g = info ? groups[info.type] : null;
      const p = info ? getP(owner) : null;
      if (isOmset) {
        total.actual += r.gsv; total.bu[r.bu] && (total.bu[r.bu].actual += r.gsv);
        if (p) { p.actual += r.gsv; p.bu[r.bu] && (p.bu[r.bu].actual += r.gsv); }
        if (g) { g.actual += r.gsv; g.bu[r.bu] && (g.bu[r.bu].actual += r.gsv); }
        if (!info) dtNonDsr += r.gsv;
      } else if (isBills && !r.ret && r.outlet) {
        const k = dt.code + '|' + r.outlet + '|' + r.day;
        total.bills.add(k);
        if (p) p.bills.add(k);
        if (g) g.bills.add(k);
      }
    });
    if (isBills) {
      // Non-DSR bills = toko/hari yang tidak dilayani DSR mana pun
      const dsrKeys = new Set(); per.forEach(p => p.bills.forEach(k => dsrKeys.add(k)));
      D.rows.forEach(r => { if (!r.ret && r.outlet && !dsrInfo.has(r.dsr)) { const k = dt.code + '|' + r.outlet + '|' + r.day; if (!dsrKeys.has(k)) { dsrKeys.add(k); dtNonDsr++; } } });
    }
    result.nonDsr += sel ? 0 : dtNonDsr;

    D.dsrs.forEach(s => {
      if (selCode && s.code !== selCode) return;
      if (s.psOnly && !per.has(s.code)) return;   // DSR hanya ada di file Perfect Store
      const p = per.get(s.code) || emptyAgg();
      const actual = isBills ? p.bills.size : p.actual;
      const t = D.targets.get(s.code + '|' + kpi.code) || 0;
      const g = groups[s.type];
      g.target += t; total.target += t;
      const bu = {};
      BUS.forEach(b => {
        const bt = D.targets.get(s.code + '|' + kpi.code + '|' + b.code) || 0;
        const a = p.bu[b.code].actual;
        bu[b.code] = { actual: a, target: bt, ratio: bt ? a / bt : null };
        g.bu[b.code].target += bt; total.bu[b.code].target += bt;
      });
      result.list.push({ code: s.code, name: s.name, dt: dt.code, type: s.type, actual, target: t, ratio: t ? actual / t : null, bu });
    });

    // Target DT khusus (baris TOTAL di file target) bila ada
    const tt = !sel && D.targets.get('TOTAL|' + kpi.code);
    if (tt) totalTargetOverride += tt; else overrideUsed = false;
  });

  if (!sel && overrideUsed && totalTargetOverride) total.target = totalTargetOverride;
  finishAgg(total, isBills);
  TYPES.forEach(t => finishAgg(groups[t.code], isBills));
  result.list.forEach(p => { p.incentive = kpi.incentive && p.ratio != null && p.ratio >= kpi.incentiveMin ? kpi.incentive : 0; });
  result.list.sort((a, b) => TYPES.findIndex(t => t.code === a.type) - TYPES.findIndex(t => t.code === b.type)
    || (b.ratio ?? -1) - (a.ratio ?? -1) || b.actual - a.actual);
  Object.assign(result, { actual: total.actual, target: total.target, ratio: total.ratio, bu: total.bu, groups });
  result.incentive = result.list.reduce((s, p) => s + p.incentive, 0);
  return result;
}

/* --- KPI dari file Perfect Store: Availability, Digitization, Perfect Store ---
   Toko split (2 DSR) dihitung di masing-masing DSR, 1 kali di total. */
function computePsKpi(kpi) {
  const src = kpi.source;
  const total = emptyAgg();
  const groups = {}; TYPES.forEach(t => { groups[t.code] = emptyAgg(); });
  const result = { list: [], nonDsr: 0, nonDsrTarget: 0, lastDate: state.ps.date, hasData: false,
    psType: { full: { actual: 0, target: 0 }, lite: { actual: 0, target: 0 } } };
  const sel = scopeDsrKey();
  const selCode = sel ? sel.split('|')[1] : null;
  scopeDts().forEach(dt => {
    const D = state.data[dt.code];
    if (!D || !D.ps || !D.ps.length) return;
    if (sel && !sel.startsWith(dt.code + '|')) return;
    result.hasData = true;
    const per = new Map();
    D.ps.forEach(r => {
      if (selCode && !r.codes.includes(selCode)) return;
      const ok = psAchieved(r, src) ? 1 : 0;
      total.actual += ok; total.target += r.panel;
      const tp = result.psType[r.full ? 'full' : 'lite']; tp.actual += ok; tp.target += r.panel;
      const codes = selCode ? [selCode] : r.codes;
      const types = new Set();
      codes.forEach(c => {
        const s = D.dsrs.find(x => x.code === c); if (!s) return;
        let p = per.get(c); if (!p) { p = { actual: 0, target: 0 }; per.set(c, p); }
        p.actual += ok; p.target += r.panel; types.add(s.type);
      });
      types.forEach(t => { if (groups[t]) { groups[t].actual += ok; groups[t].target += r.panel; } });
      if (!codes.length) { result.nonDsr += ok; result.nonDsrTarget += r.panel; }
    });
    D.dsrs.forEach(s => {
      const p = per.get(s.code); if (!p) return;
      result.list.push({ code: s.code, name: s.name, dt: dt.code, type: s.type, actual: p.actual, target: p.target, ratio: p.target ? p.actual / p.target : null, bu: {} });
    });
  });
  finishAgg(total, false);
  TYPES.forEach(t => finishAgg(groups[t.code], false));
  ['full', 'lite'].forEach(k => { const x = result.psType[k]; x.ratio = x.target ? x.actual / x.target : null; });
  result.list.forEach(p => { p.incentive = kpi.incentive && p.ratio != null && p.ratio >= kpi.incentiveMin ? kpi.incentive : 0; });
  result.list.sort((a, b) => TYPES.findIndex(t => t.code === a.type) - TYPES.findIndex(t => t.code === b.type)
    || (b.ratio ?? -1) - (a.ratio ?? -1) || b.actual - a.actual);
  Object.assign(result, { actual: total.actual, target: total.target, ratio: total.ratio, bu: total.bu, groups });
  result.incentive = result.list.reduce((s, p) => s + p.incentive, 0);
  return result;
}
function computeKpi(kpi) {
  return PS_SRC.includes(kpi.source) ? computePsKpi(kpi) : computeSalesKpi(kpi);
}

/* ===== 9. RENDER ===== */
function renderTabs() {
  const tabs = [{ code: 'ALL', name: 'Gabungan' }, ...DTS];
  $('dtTabs').innerHTML = tabs.map(t => {
    const D0 = state.data[t.code] || {};
    const st = t.code === 'ALL' ? null : (hasAny(D0) ? 'ok' : D0.status);
    const dot = st ? `<span class="tab-dot ${st === 'ok' ? '' : st === 'err' ? 'err' : 'off'}"></span>` : '';
    return `<button type="button" role="tab" class="tab ${t.code === state.dt ? 'active' : ''}" data-dt="${esc(t.code)}" aria-selected="${t.code === state.dt}">${dot}${esc(t.name)}</button>`;
  }).join('');
}

function renderDsrSelect() {
  const list = [];
  scopeDts().forEach(dt => { const D = state.data[dt.code]; if (D && D.dsrs) D.dsrs.forEach(s => list.push({ ...s, key: dt.code + '|' + s.code, dtShort: dt.short })); });
  if (state.dsr !== 'ALL' && !list.some(d => d.key === state.dsr)) state.dsr = 'ALL';
  const multi = state.dt === 'ALL';
  $('dsrSelect').innerHTML = `<option value="ALL">Semua salesman (${list.length})</option>` +
    list.map(d => `<option value="${esc(d.key)}" ${d.key === state.dsr ? 'selected' : ''}>${multi ? esc(d.dtShort) + ' · ' : ''}[${esc(d.type)}] ${esc(d.code)} - ${esc(d.name)}</option>`).join('');
}

function renderDataDates() {
  $('dataDates').innerHTML = DTS.map(dt => {
    const D = state.data[dt.code] || {};
    const val = D.status === 'ok' ? shortDate(D.lastDate) : D.status === 'err' ? 'gagal baca' : 'belum ada';
    return `<span class="${D.status === 'ok' ? '' : 'off'}">${esc(dt.short)} ${esc(val)}</span>`;
  }).join('') + `<span class="ps-date">Perfect Store: ${state.ps.status === 'ok' ? 'update ' + shortDate(state.ps.date) : state.ps.status === 'err' ? 'gagal baca' : 'belum ada'}</span>`;
}

function scopeTitle() {
  if (state.dsr !== 'ALL') {
    const [dtc, code] = state.dsr.split('|');
    const s = (state.data[dtc]?.dsrs || []).find(x => x.code === code);
    return s ? `${s.name} (${code})` : 'Salesman';
  }
  if (state.dt === 'ALL') return `Gabungan ${DTS.length} distributor`;
  return dtByCode(state.dt).name;
}

function pendingCard(kpi, note) {
  return `
  <article class="card pending s-none">
    <div class="card-name">${esc(kpi.name)}</div>
    <div class="card-date muted">Data s.d. -</div>
    <div class="card-pct">—</div>
    <div class="pending-note">${note || 'Data belum tersedia. Sumber data KPI ini akan ditambahkan.'}</div>
    <div class="basis">${esc(kpi.basis)}</div>
  </article>`;
}

function cardHTML(kpi, r) {
  if (!kpi.source) return pendingCard(kpi);
  const isPs = PS_SRC.includes(kpi.source);
  if (!r || !r.hasData) return pendingCard(kpi, isPs
    ? (state.ps.status === 'err' ? `File Perfect Store gagal dibaca (${esc(state.ps.error)}).` : state.ps.status === 'none' ? `Data belum tersedia. Upload file ke <code>${esc(CONFIG.psFile)}</code>.` : 'Tidak ada toko panel untuk pilihan ini.')
    : 'Data sales belum tersedia untuk DT ini.');
  const st = statusOf(r.ratio);
  const fmt = kpi.money ? fmtRp : fmtNum;
  const fmtShort = kpi.money ? fmtJt : fmtNum;
  const hasT = r.target > 0;
  const detail = kpi.money
    ? `${fmtRp(r.actual)}${hasT ? `<br>dari ${fmtRp(r.target)}` : ''}`
    : `${fmtNum(r.actual)}${hasT ? ` dari ${fmtNum(r.target)}` : ''} ${esc(kpi.unit)}`;
  const showDt = state.dt === 'ALL';
  const withBu = kpi.source === 'omset';
  // Availability & Digitization: nama salesman / jumlah toko panel bisa diklik → Daftar toko panel
  const linkPs = kpi.source === 'avail' || kpi.source === 'digi';
  const goBtn = (key, text, title) => linkPs ? `<button type="button" class="link-btn" data-goto-ps="${esc(key)}" title="${esc(title)}">${text}</button>` : text;
  const withGap = kpi.source === 'omset' || kpi.source === 'bills';   // kolom "Kekurangan"
  const cols = 5 + (showDt ? 1 : 0) + (state.showIncentive ? 1 : 0) + (withBu ? BUS.length : 0) + (withGap ? 1 : 0);
  // Kekurangan = target − actual (0 jika sudah tercapai)
  const gapCell = x => {
    if (!x || !x.target) return '<td class="num">-</td>';
    const g = x.target - x.actual;
    return g > 0 ? `<td class="num gap">${fmt(g)}</td>` : '<td class="num gap-ok">Tercapai</td>';
  };
  const pct = x => x.ratio == null ? '—' : fmtPct(x.ratio);
  const barW = x => x.ratio == null ? 0 : Math.min(100, Math.max(0, x.ratio * 100));

  // ---- Blok GT / MT / Total ----
  const typeRows = [...TYPES.map(t => ({ label: t.name, x: r.groups[t.code] })), { label: 'Total', x: r, total: true }]
    .filter(o => o.total || o.x.actual || o.x.target);
  const segBlock = state.dsr !== 'ALL' ? '' : `
    <div class="seg-list">
      ${typeRows.map(o => `
      <div class="seg-row ${statusOf(o.x.ratio)}${o.total ? ' seg-total' : ''}">
        <div class="bu-line"><span class="seg-name">${esc(o.label)}</span>
          <span class="bu-val">${fmtShort(o.x.actual)}${o.x.target ? ' / ' + fmtShort(o.x.target) : ''}</span>
          <span class="pill ${statusOf(o.x.ratio)}">${pct(o.x)}</span></div>
        <div class="bar bar-sm"><div class="bar-fill" data-w="${barW(o.x)}"></div></div>
      </div>`).join('')}
    </div>`;

  // ---- Blok BU (Omset): Total + rincian GT/MT ----
  const buCell = x => x.target ? `<span class="pill ${statusOf(x.ratio)}">${fmtPct(x.ratio)}</span>` : (x.actual ? `<span class="bu-amt">${fmtJt(x.actual)}</span>` : '-');
  const buBlock = !withBu ? '' : `
    <div class="bu-list">
      <div class="bu-head">Pencapaian per BU</div>
      ${BUS.map(b => { const x = r.bu[b.code]; return `
      <div class="bu-row ${statusOf(x.ratio)}">
        <div class="bu-line"><span class="bu-name">${esc(b.short)}</span>
          <span class="bu-val">${fmtJt(x.actual)}${x.target ? ' / ' + fmtJt(x.target) : ''}</span>
          <span class="pill ${statusOf(x.ratio)}">${pct(x)}</span></div>
        <div class="bar bar-sm"><div class="bar-fill" data-w="${barW(x)}"></div></div>
      </div>`; }).join('')}
    </div>`;

  // ---- Tabel detail: dikelompokkan GT lalu MT ----
  const dsrRow = (p, n) => `
      <tr>
        <td>${n}</td>
        <td>${goBtn(p.dt + '|' + p.code, esc(p.name), 'Lihat daftar toko panel ' + p.name)}</td>
        ${showDt ? `<td>${esc(dtByCode(p.dt).short)}</td>` : ''}
        <td class="num">${fmt(p.actual)}</td>
        <td class="num">${p.target ? goBtn(p.dt + '|' + p.code, fmt(p.target), 'Lihat daftar toko panel ' + p.name) : '-'}</td>
        <td class="num"><span class="pill ${statusOf(p.ratio)}">${pct(p)}</span></td>
        ${withGap ? gapCell(p) : ''}
        ${withBu ? BUS.map(b => `<td class="num">${buCell(p.bu[b.code])}</td>`).join('') : ''}
        ${state.showIncentive ? `<td class="num">${p.incentive ? fmtRp(p.incentive) : '-'}</td>` : ''}
      </tr>`;
  const groupRow = (label, g) => `
      <tr class="grp">
        <td></td><td>${esc(label)}</td>${showDt ? '<td></td>' : ''}
        <td class="num">${fmt(g.actual)}</td>
        <td class="num">${g.target ? goBtn('ALL', fmt(g.target), 'Lihat semua toko panel') : '-'}</td>
        <td class="num"><span class="pill ${statusOf(g.ratio)}">${pct(g)}</span></td>
        ${withGap ? gapCell(g) : ''}
        ${withBu ? BUS.map(b => `<td class="num">${buCell(g.bu[b.code])}</td>`).join('') : ''}
        ${state.showIncentive ? '<td></td>' : ''}
      </tr>`;
  let rowsHtml = '';
  TYPES.forEach(t => {
    const items = r.list.filter(p => p.type === t.code);
    if (!items.length) return;
    if (state.dsr === 'ALL') rowsHtml += groupRow(`DSR ${t.name} (${items.length})`, r.groups[t.code]);
    rowsHtml += items.map((p, i) => dsrRow(p, i + 1)).join('');
  });
  if (!rowsHtml) rowsHtml = `<tr><td colspan="${cols}" class="empty">Tidak ada data.</td></tr>`;
  const nonDsrRow = (r.nonDsr || r.nonDsrTarget) ? `<tr class="subtotal"><td></td><td>${isPs ? 'Toko tanpa DSR' : 'Non-DSR (Shopsales, dll.)'}</td>${showDt ? '<td></td>' : ''}<td class="num">${fmt(r.nonDsr)}</td><td class="num">${r.nonDsrTarget ? (state.dt !== 'ALL' ? goBtn(state.dt + '|__none', fmt(r.nonDsrTarget), 'Lihat toko tanpa DSR') : fmt(r.nonDsrTarget)) : ''}</td><td></td>${withGap ? '<td></td>' : ''}${withBu ? BUS.map(() => '<td></td>').join('') : ''}${state.showIncentive ? '<td></td>' : ''}</tr>` : '';
  const totalRow = state.dsr === 'ALL' && r.list.length ? groupRow('TOTAL', r).replace('class="grp"', 'class="grp grp-total"') : '';
  const incentiveHtml = !state.showIncentive ? '' : kpi.incentive
    ? `<div class="incentive">Est. insentif: ${fmtRp(r.incentive)} (${r.list.filter(p => p.incentive).length} DSR lolos)</div>`
    : `<div class="incentive">Skema insentif belum diatur</div>`;
  const splitNote = withBu && scopeDts().some(d => d.split) ? `<div class="split-note">Salesman split: omset BU dialihkan ke DSR pemegang BU.</div>`
    : isPs ? `<div class="split-note">Toko split (2 DSR) dihitung di masing-masing DSR, 1 kali di total.</div>` : '';
  // Perfect Store: rincian per tipe panel (FULL / LITE)
  const psTypeBlock = kpi.source !== 'perfect' ? '' : `
    <div class="bu-list">
      <div class="bu-head">Per tipe panel</div>
      ${[['FULL', r.psType.full], ['LITE', r.psType.lite]].map(([lb, x]) => `
      <div class="bu-row ${statusOf(x.ratio)}">
        <div class="bu-line"><span class="bu-name">${lb}</span>
          <span class="bu-val">${fmtNum(x.actual)}${x.target ? ' / ' + fmtNum(x.target) : ''}</span>
          <span class="pill ${statusOf(x.ratio)}">${pct(x)}</span></div>
        <div class="bar bar-sm"><div class="bar-fill" data-w="${barW(x)}"></div></div>
      </div>`).join('')}
    </div>`;

  return `
  <article class="card ${st}${withBu ? ' has-bu' : ''}">
    <div class="card-name">${esc(kpi.name)}</div>
    <div class="card-date">${isPs ? 'Update' : 'Data s.d.'} ${shortDate(r.lastDate)}</div>
    ${hasT ? `<div class="card-pct" data-target="${r.ratio}">0,0%</div>` : `<div class="card-pct">—</div>`}
    <div class="card-detail">${linkPs ? goBtn('ALL', detail, 'Lihat daftar toko panel') : detail}</div>
    ${hasT ? '' : `<div class="pending-note">${isPs ? 'Tidak ada toko panel.' : 'Target belum diisi di file target.'}</div>`}
    <div class="bar"><div class="bar-fill" data-w="${hasT ? barW(r) : 0}"></div></div>
    ${segBlock}
    ${buBlock}
    ${psTypeBlock}
    <div class="basis">${esc(kpi.basis)}</div>
    ${splitNote}
    ${incentiveHtml}
    <button type="button" class="detail-btn" aria-expanded="false">Klik di sini untuk lihat detail <span class="caret">▾</span></button>
    <div class="acc"><div class="acc-inner">
      <div class="acc-tools"><button type="button" class="expand-btn" data-title="${esc(kpi.name)}" aria-label="Lihat tabel ${esc(kpi.name)} layar penuh">⛶ Lihat layar penuh</button></div>
      <div class="table-wrap"><table>
        <thead><tr><th>#</th><th>DSR</th>${showDt ? '<th>DT</th>' : ''}<th class="num">${isPs ? 'Tercapai' : 'Actual'}</th><th class="num">${isPs ? 'Panel' : 'Target'}</th><th class="num">%</th>${withGap ? '<th class="num">Kekurangan</th>' : ''}${withBu ? BUS.map(b => `<th class="num">${esc(b.short)}</th>`).join('') : ''}${state.showIncentive ? '<th class="num">Insentif</th>' : ''}</tr></thead>
        <tbody>${rowsHtml}${nonDsrRow}${totalRow}</tbody>
      </table></div>
    </div></div>
  </article>`;
}

function animate() {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.querySelectorAll('.bar-fill').forEach(b => { b.style.width = (b.dataset.w || 0) + '%'; });
  }));
  const els = [...document.querySelectorAll('.card-pct[data-target]')];
  const start = performance.now(), dur = 800;
  const step = now => {
    const t = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - t, 3);
    els.forEach(el => { el.textContent = fmtPct((parseFloat(el.dataset.target) || 0) * e); });
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function render(withFade = true) {
  if (state.page === 'Outlet') { $('scopeTitle').textContent = scopeTitle(); renderOutletPage(); return; }
  const grid = $('kpiGrid');
  const draw = () => {
    $('scopeTitle').textContent = scopeTitle();
    const D = state.dt !== 'ALL' ? state.data[state.dt] : null;
    const anyData = DTS.some(d => hasAny(state.data[d.code]));
    if ((D && !hasAny(D)) || (!D && !anyData)) {
      const dt = dtByCode(state.dt);
      const msg = D && D.status === 'err'
        ? `<b>File data ${esc(dt.name)} gagal dibaca</b>Pastikan file adalah export "UID Extract Secondary Sale Data Report" (${esc(D.error)}).`
        : dt ? `<b>Data ${esc(dt.name)} belum tersedia</b>Upload file export ke <code>${esc(dt.salesFile)}</code> lalu klik tombol refresh.`
             : `<b>Belum ada data DT</b>Upload file export ke folder <code>data/</code>.`;
      grid.innerHTML = `<div class="empty-dt">${msg}</div>` + KPIS.map(k => pendingCard(k)).join('');
    } else {
      grid.innerHTML = KPIS.map(k => cardHTML(k, k.source ? computeKpi(k) : null)).join('');
    }
    grid.classList.remove('fading');
    animate();
  };
  if (withFade) { grid.classList.add('fading'); setTimeout(draw, 200); } else draw();
}

/* ===== 9b. TABEL LAYAR PENUH ===== */
function openTableModal(title, table) {
  if (!table) return;
  const scope = $('scopeTitle').textContent;
  $('tmTitle').textContent = `${title} · ${scope}`;
  $('tmBody').innerHTML = '';
  $('tmBody').appendChild(table.cloneNode(true));
  $('tableModal').classList.add('show');
  document.body.style.overflow = 'hidden';
  $('tmClose').focus();
}
function closeTableModal() {
  $('tableModal').classList.remove('show');
  document.body.style.overflow = '';
}

/* ===== 9c. HALAMAN OUTLET =====
   Tab 1  Outlet Performance          : dari file sales per DT
   Tab 2  Outlet Panel Perfect Store  : dari file Perfect Store
   Mengikuti tab DT & dropdown salesman di atas. Bisa dicari by nama / kode toko. */
const PAGES = ['Dashboard', 'Outlet'];
const OUT_LIMIT = 200;   // jumlah baris awal yang ditampilkan (sisanya via tombol)

function showPage(page) {
  closePop();
  state.page = page;
  $('pageTitle').textContent = page;
  $('kpiGrid').hidden = page !== 'Dashboard';
  $('outletPage').hidden = page !== 'Outlet';
  $('incentiveWrap').hidden = page !== 'Dashboard';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  render(false);
}

const matchQ = (code, name) => {
  const q = up(state.outlet.q); if (!q) return true;
  return up(code).includes(q) || up(name).includes(q);
};
function sortRows(rows, cols, sortState) {
  const c = cols.find(x => x.key === sortState.key) || cols.find(x => x.get);
  if (!c || !c.get) return rows;
  return rows.sort((a, b) => {
    const va = c.get(a), vb = c.get(b);
    const r = (typeof va === 'number' && typeof vb === 'number') ? va - vb : String(va ?? '').localeCompare(String(vb ?? ''), 'id', { numeric: true });
    return r * sortState.dir;
  });
}
function tableHTML(id, title, cols, rows, sortState, opts = {}) {
  const shown = opts.limit ? rows.slice(0, opts.limit) : rows;
  const head = cols.map(c => {
    if (opts.filter && c.get) {   // header bergaya filter Excel
      const on = !!opts.filter[c.key];
      const so = sortState && sortState.key === c.key ? (sortState.dir > 0 ? ' ↑' : ' ↓') : '';
      return `<th class="${c.num ? 'num ' : ''}fcol${on ? ' f-on' : ''}" data-fcol="${c.key}" tabindex="0" aria-haspopup="dialog" title="Klik untuk filter / urutkan">${esc(c.label)}${so}<span class="fbtn" aria-hidden="true">${on ? '⧩' : '▾'}</span></th>`;
    }
    const on = sortState && c.get && sortState.key === c.key;
    const arrow = on ? (sortState.dir > 0 ? ' ▲' : ' ▼') : '';
    return `<th class="${c.num ? 'num' : ''}${c.get && sortState ? ' sortable' : ''}" ${c.get && sortState ? `data-sort="${c.key}" data-table="${id}" tabindex="0" aria-sort="${on ? (sortState.dir > 0 ? 'ascending' : 'descending') : 'none'}"` : ''}>${esc(c.label)}${arrow}</th>`;
  }).join('');
  const body = shown.length ? shown.map((r, i) => `<tr class="${r._cls || ''}">${cols.map(c => `<td class="${c.num ? 'num' : ''}${c.wrap ? ' wrap' : ''}">${c.html(r, i)}</td>`).join('')}</tr>`).join('')
    : `<tr><td colspan="${cols.length}" class="empty">${esc(opts.empty || 'Tidak ada data.')}</td></tr>`;
  const more = opts.limit && rows.length > opts.limit
    ? `<button type="button" class="more-btn">Tampilkan semua (${fmtNum(rows.length)} baris)</button>` : '';
  return `
    <div class="out-block${opts.blockCls ? ' ' + opts.blockCls : ''}"${opts.blockId ? ` id="${opts.blockId}"` : ''}>
      <div class="out-block-head">
        <h3>${esc(title)}</h3>
        <div class="out-block-tools">${opts.extraBtn || ''}<button type="button" class="expand-btn" data-title="${esc(title)}">⛶ Lihat layar penuh</button></div>
      </div>
      <div class="table-wrap out-table"><table class="${opts.tableCls || ''}">
        <thead><tr>${head}</tr></thead><tbody>${body}${opts.foot || ''}</tbody>
      </table></div>
      ${more}
    </div>`;
}
const statBox = (label, value, sub, cls = '') => `
  <div class="out-stat ${cls}"><div class="info-label">${esc(label)}</div><div class="out-stat-val">${value}</div><div class="info-sub">${sub || ''}</div></div>`;
const yesNo = v => v ? '<span class="pill s-green">✓</span>' : '<span class="pill s-red">✗</span>';
const dtShort = c => esc(dtByCode(c)?.short || c);

/* --- Tab 1: Outlet Performance --- */
function outletPerfRows() {
  const sel = scopeDsrKey(), sc = sel ? sel.split('|')[1] : null;
  const map = new Map();
  scopeDts().forEach(dt => {
    const D = state.data[dt.code];
    if (!D || D.status !== 'ok') return;
    if (sel && !sel.startsWith(dt.code + '|')) return;
    D.rows.forEach(r => {
      if (sc && r.dsr !== sc) return;
      if (!r.outlet) return;
      const k = dt.code + '|' + r.outlet;
      let o = map.get(k);
      if (!o) { o = { code: r.outlet, name: r.outletName, sub: r.sub, dt: dt.code, dsrs: new Set(), gsv: 0, days: new Set(), last: null, bu: {} }; map.set(k, o); }
      if (!o.name && r.outletName) o.name = r.outletName;
      if (!dt.excludeDsr.includes(r.dsr)) o.dsrs.add(r.dsrName);
      o.gsv += r.gsv;
      o.bu[r.bu] = (o.bu[r.bu] || 0) + r.gsv;
      if (!r.ret) { o.days.add(r.day); if (!o.last || r.date > o.last) o.last = r.date; }
    });
  });
  return [...map.values()].map(o => ({ ...o, bills: o.days.size, dsr: [...o.dsrs].join(', '), buList: BUS.filter(b => (o.bu[b.code] || 0) > 0) }));
}
function renderOutletPerf() {
  const anySales = scopeDts().some(dt => state.data[dt.code]?.status === 'ok');
  if (!anySales) return `<div class="empty-dt"><b>Data sales belum tersedia</b>Outlet Performance membutuhkan file sales DT ini.</div>`;
  const all = outletPerfRows();
  const active = all.filter(o => o.bills > 0);
  const totGsv = all.reduce((s, o) => s + o.gsv, 0);
  const totBills = all.reduce((s, o) => s + o.bills, 0);
  const showDt = state.dt === 'ALL';
  const rows = sortRows(all.filter(o => matchQ(o.code, o.name)), PERF_COLS(showDt), state.outlet.sort.perf);
  const stats = `
    <div class="out-stats">
      ${statBox('Outlet aktif', fmtNum(active.length), 'belanja ≥ 1 kali bulan ini')}
      ${statBox('Total omset (GSV)', fmtRp(totGsv), 'retur sudah mengurangi')}
      ${statBox('Rata-rata omset / outlet', fmtRp(active.length ? totGsv / active.length : 0), 'outlet aktif')}
      ${statBox('Total bill', fmtNum(totBills), '1 bill = toko unik per hari')}
    </div>`;
  const note = `<p class="out-note">Menampilkan ${fmtNum(rows.length)} dari ${fmtNum(all.length)} outlet${state.outlet.q ? ` untuk pencarian "<b>${esc(state.outlet.q)}</b>"` : ''}. Kolom DSR = salesman yang menagih di outlet tsb (sebelum aturan salesman split).</p>`;
  return stats + note + tableHTML('perf', 'Outlet Performance', PERF_COLS(showDt), rows, state.outlet.sort.perf,
    { limit: state.outlet.limit, empty: 'Outlet tidak ditemukan.' });
}
function PERF_COLS(showDt) {
  return [
    { key: 'no', label: '#', html: (r, i) => i + 1 },
    { key: 'code', label: 'Kode Toko', get: r => r.code, html: r => `<span class="mono">${esc(r.code)}</span>` },
    { key: 'name', label: 'Nama Toko', get: r => r.name, html: r => esc(r.name || '-'), wrap: true },
    ...(showDt ? [{ key: 'dt', label: 'DT', get: r => dtShort(r.dt), html: r => dtShort(r.dt) }] : []),
    { key: 'sub', label: 'Sub Channel', get: r => r.sub, html: r => esc(r.sub || '-') },
    { key: 'dsr', label: 'DSR', get: r => r.dsr, html: r => esc(r.dsr || '-'), wrap: true },
    { key: 'gsv', label: 'Omset (GSV)', num: true, get: r => r.gsv, html: r => fmtRp(r.gsv) },
    { key: 'bills', label: 'Bill', num: true, get: r => r.bills, html: r => fmtNum(r.bills) },
    { key: 'avg', label: 'Rata-rata / bill', num: true, get: r => r.bills ? r.gsv / r.bills : 0, html: r => r.bills ? fmtRp(r.gsv / r.bills) : '-' },
    { key: 'bu', label: 'BU dibeli', get: r => r.buList.length, html: r => r.buList.length ? r.buList.map(b => `<span class="bu-chip">${esc(b.short)}</span>`).join('') : '-' },
    { key: 'last', label: 'Belanja terakhir', get: r => r.last ? r.last.getTime() : 0, html: r => r.last ? shortDate(r.last) : '-' }
  ];
}

/* --- Tab 2: Outlet Panel Perfect Store --- */
function psMissing(r) {
  if (r.full) return [!r.pa && 'Availability', !r.pv && 'Visibility', !r.pd && 'Digitization'].filter(Boolean).join(', ');
  const m = [];
  if (!r.pa) m.push('Availability');
  if (!r.pv && !r.pd) m.push('Visibility / Digitization');
  return m.join(', ');
}
function outletGsvMap(D) {
  if (D._gsv) return D._gsv;
  const m = new Map();
  (D.rows || []).forEach(r => m.set(r.outlet, (m.get(r.outlet) || 0) + r.gsv));
  return (D._gsv = m);
}
function psOutletRows(ignoreLocal) {
  const sel = scopeDsrKey(), sc = sel ? sel.split('|')[1] : null;
  const loc = ignoreLocal ? 'ALL' : state.outlet.psDsr;   // filter DSR lokal (dropdown di tab ini)
  const out = [];
  scopeDts().forEach(dt => {
    const D = state.data[dt.code];
    if (!D || !D.ps || !D.ps.length) return;
    if (sel && !sel.startsWith(dt.code + '|')) return;
    const gsv = D.status === 'ok' ? outletGsvMap(D) : null;
    D.ps.forEach(r => {
      if (sc && !r.codes.includes(sc)) return;
      if (loc !== 'ALL') {
        if (loc === dt.code + '|__none') { if (r.codes.length) return; }
        else if (!loc.startsWith(dt.code + '|') || !r.codes.includes(loc.split('|')[1])) return;
      }
      const perfect = psAchieved(r, 'perfect');
      out.push({ ...r, dt: dt.code, perfect, missing: perfect ? '' : psMissing(r),
        dsr: r.dsrs.map(x => x.name).join(' & '), gsv: gsv ? (gsv.get(r.outletCode) || 0) : null,
        _cls: perfect ? 'row-ok' : '' });
    });
  });
  return out;
}
function psAgg(rows) {
  const a = { panel: 0, pa: 0, pv: 0, pd: 0, ps: 0 };
  rows.forEach(r => { a.panel += r.panel; a.pa += r.pa ? 1 : 0; a.pv += r.pv ? 1 : 0; a.pd += r.pd ? 1 : 0; a.ps += r.perfect ? 1 : 0; });
  return a;
}
const pctPill = (n, d, kind) => d ? `<span class="pill ${kind === 'pd' ? digiStatus(n / d) : statusOf(n / d)}">${fmtPct(n / d)}</span>` : '-';
// Digitization: capai (hijau) bila ≥ CONFIG.digiTarget; kuning bila ≥ 80% dari target; selain itu merah
function digiStatus(r) {
  if (r == null) return 's-none';
  if (r >= CONFIG.digiTarget) return 's-green';
  if (r >= CONFIG.digiTarget * CONFIG.yellowMin) return 's-yellow';
  return 's-red';
}
// Assortment per toko: hijau ≥ 100% target, kuning ≥ 80%, merah di bawahnya
function asStatus(r) {
  if (r == null) return 's-none';
  return r >= 1 ? 's-green' : r >= CONFIG.yellowMin ? 's-yellow' : 's-red';
}
const SUM_COLS = first => [
  ...first,
  { key: 'panel', label: 'Toko Panel', num: true, get: r => r.panel, html: r => fmtNum(r.panel) },
  { key: 'pa', label: 'Availability', num: true, get: r => r.pa, html: r => `${fmtNum(r.pa)} ${pctPill(r.pa, r.panel)}` },
  { key: 'pv', label: 'Visibility', num: true, get: r => r.pv, html: r => `${fmtNum(r.pv)} ${pctPill(r.pv, r.panel)}` },
  { key: 'pd', label: 'Digitization', num: true, get: r => r.pd, html: r => `${fmtNum(r.pd)} ${pctPill(r.pd, r.panel, 'pd')}` },
  { key: 'ps', label: 'Perfect Store', num: true, get: r => r.ps, html: r => `${fmtNum(r.ps)} ${pctPill(r.ps, r.panel)}` }
];
function renderOutletPs() {
  if (state.ps.status !== 'ok') { fillPsDsrSelect([]); return `<div class="empty-dt"><b>Data Perfect Store belum tersedia</b>Upload file ke <code>${esc(CONFIG.psFile)}</code>.</div>`; }
  fillPsDsrSelect(psOutletRows(true));
  const all = psOutletRows();
  if (!all.length) return `<div class="empty-dt"><b>Tidak ada toko panel</b>untuk pilihan DT / salesman ini.</div>`;
  const showDt = state.dt === 'ALL';
  const tot = psAgg(all);
  const stats = `
    <div class="out-stats">
      ${statBox('Toko panel', fmtNum(tot.panel), `FULL ${fmtNum(all.filter(r => r.full).length)} · LITE ${fmtNum(all.filter(r => !r.full).length)}`)}
      ${statBox('Perfect Store', `${fmtNum(tot.ps)} <small>${fmtPct(tot.panel ? tot.ps / tot.panel : 0)}</small>`, 'FULL: A+V+D · LITE: A+V / A+D', statusOf(tot.panel ? tot.ps / tot.panel : null))}
      ${statBox('Availability', `${fmtNum(tot.pa)} <small>${fmtPct(tot.panel ? tot.pa / tot.panel : 0)}</small>`, 'toko perfect availability', statusOf(tot.panel ? tot.pa / tot.panel : null))}
      ${statBox('Visibility', `${fmtNum(tot.pv)} <small>${fmtPct(tot.panel ? tot.pv / tot.panel : 0)}</small>`, 'toko perfect visibility', statusOf(tot.panel ? tot.pv / tot.panel : null))}
      ${statBox('Digitization', `${fmtNum(tot.pd)} <small>${fmtPct(tot.panel ? tot.pd / tot.panel : 0)}</small>`, `toko perfect digitization · capai ≥ ${fmtPct(CONFIG.digiTarget)}`, digiStatus(tot.panel ? tot.pd / tot.panel : null))}
    </div>`;
  let html = stats;
  const noDsr = state.dsr === 'ALL' && state.outlet.psDsr === 'ALL';

  // Ringkasan per DT (Gabungan)
  if (showDt && noDsr) {
    const rows = DTS.map(dt => ({ dt: dt.code, name: dt.name, ...psAgg(all.filter(r => r.dt === dt.code)) })).filter(r => r.panel);
    const t = { name: 'TOTAL', ...tot, _cls: 'grp grp-total' };
    html += tableHTML('sumdt', 'Ringkasan per DT', SUM_COLS([{ key: 'name', label: 'Distributor', html: r => esc(r.name) }]), [...rows, t], null);
  }
  // Ringkasan per salesman
  if (noDsr) {
    const per = new Map();
    all.forEach(r => {
      const keys = r.codes.length ? r.codes : ['__none'];
      keys.forEach(c => { const k = r.dt + '|' + c; if (!per.has(k)) per.set(k, []); per.get(k).push(r); });
    });
    const rows = [...per.entries()].map(([k, list]) => {
      const [dtc, c] = k.split('|');
      const s = (state.data[dtc]?.dsrs || []).find(x => x.code === c);
      return { dt: dtc, name: s ? s.name : 'Toko tanpa DSR', code: s ? c : '', type: s ? s.type : '', ...psAgg(list), _cls: s ? '' : 'subtotal' };
    }).sort((a, b) => (a._cls ? 1 : 0) - (b._cls ? 1 : 0) || (b.panel ? b.ps / b.panel : 0) - (a.panel ? a.ps / a.panel : 0) || b.panel - a.panel);
    const first = [{ key: 'name', label: 'Salesman', html: r => r.code ? `${esc(r.name)} <span class="muted">(${esc(r.code)})</span>` : esc(r.name) },
      ...(showDt ? [{ key: 'dt', label: 'DT', html: r => dtShort(r.dt) }] : [])];
    const foot = `<tr class="grp grp-total"><td>TOTAL</td>${showDt ? '<td></td>' : ''}<td class="num">${fmtNum(tot.panel)}</td><td class="num">${fmtNum(tot.pa)} ${pctPill(tot.pa, tot.panel)}</td><td class="num">${fmtNum(tot.pv)} ${pctPill(tot.pv, tot.panel)}</td><td class="num">${fmtNum(tot.pd)} ${pctPill(tot.pd, tot.panel, 'pd')}</td><td class="num">${fmtNum(tot.ps)} ${pctPill(tot.ps, tot.panel)}</td></tr>`;
    html += tableHTML('sumdsr', 'Ringkasan per salesman', SUM_COLS(first), rows, null, { foot });
    html += `<p class="out-note">Toko split (2 DSR) dihitung di masing-masing salesman, 1 kali di TOTAL.</p>`;
  }

  // Daftar toko panel
  const st = state.outlet.psStatus;
  const filtered = all.filter(r => matchQ(r.outletCode, r.outletName) && (st === 'all' || (st === 'perfect') === r.perfect));
  const cols = PS_COLS(showDt);
  psCtx = { base: filtered, cols };
  const rows = sortRows(applyColFilters(filtered, cols), cols, state.outlet.sort.ps);
  const visCols = cols.filter(c => !state.outlet.psHidden.has(c.key));
  const fkeys = cols.filter(c => state.outlet.psFilter[c.key]).map(c => c.label);
  const nHide = cols.filter(c => state.outlet.psHidden.has(c.key)).length;
  html += `<p class="out-note">Menampilkan ${fmtNum(rows.length)} dari ${fmtNum(all.length)} toko panel${state.outlet.q ? ` untuk pencarian "<b>${esc(state.outlet.q)}</b>"` : ''}.`
    + (fkeys.length ? ` Filter kolom aktif: <b>${fkeys.map(esc).join(', ')}</b> · <button type="button" class="link-btn" data-clear-filters>Hapus semua filter</button>` : ` Klik judul kolom untuk filter / urutkan.`)
    + (nHide ? ` · ${nHide} kolom disembunyikan` : '') + `</p>`;
  html += tableHTML('ps', 'Daftar toko panel Perfect Store', visCols, rows, state.outlet.sort.ps, {
    limit: state.outlet.limit, empty: 'Toko tidak ditemukan.', filter: state.outlet.psFilter,
    tableCls: 'compact', blockCls: 'ps-list', blockId: 'psListBlock',
    extraBtn: `<button type="button" class="expand-btn" data-colpick aria-haspopup="dialog">☷ Kolom${nHide ? ` (${nHide} disembunyikan)` : ''}</button>` });
  return html;
}
/* Isi dropdown "Filter DSR" dari toko panel yang ada di cakupan DT / salesman saat ini */
function fillPsDsrSelect(rows) {
  const sel = $('psDsr'); if (!sel) return;
  const map = new Map(); let none = new Set();
  rows.forEach(r => {
    if (!r.codes.length) { none.add(r.dt); return; }
    r.codes.forEach(c => {
      const k = r.dt + '|' + c;
      if (map.has(k)) { map.get(k).n++; return; }
      const s = (state.data[r.dt]?.dsrs || []).find(x => x.code === c);
      map.set(k, { key: k, name: s ? s.name : c, code: c, dt: r.dt, n: 1 });
    });
  });
  const list = [...map.values()].sort((a, b) => a.dt.localeCompare(b.dt) || a.name.localeCompare(b.name));
  none.forEach(dt => list.push({ key: dt + '|__none', name: 'Tanpa DSR', code: '', dt, n: rows.filter(r => r.dt === dt && !r.codes.length).length }));
  if (state.outlet.psDsr !== 'ALL' && !list.some(d => d.key === state.outlet.psDsr)) state.outlet.psDsr = 'ALL';
  const multi = state.dt === 'ALL';
  sel.innerHTML = `<option value="ALL">Semua DSR (${list.filter(d => d.code).length})</option>` + list.map(d =>
    `<option value="${esc(d.key)}" ${d.key === state.outlet.psDsr ? 'selected' : ''}>${multi ? dtShort(d.dt) + ' · ' : ''}${esc(d.name)}${d.code ? ` (${esc(d.code)})` : ''} · ${fmtNum(d.n)} toko</option>`).join('');
  sel.disabled = !list.length;
}
function PS_COLS(showDt) {
  return [
    { key: 'no', label: '#', html: (r, i) => i + 1 },
    { key: 'code', label: 'Kode Toko', get: r => r.outletCode,
      fv: r => r.outletCode,  html: r => `<span class="mono">${esc(r.outletCode)}</span>` },
    { key: 'name', label: 'Nama Toko', get: r => r.outletName,
      fv: r => r.outletName,  html: r => esc(r.outletName), wrap: true },
    ...(showDt ? [{ key: 'dt', label: 'DT', get: r => dtByCode(r.dt)?.short || r.dt, html: r => dtShort(r.dt) }] : []),
    { key: 'dsr', label: 'DSR', get: r => r.dsr || '\uffff',
      fv: r => r.dsr || 'Tanpa DSR',  html: r => esc(r.dsr || 'Tanpa DSR'), wrap: true },
    { key: 'pjp', label: 'PJP', get: r => r.pjp,
      fv: r => r.pjp || '-',  html: r => esc(r.pjp || '-') },
    { key: 'type', label: 'Tipe', get: r => r.full ? 'FULL' : 'LITE', html: r => `<span class="type-chip ${r.full ? 'full' : 'lite'}">${r.full ? 'FULL' : 'LITE'}</span>` },
    { key: 'pa', label: 'Avail', get: r => +r.pa,
      fv: r => r.pa ? '✓ Ya' : '✗ Tidak',  html: r => yesNo(r.pa) },
    { key: 'pv', label: 'Visib', get: r => +r.pv,
      fv: r => r.pv ? '✓ Ya' : '✗ Tidak',  html: r => yesNo(r.pv) },
    { key: 'pd', label: 'Digi', get: r => +r.pd,
      fv: r => r.pd ? '✓ Ya' : '✗ Tidak',  html: r => yesNo(r.pd) },
    { key: 'perfect', label: 'Perfect Store', get: r => +r.perfect,
      fv: r => r.perfect ? 'PERFECT' : 'BELUM',  html: r => r.perfect ? '<span class="pill s-green">PERFECT</span>' : '<span class="pill s-red">BELUM</span>' },
    { key: 'missing', label: 'Yang kurang', get: r => r.missing,
      fv: r => r.missing || '-',  html: r => esc(r.missing || '-'), wrap: true },
    { key: 'asTarget', label: 'Assortment Target', num: true, get: r => r.asTarget,
      fv: r => r.asTarget ? fmtNum(r.asTarget) : '-',  html: r => r.asTarget ? fmtNum(r.asTarget) : '-' },
    { key: 'asAch', label: 'Assortment Achieve', num: true, get: r => r.asAch,
      fv: r => fmtNum(r.asAch),  html: r => fmtNum(r.asAch) },
    { key: 'asPct', label: '% Assortment', num: true, get: r => r.asTarget ? r.asAch / r.asTarget : -1,
      fv: r => r.asTarget ? fmtPct(r.asAch / r.asTarget) : '-', 
      html: r => r.asTarget ? `<span class="pill ${asStatus(r.asAch / r.asTarget)}">${fmtPct(r.asAch / r.asTarget)}</span>` : '-' },
    { key: 'asGap', label: 'Kekurangan Assortment', num: true, get: r => Math.max(0, r.asTarget - r.asAch),
      fv: r => !r.asTarget ? '-' : r.asTarget - r.asAch > 0 ? fmtNum(r.asTarget - r.asAch) : 'Tercapai', 
      html: r => !r.asTarget ? '-' : r.asTarget - r.asAch > 0 ? `<span class="gap">${fmtNum(r.asTarget - r.asAch)}</span>` : '<span class="gap-ok">Tercapai</span>' }
  ];
}

function renderOutletPage() {
  const tab = state.outlet.tab;
  document.querySelectorAll('.out-tab').forEach(b => { const on = b.dataset.otab === tab; b.classList.toggle('active', on); b.setAttribute('aria-selected', on); });
  $('psStatusWrap').hidden = tab !== 'ps';
  $('psDsrWrap').hidden = tab !== 'ps';
  $('outletBody').innerHTML = tab === 'perf' ? renderOutletPerf() : renderOutletPs();
}

function bindOutletEvents() {
  document.querySelectorAll('.out-tab').forEach(b => b.addEventListener('click', () => {
    if (state.outlet.tab === b.dataset.otab) return;
    state.outlet.tab = b.dataset.otab; state.outlet.limit = OUT_LIMIT; renderOutletPage();
  }));
  let t;
  $('outletSearch').addEventListener('input', e => {
    clearTimeout(t);
    t = setTimeout(() => { state.outlet.q = e.target.value.trim(); state.outlet.limit = OUT_LIMIT; renderOutletPage(); }, 150);
  });
  $('psStatus').addEventListener('change', e => { state.outlet.psStatus = e.target.value; renderOutletPage(); });
  $('psDsr').addEventListener('change', e => { state.outlet.psDsr = e.target.value; state.outlet.limit = OUT_LIMIT; renderOutletPage(); });
  const sortBy = th => {
    const tb = th.dataset.table, key = th.dataset.sort, cur = state.outlet.sort[tb];
    if (!cur) return;
    state.outlet.sort[tb] = { key, dir: cur.key === key ? -cur.dir : (key === 'gsv' || key === 'bills' || key === 'avg' || key === 'last' ? -1 : 1) };
    renderOutletPage();
  };
  $('outletBody').addEventListener('click', e => {
    const x = e.target.closest('.expand-btn:not([data-colpick])');
    if (x) { openTableModal(x.dataset.title, x.closest('.out-block').querySelector('table')); return; }
    if (e.target.closest('.more-btn')) { state.outlet.limit = Infinity; renderOutletPage(); return; }
    const fth = e.target.closest('th[data-fcol]'); if (fth) { openFilterPop(fth); return; }
    const cp = e.target.closest('[data-colpick]'); if (cp) { openColPop(cp); return; }
    if (e.target.closest('[data-clear-filters]')) { state.outlet.psFilter = {}; renderOutletPage(); return; }
    const th = e.target.closest('th[data-sort]'); if (th) sortBy(th);
  });
  $('outletBody').addEventListener('keydown', e => {
    const th = e.target.closest('th[data-sort]');
    if (th && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); sortBy(th); }
    const fth = e.target.closest('th[data-fcol]');
    if (fth && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openFilterPop(fth); }
  });
}

/* ===== 9d. FILTER KOLOM (gaya Excel) & SEMBUNYIKAN KOLOM — Daftar toko panel ===== */
let psCtx = { base: [], cols: [] };
const HIDE_KEY = 'fast.psHidden';
function loadHidden() { try { return new Set(JSON.parse(localStorage.getItem(HIDE_KEY) || '[]')); } catch (e) { return new Set(); } }
function saveHidden() { try { localStorage.setItem(HIDE_KEY, JSON.stringify([...state.outlet.psHidden])); } catch (e) { /* abaikan */ } }
const fvOf = (c, r) => String(c.fv ? c.fv(r) : (c.get(r) ?? ''));
function applyColFilters(rows, cols, exceptKey) {
  const f = state.outlet.psFilter;
  const act = cols.filter(c => c.get && c.key !== exceptKey && f[c.key]).map(c => [c, new Set(f[c.key])]);
  return act.length ? rows.filter(r => act.every(([c, set]) => set.has(fvOf(c, r)))) : rows;
}
function popEl() {
  let p = $('fpop');
  if (!p) {
    p = document.createElement('div'); p.id = 'fpop'; p.className = 'fpop'; p.setAttribute('role', 'dialog'); p.hidden = true;
    document.body.appendChild(p); bindPop(p);
  }
  return p;
}
function closePop() { const p = $('fpop'); if (p && !p.hidden) { p.hidden = true; p.innerHTML = ''; p.dataset.key = ''; } }
function placePop(p, anchor) {
  p.hidden = false;
  const r = anchor.getBoundingClientRect(), w = p.offsetWidth, h = p.offsetHeight;
  let top = r.bottom + 4;
  if (top + h > innerHeight - 8) top = Math.max(8, r.top - h - 4);
  p.style.left = Math.min(Math.max(8, r.left), Math.max(8, innerWidth - w - 8)) + 'px';
  p.style.top = top + 'px';
}
function openFilterPop(th) {
  const key = th.dataset.fcol, c = psCtx.cols.find(x => x.key === key);
  if (!c) return;
  const p = popEl();
  if (!p.hidden && p.dataset.key === key) { closePop(); return; }
  const m = new Map();
  applyColFilters(psCtx.base, psCtx.cols, key).forEach(r => {
    const v = fvOf(c, r), e = m.get(v);
    if (e) e.n++; else m.set(v, { v, n: 1, s: c.get(r) });
  });
  const vals = [...m.values()].sort((a, b) => (typeof a.s === 'number' && typeof b.s === 'number') ? a.s - b.s : a.v.localeCompare(b.v, 'id', { numeric: true }));
  const cur = state.outlet.psFilter[key], curSet = cur ? new Set(cur) : null;
  p.innerHTML = `
    <div class="fpop-head">${esc(c.label)}</div>
    <div class="fpop-sort">
      <button type="button" data-psort="1">↑ Urutkan ${c.num ? 'terkecil' : 'A → Z'}</button>
      <button type="button" data-psort="-1">↓ Urutkan ${c.num ? 'terbesar' : 'Z → A'}</button>
    </div>
    <input type="search" class="fpop-search" placeholder="Cari nilai…" aria-label="Cari nilai di kolom ${esc(c.label)}">
    <label class="fpop-item fpop-all"><input type="checkbox" data-all> <span>(Pilih semua)</span></label>
    <div class="fpop-list">${vals.length ? vals.map(o => `<label class="fpop-item"><input type="checkbox" value="${esc(o.v)}" ${!curSet || curSet.has(o.v) ? 'checked' : ''}> <span>${esc(o.v === '' ? '(kosong)' : o.v)}</span><em>${fmtNum(o.n)}</em></label>`).join('') : '<div class="empty">Tidak ada nilai.</div>'}</div>
    <div class="fpop-foot"><button type="button" data-fclear>Hapus filter</button><button type="button" class="primary" data-fapply>Terapkan</button></div>`;
  p.dataset.key = key;
  syncPopAll(p);
  placePop(p, th);
  p.querySelector('.fpop-search').focus();
}
function openColPop(btn) {
  const p = popEl();
  if (!p.hidden && p.dataset.key === '__cols') { closePop(); return; }
  const cols = psCtx.cols.filter(c => c.key !== 'no');
  p.innerHTML = `
    <div class="fpop-head">Tampilkan / sembunyikan kolom</div>
    <div class="fpop-list">${cols.map(c => `<label class="fpop-item"><input type="checkbox" data-colkey="${c.key}" ${state.outlet.psHidden.has(c.key) ? '' : 'checked'}> <span>${esc(c.label)}</span></label>`).join('')}</div>
    <div class="fpop-foot"><button type="button" data-colshowall>Tampilkan semua</button><button type="button" class="primary" data-colclose>Selesai</button></div>`;
  p.dataset.key = '__cols';
  placePop(p, btn);
}
function syncPopAll(p) {
  const items = [...p.querySelectorAll('.fpop-list input[type=checkbox]')].filter(i => !i.closest('.fpop-item').hidden);
  const all = p.querySelector('[data-all]');
  if (all) { const n = items.filter(i => i.checked).length; all.checked = items.length > 0 && n === items.length; all.indeterminate = n > 0 && n < items.length; }
  const ap = p.querySelector('[data-fapply]');
  if (ap) ap.disabled = !p.querySelector('.fpop-list input:checked');
}
function bindPop(p) {
  p.addEventListener('input', e => {
    if (!e.target.classList.contains('fpop-search')) return;
    const q = up(e.target.value);
    p.querySelectorAll('.fpop-list .fpop-item').forEach(l => { l.hidden = q && !up(l.textContent).includes(q); });
    syncPopAll(p);
  });
  p.addEventListener('change', e => {
    const t = e.target;
    if (t.matches('[data-all]')) { p.querySelectorAll('.fpop-list .fpop-item:not([hidden]) input').forEach(i => { i.checked = t.checked; }); syncPopAll(p); return; }
    if (t.matches('[data-colkey]')) {
      t.checked ? state.outlet.psHidden.delete(t.dataset.colkey) : state.outlet.psHidden.add(t.dataset.colkey);
      saveHidden(); renderOutletPage(); return;
    }
    syncPopAll(p);
  });
  p.addEventListener('click', e => {
    const key = p.dataset.key;
    const so = e.target.closest('[data-psort]');
    if (so) { state.outlet.sort.ps = { key, dir: +so.dataset.psort }; closePop(); renderOutletPage(); return; }
    if (e.target.closest('[data-fclear]')) { delete state.outlet.psFilter[key]; closePop(); renderOutletPage(); return; }
    if (e.target.closest('[data-fapply]')) {
      const q = p.querySelector('.fpop-search').value.trim();
      const items = [...p.querySelectorAll('.fpop-list input[type=checkbox]')];
      const chosen = items.filter(i => i.checked && !(q && i.closest('.fpop-item').hidden)).map(i => i.value);
      if (!q && chosen.length === items.length) delete state.outlet.psFilter[key];
      else state.outlet.psFilter[key] = chosen;
      state.outlet.limit = OUT_LIMIT; closePop(); renderOutletPage(); return;
    }
    if (e.target.closest('[data-colshowall]')) { state.outlet.psHidden.clear(); saveHidden(); p.querySelectorAll('[data-colkey]').forEach(i => { i.checked = true; }); renderOutletPage(); return; }
    if (e.target.closest('[data-colclose]')) closePop();
  });
  p.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closePop(); return; }
    if (e.key === 'Enter' && e.target.classList.contains('fpop-search')) { e.preventDefault(); const ap = p.querySelector('[data-fapply]'); if (ap && !ap.disabled) ap.click(); }
  });
  document.addEventListener('mousedown', e => { if (!p.hidden && !p.contains(e.target) && !e.target.closest('th[data-fcol], [data-colpick]')) closePop(); });
  window.addEventListener('scroll', e => { if (!p.hidden && !p.contains(e.target)) closePop(); }, true);
  window.addEventListener('resize', closePop);
}

/* Dari kartu Availability / Digitization → Daftar toko panel Perfect Store */
function goToPs(key) {
  closeTableModal(); closePop();
  Object.assign(state.outlet, { tab: 'ps', psDsr: key || 'ALL', q: '', psStatus: 'all', psFilter: {}, limit: OUT_LIMIT });
  $('outletSearch').value = ''; $('psStatus').value = 'all';
  document.querySelectorAll('.nav-item').forEach(x => x.classList.toggle('active', x.dataset.page === 'Outlet'));
  showPage('Outlet');
  setTimeout(() => { const b = $('psListBlock'); if (b) b.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 300);
}

/* ===== 10. EVENT ===== */
function bindEvents() {
  $('dtTabs').addEventListener('click', e => {
    const b = e.target.closest('.tab'); if (!b || b.dataset.dt === state.dt || state.loading) return;
    state.dt = b.dataset.dt; state.dsr = 'ALL'; state.outlet.psDsr = 'ALL'; state.outlet.psFilter = {}; closePop();
    renderTabs(); renderDsrSelect(); render();
  });
  $('dsrSelect').addEventListener('change', e => { state.dsr = e.target.value; state.outlet.psDsr = 'ALL'; state.outlet.psFilter = {}; closePop(); render(); });
  $('incentiveChk').addEventListener('change', e => { state.showIncentive = e.target.checked; render(); });
  $('kpiGrid').addEventListener('click', e => {
    const go = e.target.closest('[data-goto-ps]');
    if (go) { goToPs(go.dataset.gotoPs); return; }
    const x = e.target.closest('.expand-btn');
    if (x) { openTableModal(x.dataset.title, x.closest('.card').querySelector('.table-wrap table')); return; }
    const b = e.target.closest('.detail-btn'); if (!b) return;
    const open = b.closest('.card').classList.toggle('open');
    b.setAttribute('aria-expanded', open);
  });
  $('refreshBtn').addEventListener('click', loadAll);
  $('tmClose').addEventListener('click', closeTableModal);
  $('tmBody').addEventListener('click', e => { const go = e.target.closest('[data-goto-ps]'); if (go) goToPs(go.dataset.gotoPs); });
  $('tableModal').addEventListener('click', e => { if (e.target.id === 'tableModal') closeTableModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('tableModal').classList.contains('show')) closeTableModal(); });
  $('fsBtn').addEventListener('click', () => {
    if (!document.fullscreenElement) {
      (document.documentElement.requestFullscreen ? document.documentElement.requestFullscreen() : Promise.reject())
        .catch(() => toast('Browser tidak mendukung layar penuh'));
    } else document.exitFullscreen();
  });
  document.addEventListener('fullscreenchange', () => {
    $('fsLabel').textContent = document.fullscreenElement ? 'Keluar layar penuh' : 'Layar penuh';
  });
  const closeSide = () => { $('sidebar').classList.remove('open'); $('overlay').classList.remove('show'); };
  $('menuBtn').addEventListener('click', () => { $('sidebar').classList.add('open'); $('overlay').classList.add('show'); });
  $('overlay').addEventListener('click', closeSide);
  document.querySelectorAll('.nav-item').forEach(n => n.addEventListener('click', () => {
    const page = n.dataset.page;
    closeSide();
    if (!PAGES.includes(page)) { toast(`Halaman "${page}" segera hadir`); return; }
    document.querySelectorAll('.nav-item').forEach(x => x.classList.toggle('active', x === n));
    showPage(page);
  }));
  bindOutletEvents();
}

/* ===== 11. MULAI ===== */
document.addEventListener('DOMContentLoaded', () => {
  $('appName').textContent = CONFIG.appName;
  $('appNameMobile').textContent = CONFIG.appName;
  $('userRole').textContent = CONFIG.userRole;
  $('userName').textContent = CONFIG.userName;
  document.title = CONFIG.appName;
  if (window.lucide) lucide.createIcons();
  state.outlet.psHidden = loadHidden();
  bindEvents();
  loadAll();
});
