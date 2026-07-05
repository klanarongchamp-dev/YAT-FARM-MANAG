# สวนลุงนะ - Smart Farm Dashboard

ระบบจัดการรายรับรายจ่ายและผลผลิตฟาร์มอัจฉริยะ แบบ Single Page Application

## ฟีเจอร์

### V1 (MVP)
- Dashboard Card UI แสดงรายรับ/รายจ่าย/กำไรสุทธิ/ผลผลิตรวม
- CRUD ครบ: เพิ่ม/แก้ไข/ลบ รายการเงินและผลผลิต
- ระบบผลผลิต Grade A/B พร้อมคำนวณมูลค่า
- เก็บข้อมูลด้วย LocalStorage (ถาวรในเครื่อง)
- Responsive ใช้ได้ทั้งมือถือและ Desktop

### V2 (Advanced)
- กราฟวิเคราะห์ 4 ประเภท (รายรับvsรายจ่าย, กำไรสุทธิ, ผลผลิต, แนวโน้ม)
- Search & Filter ค้นหา/กรองตามวันที่/ประเภท/หมวดหมู่
- Export Excel, PDF Report, CSV
- สรุปข้อมูลรายเดือน 12 เดือนย้อนหลัง
- Backup & Restore ข้อมูล JSON
- PWA ติดตั้งได้ทั้ง iPhone และ Android

## การใช้งาน

1. เปิดไฟล์ `index.html` ในเบราว์เซอร์โดยตรง
2. หรือ Deploy ขึ้น GitHub Pages

## Deploy บน GitHub Pages

```bash
# สร้าง repository ใหม่ (หรือใช้ที่มีอยู่)
git init
git add .
git commit -m "สวนลุงนะ Smart Farm Dashboard"
git branch -M main
git remote add origin https://github.com/username/suan-lung-na.git
git push -u origin main

# เปิด Settings > Pages > เลือก branch main > กด Save
```

## ลัดกดปุ่ม
- `Ctrl + N` = เพิ่มรายการเงิน
- `Esc` = ปิด modal

## ไฟล์ทั้งหมด

| ไฟล์ | หน้าที่ |
|------|--------|
| `index.html` | โครงสร้างหน้าหลัก SPA |
| `style.css` | สไตล์ Modern SaaS Dashboard |
| `app.js` | ลอจิกทั้งหมด (CRUD, กราฟ, Export, PWA) |
| `manifest.json` | PWA manifest |
| `service-worker.js` | Offline support |
| `icon-192.png` | ไอคอน PWA 192px |
| `icon-512.png` | ไอคอน PWA 512px |
| `logo.png` | โลโก้สวนลุงนะ |
