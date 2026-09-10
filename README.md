# I'M YOURZ Family

Website pribadi keluarga untuk menghitung umur Daddy, Mommy, dan Anak secara live sampai hitungan detik menggunakan zona waktu WIB.

Production: [https://family.imyourz.com/](https://family.imyourz.com/)

Project ini sengaja dibuat sederhana: tidak ada form input, backend, database, login, maupun dependency runtime. Data keluarga disimpan langsung di source code agar halaman dapat dibuka dan dideploy sebagai static site.

## Fitur

- Counter umur yang diperbarui setiap detik.
- Semua perhitungan menggunakan zona waktu `Asia/Jakarta` (WIB).
- Umur kalender dalam tahun, bulan, hari, jam, menit, dan detik.
- Total umur terpisah dan diurutkan dari bulan, minggu, hari, jam, menit, hingga detik.
- Total angka ditampilkan penuh dengan pemisah ribuan Indonesia, tanpa singkatan.
- Tanggal lahir diberi highlight sebagai fokus utama setiap kartu.
- Pengingat ulang tahun berikutnya beserta jumlah hari yang tersisa.
- Kartu keluarga responsif untuk desktop dan mobile.
- Silsilah The Family Hearth: Daddy dan Mommy disatukan dalam paviliun "Pondasi Kasih" yang harmonis dengan lambang ikatan cinta di tengahnya, lalu dihubungkan oleh sulur pita kasih organik yang mengalir menuju buah hati di bawahnya.
- Animasi detak kehidupan (pulsing heartbeat) pada setiap kartu umur.
- Detail total umur tertutup secara default dan dapat dibuka secara independen pada setiap kartu.
- Setiap kali rincian dibuka, keenam total dianimasikan dari nol menuju nilai terkini; panel juga membuka dan menutup dengan lembut.
- Dukungan untuk menambahkan anak kedua, ketiga, dan seterusnya melalui satu array data.
- Validasi untuk tanggal lahir yang tidak valid atau berada di masa depan.
- Metadata SEO, canonical URL, structured data, robots, dan sitemap untuk mesin pencari.
- PWA yang dapat dipasang ke homescreen dan dibuka kembali saat offline setelah kunjungan online pertama.

## Data keluarga saat ini

| Peran | Nama | Jam lahir (WIB) |
| --- | --- | --- |
| Daddy | Zaidus Zhuhur | 10:00 WIB |
| Mommy | Zaqia Khana Meriza | 00:30 WIB |
| Anak | Zeia Elora Zhane | 09:30 WIB |

## Teknologi

- HTML semantic
- CSS responsive tanpa framework
- JavaScript module (`.mjs`)
- `Intl.DateTimeFormat` untuk format WIB dan bahasa Indonesia
- Web App Manifest dan Service Worker untuk instalasi serta dukungan offline
- Node.js built-in test runner (`node:test`)
- Vercel untuk deployment static site

Tidak ada package runtime atau dependency eksternal yang perlu di-install.

## Struktur project

```text
family-timeline/
├── index.html                         # Struktur halaman utama
├── favicon.svg                        # Ikon silsilah untuk tab browser
├── manifest.webmanifest               # Identitas dan konfigurasi aplikasi PWA
├── sw.js                              # Cache app shell dan fallback offline
├── icons/                             # Ikon homescreen dan maskable PWA
├── style.css                          # Tampilan jurnal dan responsive layout
├── script.mjs                         # Data, kalkulasi umur, dan renderer DOM
├── script.test.mjs                    # Test kalkulasi dengan node:test
├── seo.test.mjs                       # Test metadata dan file SEO
├── pwa.test.mjs                       # Test manifest, ikon, dan service worker
├── robots.txt                         # Aturan crawler dan lokasi sitemap
├── sitemap.xml                        # Daftar URL publik untuk mesin pencari
├── vercel.json                        # Konfigurasi URL canonical Vercel
├── .gitignore                         # File lokal dan hasil generate yang diabaikan Git
├── README.md                          # Dokumentasi project
└── docs/
    └── superpowers/                   # Catatan desain dan implementation plan
```

## Menjalankan secara lokal

### Prasyarat

- Browser modern yang mendukung JavaScript modules, `Intl`, elemen HTML `<details>`, dan Service Worker.
- Python 3 untuk server lokal, jika ingin menjalankan tanpa memasang dependency.
- Node.js 18 atau lebih baru hanya untuk menjalankan test.

### Dengan Python

Dari folder project:

```bash
python3 -m http.server 4173
```

Buka [http://localhost:4173](http://localhost:4173) di browser. Pada Windows, perintahnya dapat menggunakan `py -m http.server 4173`.

Hentikan server dengan `Ctrl+C`.

> Gunakan server HTTP lokal, bukan membuka `index.html` langsung dengan `file://`, supaya JavaScript module berjalan konsisten di browser.

## Menjalankan test

Test menggunakan runner bawaan Node.js, jadi tidak membutuhkan `npm install`:

```bash
node --test script.test.mjs
node --test seo.test.mjs
node --test pwa.test.mjs
```

Pengecekan sintaks dapat dijalankan dengan:

```bash
node --check script.mjs
node --check script.test.mjs
node --check sw.js
node --check pwa.test.mjs
```

## Memasang sebagai aplikasi

PWA bekerja melalui HTTPS pada domain production atau melalui `localhost` saat development. Buka website sekali dalam keadaan online agar seluruh app shell tersimpan.

- Android atau desktop Chromium: gunakan menu browser **Install app** atau **Tambahkan ke layar utama**.
- iPhone dan iPad: buka melalui Safari, pilih **Share**, lalu **Add to Home Screen**.

Setelah service worker aktif, halaman dan seluruh counter dapat dibuka kembali tanpa internet. Saat online, aplikasi tetap meminta file terbaru dari jaringan dan menggunakan cache hanya ketika jaringan tidak tersedia.

## Mengubah data keluarga

Edit konstanta `PEOPLE` di [script.mjs](./script.mjs):

```js
const PEOPLE = [
  {
    id: 'papa',
    role: 'Daddy',
    name: 'Zaidus Zhuhur',
    birthAt: 'YYYY-MM-DDTHH:mm:ss+07:00',
  },
];
```

Gunakan aturan berikut:

1. `id` harus unik dan sebaiknya menggunakan huruf kecil tanpa spasi.
2. `role` adalah label hubungan dasar. Daddy dan Mommy menampilkannya langsung di atas nama.
3. `name` adalah nama yang ditampilkan pada kartu.
4. `birthAt` menggunakan format ISO `YYYY-MM-DDTHH:mm:ss+07:00`.
5. Offset `+07:00` harus dipertahankan agar waktu lahir jelas sebagai WIB.

### Menambahkan anak berikutnya

Tambahkan object baru ke array `PEOPLE`. Tidak perlu mengubah HTML atau membuat kartu secara manual karena kartu dibuat otomatis oleh `script.mjs`.

ID `papa` dan `mama` ditempatkan pada kelompok orang tua. Anggota dengan ID lainnya masuk kelompok anak sesuai urutan array. Garis penghubung mengikuti perubahan ukuran layar dan kartu saat detail dibuka atau ditutup.

Contoh:

```js
{
  id: 'anak-2',
  role: 'Anak',
  name: 'Nama Anak Kedua',
  birthAt: 'YYYY-MM-DDTHH:mm:ss+07:00',
},
```

Jika jumlah anak lebih dari satu, label kartu otomatis menjadi `Anak Pertama`, `Anak Kedua`, dan seterusnya.

## Cara kerja perhitungan

- Waktu sekarang dibaca ulang setiap kali halaman dirender dan tampilan diperbarui setiap 1 detik.
- Komponen umur kalender dihitung berdasarkan kalender WIB, bukan zona waktu perangkat pengunjung.
- Umur kalender terdiri dari tahun lengkap, bulan lengkap, lalu sisa hari, jam, menit, dan detik.
- Total detik dihitung dari durasi absolut sejak waktu lahir.
- Total menit, jam, hari, dan minggu dibulatkan ke bawah dari total detik.
- Total bulan dihitung sebagai `tahun lengkap × 12 + bulan lengkap`.
- Angka tahun utama adalah jumlah tahun kalender lengkap.
- Ulang tahun berikutnya memakai tanggal dan jam lahir dalam WIB. Jumlah hari tersisa dihitung berdasarkan tanggal kalender WIB.
- Jika data tanggal lahir invalid atau berada di masa depan, kartu menampilkan pesan error yang terbaca dan tidak menampilkan angka negatif.

## Deployment ke Vercel

Project ini tidak membutuhkan build command.

1. Push repository ke Git provider pilihanmu secara manual.
2. Import repository tersebut ke Vercel.
3. Pilih framework `Other` atau static site.
4. Biarkan build command kosong.
5. Gunakan root project sebagai output directory.

File [vercel.json](./vercel.json) menormalkan URL dengan trailing slash. Tidak ada catch-all rewrite, sehingga URL atau file yang tidak tersedia mengembalikan status 404 dengan benar.

## SEO dan indexing Google

Halaman utama memiliki title dan description deskriptif, canonical URL, Open Graph, Twitter Card, serta structured data `WebSite`. File [robots.txt](./robots.txt) mengizinkan crawling dan menunjuk ke [sitemap.xml](./sitemap.xml).

Setelah deployment terbaru aktif, tambahkan domain ke Google Search Console, kirim `https://family.imyourz.com/sitemap.xml`, lalu gunakan URL Inspection untuk meminta indexing halaman utama. Sitemap membantu proses crawling, tetapi tidak menjamin halaman langsung muncul di hasil pencarian.

## Privasi

Nama dan tanggal lahir keluarga tersimpan langsung di `script.mjs` dan dapat dibaca oleh siapa pun yang memiliki akses ke source atau deployment. Jika data ini bersifat pribadi, gunakan repository dan deployment private atau tambahkan lapisan autentikasi sebelum membagikan URL.

Saat PWA digunakan, app shell termasuk `script.mjs` disimpan pada cache browser perangkat agar dapat dibuka offline. Hapus data situs atau uninstall aplikasi untuk menghapus salinan lokal tersebut.

Selain itu, waktu sekarang berasal dari jam perangkat pengunjung. Zona waktunya tetap diformat sebagai WIB, tetapi jam perangkat yang salah dapat memengaruhi hasil counter.

## Batasan project

Project ini belum menyediakan:

- form untuk mengubah data dari browser;
- database atau sinkronisasi antarperangkat;
- login dan autentikasi;
- notifikasi atau pengingat otomatis;
- API waktu dari server;
- galeri foto atau fitur keluarga lainnya.

Semua data dapat diubah secara manual oleh pemilik project melalui source code.
