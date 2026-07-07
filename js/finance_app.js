// finance_app.js - Main Application Logic
import { onFinanceUpdate } from './firebase.js';
import { addEntry, removeEntry, markAsPaid, filterTransactions } from './finance.js';
import { updateDashboardUI, updateListUI, showToast } from './ui.js';
import { exportToCSV, printPDF } from './storage.js';

let allData = [];
let currentFilters = {
    type: 'all',
    status: 'all',
    query: '',
    start: null,
    end: null
};

const initApp = () => {
    // 1. Realtime Listener
    onFinanceUpdate((data) => {
        allData = data;
        refreshUI();
    });

    // 2. Event Listeners
    const form = document.getElementById('finance-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = {
                type: document.getElementById('entry-type').value,
                crop: document.getElementById('entry-crop').value,
                grade: document.getElementById('entry-grade').value,
                kg: document.getElementById('entry-kg').value || 0,
                price: document.getElementById('entry-price').value || 0,
                status: document.getElementById('entry-status').value,
                note: document.getElementById('entry-note').value
            };
            
            try {
                await addEntry(formData);
                form.reset();
                showToast('บันทึกข้อมูลเรียบร้อยแล้ว');
            } catch (err) {
                showToast('เกิดข้อผิดพลาดในการบันทึก', 'error');
            }
        });
    }

    // Filters
    document.getElementById('filter-type')?.addEventListener('change', (e) => {
        currentFilters.type = e.target.value;
        refreshUI();
    });

    document.getElementById('filter-status')?.addEventListener('change', (e) => {
        currentFilters.status = e.target.value;
        refreshUI();
    });

    document.getElementById('search-query')?.addEventListener('input', (e) => {
        currentFilters.query = e.target.value;
        refreshUI();
    });

    // Exports
    document.getElementById('btn-export-csv')?.addEventListener('click', () => exportToCSV(filterTransactions(allData, currentFilters)));
    document.getElementById('btn-print-pdf')?.addEventListener('click', () => printPDF());
};

const refreshUI = () => {
    updateDashboardUI(allData);
    const filtered = filterTransactions(allData, currentFilters);
    updateListUI(filtered);
};

// Global exports for inline HTML onclicks
window.app = {
    handleDelete: async (id) => {
        try {
            await removeEntry(id);
            showToast('ลบรายการเรียบร้อย');
        } catch (err) {
            showToast('ลบไม่สำเร็จ', 'error');
        }
    },
    handleMarkPaid: async (id) => {
        try {
            await markAsPaid(id);
            showToast('อัปเดตสถานะชำระเงินแล้ว');
        } catch (err) {
            showToast('อัปเดตไม่สำเร็จ', 'error');
        }
    }
};

document.addEventListener('DOMContentLoaded', initApp);
