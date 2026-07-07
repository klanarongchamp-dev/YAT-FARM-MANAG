// ui.js - UI Updates & Event Handling
import { formatCurrency, formatDateTime } from './utils.js';
import { calculateSummary } from './dashboard.js';
import { generateInsights } from './ai.js';
import { removeEntry, markAsPaid } from './finance.js';

export const updateDashboardUI = (data) => {
    const summary = calculateSummary(data);
    
    document.getElementById('total-income').textContent = formatCurrency(summary.totalIncome);
    document.getElementById('total-expense').textContent = formatCurrency(summary.totalExpense);
    document.getElementById('outstanding-amount').textContent = formatCurrency(summary.outstanding);
    document.getElementById('paid-amount').textContent = formatCurrency(summary.paid);
    document.getElementById('net-profit').textContent = formatCurrency(summary.netProfit);
    
    document.getElementById('today-income').textContent = formatCurrency(summary.todayIncome);
    document.getElementById('today-expense').textContent = formatCurrency(summary.todayExpense);
    document.getElementById('monthly-profit').textContent = formatCurrency(summary.monthlyProfit);
    
    // AI Insights
    const insights = generateInsights(data);
    const aiContainer = document.getElementById('ai-insights');
    aiContainer.innerHTML = insights.map(text => `
        <div class="p-3 bg-blue-500/10 border-l-4 border-blue-500 rounded text-sm mb-2">
            ${text}
        </div>
    `).join('');
};

export const updateListUI = (data) => {
    const listContainer = document.getElementById('finance-list');
    if (data.length === 0) {
        listContainer.innerHTML = '<div class="text-center py-10 text-gray-500">ไม่พบข้อมูลรายการ</div>';
        return;
    }
    
    listContainer.innerHTML = data.map(item => `
        <div class="p-4 border-b border-white/5 hover:bg-white/5 transition-colors flex flex-wrap justify-between items-center gap-4">
            <div class="flex-1 min-w-[200px]">
                <div class="flex items-center gap-2 mb-1">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.type === 'income' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">
                        ${item.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                    </span>
                    <span class="text-xs text-gray-500">${formatDateTime(item.date)}</span>
                </div>
                <div class="font-bold text-lg">${item.crop || 'ทั่วไป'} <span class="text-sm font-normal text-gray-400">${item.grade ? `(เกรด ${item.grade})` : ''}</span></div>
                <div class="text-xs text-gray-400">${item.kg ? `${item.kg} กก. x ${item.price} บาท | ` : ''}${item.note || '-'}</div>
            </div>
            
            <div class="text-right">
                <div class="font-bold text-xl ${item.type === 'income' ? 'text-green-400' : 'text-red-400'}">
                    ${item.type === 'income' ? '+' : '-'}${formatCurrency(item.total)}
                </div>
                <div class="flex items-center justify-end gap-2 mt-2">
                    ${item.type === 'income' && item.status === 'outstanding' ? `
                        <button onclick="window.app.handleMarkPaid('${item.id}')" class="text-[10px] bg-blue-600 px-2 py-1 rounded text-white hover:bg-blue-500">
                            ยืนยันการรับเงิน
                        </button>
                    ` : `
                        <span class="text-[10px] ${item.status === 'paid' ? 'text-green-500' : 'text-yellow-500'}">
                            ${item.status === 'paid' ? 'ชำระแล้ว' : 'ค้างชำระ'}
                        </span>
                    `}
                    <button onclick="window.app.handleDelete('${item.id}')" class="text-gray-500 hover:text-red-500 transition-colors">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
};

export const showToast = (msg, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full text-white shadow-2xl z-[1000] animate-bounce ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
};
