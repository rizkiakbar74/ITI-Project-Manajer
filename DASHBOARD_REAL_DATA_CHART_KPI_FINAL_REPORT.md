# Dashboard Real Data Chart + KPI Final Report

Tanggal: 21 Mei 2026

## Fokus Revisi
Revisi hanya dilakukan pada tampilan Dashboard, khususnya:
- Grafik Aktivitas Proyek Kampus
- KPI cards bagian atas

Mekanisme inti aplikasi tidak diubah: role permission, project/task, submit bukti, review, verified checked, notifikasi, activity log, deadline, arsip, backup/restore, dan localStorage tetap memakai alur sebelumnya.

## Perubahan Grafik Aktivitas Proyek Kampus
- Grafik diubah menjadi grouped bar chart dengan data real dari aplikasi.
- Data dihitung dari project dan task yang dapat dilihat oleh role aktif.
- Series grafik:
  - Aktif
  - Review
  - Selesai
- Ditambahkan pilihan periode:
  - 1 Bulan Terakhir
  - 3 Bulan Terakhir
  - 6 Bulan Terakhir
  - 12 Bulan Terakhir
- Tinggi bar dihitung dari data real dan diskalakan otomatis berdasarkan nilai terbesar pada periode aktif.
- Label, legend, dan angka di bar mengikuti hasil agregasi data aplikasi.

## Perubahan KPI Cards
- Total Project memakai sparkline real berdasarkan jumlah project per bulan.
- Total Task memakai sparkline real berdasarkan jumlah task per bulan.
- Task Berjalan memakai progress kecil berdasarkan persentase task berjalan dari total task visible.
- Dalam Review memakai progress kecil berdasarkan persentase task review dari total task visible.
- Lewat Deadline memakai progress kecil berdasarkan persentase task lewat deadline dari total task visible.
- Layout KPI dirapikan agar tidak kosong dan tidak terlalu pecah saat layar lebar.

## Build Test
Perintah yang dijalankan:

```bash
npm install
npm run build
```

Hasil: berhasil.
