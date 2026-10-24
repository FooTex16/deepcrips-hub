\# DEEPCRIPS HUB

\## Product Requirements Document (PRD)



\*\*Versi:\*\* 1.0  

\*\*Status:\*\* Disetujui untuk tahap implementasi  

\*\*Produk:\*\* Website hub gaming, download, tutorial, dan komunitas  

\*\*Brand:\*\* DeepCrips  

\*\*YouTube:\*\* @DeepCrips



\---



\## 1. Ringkasan Produk



DeepCrips Hub adalah platform web yang menjadi pusat distribusi konten DeepCrips, meliputi file unduhan, tools, tutorial, pembaruan game, video YouTube, dan komunitas pengguna.



Platform memungkinkan pengunjung menjelajahi katalog secara publik. Login Google diperlukan untuk mengunduh file dan berpartisipasi dalam komunitas.



Seluruh konten diterbitkan dan dikelola melalui dashboard admin tanpa perlu mengedit kode secara manual.



\### Visi



Membangun pusat konten gaming dan teknologi yang cepat, profesional, mudah digunakan, serta memiliki identitas visual khas DeepCrips.



\### Tujuan utama



1\. Menyatukan konten DeepCrips dalam satu website.

2\. Memudahkan pengunjung menemukan file, game, tutorial, dan video.

3\. Memberikan sistem distribusi file dengan beberapa tautan host.

4\. Membangun komunitas melalui forum dan permintaan konten.

5\. Memberikan kendali penuh kepada admin atas konten, versi, tautan, dan moderasi.

6\. Mempertahankan performa baik di desktop maupun perangkat mobile.



\---



\## 2. Target pengguna



\### Pengunjung

\- Menjelajahi game, tutorial, video, dan katalog file.

\- Mencari konten tanpa harus login.

\- Melihat detail, versi, dan informasi keamanan file.



\### Anggota

\- Login menggunakan Google.

\- Mengunduh file dari host eksternal.

\- Membuat topik dan komentar forum.

\- Memberikan reaksi dan melaporkan konten.

\- Mengajukan permintaan konten.

\- Memberikan satu suara dukungan pada setiap permintaan.



\### Admin konten

\- Mengelola game, file, versi, tutorial, video, dan halaman unggulan.

\- Mengelola tautan host.

\- Meninjau dan menerbitkan konten.



\### Moderator

\- Meninjau laporan.

\- Memoderasi topik dan komentar.

\- Menangani spam dan konten bermasalah sesuai izin.



\### Admin utama

\- Memiliki akses penuh, termasuk pengaturan sistem, pengelolaan peran admin, dan tindakan sensitif.



\---



\## 3. Teknologi dan batasan arsitektur



Arsitektur inti harus menggunakan tepat tiga layanan:



1\. \*\*GitHub:\*\* repository kode, version control, dan riwayat perubahan.

2\. \*\*Vercel:\*\* hosting frontend dan fungsi server.

3\. \*\*Supabase:\*\* PostgreSQL, autentikasi, metadata konten, data anggota, forum, dan permintaan konten.



File unduhan berukuran besar disimpan di host eksternal seperti Google Drive, MediaFire, MEGA, atau host lain yang dimasukkan admin. Supabase menyimpan metadata dan URL, bukan isi file berukuran besar.



Alur umum:



Browser → Vercel → Supabase untuk metadata, autentikasi, dan interaksi → host eksternal untuk unduhan.



GitHub terhubung ke Vercel untuk deployment.



\### Batasan

\- Jangan menambahkan layanan cloud inti keempat tanpa persetujuan.

\- Jangan menggunakan database lokal atau file JSON sebagai pengganti database produksi.

\- Jangan menaruh secret key Supabase di frontend.

\- Jangan menganggap klik tautan sebagai bukti unduhan selesai.

\- Utamakan paket gratis, tetapi jangan menjanjikan kapasitas tanpa batas.

\- Tinjau ulang ketentuan hosting sebelum website dimonetisasi.



\---



\## 4. Struktur halaman



\### Halaman publik

\- Home

\- Eksplorasi game

\- Detail game

\- Katalog download

\- Detail file dan versi

\- Tutorial

\- Detail tutorial

\- Video YouTube

\- Detail atau halaman pemutaran video

\- Pencarian global

\- Forum

\- Detail topik dan komentar

\- Permintaan konten

\- Detail permintaan

\- Login

\- Profil anggota

\- Halaman kebijakan dan informasi keamanan



\### Dashboard admin

\- Overview

\- Manajemen game

\- Manajemen file

\- Manajemen versi

\- Manajemen host

\- Manajemen tutorial

\- Manajemen video

\- Konten unggulan Home

\- Moderasi forum

\- Laporan konten

\- Permintaan konten

\- Anggota dan peran admin

\- Pengaturan

\- Audit log



Semua halaman harus konsisten dalam navigasi, tipografi, warna, komponen, dan perilaku responsif.



\---



\## 5. Persyaratan Home



Urutan bagian yang disarankan:



1\. Hero dengan identitas DeepCrips, deskripsi singkat, pencarian, dan CTA.

2\. File unggulan.

3\. Eksplorasi game.

4\. Download terbaru dan pembaruan versi.

5\. Tutorial pilihan.

6\. Video YouTube terbaru.

7\. Diskusi forum terbaru.

8\. Footer dengan navigasi, Discord, Telegram, YouTube, dan kebijakan.



Konten unggulan dan urutannya harus dapat diatur admin.



Home harus memprioritaskan konten nyata, bukan sekadar dekorasi. Batasi jumlah kartu, optimalkan gambar, dan gunakan thumbnail video statis alih-alih menanamkan banyak video sekaligus.



\---



\## 6. Katalog dan manajemen file



\### Kategori konten

Konten diorganisasi berdasarkan game terlebih dahulu. Halaman game dapat menampilkan tab atau filter untuk:

\- Semua konten

\- Download

\- Tutorial

\- Pembaruan

\- Video



Kategori file dapat meliputi:

\- Tools dan utilitas Windows

\- Script

\- Modifikasi atau add-on game

\- Cheat Engine files

\- APK dan paket game terkait

\- Kategori lain yang dikelola admin



Kategori tidak berarti file otomatis aman atau legal. Admin bertanggung jawab meninjau sumber dan kelayakan publikasi.



\### Metadata file

\- Nama file

\- Slug

\- Deskripsi

\- Game terkait

\- Jenis file

\- Ukuran file jika diketahui

\- Versi

\- Tanggal rilis dan pembaruan versi

\- Kompatibilitas dan sistem operasi jika relevan

\- Screenshot atau thumbnail

\- Sumber file

\- Catatan keamanan dan risiko

\- Status pemeriksaan

\- SHA-256 jika file benar-benar tersedia untuk dihitung

\- Status publikasi

\- Daftar host dan status masing-masing



\### Versi file

\- Versi terbaru menjadi pilihan utama.

\- Riwayat versi lama tetap disimpan.

\- Setiap versi dapat memiliki host dan checksum tersendiri.

\- Versi lama dapat ditandai usang, tidak direkomendasikan, atau tidak tersedia.

\- Pembaruan deskripsi tidak boleh otomatis dianggap sebagai versi baru.



\### Host alternatif

\- Satu versi dapat memiliki beberapa host.

\- Admin dapat mengaktifkan atau menonaktifkan host.

\- Jika host utama dinonaktifkan, tampilkan host alternatif yang masih aktif.

\- Tampilkan keterangan status berdasarkan pemeriksaan terakhir atau laporan.

\- Jangan mengklaim file dapat diunduh hanya karena URL tersimpan.



\### Pelacakan unduhan

\- Catat klik berdasarkan file, versi, dan host.

\- Hindari pencatatan ganda yang tidak wajar dan spam klik.

\- Batasi detail log yang disimpan.

\- Jangan menyimpan data pribadi yang tidak diperlukan.

\- Statistik klik tidak boleh disebut jumlah unduhan berhasil.



\---



\## 7. Autentikasi dan akses



\- Login hanya menggunakan Google OAuth melalui Supabase Auth.

\- Pengunjung dapat menjelajahi konten publik tanpa login.

\- Login diwajibkan ketika anggota menekan tombol download atau mencoba berpartisipasi dalam komunitas.

\- Setelah login, anggota dapat mengunduh konten yang tersedia tanpa persetujuan admin.

\- Nama dan foto profil Google dapat ditampilkan secara publik.

\- Email tidak ditampilkan kepada pengguna lain.

\- Identitas internal menggunakan Supabase user ID, bukan email sebagai kunci utama.

\- Sediakan logout dan pengelolaan sesi yang aman.



Jika pengunjung belum login, arahkan ke login lalu kembalikan ke tindakan atau halaman yang diminta setelah autentikasi berhasil.



\---



\## 8. Forum komunitas



Forum bersifat asinkron, bukan live chat.



\### Fitur

\- Membuat topik.

\- Melihat detail topik.

\- Menulis komentar dan balasan sesuai desain yang dipilih.

\- Memberikan reaksi emoji yang telah ditentukan.

\- Melaporkan topik atau komentar.

\- Mencari berdasarkan judul dan isi.

\- Mengurutkan berdasarkan terbaru atau populer.

\- Menampilkan profil pembuat berupa nama dan foto yang tersedia.



Emoji awal: 👍 ❤️ 😂 🔥 👀



Urutan populer dapat menggunakan kombinasi reaksi dan komentar valid. Metode penghitungan harus konsisten dan tidak mudah dimanipulasi.



\### Moderasi

\- Semua anggota login boleh membuat topik dan komentar.

\- Konten dapat dilaporkan.

\- Moderator dapat menyembunyikan konten sesuai kewenangannya.

\- Admin dapat meninjau laporan dan riwayat tindakan.

\- Terapkan rate limit untuk pembuatan topik, komentar, reaksi, dan laporan.

\- Jangan menampilkan email anggota di forum.



Tautan Discord dan Telegram dapat ditampilkan sebagai kanal komunitas eksternal.



\---



\## 9. Permintaan konten



Anggota yang login dapat mengusulkan konten yang belum tersedia.



\### Informasi usulan

\- Judul

\- Jenis konten

\- Game terkait jika ada

\- Deskripsi singkat

\- Pengusul

\- Tanggal pengajuan

\- Status

\- Jumlah suara dukungan



\### Sistem dukungan

\- Satu anggota hanya boleh memiliki satu suara dukungan aktif untuk setiap permintaan.

\- Database harus mencegah suara ganda, bukan hanya UI.

\- Anggota dapat menarik dukungannya.

\- Daftar permintaan dapat diurutkan berdasarkan dukungan atau waktu terbaru.

\- Pengunjung dapat melihat daftar publik yang telah lolos pemeriksaan admin.

\- Usulan duplikat diarahkan ke permintaan yang sudah ada jika memungkinkan.



\### Status

\- Menunggu peninjauan

\- Ditinjau

\- Direncanakan

\- Selesai

\- Ditolak



Admin memutuskan penerimaan dan prioritas akhir. Jumlah suara hanya menjadi sinyal kebutuhan komunitas.



Permintaan selesai dapat ditautkan ke konten yang diterbitkan. Simpan riwayat status dan hindari menghapus usulan secara permanen tanpa alasan yang sah.



\---



\## 10. Pencarian global



Pencarian harus mencakup:

\- Game

\- File

\- Tutorial

\- Video



\### Filter katalog download

\- Game

\- Jenis file

\- Versi

\- Tanggal pembaruan

\- Ketersediaan



\### Hasil kosong

Jika tidak ditemukan hasil:

\- Tampilkan pesan yang jelas.

\- Berikan saran kata kunci.

\- Tampilkan konten terkait jika ada.

\- Bedakan saran dari hasil yang cocok langsung.



\### Implementasi

\- Mulai dengan PostgreSQL Full Text Search atau pencarian database yang sesuai.

\- Pencarian dilakukan di sisi database/server.

\- Terapkan pagination.

\- Gunakan indeks yang sesuai dengan kolom pencarian dan filter.

\- Jangan memuat seluruh katalog ke browser.

\- Jangan menambahkan layanan pencarian eksternal pada tahap awal.



Hasil hanya boleh mencakup konten publik yang memang boleh dilihat pengguna.



\---



\## 11. Dashboard admin



\### Alur publikasi

Draft → Menunggu pemeriksaan → Published.



Status tambahan: Archived atau ditarik dari publikasi.



Konten tidak boleh tampil sebagai konten publik sebelum diterbitkan.



\### Hak akses

\*\*Admin utama\*\*

\- Seluruh akses.

\- Pengaturan sistem.

\- Pengelolaan peran.

\- Tindakan sensitif.



\*\*Admin konten\*\*

\- Mengelola draft dan metadata file, versi, game, tutorial, dan video.

\- Tidak otomatis memperoleh hak mengelola admin atau pengaturan sensitif.



\*\*Moderator\*\*

\- Mengelola laporan dan moderasi sesuai izin.

\- Tidak otomatis memperoleh hak menerbitkan file atau mengubah peran admin.



Semua izin harus ditegakkan di server/database. Menyembunyikan tombol pada frontend tidak cukup.



\### Audit log

Catat tindakan penting seperti:

\- Penerbitan dan penarikan konten.

\- Perubahan URL host.

\- Perubahan versi dan checksum.

\- Perubahan peran admin.

\- Pengaturan sensitif.

\- Tindakan moderasi penting.



Hindari pencatatan secret atau data sensitif yang tidak diperlukan.



\---



\## 12. Keamanan file



\- Semua file harus memiliki sumber informasi.

\- Terapkan pemeriksaan manual sebelum publikasi.

\- Status pemeriksaan harus menjelaskan apa yang benar-benar diperiksa.

\- SHA-256 hanya boleh ditandai cocok setelah dibandingkan dengan file yang benar-benar diperoleh.

\- Hash cocok membuktikan kesamaan byte terhadap file pembanding, bukan jaminan bebas malware.

\- Jika file tidak dapat diperiksa langsung, tampilkan status yang jujur.

\- Sediakan mekanisme untuk menonaktifkan file atau host yang dilaporkan bermasalah.

\- Berikan peringatan risiko yang relevan, khususnya untuk executable, APK, script, modifikasi, dan alat yang dapat memengaruhi game atau sistem.

\- Jangan membuat klaim “100% aman”.

\- Validasi URL dan metadata pada sisi server.

\- Gunakan Row Level Security (RLS) untuk tabel yang dapat diakses melalui Supabase.

\- Jangan mengekspos service-role key atau rahasia server di browser.



\---



\## 13. Sistem desain dan UI/UX



\### Identitas visual

\- Modern, premium, minimal, dan berorientasi teknologi.

\- Dominasi dark navy, hitam, dan aksen biru elektrik/cyan.

\- Mode terang dengan latar netral terang, teks kontras, dan aksen brand yang konsisten.

\- Maskot DeepCrips sebagai elemen identitas, bukan dekorasi yang mendominasi.

\- Hindari neon berlebihan, glassmorphism berat, gradient berlebihan, dan tampilan generik.



\### Tipografi

Gunakan font modern dan mudah dibaca, misalnya Plus Jakarta Sans atau Inter. Pilih satu keluarga utama dan batasi variasi font weight. Sediakan fallback sistem dan pertimbangkan self-hosting agar performa dan privasi lebih baik.



\### Tema

\- Dark dan Light mode.

\- Tombol pergantian tema mudah ditemukan.

\- Simpan pilihan pengguna secara lokal.

\- Gunakan tema sistem sebagai pilihan awal jika sesuai.

\- Pastikan kontras, border, bayangan, status, dan komponen konsisten di kedua tema.



\### Animasi

\- Transisi halaman dan komponen yang halus.

\- Hover dan pressed states yang responsif.

\- Animasi ringan pada kartu, menu, modal, dan elemen hero.

\- Hindari animasi yang terus berjalan tanpa alasan.

\- Dukung prefers-reduced-motion.

\- Gunakan transform dan opacity jika memungkinkan.

\- Hindari efek yang menyebabkan layout shift atau menghambat interaksi.



\### Responsivitas

\- Desktop, tablet, dan mobile.

\- Navigasi mobile yang jelas.

\- Target sentuh nyaman.

\- Teks tidak terpotong.

\- Filter katalog mudah digunakan pada layar kecil.

\- Dashboard admin harus usable pada layar sempit, walaupun pengalaman utama tetap di desktop.



\### Aksesibilitas

\- Semantik HTML yang benar.

\- Navigasi keyboard.

\- Focus states terlihat.

\- Label form jelas.

\- Kontras warna memadai.

\- Pesan error yang dapat dipahami.

\- Reduced motion.

\- Jangan menyampaikan status hanya dengan warna.



\---



\## 14. Performa dan SEO



\- Utamakan loading cepat dan interaksi responsif.

\- Gunakan gambar teroptimasi, ukuran responsif, dan lazy loading di luar area awal.

\- Hindari library besar yang tidak diperlukan.

\- Hindari memuat banyak iframe video sekaligus.

\- Terapkan pagination atau strategi pemuatan bertahap.

\- Gunakan loading, empty, error, dan success states yang konsisten.

\- Hindari layout shift.

\- Optimalkan metadata SEO untuk halaman publik.

\- Gunakan URL yang mudah dibaca dan metadata sosial untuk konten yang relevan.

\- Halaman privat dan data anggota harus memiliki kontrol akses yang sesuai.



\---



\## 15. Data dan integritas



Entitas data konseptual:

\- Profiles

\- Games

\- Files

\- File versions

\- Download hosts

\- Download events

\- Tutorials

\- Videos

\- Home featured content

\- Forum topics

\- Forum comments

\- Reactions

\- Reports

\- Content requests

\- Request votes

\- Admin roles/permissions

\- Audit logs

\- Site settings



Relasi dan skema final harus ditentukan setelah mengaudit repository dan database yang sudah ada. Jangan membuat tabel duplikat jika entitas setara telah tersedia.



Gunakan UUID atau ID stabil yang sesuai. Terapkan foreign keys, unique constraints, indeks, validasi, dan kebijakan akses yang tepat.



\---



\## 16. Kriteria penerimaan



Website belum dianggap selesai hanya karena tampilan Home berhasil dirender.



\### Fungsional

\- Pengunjung dapat menjelajahi konten publik.

\- Pencarian global bekerja untuk empat tipe konten.

\- Filter katalog bekerja bersama pencarian.

\- Login Google dan logout bekerja.

\- Download memerlukan login dan menampilkan host yang aktif.

\- Riwayat versi dapat dilihat.

\- Forum mendukung topik, komentar, reaksi, dan laporan.

\- Permintaan konten dapat diajukan dan didukung tanpa suara ganda.

\- Admin dapat mengelola konten melalui dashboard.

\- Peran admin benar-benar ditegakkan di backend.

\- Tema gelap dan terang bekerja di semua halaman.

\- Loading, error, empty, dan success states tersedia.



\### Keamanan

\- Tidak ada secret key di frontend.

\- RLS dan pemeriksaan izin telah diuji.

\- Anggota tidak dapat memodifikasi konten admin.

\- Anggota tidak dapat memberi suara ganda untuk satu permintaan.

\- Draft dan konten privat tidak muncul pada pencarian publik.

\- Host dan konten dapat dinonaktifkan tanpa menghapus riwayat secara tidak perlu.



\### Kualitas

\- Layout responsif.

\- Animasi ringan dan mendukung reduced motion.

\- Tidak ada tautan atau tombol utama yang hanya berupa dekorasi.

\- Tidak ada data dummy yang disamarkan sebagai data produksi.

\- Build, lint, dan pengujian yang tersedia lulus.

\- Tidak ada migrasi destruktif atau penghapusan data tanpa persetujuan.



\---



\## 17. Tahapan implementasi



1\. Audit repository, teknologi, environment, dan database.

2\. Tetapkan arsitektur dan rencana perubahan yang aman.

3\. Bangun design system, layout responsif, dan tema.

4\. Bangun autentikasi dan fondasi database.

5\. Implementasikan katalog, pencarian, detail file, dan versi.

6\. Implementasikan dashboard admin dan pengelolaan host.

7\. Implementasikan forum dan moderasi.

8\. Implementasikan permintaan konten dan suara dukungan.

9\. Optimalkan performa, aksesibilitas, SEO, dan keamanan.

10\. Jalankan build, test, audit, dan dokumentasikan deployment.



Setiap tahap harus menghasilkan perubahan yang dapat diuji sebelum lanjut ke tahap berikutnya.



\---



\## 18. Prinsip akhir



DeepCrips Hub harus terasa seperti produk digital yang matang, bukan template yang sekadar diganti warna dan logo.



Keberhasilan diukur dari kombinasi identitas visual yang kuat, konten yang mudah ditemukan, interaksi yang aman, dashboard admin yang efektif, dan performa yang tetap baik saat jumlah konten bertambah.



