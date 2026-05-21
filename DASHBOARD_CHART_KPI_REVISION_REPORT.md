# Dashboard Chart & KPI Revision Report

## Revisi yang diterapkan

1. Grafik `Aktivitas Proyek Kampus` di dashboard diganti dari area/line chart menjadi grouped bar chart seperti referensi kedua.
   - Menampilkan 3 kategori: Aktif, Review, dan Selesai.
   - Ada nilai per bulan di atas bar.
   - Ada legenda ringkas di bagian bawah.
   - Area chart dibuat lebih padat agar tidak menyisakan ruang kosong berlebihan.

2. KPI cards bagian atas yang sebelumnya terasa kosong diisi dengan insight kecil.
   - Total Project dan Total Task memakai mini sparkline.
   - Task Berjalan, Dalam Review, dan Lewat Deadline memakai mini progress indicator.
   - Ditambahkan teks perbandingan `vs bulan lalu` agar card terasa informatif.

3. Tampilan dashboard tetap mempertahankan warna identitas ITI.
   - Orange sebagai warna utama.
   - Navy untuk teks utama.
   - Biru untuk selesai/indikator pendukung.
   - Kuning untuk review.

## Build Test

Perintah yang dijalankan:

```bash
npm install
npm run build
```

Hasil: build berhasil.
