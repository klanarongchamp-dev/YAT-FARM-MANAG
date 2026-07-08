# YAT FARM MANAGER - TODO

## Phase 1: Database Schema & Backend API
- [x] Create sensor_readings table (temperature, humidity, soil_moisture, light, device_id, timestamp)
- [x] Create devices table (id, name, type, status, mode, last_seen)
- [x] Create schedules table (id, device_id, time, duration, enabled)
- [x] Create finance_transactions table (id, type, category, amount, date, note, user_id)
- [x] Create yields table (id, crop_name, kg, grade, price_per_kg, total_value, date, note, user_id)
- [x] Create activity_logs table (id, user_id, action, detail, timestamp)
- [x] Create alerts table (id, type, message, threshold, is_read, triggered_at)
- [x] Run DB migration via webdev_execute_sql
- [x] tRPC router: sensor (postReading, getLatest, getHistory)
- [x] tRPC router: device (getAll, updateStatus, setMode)
- [x] tRPC router: schedule (getAll, create, update, delete)
- [x] tRPC router: finance (getTransactions, createTransaction, deleteTransaction, getYields, createYield, deleteYield, getSummary)
- [x] tRPC router: users (getAll, updateRole, deleteUser) - admin only
- [x] tRPC router: activityLog (getAll, create)
- [x] tRPC router: alerts (getAll, markRead, getUnreadCount)
- [x] Public REST endpoint POST /api/sensor for ESP8266
- [x] Public REST endpoint GET /api/device/:deviceId/command for ESP8266 pump polling

## Phase 2: Frontend - Dashboard & IoT Control
- [x] Setup FarmDashboardLayout with sidebar navigation (Thai labels)
- [x] Apply green farm theme with Dark Mode support (CSS variables)
- [x] Dashboard page: 4 sensor cards (temp, humidity, soil, light) with real-time polling
- [x] Dashboard page: historical charts using recharts (line chart per sensor)
- [x] Dashboard page: device status overview card
- [x] Pump Control page: toggle ON/OFF button, Auto/Manual mode selector
- [x] Pump Control page: schedule list with add/edit/delete
- [x] Pump Control page: schedule form (time, duration, enabled toggle)

## Phase 3: Frontend - Finance, Users, Logs, Alerts
- [x] Finance page: summary cards (income, expense, profit)
- [x] Finance page: transaction list
- [x] Finance page: add/delete transaction form (income/expense with Thai categories)
- [x] Finance page: yield tracking with Grade A / Grade B distinction
- [x] User Management page (admin only): user list with role badges
- [x] User Management page: change role (admin/user), delete user
- [x] Activity Log page: log list with timestamp, action, user
- [x] Alerts page: unread badge on nav, list of alerts, mark as read

## Phase 4: PWA, Dark Mode, Responsive & ESP8266
- [x] PWA manifest.json
- [x] Dark mode toggle in sidebar
- [x] Responsive layout: mobile drawer + desktop sidebar
- [x] Write ESP8266 .ino firmware (DHT22, soil moisture, relay, HTTP POST JSON)
- [x] ESP8266: WiFi auto-reconnect using millis()
- [x] ESP8266: JSON payload with deviceId, temperature, humidity, soilMoisture, light

## Phase 5: Tests & Delivery
- [x] Vitest: sensor router tests (3 tests)
- [x] Vitest: finance router tests (5 tests)
- [x] Vitest: auth/user/device/alerts router tests (12 tests)
- [x] Total: 20 tests passing
- [x] Final screenshot verification (all 6 pages confirmed working)
- [x] Checkpoint saved
- [x] ESP8266 Arduino sketch documented
