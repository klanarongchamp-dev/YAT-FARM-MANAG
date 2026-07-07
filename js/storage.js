// storage.js - Export Functionality
import { formatCurrency, formatDateTime } from './utils.js';

export const exportToCSV = (data) => {
    const headers = ['วันที่', 'ประเภท', 'ผลผลิต', 'เกรด', 'น้ำหนัก(กก.)', 'ราคา/หน่วย', 'ยอดรวม', 'สถานะ', 'หมายเหตุ'];
    const rows = data.map(d => [
        formatDateTime(d.date),
        d.type === 'income' ? 'รายรับ' : 'รายจ่าย',
        d.crop || '-',
        d.grade || '-',
        d.kg || 0,
        d.price || 0,
        d.total || 0,
        d.status === 'paid' ? 'ชำระแล้ว' : 'ค้างชำระ',
        d.note || '-'
    ]);
    
    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += headers.join(",") + "\n";
    rows.forEach(row => {
        csvContent += row.map(cell => `"${cell}"`).join(",") + "\n";
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `farm_report_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const printPDF = () => {
    window.print();
};
