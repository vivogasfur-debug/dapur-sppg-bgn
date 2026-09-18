---
Task ID: 1
Agent: Main Agent
Task: Update CSV import and Excel export for 3B Balita new fields

Work Log:
- Read all relevant files (API route, MainApp.tsx, import-csv route)
- Confirmed interface, API, form, table already support Balita fields (tempatLahir, alamat, namaOrtu, BB, TB, LK, LL)
- Updated CSV import (import-csv/route.ts) to map Balita-specific fields: tempat_lahir, alamat, nama_orang_tua, berat_badan, tinggi_badan, lingkar_kepala, lingkar_lengan
- Updated Excel export (MainApp.tsx) to separate Balita sheet with specific columns: No, Nama Anak, NIK, JK, Tempat Lahir, Tanggal Lahir, Umur, Nama Orang Tua, Alamat, BB, TB, LK, LL, Posyandu, Alergi
- Bumil/Busui export remains separate with their own columns
- Pushed to GitHub (commit 7a15b78)

Stage Summary:
- CSV import now supports all Balita fields with flexible header matching
- Excel export creates separate Balita sheet with 15 columns including Umur (auto-calculated)
- Bumil/Busui export separated into its own sheet with original columns

---
Task ID: 2
Agent: Main Agent
Task: Implement period-based data separation (Option A) + Migration check UI

Work Log:
- Verified 003-pm-periods.sql exists at /home/z/my-project/supabase-migrations/003-pm-periods.sql
- SQL migration creates pm_periods table + adds period_id FK to students, teachers, beneficiaries_3b
- Verified pm-periods/route.ts already has full CRUD + set_active + copy_data + generate_more
- Verified all data routes (students, teachers, beneficiaries-3b) already have period_id filtering
- Verified import-csv/route.ts already handles period_id with period-scoped dedup
- Verified RekapitulasiPmModule passes activePeriodId for period-scoped rekap
- Created /api/check-migration endpoint to detect if pm_periods table exists in Supabase
- Added migration banner UI in MainApp.tsx with:
  - AlertTriangle warning banner
  - Full SQL displayed in dark code block
  - Copy-to-clipboard button for SQL
  - "Salin SQL & Jalankan di Supabase" button
  - "Sudah Dijalankan" button (dismisses banner and refreshes periods)
  - Close banner option
- Updated export-excel/route.ts to support period_id filtering for all export types
- Added Database, ClipboardCopy, AlertTriangle icons to MainApp.tsx

Stage Summary:
- Period system code is fully implemented in the project
- The only missing step is running the SQL migration in Supabase Dashboard
- Migration banner will auto-detect if pm_periods is missing and show instructions
- All API routes support period_id: students, teachers, beneficiaries-3b, rekap-pm, export-excel, import-csv
- MainApp.tsx has period selector, copy-from-previous-period button, and period-scoped data display
