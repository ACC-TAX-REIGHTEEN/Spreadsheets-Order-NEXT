# 📋 Web App Form Order Penjualan — Google Apps Script

> **Form input order penjualan berbasis web yang terhubung langsung ke Google Sheets — sales login otomatis via akun Google, pilih customer, upload foto, data tersimpan seketika**

Aplikasi web dua file (`Code.gs` + `Index.html`) yang di-deploy sebagai **Google Apps Script Web App**. Sales membuka URL form, login tervalidasi otomatis dari email Google, mengisi order (nama sales, kategori, kota, customer multi-pilih, foto opsional), dan satu klik kirim menyimpan data ke Spreadsheet tujuan sekaligus mengupload foto ke Google Drive.

## 🔗 Keterkaitan dengan Ekosistem Proyek

Aplikasi Web App ini berperan penting sebagai **garda terdepan pengumpulan & validasi data** untuk mendukung dua proyek utama lainnya:

1. **[AR Orderan — Machine Learning](https://github.com/ACC-TAX-REIGHTEEN/AR-Orderan-MachineLearning)**
   * **Masalah:** Model Machine Learning berisiko mengalami penurunan akurasi atau gagal membuat prediksi jika dataset latihan memiliki celah (*data gap*) atau menerima data baru yang belum dipetakan secara manual oleh manusia.
   * **Peran Web App Ini:** Memastikan data order yang diinput dari lapangan terstruktur, memiliki format yang konsisten, serta mencatat entitas baru (seperti *New Outlet Order / NOO*) secara sistematis agar dapat dipetakan dengan tepat.

2. **[Automasi AR Orderan](https://github.com/ACC-TAX-REIGHTEEN/Automasi-AR-Orderan)**
   * **Masalah:** Proses otomatisasi rentan terganggu akibat kesalahan ketik (*human error*) pada kode atau nama pelanggan oleh tim lapangan, sehingga menimbulkan data yang salah dan menambah beban kerja tim admin.
   * **Peran Web App Ini:** Menyediakan fitur pencarian pelanggan *real-time* dan *multi-select* berbasis master data Google Sheets, sehingga mencegah tim lapangan memasukkan kode pelanggan yang salah sejak awal.

---

## 📋 Daftar Isi

- [Gambaran Umum & Arsitektur](#-gambaran-umum--arsitektur)
- [Fitur Utama](#-fitur-utama)
- [Setup: Langkah Demi Langkah](#-setup-langkah-demi-langkah)
- [Konfigurasi `CONFIG` di `Code.gs`](#-konfigurasi-config-di-codegs)
- [Struktur Google Sheets yang Dibutuhkan](#-struktur-google-sheets-yang-dibutuhkan)
- [Format Data yang Disimpan](#-format-data-yang-disimpan)
- [Cara Kerja Tiap Fitur](#-cara-kerja-tiap-fitur)
- [Pengaturan Deploy Web App](#-pengaturan-deploy-web-app)
- [Troubleshooting](#-troubleshooting)
- [Catatan Penting](#-catatan-penting)

---

## 🗂️ Gambaran Umum & Arsitektur

```
[Pengguna buka URL Web App]
        │
        ▼
  Index.html (Bootstrap 5, berjalan di browser)
        │
        │ google.script.run.getInitialData()
        ▼
  Code.gs (berjalan di server Google)
    ├── Validasi email akun Google aktif → Spreadsheet Sales
    ├── Baca daftar Customer → Spreadsheet Customer
    ├── Baca daftar Kategori → Spreadsheet (opsional)
    └── Baca daftar Kota → Spreadsheet (opsional)
        │
        ▼
  Form tampil di browser (dinamis sesuai konfigurasi)
        │
        │ google.script.run.submitOrderForm(payload)
        ▼
  Code.gs
    ├── Upload foto → Google Drive (jika ada)
    └── Append baris → Spreadsheet Target
```

**File yang diperlukan:**

| File | Letak di GAS | Keterangan |
|---|---|---|
| `Code.gs` | Server-side | Logika validasi, baca data, simpan form |
| `Index.html` | Client-side | UI form (Bootstrap 5, JavaScript) |

---

## ✨ Fitur Utama

- **Autentikasi email otomatis** — Email akun Google pengguna dibandingkan dengan daftar di Spreadsheet Sales. Jika tidak terdaftar, akses ditolak dengan pesan diagnosa terperinci.
- **Sales auto-selected** — Dropdown nama sales otomatis memilih nama yang emailnya cocok dengan pengguna yang login.
- **Pencarian customer real-time** — Ketik kode, nama, atau nama kontak customer; hasil muncul instan (maks 40 hasil, tanpa loading).
- **Multi-pilih customer** — Pilih lebih dari satu customer sekaligus; tampil sebagai badge yang bisa dihapus satu per satu.
- **Dukungan NOO (New Outlet Order)** — Opsi khusus untuk customer baru yang belum terdaftar; muncul kotak input nama outlet baru saat dipilih.
- **Field dinamis** — Kategori dan Kota Customer hanya muncul jika dikonfigurasi dan datanya tersedia; form tidak membebani pengguna dengan field yang tidak relevan.
- **Upload foto opsional** — Foto dikonversi ke base64 di browser, diunggah ke Google Drive, dan URL-nya disimpan ke Spreadsheet.
- **Diagnosa akses ditolak** — Pengguna yang emailnya tidak terdaftar melihat pesan error beserta detail teknis (nama kolom tidak ditemukan, email tidak cocok, dll.) untuk memudahkan debugging.

---

## 🚀 Setup: Langkah Demi Langkah

### Langkah 1 — Siapkan Spreadsheet

Sebelum menyentuh kode, buat dan isi semua Google Spreadsheet yang dibutuhkan. Lihat [Struktur Google Sheets yang Dibutuhkan](#-struktur-google-sheets-yang-dibutuhkan) untuk detail kolom yang wajib ada.

Catat **Spreadsheet ID** masing-masing (bagian URL: `https://docs.google.com/spreadsheets/d/**[ID DI SINI]**/edit`).

### Langkah 2 — Siapkan Google Drive Folder

Buat satu folder di Google Drive khusus untuk menyimpan foto orderan. Catat **Folder ID** (bagian URL: `https://drive.google.com/drive/folders/**[ID DI SINI]**`).

### Langkah 3 — Buat Proyek Google Apps Script

1. Buka [script.google.com](https://script.google.com) → klik **New project**.
2. Ganti nama proyek (klik "Untitled project" di pojok kiri atas).
3. Di panel kiri, hapus isi default `Code.gs` → paste seluruh isi `Code.gs` dari repositori ini.
4. Klik ikon `+` di panel kiri → pilih **HTML** → beri nama `Index` (tanpa ekstensi) → paste seluruh isi `Index.html`.

### Langkah 4 — Isi Konfigurasi `CONFIG`

Di `Code.gs`, isi semua nilai di blok `CONFIG` sesuai ID Spreadsheet dan nama kolom yang sudah disiapkan. Lihat panduan lengkap di [Konfigurasi CONFIG](#-konfigurasi-config-di-codegs).

### Langkah 5 — Simpan & Deploy

1. Klik **Deploy** → **New deployment**.
2. Klik ikon ⚙️ di samping "Select type" → pilih **Web app**.
3. Isi deskripsi (opsional).
4. Atur **Execute as**: `Me (nama akun Google Anda)`.
5. Atur **Who has access**: `Anyone` (semua pengguna dengan link) atau `Anyone within [organisasi]` (khusus Workspace).
6. Klik **Deploy** → izinkan permissions yang diminta → salin **Web App URL**.
7. Bagikan URL tersebut ke tim sales.

> ⚠️ Setiap kali mengubah `Code.gs`, buat **New deployment** baru atau gunakan **Manage deployments → Edit → Save new version** agar perubahan berlaku.

---

## ⚙️ Konfigurasi `CONFIG` di `Code.gs`

Seluruh konfigurasi terpusat di satu objek `CONFIG`. Tidak perlu mengubah kode di bagian lain.

```javascript
const CONFIG = {
  GENERAL:  { COMPANY_NAME: "..." },
  TARGET:   { SPREADSHEET_ID: "...", SHEET_NAME: "...", FOLDER_DRIVE_ID: "..." },
  SALES:    { SPREADSHEET_ID: "...", SHEET_NAME: "...", COL_NAME: "...", COL_EMAIL: "..." },
  CUSTOMER: { SPREADSHEET_ID: "...", SHEET_NAME: "...", COL_CODE: "...", COL_NAME: "...", COL_CONTACT: "..." },
  CATEGORY: { SPREADSHEET_ID: "...", SHEET_NAME: "...", COL_NAME: "..." },
  CITY:     { SPREADSHEET_ID: "...", SHEET_NAME: "...", COL_NAME: "..." },
  PHOTO:    { ENABLED: true }
};
```

### Penjelasan tiap seksi

#### `GENERAL` — Identitas Perusahaan

| Key | Keterangan |
|---|---|
| `COMPANY_NAME` | Nama perusahaan yang tampil di header form dan judul tab browser |

---

#### `TARGET` — Tujuan Penyimpanan Data

| Key | Keterangan |
|---|---|
| `SPREADSHEET_ID` | ID Spreadsheet tempat baris order disimpan |
| `SHEET_NAME` | Nama sheet/tab di spreadsheet tersebut (contoh: `Form Responses 1`) |
| `FOLDER_DRIVE_ID` | ID folder Google Drive untuk menyimpan foto orderan |

---

#### `SALES` — Data & Validasi Sales

| Key | Keterangan |
|---|---|
| `SPREADSHEET_ID` | ID Spreadsheet yang berisi daftar sales |
| `SHEET_NAME` | Nama sheet berisi data sales |
| `COL_NAME` | Nama header kolom berisi **nama sales** (contoh: `Nama Sales`) |
| `COL_EMAIL` | Nama header kolom berisi **email sales** — digunakan untuk validasi login |

> Email pengguna yang login (dari `Session.getActiveUser().getEmail()`) dibandingkan secara exact match (case-insensitive) dengan kolom `COL_EMAIL`.

---

#### `CUSTOMER` — Data Pelanggan

| Key | Keterangan |
|---|---|
| `SPREADSHEET_ID` | ID Spreadsheet data pelanggan |
| `SHEET_NAME` | Nama sheet |
| `COL_CODE` | Header kolom kode pelanggan (contoh: `No. Pelanggan.`) |
| `COL_NAME` | Header kolom nama pelanggan |
| `COL_CONTACT` | Header kolom nama kontak/keterangan (opsional, boleh `""`) |

Ketiga nilai (`code`, `name`, `contact`) digunakan sebagai target pencarian real-time di form.

---

#### `CATEGORY` — Kategori Order (Opsional)

| Key | Keterangan |
|---|---|
| `SPREADSHEET_ID` | ID Spreadsheet berisi daftar kategori |
| `SHEET_NAME` | Nama sheet |
| `COL_NAME` | Header kolom nama kategori |

> Jika `SPREADSHEET_ID`, `SHEET_NAME`, atau `COL_NAME` dikosongkan (`""`), field Kategori **tidak akan tampil** di form.

---

#### `CITY` — Kota Customer (Opsional)

Struktur identik dengan `CATEGORY`. Jika dikosongkan, field Kota tidak tampil.

---

#### `PHOTO` — Foto Orderan

| Key | Nilai | Keterangan |
|---|---|---|
| `ENABLED` | `true` | Field upload foto **tampil** di form |
| `ENABLED` | `false` | Field upload foto **tidak tampil** |

---

## 📊 Struktur Google Sheets yang Dibutuhkan

### Spreadsheet Sales

Digunakan untuk validasi login dan dropdown nama sales.

| Nama Sales | Surel Sales | *(kolom lain bebas)* |
|---|---|---|
| Budi Santoso | budi@gmail.com | |
| Siti Rahayu | siti@gmail.com | |

Nama header harus **persis sama** dengan nilai `COL_NAME` dan `COL_EMAIL` di `CONFIG.SALES`.

---

### Spreadsheet Customer

Digunakan untuk daftar customer di form pencarian.

| No. Pelanggan. | Nama Pelanggan | Nama kontak |
|---|---|---|
| MGL-1001 | Toko Makmur | Bapak Hendra |
| MGL-1002 | CV Jaya Abadi | Ibu Susi |

Nama header harus persis sesuai `COL_CODE`, `COL_NAME`, `COL_CONTACT` di `CONFIG.CUSTOMER`.

---

### Spreadsheet Kategori & Kota (Opsional)

Boleh berada di sheet yang sama dengan Spreadsheet Sales atau terpisah. Hanya butuh satu kolom per data:

**Contoh sheet Kategori:**

| Kategori |
|---|
| PCMO |
| HDEO |
| Gear Oil |

**Contoh sheet Kota:**

| Kota Cust |
|---|
| Magelang |
| Purworejo |
| Semarang |

---

### Spreadsheet Target (Output)

Sheet tempat baris order ditulis. Boleh kosong atau sudah memiliki header. Data ditambahkan dengan `appendRow` sehingga tidak menimpa data yang ada.

**Header yang dihasilkan (kolom A–G):**

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| Timestamp | Nama Sales | Kategori | Nama Customer | Kota Customer | URL Foto | Kode Customer |

Nilai kolom D (`Nama Customer`) dan G (`Kode Customer`) untuk order dengan beberapa customer dipisahkan dengan ` & `:
```
MGL-1001 & MGL-1002          ← Kolom G
Toko Makmur & CV Jaya Abadi  ← Kolom D
```

---

## 🔍 Cara Kerja Tiap Fitur

### Validasi Akses Sales

Saat form dibuka, `getInitialData()` dipanggil otomatis. Fungsi ini mengambil email pengguna via `Session.getActiveUser().getEmail()` dan membandingkannya dengan kolom `COL_EMAIL` di Spreadsheet Sales (case-insensitive, strip whitespace dan `\u00a0`).

Jika tidak cocok → form tersembunyi, muncul kotak merah **"Akses Ditolak"** dengan detail diagnosa:
- Email yang dideteksi
- Pesan spesifik (kolom tidak ditemukan, email tidak cocok, sheet tidak ada, dll.)

### Pencarian Customer Real-Time

Pencarian dijalankan di sisi klien (JavaScript), bukan server — sehingga tidak ada delay jaringan. Seluruh data customer diunduh satu kali saat form pertama kali dimuat, lalu disimpan di variabel `allCustomers`.

Filter dilakukan terhadap tiga field sekaligus:
- Kode pelanggan (`code`)
- Nama pelanggan (`name`)
- Nama kontak (`contact`)

Pencarian dimulai setelah pengguna mengetik **minimal 2 karakter**. Hasil dibatasi **40 entri** untuk menjaga performa render.

### NOO (New Outlet Order)

Opsi `[NOO]` selalu tampil di baris paling atas daftar customer, bahkan sebelum pengguna mengetik. Saat dicentang:
- Muncul kotak input teks untuk nama outlet baru
- Nilai yang dikirim ke server adalah nama yang diketikkan (bukan `NOO`)
- Kode yang disimpan tetap `NOO`

### Upload Foto

Proses upload dilakukan dalam dua tahap:
1. **Browser (JavaScript):** File dibaca dengan `FileReader.readAsDataURL()` → base64 string
2. **Server (GAS):** String base64 didecode, dibuat Blob, diupload ke folder Drive yang dikonfigurasi, file diberi akses `ANYONE_WITH_LINK VIEW`, URL-nya disimpan ke Spreadsheet

---

## 🛠️ Pengaturan Deploy Web App

### "Execute as" — Pilih dengan tepat

| Pilihan | Kapan digunakan | Efek pada `getActiveUser()` |
|---|---|---|
| `Me` | Aplikasi internal, satu akun | Selalu mengembalikan email deployer |
| `User accessing the web app` | Multi-user, Google Workspace | Mengembalikan email pengguna yang login |

> Untuk form yang diakses banyak sales dengan akun berbeda, gunakan `User accessing the web app`. Akun harus masuk Google terlebih dahulu.

### "Who has access"

| Pilihan | Cocok untuk |
|---|---|
| `Only myself` | Testing pribadi |
| `Anyone` | Tim sales dengan akun Google personal atau Workspace berbeda |
| `Anyone within [domain]` | Hanya akun @domainperusahaan.com (butuh Google Workspace) |

### Izin (Permissions/Scopes) yang Diminta

Saat pertama deploy, Google akan meminta izin untuk:
- **Google Spreadsheets** — baca dan tulis data
- **Google Drive** — upload file ke folder
- **Lihat email akun Google Anda** — validasi login sales

Klik **Allow** untuk semua izin yang diminta.

---

## 🛠️ Troubleshooting

### ❌ Form loading terus / tidak tampil
JavaScript GAS membutuhkan koneksi ke server. Pastikan: (1) browser tidak memblokir `script.google.com`; (2) pengguna sudah login ke akun Google.

### ❌ "Akses Ditolak" padahal email sudah terdaftar
Baca detail diagnosa yang muncul. Kemungkinan penyebab:
- Nama header kolom di `CONFIG.SALES.COL_EMAIL` tidak persis sama dengan header di Spreadsheet (perhatikan spasi, titik, atau karakter `\u00a0`)
- Email di Spreadsheet memiliki spasi tersembunyi di awal/akhir
- Spreadsheet belum bisa diakses oleh akun yang menjalankan skrip

### ❌ Dropdown Kategori / Kota tidak muncul
Salah satu dari `SPREADSHEET_ID`, `SHEET_NAME`, atau `COL_NAME` di `CONFIG.CATEGORY`/`CONFIG.CITY` kosong atau header tidak ditemukan. Cek nama header persis sama (gunakan `Logger.log(headers)` di editor GAS untuk debug).

### ❌ Data customer tidak muncul saat dicari
Pastikan `CONFIG.CUSTOMER.COL_CODE` dan `CONFIG.CUSTOMER.COL_NAME` persis sama dengan header di Spreadsheet Customer. Fungsi `getCustomerData()` mengembalikan array kosong jika salah satu kolom kunci tidak ditemukan.

### ❌ Foto gagal terupload
Kemungkinan: (1) `CONFIG.TARGET.FOLDER_DRIVE_ID` salah atau folder tidak bisa diakses; (2) skrip tidak memiliki izin Drive. Jalankan ulang deployment dan pastikan izin Drive diberikan saat popup muncul.

### ❌ Perubahan kode tidak berlaku setelah simpan
Perubahan di `Code.gs` atau `Index.html` tidak otomatis aktif. Harus buat **new deployment** atau pilih **Manage deployments → Edit deployment → Save new version**.

### ❌ `Session.getActiveUser().getEmail()` mengembalikan string kosong
Terjadi jika Web App di-deploy dengan `Execute as: Me` tapi diakses oleh akun lain, atau pengaturan Workspace membatasi akses email. Gunakan `Execute as: User accessing the web app` untuk mendapatkan email pengguna yang login.

---

## 📌 Catatan Penting

- **Tidak perlu server atau hosting** — seluruh aplikasi berjalan di infrastruktur Google (Apps Script + Sheets + Drive). Tidak ada biaya hosting selama dalam kuota gratis Google.
- **Batas kuota GAS:** `appendRow` dan operasi Spreadsheet tunduk pada [kuota Google Apps Script](https://developers.google.com/apps-script/guides/services/quotas). Untuk penggunaan intensif (ratusan submit per hari), pantau kuota di GAS Dashboard.
- **`getInitialData()` berjalan sekali** — Semua data (sales, customer, kategori, kota) diunduh saat form pertama kali dibuka. Perubahan data di Spreadsheet sumber baru terlihat setelah pengguna refresh halaman.
- **Header kolom case-sensitive** — Fungsi `getSheetDataByHeader()` dan `getCustomerData()` mencari header dengan exact match setelah strip whitespace. `"Nama Sales"` ≠ `"nama sales"`.
- **Karakter `\u00a0`** — Google Sheets terkadang menyisipkan non-breaking space di sel. Kode sudah menangani ini secara otomatis dengan `.replace(/\u00a0/g, " ")`.
- **ID Spreadsheet bukan URL** — `SPREADSHEET_ID` diisi dengan string ID saja (bukan URL lengkap). Contoh: `1rIop4CB6DvlwopvvH_Bmgujl0zAL3t2Zp2qE9KHPnaY`.
- **Satu `Code.gs` untuk banyak form** — Untuk membuat form serupa dengan konfigurasi berbeda (misalnya untuk cabang lain), duplikat proyek GAS dan ubah CONFIG-nya; tidak perlu mengubah logika kode.

---

### 📜 Lisensi

Proyek ini dikembangkan untuk keperluan internal internal perusahaan. Silakan sesuaikan dengan kebutuhan organisasi Anda.

---

* Dikembangkan oleh [ACC-TAX-REIGHTEEN](https://github.com/ACC-TAX-REIGHTEEN)
