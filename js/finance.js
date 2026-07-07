// finance.js - Transaction Management
import { saveTransaction, deleteTransaction, updateTransactionStatus } from './firebase.js';

export const addEntry = async (formData) => {
    const { type, crop, grade, kg, price, status, note } = formData;
    const total = parseFloat(kg) * parseFloat(price);
    
    const transaction = {
        type,
        crop,
        grade,
        kg: parseFloat(kg),
        price: parseFloat(price),
        total,
        status, // 'paid' or 'outstanding'
        note,
        date: Date.now()
    };
    
    return await saveTransaction(transaction);
};

export const removeEntry = async (id) => {
    if (confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) {
        await deleteTransaction(id);
    }
};

export const markAsPaid = async (id) => {
    await updateTransactionStatus(id, 'paid');
};

export const filterTransactions = (data, filters) => {
    return data.filter(item => {
        const matchType = !filters.type || filters.type === 'all' || item.type === filters.type;
        const matchStatus = !filters.status || filters.status === 'all' || item.status === filters.status;
        const matchDate = (!filters.start || item.date >= filters.start) && 
                          (!filters.end || item.date <= filters.end);
        const matchSearch = !filters.query || 
                           (item.crop && item.crop.includes(filters.query)) || 
                           (item.note && item.note.includes(filters.query));
        
        return matchType && matchStatus && matchDate && matchSearch;
    }).sort((a, b) => b.date - a.date);
};
