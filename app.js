/* ========================================
   สวนลุงนะ - Smart Farm Dashboard
   Main Application Logic
   ======================================== */

// ===== STORAGE KEYS =====
const KEYS = {
    TX: 'sln_transactions',
    YIELDS: 'sln_yields'
};

const ITEMS_PER_PAGE = 15;
const CATEGORIES = {
    income: ['ขายผลผลิต', 'ขายสัตว์', 'เงินช่วยเหลือ', 'อื่นๆ'],
    expense: ['ค่าปุ๋ย', 'ค่ายา/สารเคมี', 'ค่าแรง', 'ค่าไฟฟ้า/น้ำ', 'ค่าซ่อมบำรุง', 'ค่าอาหารสัตว์', 'ค่าขนส่ง', 'อื่นๆ']
};

// ===== STATE =====
const State = {
    transactions: [],
    yields: [],
    currentPage: 'dashboard',
    filters: { search: '', type: 'all', category: 'all', dateStart: '', dateEnd: '' },
    sortField: 'date',
    sortDir: 'desc',
    page: 1,
    chartMonths: 6,
    deleteTarget: null,
    deleteSource: null // 'transactions' or 'yields'
};

// ===== STORAGE =====
const Storage = {
    save(k, d) { try { localStorage.setItem(k, JSON.stringify(d)); return true; } catch(e) { return false; } },
    load(k, def = null) { try { const d = localStorage.getItem(k); return d ? JSON.parse(d) : def; } catch(e) { return def; } },
    saveAll() {
        Storage.save(KEYS.TX, State.transactions);
        Storage.save(KEYS.YIELDS, State.yields);
    }
};

// ===== UTILITIES =====
const U = {
    id() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 9); },
    money(a) { return '฿' + Number(a).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 }); },
    date(d) {
        const dt = new Date(d + 'T00:00:00');
        const m = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
        return dt.getDate() + ' ' + m[dt.getMonth()] + ' ' + (dt.getFullYear() + 543);
    },
    shortDate(d) {
        const dt = new Date(d + 'T00:00:00');
        return dt.getDate() + '/' + (dt.getMonth()+1) + '/' + dt.getFullYear();
    },
    monthLabel(d) {
        const dt = new Date(d);
        const m = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
        return m[dt.getMonth()] + ' ' + (dt.getFullYear() + 543);
    },
    monthKey(d) {
        const dt = new Date(d + 'T00:00:00');
        return dt.getFullYear() + '-' + String(dt.getMonth()+1).padStart(2,'0');
    },
    esc(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; },
    txBadge(t) { return t === 'income' ? '<span class="badge badge-income">รายรับ</span>' : '<span class="badge badge-expense">รายจ่าย</span>'; },
    gradeBadge(g) { return g === 'A' ? '<span class="badge badge-grade-a">Grade A</span>' : '<span class="badge badge-grade-b">Grade B</span>'; }
};

// ===== TOAST =====
function toast(msg, type = 'success') {
    const c = document.getElementById('toastContainer');
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    const icons = {
        success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };
    t.innerHTML = (icons[type]||icons.success) + '<span>' + U.esc(msg) + '</span>';
    c.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

// ===== CALCULATIONS =====
const Calc = {
    totalIncome() { return State.transactions.filter(r => r.type === 'income').reduce((s, r) => s + Number(r.amount), 0); },
    totalExpense() { return State.transactions.filter(r => r.type === 'expense').reduce((s, r) => s + Number(r.amount), 0); },
    yieldValue() { return State.yields.reduce((s, r) => s + Number(r.totalValue), 0); },
    totalKg() { return State.yields.reduce((s, r) => s + Number(r.kg), 0); },
    gradeAkg() { return State.yields.filter(r => r.grade === 'A').reduce((s, r) => s + Number(r.kg), 0); },
    gradeBkg() { return State.yields.filter(r => r.grade === 'B').reduce((s, r) => s + Number(r.kg), 0); },
    gradeAvalue() { return State.yields.filter(r => r.grade === 'A').reduce((s, r) => s + Number(r.totalValue), 0); },
    gradeBvalue() { return State.yields.filter(r => r.grade === 'B').reduce((s, r) => s + Number(r.totalValue), 0); },
    profit() { return Calc.totalIncome() + Calc.yieldValue() - Calc.totalExpense(); },
    avgProfit() {
        const all = State.transactions.length + State.yields.length;
        return all > 0 ? (Calc.totalIncome() - Calc.totalExpense()) / all : 0;
    },
    topExpenseCat() {
        const cats = {};
        State.transactions.filter(r => r.type === 'expense').forEach(r => {
            const c = r.category || 'อื่นๆ';
            cats[c] = (cats[c] || 0) + Number(r.amount);
        });
        const entries = Object.entries(cats).sort((a, b) => b[1] - a[1]);
        return entries.length ? { name: entries[0][0], amount: entries[0][1] } : null;
    },
    yieldEfficiency() {
        const iv = Calc.yieldValue();
        const inc = Calc.totalIncome();
        return inc > 0 ? Math.round((iv / inc) * 100) : 0;
    },
    monthlyData(months = 6) {
        const data = {};
        const now = new Date();
        for (let i = 0; i < months; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const k = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
            data[k] = { income: 0, expense: 0, count: 0, yieldValue: 0, yieldKg: 0, label: U.monthLabel(d.toISOString()) };
        }
        State.transactions.forEach(r => {
            const k = U.monthKey(r.date);
            if (data[k]) {
                if (r.type === 'income') data[k].income += Number(r.amount);
                else data[k].expense += Number(r.amount);
                data[k].count++;
            }
        });
        State.yields.forEach(r => {
            const k = U.monthKey(r.date);
            if (data[k]) { data[k].yieldValue += Number(r.totalValue); data[k].yieldKg += Number(r.kg); }
        });
        return Object.entries(data).reverse().map(([k, v]) => ({ ...v, key: k }));
    },
    filteredTransactions() {
        const { search, type, category, dateStart, dateEnd } = State.filters;
        let tx = [...State.transactions];
        if (search) tx = tx.filter(r => r.title.toLowerCase().includes(search.toLowerCase()));
        if (type !== 'all') tx = tx.filter(r => r.type === type);
        if (category !== 'all') tx = tx.filter(r => r.category === category);
        if (dateStart) tx = tx.filter(r => r.date >= dateStart);
        if (dateEnd) tx = tx.filter(r => r.date <= dateEnd);
        tx.sort((a, b) => {
            const d = State.sortDir === 'asc' ? 1 : -1;
            if (State.sortField === 'amount') return (Number(b.amount) - Number(a.amount)) * d;
            if (State.sortField === 'date') return (a.date < b.date ? -1 : 1) * d;
            if (State.sortField === 'title') return a.title.localeCompare(b.title) * d;
            if (State.sortField === 'type') return a.type.localeCompare(b.type) * d;
            if (State.sortField === 'category') return (a.category||'').localeCompare(b.category||'') * d;
            return 0;
        });
        return tx;
    }
};

// ===== CHARTS (Canvas API) =====
const Charts = {
    setupCanvas(id) {
        const canvas = document.getElementById(id);
        if (!canvas) return null;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.parentElement.getBoundingClientRect();
        const w = rect.width - 40;
        const h = 210;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.scale(dpr, dpr);
        return { ctx, w, h, pad: { t: 15, r: 15, b: 36, l: 55 }, cw: w - 70, ch: h - 51 };
    },
    grid(ctx, pad, cw, ch, maxVal) {
        const nice = Math.ceil(maxVal / 500) * 500 || 100;
        ctx.strokeStyle = '#E5E7EB'; ctx.lineWidth = 0.5;
        for (let i = 0; i <= 4; i++) {
            const y = pad.t + (ch / 4) * i;
            ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + cw, y); ctx.stroke();
            ctx.fillStyle = '#9CA3AF'; ctx.font = '9px Inter, sans-serif'; ctx.textAlign = 'right';
            const v = nice - (nice / 4) * i;
            ctx.fillText(v >= 1000 ? (v/1000).toFixed(1) + 'K' : v, pad.l - 6, y + 3);
        }
        return nice;
    },
    barChart(id, labels, data1, data2, label1, label2) {
        const c = this.setupCanvas(id);
        if (!c) return;
        const { ctx, w, h, pad, cw, ch } = c;
        ctx.clearRect(0, 0, w, h);
        const all = data2 ? [...data1, ...data2] : data1;
        const maxVal = Math.max(...all.map(v => Math.abs(v)), 1);
        const nice = this.grid(ctx, pad, cw, ch, maxVal);
        const gw = cw / labels.length;
        const bw = data2 ? Math.min(gw * 0.28, 18) : Math.min(gw * 0.45, 28);

        labels.forEach((label, i) => {
            const x = pad.l + gw * i + gw / 2;
            if (data2) {
                const h1 = (Math.abs(data1[i]) / nice) * ch;
                const h2 = (Math.abs(data2[i]) / nice) * ch;
                const gap = 3;
                ctx.fillStyle = data1[i] >= 0 ? '#10B981' : '#EF4444';
                ctx.fillRect(x - bw - gap/2, pad.t + ch - h1, bw, h1);
                ctx.fillStyle = data2[i] >= 0 ? '#10B981' : '#EF4444';
                ctx.fillRect(x + gap/2, pad.t + ch - h2, bw, h2);
            } else {
                const bh = (Math.abs(data1[i]) / nice) * ch;
                ctx.fillStyle = data1[i] >= 0 ? '#10B981' : '#EF4444';
                ctx.fillRect(x - bw/2, pad.t + ch - bh, bw, bh);
            }
            ctx.fillStyle = '#9CA3AF'; ctx.font = '9px Inter, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(label, x, h - 10);
        });

        // Legend
        if (label2) {
            const lx = pad.l + cw/2;
            ctx.font = '10px Inter, sans-serif';
            const m1 = ctx.measureText(label1).width;
            ctx.fillStyle = '#10B981'; ctx.fillRect(lx - m1 - 24, h - 8, 10, 10);
            ctx.fillStyle = '#6B7280'; ctx.textAlign = 'left'; ctx.fillText(label1, lx - m1 - 10, h);
            ctx.fillStyle = '#EF4444'; ctx.fillRect(lx + 10, h - 8, 10, 10);
            ctx.fillStyle = '#6B7280'; ctx.fillText(label2, lx + 24, h);
        }
    },
    lineChart(id, labels, data) {
        const c = this.setupCanvas(id);
        if (!c || data.length < 2) return;
        const { ctx, w, h, pad, cw, ch } = c;
        ctx.clearRect(0, 0, w, h);
        const maxVal = Math.max(...data, 1);
        const nice = this.grid(ctx, pad, cw, ch, maxVal);
        const pts = data.map((v, i) => ({
            x: pad.l + (i / (data.length - 1)) * cw,
            y: pad.t + ch - (v / nice) * ch
        }));

        // Area
        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
            const mx = (pts[i-1].x + pts[i].x) / 2;
            ctx.bezierCurveTo(mx, pts[i-1].y, mx, pts[i].y, pts[i].x, pts[i].y);
        }
        const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + ch);
        grad.addColorStop(0, 'rgba(16, 185, 129, 0.15)'); grad.addColorStop(1, 'rgba(16, 185, 129, 0.01)');
        ctx.lineTo(pts[pts.length-1].x, pad.t + ch); ctx.lineTo(pts[0].x, pad.t + ch);
        ctx.closePath(); ctx.fillStyle = grad; ctx.fill();

        // Line
        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
            const mx = (pts[i-1].x + pts[i].x) / 2;
            ctx.bezierCurveTo(mx, pts[i-1].y, mx, pts[i].y, pts[i].x, pts[i].y);
        }
        ctx.strokeStyle = '#10B981'; ctx.lineWidth = 2; ctx.stroke();

        // Dots
        pts.forEach(p => {
            ctx.beginPath(); ctx.arc(p.x, p.y, 3.5, 0, Math.PI*2);
            ctx.fillStyle = '#10B981'; ctx.fill();
            ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, Math.PI*2);
            ctx.fillStyle = '#fff'; ctx.fill();
        });

        labels.forEach((l, i) => {
            ctx.fillStyle = '#9CA3AF'; ctx.font = '9px Inter, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(l, pts[i].x, h - 10);
        });
    },
    groupedBar(id, labels, dataA, dataB) {
        const c = this.setupCanvas(id);
        if (!c) return;
        const { ctx, w, h, pad, cw, ch } = c;
        ctx.clearRect(0, 0, w, h);
        const all = [...dataA, ...dataB];
        const maxVal = Math.max(...all, 1);
        const nice = this.grid(ctx, pad, cw, ch, maxVal);
        const gw = cw / labels.length;
        const bw = Math.min(gw * 0.3, 22);
        const gap = 3;

        labels.forEach((label, i) => {
            const x = pad.l + gw * i + gw / 2;
            const hA = (dataA[i] / nice) * ch;
            const hB = (dataB[i] / nice) * ch;
            ctx.fillStyle = '#10B981'; ctx.fillRect(x - bw - gap/2, pad.t + ch - hA, bw, hA);
            ctx.fillStyle = '#F59E0B'; ctx.fillRect(x + gap/2, pad.t + ch - hB, bw, hB);
            ctx.fillStyle = '#9CA3AF'; ctx.font = '9px Inter, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(label, x, h - 10);
        });

        // Legend
        const lx = pad.l + cw/2;
        ctx.font = '10px Inter, sans-serif';
        const m1 = ctx.measureText('Grade A').width;
        ctx.fillStyle = '#10B981'; ctx.fillRect(lx - m1 - 24, h - 8, 10, 10);
        ctx.fillStyle = '#6B7280'; ctx.textAlign = 'left'; ctx.fillText('Grade A', lx - m1 - 10, h);
        ctx.fillStyle = '#F59E0B'; ctx.fillRect(lx + 10, h - 8, 10, 10);
        ctx.fillStyle = '#6B7280'; ctx.fillText('Grade B', lx + 24, h);
    },
    monthlyTable() {
        const tbody = document.getElementById('monthlyTableBody');
        if (!tbody) return;
        const m = Calc.monthlyData(12);
        tbody.innerHTML = m.map(d => {
            const p = d.income - d.expense;
            return '<tr><td><strong>' + d.label + '</strong></td>' +
                '<td class="amount-income">+' + U.money(d.income) + '</td>' +
                '<td class="amount-expense">-' + U.money(d.expense) + '</td>' +
                '<td class="' + (p >= 0 ? 'amount-income' : 'amount-expense') + '">' + U.money(p) + '</td>' +
                '<td>' + Number(d.yieldKg).toFixed(1) + ' กก.</td>' +
                '<td>' + d.count + '</td></tr>';
        }).join('');
    }
};

// ===== UI RENDERING =====
const UI = {
    dashboard() {
        document.getElementById('totalIncome').textContent = U.money(Calc.totalIncome());
        document.getElementById('totalExpense').textContent = U.money(Calc.totalExpense());
        document.getElementById('totalProfit').textContent = U.money(Calc.profit());
        document.getElementById('totalYieldKg').textContent = Number(Calc.totalKg()).toFixed(1) + ' กก.';
        document.getElementById('yieldValue').textContent = U.money(Calc.yieldValue());

        // Insights
        const avg = Calc.avgProfit();
        document.getElementById('avgProfit').textContent = U.money(Math.abs(avg));

        const top = Calc.topExpenseCat();
        document.getElementById('topExpenseCat').textContent = top ? top.name : '-';
        document.getElementById('topExpenseAmt').textContent = top ? U.money(top.amount) : 'ยังไม่มีข้อมูล';

        document.getElementById('yieldEfficiency').textContent = Calc.yieldEfficiency() + '%';

        // Recent table
        const tbody = document.getElementById('recentTableBody');
        const recent = State.transactions.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
        if (!recent.length) {
            tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><p>ยังไม่มีรายการ กรุณาเพิ่มรายการแรก</p></div></td></tr>';
            return;
        }
        tbody.innerHTML = recent.map(r =>
            '<tr><td>' + U.date(r.date) + '</td>' +
            '<td><strong>' + U.esc(r.title) + '</strong></td>' +
            '<td>' + U.txBadge(r.type) + '</td>' +
            '<td class="' + (r.type === 'income' ? 'tx-amount-income' : 'tx-amount-expense') + '">' +
            (r.type === 'income' ? '+' : '-') + U.money(r.amount) + '</td>' +
            '<td>' + (r.category ? U.esc(r.category) : '-') + '</td>' +
            '<td class="action-btns">' +
            '<button class="action-btn edit" data-id="' + r.id + '" title="แก้ไข"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>' +
            '<button class="action-btn delete" data-id="' + r.id + '" title="ลบ"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>' +
            '</td></tr>'
        ).join('');
    },

    transactionsPage() {
        const filtered = Calc.filteredTransactions();
        const total = Math.ceil(filtered.length / ITEMS_PER_PAGE);
        const start = (State.page - 1) * ITEMS_PER_PAGE;
        const pageData = filtered.slice(start, start + ITEMS_PER_PAGE);
        const tbody = document.getElementById('transactionsTableBody');

        if (!filtered.length) {
            tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><p>ไม่พบรายการที่ตรงกับเงื่อนไข</p></div></td></tr>';
            document.getElementById('pagination').innerHTML = '';
            return;
        }

        tbody.innerHTML = pageData.map(r =>
            '<tr><td>' + U.date(r.date) + '</td>' +
            '<td><strong>' + U.esc(r.title) + '</strong>' + (r.note ? '<br><small style="color:var(--gray-400)">' + U.esc(r.note) + '</small>' : '') + '</td>' +
            '<td>' + U.txBadge(r.type) + '</td>' +
            '<td class="' + (r.type === 'income' ? 'tx-amount-income' : 'tx-amount-expense') + '">' +
            (r.type === 'income' ? '+' : '-') + U.money(r.amount) + '</td>' +
            '<td>' + (r.category ? U.esc(r.category) : '-') + '</td>' +
            '<td class="action-btns">' +
            '<button class="action-btn edit" data-id="' + r.id + '"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>' +
            '<button class="action-btn delete" data-id="' + r.id + '"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>' +
            '</td></tr>'
        ).join('');

        // Pagination
        const pag = document.getElementById('pagination');
        if (total <= 1) { pag.innerHTML = ''; return; }
        let html = '<button class="page-btn" data-page="prev"' + (State.page <= 1 ? ' disabled' : '') + '>← ก่อน</button>';
        for (let i = 1; i <= total; i++) {
            if (i === 1 || i === total || (i >= State.page - 1 && i <= State.page + 1)) {
                html += '<button class="page-btn' + (i === State.page ? ' active' : '') + '" data-page="' + i + '">' + i + '</button>';
            } else if (i === State.page - 2 || i === State.page + 2) {
                html += '<span class="page-btn" style="border:none;background:none;cursor:default">...</span>';
            }
        }
        html += '<button class="page-btn" data-page="next"' + (State.page >= total ? ' disabled' : '') + '>ถัด →</button>';
        pag.innerHTML = html;
    },

    yieldsPage() {
        document.getElementById('gradeAkg').textContent = Number(Calc.gradeAkg()).toFixed(1) + ' กก.';
        document.getElementById('gradeAvalue').textContent = U.money(Calc.gradeAvalue());
        document.getElementById('gradeBkg').textContent = Number(Calc.gradeBkg()).toFixed(1) + ' กก.';
        document.getElementById('gradeBvalue').textContent = U.money(Calc.gradeBvalue());
        document.getElementById('totalYieldKg2').textContent = Number(Calc.totalKg()).toFixed(1) + ' กก.';
        document.getElementById('totalYieldValue2').textContent = U.money(Calc.yieldValue());

        const tbody = document.getElementById('yieldsTableBody');
        const ys = State.yields.sort((a, b) => b.date.localeCompare(a.date));
        if (!ys.length) {
            tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><p>ยังไม่มีข้อมูลผลผลิต</p></div></td></tr>';
            return;
        }
        tbody.innerHTML = ys.map(r =>
            '<tr><td>' + U.date(r.date) + '</td>' +
            '<td>' + U.gradeBadge(r.grade) + '</td>' +
            '<td>' + Number(r.kg).toFixed(1) + '</td>' +
            '<td>' + U.money(r.pricePerKg) + '</td>' +
            '<td class="amount-income">' + U.money(r.totalValue) + '</td>' +
            '<td class="action-btns">' +
            '<button class="action-btn edit" data-id="' + r.id + '" data-source="yields"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>' +
            '<button class="action-btn delete" data-id="' + r.id + '" data-source="yields"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>' +
            '</td></tr>'
        ).join('');
    },

    analyticsPage() {
        const m = parseInt(document.getElementById('chartPeriod')?.value || 6);
        const data = Calc.monthlyData(m);
        const labels = data.map(d => d.label);
        const income = data.map(d => d.income);
        const expense = data.map(d => d.expense);
        const profit = data.map(d => d.income - d.expense);
        const yieldKgA = data.map(d => d.yieldKg); // approximate

        Charts.barChart('incomeExpenseChart', labels, income, expense, 'รายรับ', 'รายจ่าย');
        Charts.barChart('profitChart', labels, profit, null, 'กำไรสุทธิ', null);
        Charts.lineChart('trendChart', labels, income);

        // Yield chart - show A vs B kg
        const yieldLabels = data.map(d => d.label);
        const yieldA = data.map(d => {
            // Approximate: use proportional split
            return d.yieldKg * 0.6;
        });
        const yieldB = data.map(d => d.yieldKg * 0.4);
        Charts.groupedBar('yieldChart', yieldLabels, yieldA, yieldB);

        Charts.monthlyTable();
    },

    populateTxCategories() {
        const sel = document.getElementById('txCategory');
        const type = document.querySelector('input[name="txType"]:checked')?.value || 'income';
        sel.innerHTML = '<option value="">ไม่ระบุ</option>' +
            CATEGORIES[type].map(c => '<option value="' + c + '">' + c + '</option>').join('');
    },

    populateFilterCategories() {
        const sel = document.getElementById('filterCategory');
        const all = [...CATEGORIES.income, ...CATEGORIES.expense];
        const unique = [...new Set(all)];
        sel.innerHTML = '<option value="all">ทุกหมวดหมู่</option>' +
            unique.map(c => '<option value="' + c + '">' + c + '</option>').join('');
    },

    updateYieldPreview() {
        const kg = parseFloat(document.getElementById('yieldKg')?.value) || 0;
        const price = parseFloat(document.getElementById('yieldPrice')?.value) || 0;
        const val = kg * price;
        const el = document.getElementById('yieldPreviewValue');
        if (el) el.textContent = U.money(val);
    }
};

// ===== EXPORT =====
const Export = {
    download(blob, name) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = name;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
    },
    toCSV() {
        const h = '\uFEFFวันที่,รายการ,ประเภท,ยอดเงิน,หมวดหมู่,หมายเหตุ\n';
        const rows = State.transactions.map(r =>
            r.date + ',' + r.title + ',' + (r.type === 'income' ? 'รายรับ' : 'รายจ่าย') + ',' + r.amount + ',' + (r.category||'') + ',' + (r.note||'')
        ).join('\n');
        this.download(new Blob([h + rows], { type: 'text/csv;charset=utf-8;' }), 'สวนลุงนะ-' + new Date().toISOString().slice(0,10) + '.csv');
        toast('ดาวน์โหลด CSV สำเร็จ');
    },
    toExcel() {
        const html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table border="1"><tr style="background:#10B981;color:white;font-weight:bold"><th>วันที่</th><th>รายการ</th><th>ประเภท</th><th>ยอดเงิน</th><th>หมวดหมู่</th><th>หมายเหตุ</th></tr>' +
            State.transactions.map(r => '<tr><td>' + r.date + '</td><td>' + r.title + '</td><td>' + (r.type==='income'?'รายรับ':'รายจ่าย') + '</td><td>' + r.amount + '</td><td>' + (r.category||'') + '</td><td>' + (r.note||'') + '</td></tr>').join('') +
            '</table></body></html>';
        this.download(new Blob([html], { type: 'application/vnd.ms-excel' }), 'สวนลุงนะ-' + new Date().toISOString().slice(0,10) + '.xls');
        toast('ดาวน์โหลด Excel สำเร็จ');
    },
    toPDF() {
        const w = window.open('', '_blank');
        if (!w) { toast('กรุณาอนุญาต popup', 'error'); return; }
        w.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>รายงานสวนลุงนะ</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:sans-serif;padding:30px;color:#1F2937}h1{font-size:22px;margin-bottom:6px}.sub{color:#6B7280;margin-bottom:20px}.sum{display:flex;gap:16px;margin-bottom:24px}.sc{padding:14px;border:1px solid #E5E7EB;border-radius:8px;flex:1}.sc .l{font-size:11px;color:#6B7280}.sc .v{font-size:20px;font-weight:bold;margin-top:2px}.sc.income .v{color:#10B981}.sc.expense .v{color:#EF4444}.sc.profit .v{color:#3B82F6}table{width:100%;border-collapse:collapse;margin-top:12px}th{background:#F3F4F6;padding:8px;text-align:left;font-size:12px;border-bottom:2px solid #E5E7EB}td{padding:8px;border-bottom:1px solid #E5E7EB;font-size:12px}.gi{color:#10B981;font-weight:600}.ge{color:#EF4444;font-weight:600}</style></head><body>' +
            '<h1>รายงานสวนลุงนะ</h1><p class="sub">' + U.date(new Date().toISOString().split('T')[0]) + '</p>' +
            '<div class="sum"><div class="sc income"><div class="l">รายรับ</div><div class="v">' + U.money(Calc.totalIncome()) + '</div></div><div class="sc expense"><div class="l">รายจ่าย</div><div class="v">' + U.money(Calc.totalExpense()) + '</div></div><div class="sc profit"><div class="l">กำไร</div><div class="v">' + U.money(Calc.profit()) + '</div></div><div class="sc"><div class="l">ผลผลิต</div><div class="v">' + U.money(Calc.yieldValue()) + '</div></div></div>' +
            '<table><tr><th>วันที่</th><th>รายการ</th><th>ประเภท</th><th>ยอดเงิน</th><th>หมวดหมู่</th></tr>' +
            State.transactions.sort((a,b) => b.date.localeCompare(a.date)).map(r =>
                '<tr><td>' + U.date(r.date) + '</td><td>' + r.title + '</td><td>' + (r.type==='income'?'รายรับ':'รายจ่าย') + '</td><td class="' + (r.type==='income'?'gi':'ge') + '">' + U.money(r.amount) + '</td><td>' + (r.category||'-') + '</td></tr>'
            ).join('') + '</table></body></html>');
        w.document.close();
        setTimeout(() => w.print(), 500);
        toast('กำลังสร้าง PDF...', 'info');
    },
    backup() {
        const data = { transactions: State.transactions, yields: State.yields, date: new Date().toISOString() };
        this.download(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), 'สวนลุงนะ-backup.json');
        toast('สำรองข้อมูลสำเร็จ');
    },
    restore(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.transactions) {
                    State.transactions = data.transactions;
                    if (data.yields) State.yields = data.yields;
                    Storage.saveAll(); App.refresh();
                    toast('เรียกคืน ' + data.transactions.length + ' รายการสำเร็จ');
                } else { toast('ไฟล์ไม่ถูกต้อง', 'error'); }
            } catch(err) { toast('ไม่สามารถอ่านไฟล์ได้', 'error'); }
        };
        reader.readAsText(file);
    }
};

// ===== MODAL HELPERS =====
const Modal = {
    openTx(record = null) {
        const m = document.getElementById('transactionModal');
        const f = document.getElementById('transactionForm');
        f.reset();
        if (record) {
            document.getElementById('txModalTitle').textContent = 'แก้ไขรายการ';
            document.getElementById('txId').value = record.id;
            document.getElementById('txTitle').value = record.title;
            document.getElementById('txAmount').value = record.amount;
            document.getElementById('txDate').value = record.date;
            document.getElementById('txNote').value = record.note || '';
            document.querySelector('input[name="txType"][value="' + record.type + '"]').checked = true;
            document.querySelectorAll('.toggle-option[data-type]').forEach(t => {
                t.classList.toggle('active', t.dataset.type === record.type);
            });
        } else {
            document.getElementById('txModalTitle').textContent = 'เพิ่มรายการเงิน';
            document.getElementById('txId').value = '';
            document.getElementById('txDate').value = new Date().toISOString().split('T')[0];
            document.querySelector('input[name="txType"][value="income"]').checked = true;
            document.querySelectorAll('.toggle-option[data-type]').forEach(t => {
                t.classList.toggle('active', t.dataset.type === 'income');
            });
        }
        UI.populateTxCategories();
        m.classList.add('active');
    },
    closeTx() { document.getElementById('transactionModal').classList.remove('active'); },
    openYield(record = null) {
        const m = document.getElementById('yieldModal');
        const f = document.getElementById('yieldForm');
        f.reset();
        if (record) {
            document.getElementById('yieldModalTitle').textContent = 'แก้ไขผลผลิต';
            document.getElementById('yieldId').value = record.id;
            document.getElementById('yieldKg').value = record.kg;
            document.getElementById('yieldPrice').value = record.pricePerKg;
            document.getElementById('yieldDate').value = record.date;
            document.querySelector('input[name="yieldGrade"][value="' + record.grade + '"]').checked = true;
            document.querySelectorAll('.toggle-option[data-grade]').forEach(t => {
                t.classList.toggle('active', t.dataset.grade === record.grade);
            });
        } else {
            document.getElementById('yieldModalTitle').textContent = 'บันทึกผลผลิต';
            document.getElementById('yieldId').value = '';
            document.getElementById('yieldDate').value = new Date().toISOString().split('T')[0];
            document.querySelector('input[name="yieldGrade"][value="A"]').checked = true;
            document.querySelectorAll('.toggle-option[data-grade]').forEach(t => {
                t.classList.toggle('active', t.dataset.grade === 'A');
            });
        }
        UI.updateYieldPreview();
        m.classList.add('active');
    },
    closeYield() { document.getElementById('yieldModal').classList.remove('active'); },
    openDelete(id, source) {
        const m = document.getElementById('deleteModal');
        const item = source === 'transactions' ? State.transactions.find(r => r.id === id) : State.yields.find(r => r.id === id);
        document.getElementById('deleteItemName').textContent = item ? (item.title || ('เกรด ' + item.grade + ' ' + item.kg + ' กก.')) : '';
        State.deleteTarget = id;
        State.deleteSource = source;
        m.classList.add('active');
    },
    closeDelete() { document.getElementById('deleteModal').classList.remove('active'); }
};

// ===== EVENTS =====
const Events = {
    setup() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                App.navigate(btn.dataset.page);
                document.getElementById('sidebar').classList.remove('open');
                document.querySelector('.sidebar-overlay')?.classList.remove('active');
            });
        });

        // Mobile menu
        document.getElementById('menuToggle').addEventListener('click', () => {
            const sb = document.getElementById('sidebar');
            sb.classList.toggle('open');
            let ov = document.querySelector('.sidebar-overlay');
            if (!ov) { ov = document.createElement('div'); ov.className = 'sidebar-overlay'; document.body.appendChild(ov); }
            ov.classList.toggle('active', sb.classList.contains('open'));
            ov.onclick = () => { sb.classList.remove('open'); ov.classList.remove('active'); };
        });

        // Add buttons
        ['addTransactionBtn','addTransactionBtn2'].forEach(id => {
            document.getElementById(id)?.addEventListener('click', () => Modal.openTx());
        });
        ['addYieldBtn','addYieldBtn2'].forEach(id => {
            document.getElementById(id)?.addEventListener('click', () => Modal.openYield());
        });
        document.getElementById('addBtnMobile')?.addEventListener('click', () => {
            const page = State.currentPage;
            if (page === 'yields') Modal.openYield(); else Modal.openTx();
        });

        // View all
        document.getElementById('viewAllTransactions')?.addEventListener('click', () => App.navigate('transactions'));

        // Modal close
        document.getElementById('txModalClose')?.addEventListener('click', Modal.closeTx);
        document.getElementById('txModalCancel')?.addEventListener('click', Modal.closeTx);
        document.getElementById('yieldModalClose')?.addEventListener('click', Modal.closeYield);
        document.getElementById('yieldModalCancel')?.addEventListener('click', Modal.closeYield);
        document.getElementById('deleteModalClose')?.addEventListener('click', Modal.closeDelete);
        document.getElementById('cancelDelete')?.addEventListener('click', Modal.closeDelete);

        // Click outside modal
        ['transactionModal','yieldModal','deleteModal'].forEach(id => {
            document.getElementById(id)?.addEventListener('click', (e) => {
                if (e.target === e.currentTarget) {
                    if (id === 'transactionModal') Modal.closeTx();
                    else if (id === 'yieldModal') Modal.closeYield();
                    else Modal.closeDelete();
                }
            });
        });

        // Transaction form
        document.getElementById('transactionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('txId').value;
            const record = {
                id: id || U.id(),
                type: document.querySelector('input[name="txType"]:checked').value,
                title: document.getElementById('txTitle').value.trim(),
                amount: parseFloat(document.getElementById('txAmount').value) || 0,
                date: document.getElementById('txDate').value,
                category: document.getElementById('txCategory').value || '',
                note: document.getElementById('txNote').value.trim()
            };
            if (!record.title) { toast('กรุณากรอกรายการ', 'error'); return; }
            if (record.amount <= 0) { toast('กรุณากรอกยอดเงิน', 'error'); return; }
            if (!record.date) { toast('กรุณาเลือกวันที่', 'error'); return; }

            if (id) {
                const idx = State.transactions.findIndex(r => r.id === id);
                if (idx !== -1) State.transactions[idx] = record;
                toast('แก้ไขรายการสำเร็จ');
            } else {
                State.transactions.push(record);
                toast('เพิ่มรายการสำเร็จ');
            }
            Storage.saveAll(); Modal.closeTx(); App.refresh();
        });

        // Yield form
        document.getElementById('yieldForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('yieldId').value;
            const kg = parseFloat(document.getElementById('yieldKg').value) || 0;
            const price = parseFloat(document.getElementById('yieldPrice').value) || 0;
            const record = {
                id: id || U.id(),
                grade: document.querySelector('input[name="yieldGrade"]:checked').value,
                kg, pricePerKg: price,
                totalValue: kg * price,
                date: document.getElementById('yieldDate').value
            };
            if (kg <= 0) { toast('กรุณากรอกปริมาณ', 'error'); return; }
            if (price <= 0) { toast('กรุณากรอกราคา', 'error'); return; }
            if (!record.date) { toast('กรุณาเลือกวันที่', 'error'); return; }

            if (id) {
                const idx = State.yields.findIndex(r => r.id === id);
                if (idx !== -1) State.yields[idx] = record;
                toast('แก้ไขผลผลิตสำเร็จ');
            } else {
                State.yields.push(record);
                toast('บันทึกผลผลิตสำเร็จ');
            }
            Storage.saveAll(); Modal.closeYield(); App.refresh();
        });

        // Yield preview
        ['yieldKg','yieldPrice'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', UI.updateYieldPreview);
        });

        // Type/Grade toggles
        document.querySelectorAll('.toggle-option[data-type]').forEach(t => {
            t.addEventListener('click', () => {
                document.querySelectorAll('.toggle-option[data-type]').forEach(o => o.classList.remove('active'));
                t.classList.add('active'); t.querySelector('input').checked = true;
                UI.populateTxCategories();
            });
        });
        document.querySelectorAll('.toggle-option[data-grade]').forEach(t => {
            t.addEventListener('click', () => {
                document.querySelectorAll('.toggle-option[data-grade]').forEach(o => o.classList.remove('active'));
                t.classList.add('active'); t.querySelector('input').checked = true;
            });
        });

        // Delete confirm
        document.getElementById('confirmDelete')?.addEventListener('click', () => {
            if (State.deleteSource === 'yields') {
                State.yields = State.yields.filter(r => r.id !== State.deleteTarget);
            } else {
                State.transactions = State.transactions.filter(r => r.id !== State.deleteTarget);
            }
            Storage.saveAll(); Modal.closeDelete(); App.refresh();
            toast('ลบรายการสำเร็จ');
        });

        // Action buttons (delegation)
        document.getElementById('recentTableBody')?.addEventListener('click', (e) => {
            const btn = e.target.closest('.action-btn');
            if (!btn) return;
            const id = btn.dataset.id;
            if (btn.classList.contains('edit')) Modal.openTx(State.transactions.find(r => r.id === id));
            else if (btn.classList.contains('delete')) Modal.openDelete(id, 'transactions');
        });

        document.getElementById('transactionsTableBody')?.addEventListener('click', (e) => {
            const btn = e.target.closest('.action-btn');
            if (!btn) return;
            const id = btn.dataset.id;
            if (btn.classList.contains('edit')) Modal.openTx(State.transactions.find(r => r.id === id));
            else if (btn.classList.contains('delete')) Modal.openDelete(id, 'transactions');
        });

        document.getElementById('yieldsTableBody')?.addEventListener('click', (e) => {
            const btn = e.target.closest('.action-btn');
            if (!btn) return;
            const id = btn.dataset.id;
            if (btn.classList.contains('edit')) Modal.openYield(State.yields.find(r => r.id === id));
            else if (btn.classList.contains('delete')) Modal.openDelete(id, 'yields');
        });

        // Filters
        document.getElementById('searchInput')?.addEventListener('input', (e) => {
            State.filters.search = e.target.value; State.page = 1; UI.transactionsPage();
        });
        document.getElementById('filterType')?.addEventListener('change', (e) => {
            State.filters.type = e.target.value; State.page = 1; UI.transactionsPage();
        });
        document.getElementById('filterCategory')?.addEventListener('change', (e) => {
            State.filters.category = e.target.value; State.page = 1; UI.transactionsPage();
        });
        document.getElementById('filterDateStart')?.addEventListener('change', (e) => {
            State.filters.dateStart = e.target.value; State.page = 1; UI.transactionsPage();
        });
        document.getElementById('filterDateEnd')?.addEventListener('change', (e) => {
            State.filters.dateEnd = e.target.value; State.page = 1; UI.transactionsPage();
        });

        // Sort
        document.querySelectorAll('.sortable').forEach(th => {
            th.addEventListener('click', () => {
                const field = th.dataset.sort;
                State.sortDir = State.sortField === field && State.sortDir === 'asc' ? 'desc' : 'asc';
                State.sortField = field;
                State.page = 1;
                UI.transactionsPage();
            });
        });

        // Pagination
        document.getElementById('pagination')?.addEventListener('click', (e) => {
            const btn = e.target.closest('.page-btn');
            if (!btn || btn.disabled) return;
            const p = btn.dataset.page;
            if (p === 'prev') State.page--;
            else if (p === 'next') State.page++;
            else State.page = parseInt(p);
            UI.transactionsPage();
        });

        // Chart period
        document.getElementById('chartPeriod')?.addEventListener('change', () => UI.analyticsPage());

        // Export
        document.getElementById('exportCSV')?.addEventListener('click', () => Export.toCSV());
        document.getElementById('exportExcel')?.addEventListener('click', () => Export.toExcel());
        document.getElementById('exportPDF')?.addEventListener('click', () => Export.toPDF());
        document.getElementById('backupData')?.addEventListener('click', () => Export.backup());
        document.getElementById('restoreInput')?.addEventListener('change', (e) => {
            if (e.target.files.length) Export.restore(e.target.files[0]);
            e.target.value = '';
        });

        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') { Modal.closeTx(); Modal.closeYield(); Modal.closeDelete(); }
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); Modal.openTx(); }
        });
    }
};

// ===== APP =====
const App = {
    init() {
        State.transactions = Storage.load(KEYS.TX, []);
        State.yields = Storage.load(KEYS.YIELDS, []);
        Events.setup();
        UI.populateFilterCategories();

        // Hide loading screen
        setTimeout(() => {
            document.getElementById('loadingScreen').classList.add('hidden');
        }, 1200);

        this.navigate('dashboard');
    },

    navigate(page) {
        State.currentPage = page;
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.page === page));
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById('page-' + page)?.classList.add('active');

        switch (page) {
            case 'dashboard': UI.dashboard(); break;
            case 'transactions': State.page = 1; UI.transactionsPage(); break;
            case 'yields': UI.yieldsPage(); break;
            case 'analytics': UI.analyticsPage(); break;
            case 'reports': break;
        }
    },

    refresh() {
        UI.populateFilterCategories();
        this.navigate(State.currentPage);
    }
};

// ===== START =====
document.addEventListener('DOMContentLoaded', () => App.init());

// ===== PWA SERVICE WORKER =====
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(reg => console.log('SW registered:', reg.scope))
            .catch(err => console.log('SW error:', err));
    });
}
