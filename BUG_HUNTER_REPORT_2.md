# Bug Hunter Report 2 - Workspace Tabs & Detail Task

Tanggal audit: 2026-05-20
Basis revisi: `ITI-Project-Manajer-BugHunter-Audit-Fixed.zip`

## Masalah utama yang ditemukan

### 1. Workspace tab Backlog / Review / Selesai membesar pada role Moderator/User
**Gejala:** Saat role Moderator/User membuka menu Tugas Berjalan lalu klik Detail, aplikasi masuk ke Workspace Project. Di tampilan itu tab Backlog, Review, dan Selesai bisa terlihat terlalu besar/lebar dan kurang nyaman, terutama di layar kecil atau ketika isi task yang terlihat role tersebut hanya sedikit.

**Penyebab:** Ada beberapa batch CSS lama yang menimpa style workspace tabs. Pada breakpoint mobile, `.workspace-tabs` sempat dibuat horizontal-scroll dengan border radius sangat besar dan padding yang relatif besar. Karena detail task dari menu Tugas membawa user ke workspace dengan `highlightedTaskId`, tab tetap tampil dalam mode workspace penuh.

**Perbaikan:**
- Menambahkan class khusus `iti-workspace-page` dan `is-task-focus`.
- Workspace tabs dibuat compact dengan grid 3 kolom: Backlog, Review, Selesai.
- Ukuran tombol, counter, padding, dan font diperkecil agar tidak membesar.
- Pada mobile, tabs tetap 3 kolom dan tidak lagi membentuk tombol besar horizontal yang mengganggu.

### 2. Klik Detail dari menu Tugas belum langsung membuka modal detail task
**Gejala:** Dari menu Tugas, tombol detail mengarahkan ke workspace dan highlight task, tetapi user masih melihat tab workspace dulu. Ini terasa tidak langsung sebagai “detail”.

**Perbaikan:**
- Saat `highlightedTaskId` diterima oleh Workspace, aplikasi sekarang otomatis membuka modal Detail Task.
- Workspace tetap terbuka di belakang modal, tab tetap menyesuaikan status task, dan task tetap di-highlight.

### 3. Tombol Detail task muncul ganda di task card workspace
**Gejala:** Di dalam card task workspace ada tombol Detail dua kali. Ini membuat action row lebih padat dan bisa memperburuk tampilan mobile.

**Perbaikan:**
- Menghapus tombol Detail duplikat.
- Action row task menjadi lebih ringkas: Detail, Verified/Reject, Submit Bukti, Buka Ulang, Hapus sesuai izin.

## Area lain yang dicek ulang

- Build production berhasil.
- Render workspace task tidak crash setelah perubahan auto modal.
- Layout mobile masih memakai bottom navigation.
- Workspace tetap memakai tab Backlog / Review / Selesai, tetapi sekarang lebih kecil dan rapi.
- Role User tetap hanya melihat task yang bisa dia akses.
- Role Moderator tetap bisa membuka detail task yang bisa dia akses.

## Test build

Perintah yang dijalankan:

```bash
npm install
npm run build
```

Hasil: berhasil.
