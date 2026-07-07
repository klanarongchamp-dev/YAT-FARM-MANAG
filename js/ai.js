// ai.js - Data-Driven Insights
import { getTodayRange } from './utils.js';

export const generateInsights = (data) => {
    if (!data || data.length === 0) return ["เริ่มบันทึกข้อมูลเพื่อรับการวิเคราะห์จาก AI"];
    
    const insights = [];
    const today = getTodayRange();
    const incomeItems = data.filter(d => d.type === 'income');
    const expenseItems = data.filter(d => d.type === 'expense');
    
    // 1. Outstanding Check
    const outstanding = incomeItems.filter(d => d.status === 'outstanding');
    if (outstanding.length > 0) {
        const totalOut = outstanding.reduce((sum, d) => sum + d.total, 0);
        insights.push(`⚠️ มียอดค้างชำระ ${outstanding.length} รายการ รวม ${totalOut.toLocaleString()} บาท ควรติดตามการเรียกเก็บเงิน`);
    }
    
    // 2. Today's Performance
    const todayIncome = incomeItems.filter(d => d.date >= today.start).reduce((sum, d) => sum + d.total, 0);
    const avgDailyIncome = incomeItems.length > 0 ? incomeItems.reduce((sum, d) => sum + d.total, 0) / 30 : 0; // Rough 30-day avg
    
    if (todayIncome > avgDailyIncome && todayIncome > 0) {
        insights.push(`🚀 รายได้วันนี้สูงกว่าค่าเฉลี่ย! (${todayIncome.toLocaleString()} บาท)`);
    }
    
    // 3. Best Selling Crop
    if (incomeItems.length > 0) {
        const crops = {};
        incomeItems.forEach(d => {
            crops[d.crop] = (crops[d.crop] || 0) + d.total;
        });
        const bestCrop = Object.keys(crops).reduce((a, b) => crops[a] > crops[b] ? a : b);
        insights.push(`💎 ผลผลิตที่ทำรายได้สูงสุดคือ: ${bestCrop}`);
    }
    
    // 4. Most Profitable Grade
    if (incomeItems.length > 0) {
        const grades = {};
        incomeItems.forEach(d => {
            const key = `${d.crop} (${d.grade})`;
            grades[key] = (grades[key] || 0) + d.total;
        });
        const bestGrade = Object.keys(grades).reduce((a, b) => grades[a] > grades[b] ? a : b);
        insights.push(`⭐ เกรดผลผลิตที่ทำกำไรดีที่สุด: ${bestGrade}`);
    }
    
    // 5. Expense Warning
    const lastWeek = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const thisWeekExpenses = expenseItems.filter(d => d.date >= lastWeek).reduce((sum, d) => sum + d.total, 0);
    const prevWeekExpenses = expenseItems.filter(d => d.date < lastWeek && d.date >= (lastWeek - 7 * 24 * 60 * 60 * 1000)).reduce((sum, d) => sum + d.total, 0);
    
    if (thisWeekExpenses > prevWeekExpenses && prevWeekExpenses > 0) {
        insights.push(`📉 รายจ่ายสัปดาห์นี้เพิ่มขึ้นเมื่อเทียบกับสัปดาห์ก่อน (${((thisWeekExpenses/prevWeekExpenses - 1)*100).toFixed(1)}%)`);
    }

    return insights;
};
