# TESTER AUDIT REPORT — ITI PROJECT MANAGER

Tanggal audit: 2026-05-21
Basis file: ITI-Project-Manajer-BugHunter-Layout-KPI-Fixed.zip
Mode audit: Frontend LocalStorage, React + Vite

## Hasil Utama

Build production berhasil dijalankan dengan `npm run build`. Tidak ditemukan error sintaks atau kegagalan bundling setelah perbaikan.

## Bug / Risiko yang Ditemukan dan Diperbaiki

### 1. Transfer owner project terlalu longgar untuk Admin/Moderator
**Masalah:** Di modal edit project, Admin/Moderator yang menjadi owner dapat melihat field `Owner Project` dan berpotensi memindahkan ownership project ke orang lain. Ini rawan karena standar role menyatakan ownership project adalah kontrol penting dan pemindahan ownership sebaiknya hanya dilakukan oleh SUPERADMIN atau flow khusus.

**Perbaikan:** Field `Owner Project` sekarang hanya tampil untuk SUPERADMIN. Admin/Moderator tetap dapat mengelola anggota project miliknya, tetapi tidak bisa transfer owner langsung dari modal.

### 2. Menu Tugas Saya belum punya pagination
**Masalah:** Menu Tugas Saya hanya menampilkan 12 task pertama. Jika user memiliki banyak task, sisanya tidak bisa diakses dari halaman itu.

**Perbaikan:** Ditambahkan pagination 12 task per halaman, lengkap dengan indikator jumlah data dan tombol halaman.

### 3. Menu Deadline belum punya pagination yang jelas
**Masalah:** Deadline page mengambil maksimal 30 item dan tidak memberi navigasi halaman. Pada data banyak, deadline di luar limit sulit diakses.

**Perbaikan:** Ditambahkan pagination 12 deadline per halaman. Saat user memilih tanggal di kalender, pagination mengikuti daftar deadline tanggal tersebut.

### 4. Quick Action “Buat Deadline Task” masih muncul untuk role yang tidak punya akses
**Masalah:** Tombol cepat pada sidebar Deadline dapat muncul walau role tidak punya project yang bisa diberi deadline/task, terutama pada USER.

**Perbaikan:** Tombol cepat “Buat Deadline Task” sekarang hanya muncul jika user aktif memiliki minimal satu project yang boleh ditambahkan task/deadline berdasarkan permission.

### 5. Review proof mengambil submission pertama, bukan submission terbaru yang dihitung sistem
**Masalah:** Fungsi review sudah mengecek latest submission menggunakan sorter, tetapi saat update data masih memakai index pertama. Jika data lama atau restore backup punya urutan submission tidak rapi, reviewer bisa mengubah submission yang salah.

**Perbaikan:** Update review sekarang menargetkan submission berdasarkan `latest.id`. Jika ID tidak ada, baru fallback ke index pertama.

## Area yang Diperiksa

- Build React/Vite.
- Permission role dasar: SUPERADMIN, ADMIN, MODERATOR, USER.
- Project ownership dan manager.
- Task submit → review → verified/rejected.
- Progress berdasarkan verified task.
- Notifikasi berbasis localStorage.
- Pagination project/task/deadline.
- File action: open, print, download.
- Mobile layout dan workspace tab.

## Catatan Tester

Aplikasi masih berbasis localStorage, jadi beberapa fitur seperti password, email notification, dan file besar hanya simulasi frontend. Untuk produksi, fitur tersebut perlu backend, database, auth, dan storage file sungguhan.

