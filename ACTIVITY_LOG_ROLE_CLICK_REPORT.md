# Activity Log Role & Click Fix Report

## Fokus Revisi
Revisi ini memperbaiki dua masalah utama pada menu Activity Log:

1. Item activity di tabel Activity Log belum bisa diklik untuk melihat detail aktivitas.
2. Activity Log belum mengikuti hirarki role secara ketat.

## Perubahan yang Diterapkan

### 1. Activity Log Bisa Diklik
- Setiap baris activity sekarang bisa diklik.
- Klik baris membuka modal **Detail Activity**.
- Modal menampilkan:
  - waktu aktivitas
  - aktor
  - role aktor
  - aksi
  - detail aktivitas
  - project terkait jika ada
  - task terkait jika ada
- Jika activity memiliki `projectId` / `taskId`, modal menyediakan tombol **Buka Project/Task**.

### 2. Filter Activity Log Berdasarkan Hirarki Role
Aturan yang diterapkan:

- **SUPERADMIN** dapat melihat semua activity log.
- **ADMIN** tidak dapat melihat activity yang dibuat oleh SUPERADMIN.
- **MODERATOR** tidak dapat melihat activity yang dibuat oleh ADMIN dan SUPERADMIN.
- Role tetap dapat melihat activity miliknya sendiri.
- Activity yang terkait project tetap dibatasi oleh project yang bisa diakses oleh role tersebut.
- Activity global tanpa project hanya tampil jika aktornya sesuai hirarki role yang boleh dilihat.

### 3. Export CSV Disesuaikan
Export Activity Log sekarang menambahkan kolom:
- Waktu
- Aktor
- Role Aktor
- Aksi
- Detail
- Project
- Task

### 4. UX Detail Activity
- Ditambahkan tampilan modal detail yang compact.
- Baris activity tetap terlihat rapi dan clickable.
- Activity global tetap bisa diklik untuk melihat detail, meskipun tidak membuka project.

## Build Test
Perintah yang dijalankan:

```bash
npm install
npm run build
```

Hasil: **berhasil**.
