/* ========================================
   Farm Dashboard - Main Application
   V1 MVP + V2 Advanced Features
   ======================================== */

// ===== CONSTANTS & CONFIG =====
const STORAGE_KEYS = {
    RECORDS: 'farm_records',
    SETTINGS: 'farm_settings',
    CATEGORIES: 'farm_categories'
};

const DEFAULT_CATEGORIES = {
    income: ['ขายผลผลิต', 'ขายสัตว์', 'สนับสนุน/เงินช่วยเหลือ', 'อื่นๆ'],
    expense: ['ค่าปุ๋ย', 'ค่ายา/สารเคมี', 'ค่าแรง', 'ค่าไฟฟ้า/น้ำ', 'ค่าซ่อมบำรุง', 'ค่าอาหารสัตว์', 'อื่นๆ']
};

const ITEMS_PER_PAGE = 15;

// ===== STATE MANAGEMENT =====
const State = {
    records: [],
    settings: {
        farmName: 'ฟาร์มของฉัน',
        currency: '฿'
    },
    categories: JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)),
    currentPage: 'dashboard',
    currentFilters: {
        search: '',
        type: 'all',
        status: 'all',
        dateStart: '',
        dateEnd: ''
    },
    sortField: 'date',
    sortDirection: 'desc',
    tablePage: 1,
    chartPeriod: 6
};

// ===== STORAGE MODULE =====
const Storage = {
    save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            showToast('ไม่สามารถบันทึกข้อมูลได้', 'error');
            return false;
        }
    },
    load(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            return defaultValue;
        }
    },
    saveAll() {
        Storage.save(STORAGE_KEYS.RECORDS, State.records);
        Storage.save(STORAGE_KEYS.SETTINGS, State.settings);
        Storage.save(STORAGE_KEYS.CATEGORIES, State.categories);
    },
    loadAll() {
        State.records = Storage.load(STORAGE_KEYS.RECORDS, []);
        State.settings = Storage.load(STORAGE_KEYS.SETTINGS, State.settings);
        State.categories = Storage.load(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
    }
};

// ===== UTILITY FUNCTIONS =====
const Utils = {
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    },

    formatCurrency(amount) {
        return State.settings.currency + Number(amount).toLocaleString('th-TH', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    },

    formatDate(dateStr) {
        const date = new Date(dateStr);
        const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
            'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear() + 543}`;
    },

    formatShortDate(dateStr) {
        const date = new Date(dateStr);
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    },

    formatMonth(dateStr) {
        const date = new Date(dateStr);
        const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
            'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        return `${months[date.getMonth()]} ${date.getFullYear() + 543}`;
    },

    getMonthKey(dateStr) {
        const date = new Date(dateStr);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    },

    getStatusBadge(status) {
        if (status === 'paid') return '<span class="badge badge-paid">รับเงินแล้ว</span>';
        return '<span class="badge badge-pending">รอรับเงิน</span>';
    },

    getTypeBadge(type) {
        if (type === 'income') return '<span class="badge badge-income">รายรับ</span>';
        return '<span class="badge badge-expense">รายจ่าย</span>';
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// ===== TOAST NOTIFICATION =====
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };

    toast.innerHTML = `${icons[type] || icons.success}<span>${Utils.escapeHtml(message)}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ===== DATA CALCULATIONS =====
const Calculations = {
    getTotalIncome(records = State.records) {
        return records.filter(r => r.type === 'income').reduce((sum, r) => sum + Number(r.amount), 0);
    },

    getTotalExpense(records = State.records) {
        return records.filter(r => r.type === 'expense').reduce((sum, r) => sum + Number(r.amount), 0);
    },

    getProfit(records = State.records) {
        return this.getTotalIncome(records) - this.getTotalExpense(records);
    },

    getTotalYield(records = State.records) {
        return records.reduce((sum, r) => sum + Number(r.yield || 0), 0);
    },

    getPendingIncome(records = State.records) {
        return records.filter(r => r.type === 'income' && r.status === 'pending').reduce((sum, r) => sum + Number(r.amount), 0);
    },

    getPaidIncome(records = State.records) {
        return records.filter(r => r.type === 'income' && r.status === 'paid').reduce((sum, r) => sum + Number(r.amount), 0);
    },

    getThisMonthRecords() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        return State.records.filter(r => {
            const d = new Date(r.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
    },

    getPreviousMonthRecords() {
        const now = new Date();
        const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        return State.records.filter(r => {
            const d = new Date(r.date);
            return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
        });
    },

    getMonthlyData(months = 6) {
        const data = {};
        const now = new Date();
        for (let i = 0; i < months; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            data[key] = { income: 0, expense: 0, count: 0, label: Utils.formatMonth(d.toISOString()) };
        }

        State.records.forEach(r => {
            const key = Utils.getMonthKey(r.date);
            if (data[key]) {
                if (r.type === 'income') data[key].income += Number(r.amount);
                else data[key].expense += Number(r.amount);
                data[key].count++;
            }
        });

        return Object.entries(data).reverse().map(([key, val]) => ({ ...val, key }));
    },

    getExpenseByCategory() {
        const categories = {};
        State.records.filter(r => r.type === 'expense').forEach(r => {
            const cat = r.category || 'อื่นๆ';
            categories[cat] = (categories[cat] || 0) + Number(r.amount);
        });
        return Object.entries(categories)
            .sort((a, b) => b[1] - a[1])
            .map(([name, amount]) => ({ name, amount }));
    },

    getTopRecords(type, limit = 5) {
        return State.records
            .filter(r => r.type === type)
            .sort((a, b) => Number(b.amount) - Number(a.amount))
            .slice(0, limit);
    }
};

// ===== UI RENDERING =====
const UI = {
    // ===== DASHBOARD =====
    renderDashboard() {
        this.renderSummaryCards();
        this.renderQuickStats();
        this.renderTopLists();
        this.renderRecentTable();
    },

    renderSummaryCards() {
        const records = this.getFilteredRecords();
        document.getElementById('totalIncome').textContent = Utils.formatCurrency(Calculations.getTotalIncome(records));
        document.getElementById('totalExpense').textContent = Utils.formatCurrency(Calculations.getTotalExpense(records));
        document.getElementById('totalProfit').textContent = Utils.formatCurrency(Calculations.getProfit(records));
        document.getElementById('totalYield').textContent = Number(Calculations.getTotalYield(records)).toFixed(1) + ' กก.';

        // Trend calculation
        const current = this.getFilteredRecords();
        const prev = this.getPreviousMonthRecords();
        const prevIncome = Calculations.getTotalIncome(prev);
        const prevExpense = Calculations.getTotalExpense(prev);

        if (prevIncome > 0) {
            const incomeChange = ((Calculations.getTotalIncome(current) - prevIncome) / prevIncome * 100).toFixed(1);
            document.getElementById('incomeTrendText').textContent = `${incomeChange > 0 ? '+' : ''}${incomeChange}%`;
        } else {
            document.getElementById('incomeTrendText').textContent = 'N/A';
        }

        if (prevExpense > 0) {
            const expenseChange = ((Calculations.getTotalExpense(current) - prevExpense) / prevExpense * 100).toFixed(1);
            document.getElementById('expenseTrendText').textContent = `${expenseChange > 0 ? '+' : ''}${expenseChange}%`;
        } else {
            document.getElementById('expenseTrendText').textContent = 'N/A';
        }

        const profit = Calculations.getProfit(current);
        const income = Calculations.getTotalIncome(current);
        document.getElementById('profitMarginText').textContent = income > 0 ? `${(profit / income * 100).toFixed(1)}%` : '0%';
        document.getElementById('totalRecordCount').textContent = current.length;
    },

    getFilteredRecords() {
        const { search, type, status, dateStart, dateEnd } = State.currentFilters;
        let records = [...State.records];

        if (search) {
            records = records.filter(r => r.title.toLowerCase().includes(search.toLowerCase()) || (r.note || '').toLowerCase().includes(search.toLowerCase()));
        }
        if (type !== 'all') records = records.filter(r => r.type === type);
        if (status !== 'all') records = records.filter(r => r.status === status);
        if (dateStart) records = records.filter(r => r.date >= dateStart);
        if (dateEnd) records = records.filter(r => r.date <= dateEnd);

        records.sort((a, b) => {
            const field = State.sortField;
            const dir = State.sortDirection === 'asc' ? 1 : -1;
            if (field === 'amount') return (Number(b[field]) - Number(a[field])) * dir;
            if (field === 'date') return (a[field] < b[field] ? -1 : 1) * dir;
            if (field === 'title') return a[field].localeCompare(b[field]) * dir;
            if (field === 'type') return a[field].localeCompare(b[field]) * dir;
            if (field === 'status') return a[field].localeCompare(b[field]) * dir;
            if (field === 'category') return (a.category || '').localeCompare(b.category || '') * dir;
            return 0;
        });

        return records;
    },

    renderQuickStats() {
        const thisMonth = Calculations.getThisMonthRecords();
        document.getElementById('pendingIncome').textContent = Utils.formatCurrency(Calculations.getPendingIncome());
        document.getElementById('paidIncome').textContent = Utils.formatCurrency(Calculations.getPaidIncome());
        document.getElementById('thisMonthCount').textContent = thisMonth.length;
        document.getElementById('thisMonthIncome').textContent = Utils.formatCurrency(Calculations.getTotalIncome(thisMonth));
    },

    renderTopLists() {
        const incomeList = document.getElementById('topIncomeList');
        const expenseList = document.getElementById('topExpenseList');

        const topIncome = Calculations.getTopRecords('income');
        const topExpense = Calculations.getTopRecords('expense');

        incomeList.innerHTML = topIncome.length
            ? topIncome.map(r => `
                <div class="top-item">
                    <div>
                        <div class="top-item-name">${Utils.escapeHtml(r.title)}</div>
                        <div class="top-item-date">${Utils.formatDate(r.date)}</div>
                    </div>
                    <div class="top-item-amount">+${Utils.formatCurrency(r.amount)}</div>
                </div>`).join('')
            : '<div class="empty-state"><p>ยังไม่มีรายการ</p></div>';

        expenseList.innerHTML = topExpense.length
            ? topExpense.map(r => `
                <div class="top-item expense">
                    <div>
                        <div class="top-item-name">${Utils.escapeHtml(r.title)}</div>
                        <div class="top-item-date">${Utils.formatDate(r.date)}</div>
                    </div>
                    <div class="top-item-amount">-${Utils.formatCurrency(r.amount)}</div>
                </div>`).join('')
            : '<div class="empty-state"><p>ยังไม่มีรายการ</p></div>';
    },

    renderRecentTable() {
        const tbody = document.getElementById('recentTableBody');
        const records = State.records
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 8);

        if (!records.length) {
            tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <p>ยังไม่มีรายการ กรุณาเพิ่มรายการแรก</p>
            </div></td></tr>`;
            return;
        }

        tbody.innerHTML = records.map(r => `
            <tr>
                <td>${Utils.formatDate(r.date)}</td>
                <td><strong>${Utils.escapeHtml(r.title)}</strong></td>
                <td>${Utils.getTypeBadge(r.type)}</td>
                <td class="${r.type === 'income' ? 'amount-income' : 'amount-expense'}">
                    ${r.type === 'income' ? '+' : '-'}${Utils.formatCurrency(r.amount)}
                </td>
                <td>${Utils.getStatusBadge(r.status)}</td>
                <td class="action-btns">
                    <button class="action-btn edit" data-id="${r.id}" title="แก้ไข">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="action-btn delete" data-id="${r.id}" title="ลบ">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </td>
            </tr>`).join('');
    },

    // ===== RECORDS TABLE =====
    renderRecordsTable() {
        const tbody = document.getElementById('allRecordsTableBody');
        const filtered = this.getFilteredRecords();
        const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
        const start = (State.tablePage - 1) * ITEMS_PER_PAGE;
        const pageRecords = filtered.slice(start, start + ITEMS_PER_PAGE);

        if (!filtered.length) {
            tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <p>ไม่พบรายการที่ตรงกับเงื่อนไข</p>
            </div></td></tr>`;
            this.renderPagination(0);
            return;
        }

        tbody.innerHTML = pageRecords.map(r => `
            <tr>
                <td>${Utils.formatDate(r.date)}</td>
                <td><strong>${Utils.escapeHtml(r.title)}</strong>${r.note ? `<br><small style="color:var(--gray-400)">${Utils.escapeHtml(r.note)}</small>` : ''}</td>
                <td>${Utils.getTypeBadge(r.type)}</td>
                <td class="${r.type === 'income' ? 'amount-income' : 'amount-expense'}">
                    ${r.type === 'income' ? '+' : '-'}${Utils.formatCurrency(r.amount)}
                </td>
                <td>${Utils.getStatusBadge(r.status)}</td>
                <td>${r.category ? `<span class="badge badge-category">${Utils.escapeHtml(r.category)}</span>` : '-'}</td>
                <td class="action-btns">
                    <button class="action-btn edit" data-id="${r.id}" title="แก้ไข">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="action-btn delete" data-id="${r.id}" title="ลบ">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </td>
            </tr>`).join('');

        this.renderPagination(totalPages);
    },

    renderPagination(totalPages) {
        const container = document.getElementById('pagination');
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = '';
        html += `<button class="page-btn" data-page="prev" ${State.tablePage <= 1 ? 'disabled' : ''}>← ก่อนหน้า</button>`;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= State.tablePage - 2 && i <= State.tablePage + 2)) {
                html += `<button class="page-btn${i === State.tablePage ? ' active' : ''}" data-page="${i}">${i}</button>`;
            } else if (i === State.tablePage - 3 || i === State.tablePage + 3) {
                html += `<span class="page-btn" style="border:none;background:none;cursor:default">...</span>`;
            }
        }

        html += `<button class="page-btn" data-page="next" ${State.tablePage >= totalPages ? 'disabled' : ''}>ถัดไป →</button>`;
        container.innerHTML = html;
    },

    // ===== ANALYTICS =====
    renderAnalytics() {
        this.renderMonthlyTable();
        this.renderCharts();
    },

    renderMonthlyTable() {
        const tbody = document.getElementById('monthlyTableBody');
        const monthly = Calculations.getMonthlyData(12);

        tbody.innerHTML = monthly.map(m => {
            const profit = m.income - m.expense;
            return `
                <tr>
                    <td><strong>${m.label}</strong></td>
                    <td class="amount-income">+${Utils.formatCurrency(m.income)}</td>
                    <td class="amount-expense">-${Utils.formatCurrency(m.expense)}</td>
                    <td class="${profit >= 0 ? 'amount-income' : 'amount-expense'}">${Utils.formatCurrency(profit)}</td>
                    <td>${m.count}</td>
                </tr>`;
        }).join('');
    },

    renderCharts() {
        const months = parseInt(document.getElementById('chartPeriod')?.value || 6);
        const monthlyData = Calculations.getMonthlyData(months);
        const labels = monthlyData.map(m => m.label);
        const incomeData = monthlyData.map(m => m.income);
        const expenseData = monthlyData.map(m => m.expense);
        const profitData = monthlyData.map(m => m.income - m.expense);

        // Income vs Expense Chart
        this.createBarChart('incomeExpenseChart', labels, incomeData, expenseData, 'รายรับ', 'รายจ่าย');

        // Profit Chart
        this.createBarChart('profitChart', labels, profitData, null, 'กำไรสุทธิ', null, profitData.map(v => v >= 0 ? '#10B981' : '#EF4444'));

        // Income Trend Chart
        this.createLineChart('incomeTrendChart', labels, incomeData);

        // Expense Category Chart
        const expByCat = Calculations.getExpenseByCategory();
        this.createPieChart('expenseCategoryChart', expByCat.map(c => c.name), expByCat.map(c => c.amount));
    },

    createBarChart(canvasId, labels, data1, data2, label1, label2, colors) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.parentElement.getBoundingClientRect();
        const w = rect.width - 48;
        const h = 220;

        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.scale(dpr, dpr);

        const padding = { top: 20, right: 20, bottom: 40, left: 60 };
        const chartW = w - padding.left - padding.right;
        const chartH = h - padding.top - padding.bottom;

        ctx.clearRect(0, 0, w, h);

        const allValues = data2 ? [...data1, ...data2] : data1;
        const maxVal = Math.max(...allValues.map(v => Math.abs(v)), 1);
        const niceMax = Math.ceil(maxVal / 500) * 500 || 100;

        // Grid lines
        ctx.strokeStyle = '#E5E7EB';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (chartH / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(w - padding.right, y);
            ctx.stroke();

            ctx.fillStyle = '#9CA3AF';
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'right';
            const val = niceMax - (niceMax / 4) * i;
            ctx.fillText(val >= 1000 ? (val / 1000).toFixed(1) + 'K' : val, padding.left - 8, y + 4);
        }

        // Bars
        const groupWidth = chartW / labels.length;
        const barWidth = data2 ? Math.min(groupWidth * 0.3, 20) : Math.min(groupWidth * 0.5, 30);

        labels.forEach((label, i) => {
            const x = padding.left + groupWidth * i + groupWidth / 2;

            if (data2) {
                // Grouped bars
                const h1 = (Math.abs(data1[i]) / niceMax) * chartH;
                const h2 = (Math.abs(data2[i]) / niceMax) * chartH;
                const barGap = 4;

                ctx.fillStyle = colors ? (data1[i] >= 0 ? '#10B981' : '#EF4444') : '#10B981';
                ctx.fillRect(x - barWidth - barGap / 2, padding.top + chartH - h1, barWidth, h1);

                ctx.fillStyle = colors ? (data2[i] >= 0 ? '#10B981' : '#EF4444') : '#EF4444';
                ctx.fillRect(x + barGap / 2, padding.top + chartH - h2, barWidth, h2);
            } else {
                const h = (Math.abs(data1[i]) / niceMax) * chartH;
                ctx.fillStyle = colors ? colors[i] : '#10B981';
                ctx.fillRect(x - barWidth / 2, padding.top + chartH - h, barWidth, h);
            }

            // Label
            ctx.fillStyle = '#9CA3AF';
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(label, x, h - padding.bottom + 56);
        });

        // Legend
        if (label2) {
            const legendY = h - 10;
            ctx.font = '11px Inter, sans-serif';
            const l1 = ctx.measureText(label1).width;
            ctx.fillStyle = '#10B981';
            ctx.fillRect(padding.left + chartW / 2 - l1 - 30, legendY - 8, 12, 12);
            ctx.fillStyle = '#6B7280';
            ctx.textAlign = 'left';
            ctx.fillText(label1, padding.left + chartW / 2 - l1 - 14, legendY + 2);

            const l2 = ctx.measureText(label2).width;
            ctx.fillStyle = '#EF4444';
            ctx.fillRect(padding.left + chartW / 2 + 10, legendY - 8, 12, 12);
            ctx.fillStyle = '#6B7280';
            ctx.fillText(label2, padding.left + chartW / 2 + 26, legendY + 2);
        }
    },

    createLineChart(canvasId, labels, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.parentElement.getBoundingClientRect();
        const w = rect.width - 48;
        const h = 220;

        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.scale(dpr, dpr);

        const padding = { top: 20, right: 20, bottom: 40, left: 60 };
        const chartW = w - padding.left - padding.right;
        const chartH = h - padding.top - padding.bottom;

        ctx.clearRect(0, 0, w, h);

        const maxVal = Math.max(...data, 1);
        const niceMax = Math.ceil(maxVal / 500) * 500 || 100;

        // Grid
        ctx.strokeStyle = '#E5E7EB';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (chartH / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(w - padding.right, y);
            ctx.stroke();

            ctx.fillStyle = '#9CA3AF';
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'right';
            const val = niceMax - (niceMax / 4) * i;
            ctx.fillText(val >= 1000 ? (val / 1000).toFixed(1) + 'K' : val, padding.left - 8, y + 4);
        }

        if (data.length < 2) {
            ctx.fillStyle = '#9CA3AF';
            ctx.font = '13px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('ต้องการข้อมูลอย่างน้อย 2 เดือน', w / 2, h / 2);
            return;
        }

        // Draw area
        const points = data.map((val, i) => ({
            x: padding.left + (i / (data.length - 1)) * chartW,
            y: padding.top + chartH - (val / niceMax) * chartH
        }));

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            const cp1x = (points[i - 1].x + points[i].x) / 2;
            const cp1y = points[i - 1].y;
            const cp2x = cp1x;
            const cp2y = points[i].y;
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, points[i].x, points[i].y);
        }

        // Fill area
        const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0.01)');
        ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
        ctx.lineTo(points[0].x, padding.top + chartH);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw line
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            const cp1x = (points[i - 1].x + points[i].x) / 2;
            const cp1y = points[i - 1].y;
            const cp2x = cp1x;
            const cp2y = points[i].y;
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, points[i].x, points[i].y);
        }
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Dots
        points.forEach((p, i) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#10B981';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();
        });

        // Labels
        labels.forEach((label, i) => {
            ctx.fillStyle = '#9CA3AF';
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(label, points[i].x, h - 10);
        });
    },

    createPieChart(canvasId, labels, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.parentElement.getBoundingClientRect();
        const w = rect.width - 48;
        const h = 220;

        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, w, h);

        if (!data.length) {
            ctx.fillStyle = '#9CA3AF';
            ctx.font = '13px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('ยังไม่มีข้อมูลรายจ่าย', w / 2, h / 2);
            return;
        }

        const colors = ['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#10B981', '#EC4899', '#06B6D4', '#84CC16'];
        const total = data.reduce((s, v) => s + v, 0);
        const cx = w * 0.35;
        const cy = h / 2;
        const radius = Math.min(cx - 20, cy - 30);
        const innerRadius = radius * 0.55;

        let startAngle = -Math.PI / 2;

        data.forEach((val, i) => {
            const sliceAngle = (val / total) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();
            startAngle += sliceAngle;
        });

        // Inner circle (donut)
        ctx.beginPath();
        ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();

        // Center text
        ctx.fillStyle = '#374151';
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(Utils.formatCurrency(total), cx, cy - 4);
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText('รายจ่ายทั้งหมด', cx, cy + 14);

        // Legend
        const legendX = w * 0.65;
        let legendY = 30;
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'left';

        data.forEach((val, i) => {
            const pct = ((val / total) * 100).toFixed(1);
            ctx.fillStyle = colors[i % colors.length];
            ctx.fillRect(legendX, legendY - 8, 12, 12);

            ctx.fillStyle = '#4B5563';
            ctx.fillText(labels[i], legendX + 18, legendY + 2);

            ctx.fillStyle = '#9CA3AF';
            ctx.fillText(`${pct}%`, legendX + ctx.measureText(labels[i]).width + 24, legendY + 2);

            legendY += 26;
        });
    },

    // ===== SETTINGS =====
    renderCategories() {
        const incomeDiv = document.getElementById('incomeCategories');
        const expenseDiv = document.getElementById('expenseCategories');

        incomeDiv.innerHTML = State.categories.income.map(cat => `
            <div class="category-item">
                <span>${Utils.escapeHtml(cat)}</span>
                <button class="remove-cat" data-type="income" data-name="${Utils.escapeHtml(cat)}">×</button>
            </div>`).join('');

        expenseDiv.innerHTML = State.categories.expense.map(cat => `
            <div class="category-item">
                <span>${Utils.escapeHtml(cat)}</span>
                <button class="remove-cat" data-type="expense" data-name="${Utils.escapeHtml(cat)}">×</button>
            </div>`).join('');
    },

    populateCategorySelect() {
        const select = document.getElementById('recordCategory');
        const type = document.querySelector('input[name="recordType"]:checked')?.value || 'income';
        select.innerHTML = '<option value="">ไม่ระบุ</option>' +
            State.categories[type].map(cat => `<option value="${Utils.escapeHtml(cat)}">${Utils.escapeHtml(cat)}</option>`).join('');
    }
};

// ===== EXPORT FUNCTIONS =====
const Export = {
    async exportToCSV() {
        const headers = ['วันที่', 'รายการ', 'ประเภท', 'ยอดเงิน', 'สถานะ', 'หมวดหมู่', 'ปริมาณ(กก.)', 'หมายเหตุ'];
        const rows = State.records.map(r => [
            r.date, r.title, r.type === 'income' ? 'รายรับ' : 'รายจ่าย',
            r.amount, r.status === 'paid' ? 'รับเงินแล้ว' : 'รอรับเงิน',
            r.category || '', r.yield || '', r.note || ''
        ]);

        const csvContent = '\uFEFF' + // BOM for Thai support
            [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        this.downloadFile(blob, `farm-records-${new Date().toISOString().slice(0, 10)}.csv`);
        showToast('ดาวน์โหลด CSV สำเร็จ', 'success');
    },

    async exportToExcel() {
        // Generate XLSX-compatible HTML table as fallback
        const html = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
            <head><meta charset="utf-8"></head>
            <body>
            <table border="1">
                <tr style="background:#10B981;color:white;font-weight:bold;">
                    <th>วันที่</th><th>รายการ</th><th>ประเภท</th><th>ยอดเงิน</th>
                    <th>สถานะ</th><th>หมวดหมู่</th><th>ปริมาณ(กก.)</th><th>หมายเหตุ</th>
                </tr>
                ${State.records.map(r => `
                    <tr>
                        <td>${r.date}</td>
                        <td>${r.title}</td>
                        <td>${r.type === 'income' ? 'รายรับ' : 'รายจ่าย'}</td>
                        <td>${r.amount}</td>
                        <td>${r.status === 'paid' ? 'รับเงินแล้ว' : 'รอรับเงิน'}</td>
                        <td>${r.category || ''}</td>
                        <td>${r.yield || ''}</td>
                        <td>${r.note || ''}</td>
                    </tr>`).join('')}
            </table>
            </body></html>`;

        const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
        this.downloadFile(blob, `farm-records-${new Date().toISOString().slice(0, 10)}.xls`);
        showToast('ดาวน์โหลด Excel สำเร็จ', 'success');
    },

    exportToPDF() {
        // Print-based PDF export
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            showToast('กรุณาอนุญาต popup เพื่อสร้าง PDF', 'error');
            return;
        }

        const now = new Date();
        const income = Calculations.getTotalIncome();
        const expense = Calculations.getTotalExpense();
        const profit = Calculations.getProfit();

        printWindow.document.write(`
            <!DOCTYPE html>
            <html><head><meta charset="utf-8"><title>รายงานฟาร์ม</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Sarabun', sans-serif; padding: 40px; color: #1F2937; }
                h1 { font-size: 24px; margin-bottom: 8px; }
                .subtitle { color: #6B7280; margin-bottom: 24px; }
                .summary { display: flex; gap: 20px; margin-bottom: 30px; }
                .summary-card { padding: 16px; border: 1px solid #E5E7EB; border-radius: 8px; flex: 1; }
                .summary-card .label { font-size: 12px; color: #6B7280; text-transform: uppercase; }
                .summary-card .value { font-size: 22px; font-weight: bold; margin-top: 4px; }
                .summary-card.income .value { color: #10B981; }
                .summary-card.expense .value { color: #EF4444; }
                .summary-card.profit .value { color: #3B82F6; }
                table { width: 100%; border-collapse: collapse; margin-top: 16px; }
                th { background: #F3F4F6; padding: 10px; text-align: left; font-size: 13px; border-bottom: 2px solid #E5E7EB; }
                td { padding: 10px; border-bottom: 1px solid #E5E7EB; font-size: 13px; }
                .income-text { color: #10B981; font-weight: 600; }
                .expense-text { color: #EF4444; font-weight: 600; }
            </style></head>
            <body>
                <h1>รายงานสรุปผลการดำเนินงาน - ${State.settings.farmName}</h1>
                <p class="subtitle">ณ วันที่ ${Utils.formatDate(now.toISOString().split('T')[0])}</p>
                <div class="summary">
                    <div class="summary-card income"><div class="label">รายรับทั้งหมด</div><div class="value">${Utils.formatCurrency(income)}</div></div>
                    <div class="summary-card expense"><div class="label">รายจ่ายทั้งหมด</div><div class="value">${Utils.formatCurrency(expense)}</div></div>
                    <div class="summary-card profit"><div class="label">กำไรสุทธิ</div><div class="value">${Utils.formatCurrency(profit)}</div></div>
                </div>
                <table>
                    <tr><th>วันที่</th><th>รายการ</th><th>ประเภท</th><th>ยอดเงิน</th><th>สถานะ</th><th>หมวดหมู่</th></tr>
                    ${State.records.sort((a, b) => b.date.localeCompare(a.date)).map(r => `
                        <tr>
                            <td>${Utils.formatDate(r.date)}</td>
                            <td>${r.title}</td>
                            <td>${r.type === 'income' ? 'รายรับ' : 'รายจ่าย'}</td>
                            <td class="${r.type === 'income' ? 'income-text' : 'expense-text'}">${Utils.formatCurrency(r.amount)}</td>
                            <td>${r.status === 'paid' ? 'รับเงินแล้ว' : 'รอรับเงิน'}</td>
                            <td>${r.category || '-'}</td>
                        </tr>`).join('')}
                </table>
            </body></html>`);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
        showToast('กำลังสร้าง PDF...', 'info');
    },

    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    backupData() {
        const data = {
            records: State.records,
            settings: State.settings,
            categories: State.categories,
            exportDate: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        this.downloadFile(blob, `farm-backup-${new Date().toISOString().slice(0, 10)}.json`);
        showToast('สำรองข้อมูลสำเร็จ', 'success');
    },

    restoreData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.records && Array.isArray(data.records)) {
                    State.records = data.records;
                    if (data.settings) State.settings = data.settings;
                    if (data.categories) State.categories = data.categories;
                    Storage.saveAll();
                    App.init();
                    showToast(`เรียกคืนข้อมูล ${data.records.length} รายการสำเร็จ`, 'success');
                } else {
                    showToast('ไฟล์ไม่ถูกต้อง', 'error');
                }
            } catch (err) {
                showToast('ไม่สามารถอ่านไฟล์ได้', 'error');
            }
        };
        reader.readAsText(file);
    }
};

// ===== MODAL MANAGEMENT =====
const Modal = {
    openRecordModal(record = null) {
        const modal = document.getElementById('recordModal');
        const form = document.getElementById('recordForm');
        form.reset();

        if (record) {
            document.getElementById('modalTitle').textContent = 'แก้ไขรายการ';
            document.getElementById('recordId').value = record.id;
            document.getElementById('recordTitle').value = record.title;
            document.getElementById('recordAmount').value = record.amount;
            document.getElementById('recordDate').value = record.date;
            document.getElementById('recordYield').value = record.yield || '';
            document.getElementById('recordNote').value = record.note || '';
            document.getElementById('recordStatus').value = record.status || 'paid';

            // Set type
            document.querySelector(`input[name="recordType"][value="${record.type}"]`).checked = true;
            document.querySelectorAll('.toggle-option').forEach(t => {
                t.classList.toggle('active', t.dataset.type === record.type);
            });
        } else {
            document.getElementById('modalTitle').textContent = 'เพิ่มรายการใหม่';
            document.getElementById('recordId').value = '';
            document.getElementById('recordDate').value = new Date().toISOString().split('T')[0];
            document.querySelector('input[name="recordType"][value="income"]').checked = true;
            document.querySelectorAll('.toggle-option').forEach(t => {
                t.classList.toggle('active', t.dataset.type === 'income');
            });
        }

        UI.populateCategorySelect();
        document.getElementById('statusGroup').style.display =
            document.querySelector('input[name="recordType"]:checked').value === 'income' ? 'block' : 'none';

        modal.classList.add('active');
    },

    closeRecordModal() {
        document.getElementById('recordModal').classList.remove('active');
    },

    openDeleteModal(record) {
        const modal = document.getElementById('deleteModal');
        document.getElementById('deleteItemName').textContent = record.title;
        modal.dataset.id = record.id;
        modal.classList.add('active');
    },

    closeDeleteModal() {
        document.getElementById('deleteModal').classList.remove('active');
    }
};

// ===== EVENT HANDLERS =====
const Events = {
    setup() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.dataset.page;
                App.navigate(page);
                // Close sidebar on mobile
                document.getElementById('sidebar').classList.remove('open');
                document.querySelector('.sidebar-overlay')?.classList.remove('active');
            });
        });

        // Mobile menu
        document.getElementById('menuToggle').addEventListener('click', () => {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.toggle('open');

            // Overlay
            let overlay = document.querySelector('.sidebar-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'sidebar-overlay';
                document.body.appendChild(overlay);
            }
            overlay.classList.toggle('active', sidebar.classList.contains('open'));
            overlay.addEventListener('click', () => {
                sidebar.classList.remove('open');
                overlay.classList.remove('active');
            }, { once: true });
        });

        // Add buttons
        document.getElementById('addBtn').addEventListener('click', () => Modal.openRecordModal());
        document.getElementById('addBtnRecords').addEventListener('click', () => Modal.openRecordModal());
        document.getElementById('addBtnMobile').addEventListener('click', () => Modal.openRecordModal());

        // View all records
        document.getElementById('viewAllBtn').addEventListener('click', () => App.navigate('records'));

        // Modal
        document.getElementById('modalClose').addEventListener('click', Modal.closeRecordModal);
        document.getElementById('modalCancel').addEventListener('click', Modal.closeRecordModal);
        document.getElementById('deleteModalClose').addEventListener('click', Modal.closeDeleteModal);
        document.getElementById('cancelDelete').addEventListener('click', Modal.closeDeleteModal);

        // Record form submit
        document.getElementById('recordForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveRecord();
        });

        // Type toggle
        document.querySelectorAll('.toggle-option').forEach(toggle => {
            toggle.addEventListener('click', () => {
                document.querySelectorAll('.toggle-option').forEach(t => t.classList.remove('active'));
                toggle.classList.add('active');
                toggle.querySelector('input').checked = true;
                UI.populateCategorySelect();
                document.getElementById('statusGroup').style.display =
                    toggle.dataset.type === 'income' ? 'block' : 'none';
            });
        });

        // Delete confirm
        document.getElementById('confirmDelete').addEventListener('click', () => {
            const id = document.getElementById('deleteModal').dataset.id;
            State.records = State.records.filter(r => r.id !== id);
            Storage.saveAll();
            Modal.closeDeleteModal();
            App.refreshCurrentPage();
            showToast('ลบรายการสำเร็จ', 'success');
        });

        // Action buttons (edit/delete) via delegation
        document.getElementById('recentTableBody').addEventListener('click', (e) => {
            const btn = e.target.closest('.action-btn');
            if (!btn) return;
            const id = btn.dataset.id;
            const record = State.records.find(r => r.id === id);
            if (!record) return;

            if (btn.classList.contains('edit')) {
                Modal.openRecordModal(record);
            } else if (btn.classList.contains('delete')) {
                Modal.openDeleteModal(record);
            }
        });

        document.getElementById('allRecordsTableBody').addEventListener('click', (e) => {
            const btn = e.target.closest('.action-btn');
            if (!btn) return;
            const id = btn.dataset.id;
            const record = State.records.find(r => r.id === id);
            if (!record) return;

            if (btn.classList.contains('edit')) {
                Modal.openRecordModal(record);
            } else if (btn.classList.contains('delete')) {
                Modal.openDeleteModal(record);
            }
        });

        // Category management
        document.getElementById('incomeCategories').addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-cat')) {
                const name = e.target.dataset.name;
                State.categories.income = State.categories.income.filter(c => c !== name);
                Storage.saveAll();
                UI.renderCategories();
            }
        });

        document.getElementById('expenseCategories').addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-cat')) {
                const name = e.target.dataset.name;
                State.categories.expense = State.categories.expense.filter(c => c !== name);
                Storage.saveAll();
                UI.renderCategories();
            }
        });

        document.getElementById('addCategoryBtn').addEventListener('click', () => {
            const name = document.getElementById('newCategoryName').value.trim();
            const type = document.getElementById('newCategoryType').value;
            if (!name) { showToast('กรุณากรอกชื่อหมวดหมู่', 'error'); return; }
            if (State.categories[type].includes(name)) { showToast('หมวดหมู่นี้มีอยู่แล้ว', 'error'); return; }
            State.categories[type].push(name);
            Storage.saveAll();
            UI.renderCategories();
            document.getElementById('newCategoryName').value = '';
            showToast('เพิ่มหมวดหมู่สำเร็จ', 'success');
        });

        // Filters
        document.getElementById('searchInput').addEventListener('input', (e) => {
            State.currentFilters.search = e.target.value;
            State.tablePage = 1;
            UI.renderRecordsTable();
        });

        document.getElementById('filterType').addEventListener('change', (e) => {
            State.currentFilters.type = e.target.value;
            State.tablePage = 1;
            UI.renderRecordsTable();
        });

        document.getElementById('filterStatus').addEventListener('change', (e) => {
            State.currentFilters.status = e.target.value;
            State.tablePage = 1;
            UI.renderRecordsTable();
        });

        document.getElementById('filterDateStart').addEventListener('change', (e) => {
            State.currentFilters.dateStart = e.target.value;
            State.tablePage = 1;
            UI.renderRecordsTable();
        });

        document.getElementById('filterDateEnd').addEventListener('change', (e) => {
            State.currentFilters.dateEnd = e.target.value;
            State.tablePage = 1;
            UI.renderRecordsTable();
        });

        // Sort
        document.querySelectorAll('.sortable').forEach(th => {
            th.addEventListener('click', () => {
                const field = th.dataset.sort;
                if (State.sortField === field) {
                    State.sortDirection = State.sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    State.sortField = field;
                    State.sortDirection = 'asc';
                }
                State.tablePage = 1;
                UI.renderRecordsTable();
            });
        });

        // Pagination
        document.getElementById('pagination').addEventListener('click', (e) => {
            const btn = e.target.closest('.page-btn');
            if (!btn || btn.disabled) return;
            const page = btn.dataset.page;
            if (page === 'prev') State.tablePage--;
            else if (page === 'next') State.tablePage++;
            else State.tablePage = parseInt(page);
            UI.renderRecordsTable();
        });

        // Chart period
        document.getElementById('chartPeriod').addEventListener('change', () => {
            UI.renderCharts();
        });

        // Export buttons
        document.getElementById('exportCSV').addEventListener('click', () => Export.exportToCSV());
        document.getElementById('exportExcel').addEventListener('click', () => Export.exportToExcel());
        document.getElementById('exportPDF').addEventListener('click', () => Export.exportToPDF());
        document.getElementById('backupData').addEventListener('click', () => Export.backupData());

        // Restore
        document.getElementById('restoreInput').addEventListener('change', (e) => {
            if (e.target.files.length) Export.restoreData(e.target.files[0]);
            e.target.value = '';
        });

        // Settings
        document.getElementById('saveSettings').addEventListener('click', () => {
            State.settings.farmName = document.getElementById('settingFarmName').value.trim() || 'ฟาร์มของฉัน';
            State.settings.currency = document.getElementById('settingCurrency').value;
            Storage.saveAll();
            document.getElementById('currencyPrefix').textContent = State.settings.currency;
            App.refreshCurrentPage();
            showToast('บันทึกการตั้งค่าสำเร็จ', 'success');
        });

        // Clear all data
        document.getElementById('clearAllData').addEventListener('click', () => {
            if (confirm('คุณแน่ใจหรือไม่ที่จะล้างข้อมูลทั้งหมด? การดำเนินการนี้ไม่สามารถเรียกคืนได้')) {
                State.records = [];
                Storage.saveAll();
                App.init();
                showToast('ล้างข้อมูลทั้งหมดแล้ว', 'success');
            }
        });

        // Click outside modal
        document.getElementById('recordModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) Modal.closeRecordModal();
        });
        document.getElementById('deleteModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) Modal.closeDeleteModal();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                Modal.closeRecordModal();
                Modal.closeDeleteModal();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                Modal.openRecordModal();
            }
        });
    },

    saveRecord() {
        const id = document.getElementById('recordId').value;
        const record = {
            id: id || Utils.generateId(),
            title: document.getElementById('recordTitle').value.trim(),
            amount: parseFloat(document.getElementById('recordAmount').value) || 0,
            date: document.getElementById('recordDate').value,
            type: document.querySelector('input[name="recordType"]:checked').value,
            category: document.getElementById('recordCategory').value || '',
            status: document.getElementById('recordStatus').value,
            yield: parseFloat(document.getElementById('recordYield').value) || 0,
            note: document.getElementById('recordNote').value.trim()
        };

        if (!record.title) { showToast('กรุณากรอกรายการ', 'error'); return; }
        if (record.amount <= 0) { showToast('กรุณากรอกยอดเงิน', 'error'); return; }
        if (!record.date) { showToast('กรุณาเลือกวันที่', 'error'); return; }

        if (id) {
            const idx = State.records.findIndex(r => r.id === id);
            if (idx !== -1) State.records[idx] = record;
            showToast('แก้ไขรายการสำเร็จ', 'success');
        } else {
            State.records.push(record);
            showToast('เพิ่มรายการสำเร็จ', 'success');
        }

        Storage.saveAll();
        Modal.closeRecordModal();
        App.refreshCurrentPage();
    }
};

// ===== APP INITIALIZATION =====
const App = {
    init() {
        Storage.loadAll();
        Events.setup();
        this.loadSettings();
        this.navigate('dashboard');
    },

    loadSettings() {
        document.getElementById('settingFarmName').value = State.settings.farmName;
        document.getElementById('settingCurrency').value = State.settings.currency;
        document.getElementById('currencyPrefix').textContent = State.settings.currency;
        UI.renderCategories();
    },

    navigate(page) {
        State.currentPage = page;

        // Update nav
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });

        // Show page
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(`page-${page}`).classList.add('active');

        // Render content
        switch (page) {
            case 'dashboard':
                UI.renderDashboard();
                break;
            case 'records':
                State.tablePage = 1;
                UI.renderRecordsTable();
                break;
            case 'analytics':
                UI.renderAnalytics();
                break;
            case 'reports':
                // No special rendering needed
                break;
            case 'settings':
                UI.renderCategories();
                break;
        }
    },

    refreshCurrentPage() {
        this.navigate(State.currentPage);
    }
};

// ===== START APPLICATION =====
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// ===== PWA SERVICE WORKER REGISTRATION =====
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('SW registered:', registration.scope);
            })
            .catch(error => {
                console.log('SW registration failed:', error);
            });
    });
}
