# BUG HUNTER REPORT 3

Tanggal audit: 2026-05-20
Basis revisi: ITI-Project-Manajer-BugHunter-Tabs-Detail-Fixed.zip

## Bug yang ditemukan dari screenshot user

### 1. Workspace tab Backlog / Review / Selesai melebar tinggi saat ada task berjalan
**Gejala:** area tab Backlog/Review/Selesai menjadi kotak kosong tinggi/lebar dan tidak enak dilihat, terutama pada role Moderator/User saat masuk detail task/project.

**Penyebab:** parent layout `iti-workspace-layout` dan `iti-workspace-main` masih mengikuti perilaku CSS grid default `align-items/stretch` dan `align-content/stretch`. Ketika panel kanan lebih tinggi, row tab ikut melar sehingga area tab terlihat seperti kotak kosong besar.

**Perbaikan:**
- `iti-workspace-layout` dipaksa `align-items: start`.
- `iti-workspace-main` dipaksa `align-content: start` dan `grid-auto-rows: max-content`.
- `workspace-tabs` diberi `align-self: start`, `height:auto`, dan `min-height:0`.
- `workspace-task-list` dan `iti-side-stack` dibuat tidak ikut stretch.

### 2. Dokumen terkait melebar turun dan nama file pecah vertikal
**Gejala:** nama file seperti `brief-submit` turun per huruf di panel kanan Dokumen Terkait.

**Penyebab:** file row di sidebar terlalu sempit karena grid file masih memakai kolom tombol di kanan, lalu aturan `overflow-wrap:anywhere` membuat nama file pecah per karakter.

**Perbaikan:**
- Untuk file di `iti-side-stack`, layout file dipaksa satu kolom agar tidak memeras nama file.
- Tombol Open/Print/Download di sidebar dibuat full-width dan turun rapi.
- Nama file memakai `word-break: normal` + `overflow-wrap: break-word`, bukan pecah agresif per huruf.

### 3. KPI Project berubah angka saat filter diklik
**Gejala:** saat klik `Berjalan`, `Review`, `Selesai`, atau `Lewat Deadline`, nilai `Total Project` ikut berubah mengikuti hasil filter. Contoh header awal 321, setelah klik Berjalan total berubah menjadi 3.

**Penyebab:** kartu `Total Project` memakai `visible.length`, padahal `visible` adalah data setelah filter status aktif.

**Perbaikan:**
- `Total Project` sekarang memakai `baseProjects.length`, yaitu total project sesuai role/search sebelum filter status.
- Filter status tetap bekerja untuk list project, tapi KPI total tidak berubah-ubah karena klik filter.

### 4. KPI Tugas berpotensi memiliki bug yang sama
**Gejala potensial:** di menu Tugas, angka total/aktif/review/selesai bisa ikut berubah berdasarkan filter status aktif.

**Penyebab:** statistik dihitung dari `items`, padahal `items` sudah difilter oleh status.

**Perbaikan:**
- Ditambahkan `baseItems` sebagai sumber statistik utama.
- List tetap memakai `items` yang terfilter.
- KPI `Semua Tugas`, `Aktif`, `Perlu Review`, `Selesai`, dan `Terlambat` dihitung dari `baseItems`.
- Produktivitas juga dihitung dari `baseItems`, bukan data hasil filter.

## Hasil test

- `npm install` berhasil.
- `npm run build` berhasil.
- Tidak ada error build Vite.

## Catatan

Perbaikan ini fokus pada bug yang terlihat di screenshot dan bug turunan di KPI Tugas yang mekanismenya mirip. Struktur permission dan localStorage tetap dipertahankan.
