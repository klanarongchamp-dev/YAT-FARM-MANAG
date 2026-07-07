// dashboard.js - Data Aggregation & Analytics
import { getTodayRange, getMonthRange } from './utils.js';

export const calculateSummary = (data) => {
    const today = getTodayRange();
    const month = getMonthRange();
    
    const summary = {
        totalIncome: 0,
        totalExpense: 0,
        outstanding: 0,
        paid: 0,
        netProfit: 0,
        todayIncome: 0,
        todayExpense: 0,
        monthlyProfit: 0
    };
    
    data.forEach(item => {
        const amount = parseFloat(item.total) || 0;
        
        // Totals
        if (item.type === 'income') {
            summary.totalIncome += amount;
            if (item.status === 'paid') summary.paid += amount;
            else summary.outstanding += amount;
            
            // Today
            if (item.date >= today.start && item.date <= today.end) {
                summary.todayIncome += amount;
            }
            
            // Monthly
            if (item.date >= month.start && item.date <= month.end) {
                summary.monthlyProfit += amount;
            }
        } else {
            summary.totalExpense += amount;
            
            // Today
            if (item.date >= today.start && item.date <= today.end) {
                summary.todayExpense += amount;
            }
            
            // Monthly
            if (item.date >= month.start && item.date <= month.end) {
                summary.monthlyProfit -= amount;
            }
        }
    });
    
    summary.netProfit = summary.totalIncome - summary.totalExpense;
    
    return summary;
};
