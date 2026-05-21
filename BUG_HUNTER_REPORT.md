# Bug Hunter Report — ITI Project Manager

Audit dilakukan pada ZIP terakhir: `ITI-Project-Manajer-Audit-Repair-Mobile-Mechanism.zip`.

## Bug kritis yang ditemukan dan diperbaiki

1. **Dashboard runtime error karena variabel tidak ada**
   - Ditemukan pemakaian `baseProjects.length` di dashboard baru, padahal variabel `baseProjects` tidak tersedia di scope tersebut.
   - Dampak: Dashboard berpotensi blank/error saat dibuka.
   - Perbaikan: diganti menjadi `visible.length` agar sesuai data project yang benar-benar terlihat oleh role aktif.

2. **Progress project/institusi bisa salah karena data demo lama**
   - Beberapa submission demo lama tidak punya `status: approved`, sementara task punya `isCompleted`/`completedBy`.
   - Dampak: task yang seharusnya selesai bisa terbaca belum selesai, sehingga progress institusi/project tidak akurat.
   - Perbaikan: dibuat normalisasi data project/task/submission saat load, reset demo, restore backup, dan save storage.

3. **Task yang dibuka ulang tetap dianggap selesai**
   - Penyebab: pengecekan selesai sebelumnya mencari submission approved di seluruh riwayat. Jika task di-reopen, riwayat approved lama masih ada, sehingga task tetap terbaca selesai.
   - Perbaikan: `isTaskFullyCompleted()` sekarang menghormati `reviewStatus`. Status `reopened`, `submitted`, `rejected`, dan `open` tidak dianggap selesai.

4. **Task bisa diverifikasi tanpa bukti submit dari halaman Tugas**
   - Tombol verified di menu Tugas sebelumnya bisa muncul untuk task yang belum punya bukti baru.
   - Dampak: alur Submit → Review → Verified bisa dilompati.
   - Perbaikan: verified checked sekarang hanya bisa dilakukan jika submission terbaru berstatus `submitted`.

5. **Bukti yang sudah direject/approved masih bisa direview ulang**
   - Perbaikan: tombol review dan fungsi review sekarang hanya menerima submission terbaru dengan status `submitted`.

6. **File upload tidak persist setelah refresh**
   - Sebelumnya file hanya memakai `ObjectURL`, sehingga preview/open/download/print hanya aman selama sesi browser.
   - Perbaikan: file kecil disimpan sebagai `dataUrl` di localStorage; Open/Print/Download memakai `dataUrl` jika tersedia. File besar tetap diberi metadata dan preview sesi.

7. **Komentar lama bisa tidak terbaca benar**
   - Beberapa format lama memakai `userId/text`, sementara tampilan baru memakai `createdBy/body`.
   - Perbaikan: normalisasi komentar agar format lama tetap terbaca dan bisa dihapus oleh pihak yang berhak.

8. **Notifikasi submit juga muncul ke submitter sendiri**
   - Karena notifikasi dengan recipient eksplisit tetap dianggap terlihat oleh pembuat aksi.
   - Perbaikan: jika notifikasi punya `userIds`, hanya target recipient yang melihatnya. Notifikasi umum tetap bisa dilihat semua.

9. **Anggota project bisa dihapus walaupun masih punya task aktif**
   - Dampak: task menggantung tanpa assignee/reviewer sesuai aturan final.
   - Perbaikan: edit anggota project sekarang memblokir penghapusan anggota jika masih ada task aktif yang dibuat atau diassign ke anggota tersebut.

10. **Role bisa diturunkan tanpa validasi bawahan/ownership yang cukup**
   - Perbaikan tambahan:
     - SUPERADMIN terakhir tidak bisa diturunkan.
     - Role tidak bisa diturunkan ke USER jika masih punya project, task aktif, atau bawahan.
     - ADMIN tidak bisa diturunkan ke MODERATOR jika masih punya project/task aktif atau Moderator bawahan.

## Penambahan UX/fitur kecil

- Thumbnail file gambar tampil di daftar lampiran.
- Baris file lebih aman di mobile dengan teks panjang.
- Notifikasi unread diberi indikator visual yang lebih jelas.
- Tombol archive project hanya muncul jika project sudah memenuhi syarat archive.
- Deadline task baru membuat notifikasi ke pihak terkait.

## Validasi teknis

Perintah yang dijalankan:

```bash
npm install
npm run build
```

Hasil: build berhasil.

## Catatan batasan frontend-only

Karena aplikasi masih full frontend LocalStorage, file sangat besar tidak selalu disimpan permanen sebagai base64 untuk menghindari localStorage penuh. File kecil/gambar/pdf ringan akan lebih aman untuk preview/download/print setelah refresh.
