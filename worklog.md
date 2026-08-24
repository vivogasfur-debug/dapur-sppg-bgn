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
