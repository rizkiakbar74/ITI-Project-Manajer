# Dashboard Visual Real Data + Demo Scale Revision

Tanggal revisi: 21 Mei 2026

## Fokus revisi
Revisi ini hanya menyentuh area tampilan Dashboard dan data demo. Mekanisme inti aplikasi tidak diubah.

## Yang diperbaiki

### 1. Grafik Aktivitas Proyek Kampus
- Tetap memakai data real dari aplikasi.
- Data dihitung dari project/task yang bisa dilihat role aktif.
- Series tetap:
  - Aktif
  - Review
  - Selesai
- Periode tetap:
  - 1 Bulan Terakhir
  - 3 Bulan Terakhir
  - 6 Bulan Terakhir
  - 12 Bulan Terakhir
- Tampilan bar chart diperbaiki agar batang benar-benar terlihat tinggi sesuai nilai real, bukan hanya garis kecil di bawah.
- Legenda bawah dibuat lebih rapi dan mudah dibaca.

### 2. KPI Cards Dashboard
- Total Project tetap memakai sparkline dari jumlah project real per bulan.
- Total Task tetap memakai sparkline dari jumlah task real per bulan.
- Task Berjalan, Dalam Review, dan Lewat Deadline tetap memakai progress kecil berdasarkan persentase real dari total task visible.
- Layout KPI cards dibuat lebih padat dan tidak kosong.
- Teks KPI, sparkline, progress, dan footer disusun ulang agar tidak pecah dan tidak berantakan.

### 3. Data demo besar
- Data demo diperbesar menjadi 560 project.
- Setiap project memiliki 1-3 task.
- Total task demo berada dalam rentang 500-1000 task.
- Data demo disebar dalam periode 24 bulan untuk simulasi performa 1-2 tahun.
- Status task demo dibuat bervariasi: open/aktif, submitted/review, dan approved/selesai.
- Data demo tetap kompatibel dengan role, localStorage, backup/restore, submit, review, verified, deadline, notifikasi, dan activity log.

## Mekanisme yang tidak diubah
- Role permission.
- Project/task ownership.
- Submit bukti.
- Review, reject, verified checked.
- Notifikasi.
- Activity log.
- Deadline.
- Arsip.
- Backup/restore.
- LocalStorage.
- User switcher demo.

## Build Test
Build berhasil dijalankan dengan:

```bash
npm install
npm run build
```
