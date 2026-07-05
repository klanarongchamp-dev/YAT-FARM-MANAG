# Farm Dashboard - ระบบจัดการรายรับรายจ่ายฟาร์ม

เว็บแอป Dashboard สำหรับจัดการข้อมูลรายรับรายจ่ายของฟาร์ม แบบ Single Page Application (SPA)

## ฟีเจอร์

### V1 (MVP)
- Dashboard แบบ Card UI ทันสมัย (Modern Clean UI)
- แสดงข้อมูล: รายรับ, รายจ่าย, เงินค้างรับ, รับเงินแล้ว, ผลผลิตรวม
- CRUD: เพิ่ม/แก้ไข/ลบ รายการ
- เก็บข้อมูลด้วย LocalStorage (ถาวรในเครื่อง)
- Responsive ใช้ได้ทั้งมือถือและ Desktop
- Filter ข้อมูลตามประเภท
- ไม่มี backend ทำงานฝั่ง Frontend ทั้งหมด

### V2 (Advanced)
- กราฟรายรับ/รายจ่าย/กำไร (Bar, Line, Pie Chart)
- กราฟแนวโน้มรายเดือน
- Search & Filter ตามวันที่/ประเภท/สถานะ
- Export Excel (.xlsx), PDF Report, CSV
- กำไรสุทธิ, Top รายรับ, Top รายจ่าย
- สรุปข้อมูลรายเดือน
- Backup & Restore ข้อมูล

## โครงสร้างไฟล์

```
farm-dashboard/
├── index.html          # หน้าหลัก (SPA)
├── style.css           # สไตล์ทั้งหมด
├── app.js              # JavaScript ทั้งหมด
├── manifest.json       # PWA Manifest
├── service-worker.js   # Service Worker สำหรับ offline
└── README.md           # คู่มือการใช้งาน
```

## การใช้งาน

### ใช้งานทันที
1. เปิดไฟล์ `index.html` ในเบราว์เซอร์
2. หรือใช้ Python: `python3 -m http.server 3000`
3. หรือใช้ Node.js: `npx serve .`

### Deploy บน GitHub Pages
1. สร้าง Repository ใหม่บน GitHub
2. Push ไฟล์ทั้งหมดขึ้น
3. ไปที่ Settings > Pages > เลือก Branch: main > Save
4. ระบบจะพร้อมใช้งานทันที

### ติดตั้งเป็น PWA
1. เปิดเว็บแอปในเบราว์เซอร์ (Chrome/Safari)
2. iPhone: กด Share > Add to Home Screen
3. Android: กด Menu > Install App
4. ใช้ได้แม้ไม่มีอินเทอร์เน็ต (Offline)

## เทคโนโลยี

- HTML5 + CSS3 + Vanilla JavaScript
- LocalStorage สำหรับเก็บข้อมูล
- PWA (Progressive Web App)
- Canvas API สำหรับกราฟ
- ไม่ต้องมี Backend/Server
- ไม่ต้องติดตั้งอะไรเพิ่ม

## ลิงก์ที่เกี่ยวข้อง

- [Google Fonts - Inter](https://fonts.google.com/specimen/Inter)
- [Can I Use PWA](https://caniuse.com/?search=pwa)

## License

MIT License
