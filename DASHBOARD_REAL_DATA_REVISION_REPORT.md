# Dashboard Real Data Revision Report

## Perubahan utama

1. Grafik `Aktivitas Proyek Kampus` sekarang memakai data real dari aplikasi, bukan angka dummy.
   - Data dihitung dari project/task yang bisa dilihat role aktif.
   - Series grafik: Aktif, Review, Selesai.
   - Data dibucket per bulan untuk 6 bulan terakhir berdasarkan tanggal task/submission/created/deadline.

2. KPI cards dashboard atas sekarang memakai insight yang berasal dari data aplikasi.
   - Total Project memakai sparkline dari jumlah project real per bulan.
   - Total Task memakai sparkline dari jumlah task real per bulan.
   - Task Berjalan, Dalam Review, dan Lewat Deadline memakai progress kecil berdasarkan persentase dari total task visible.

3. Tidak mengubah mekanisme utama aplikasi.
   - Role permission tetap.
   - Submit/review/verified tetap.
   - Notifikasi, deadline, arsip, backup/restore, dan localStorage tetap.

## Build test

`npm install`
`npm run build`

Hasil: berhasil.
