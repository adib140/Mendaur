# Pengujian PWA Offline - NF-03
## Mendaur Application

### Prasyarat
- Browser: Google Chrome (recommended) atau Edge
- Aplikasi sudah di-deploy dan diakses setidaknya sekali
- Service Worker sudah ter-install (cek di DevTools > Application > Service Workers)

---

## Test Case 1: Service Worker Registration
**Tujuan:** Memastikan service worker terdaftar dan aktif

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Buka aplikasi di Chrome | Halaman loading, kemudian tampil |
| 2 | Buka DevTools (F12) > Application > Service Workers | Service worker terdaftar dengan status "activated and running" |
| 3 | Cek "Source" dari service worker | Menampilkan file sw.js yang di-generate |

**Status:** ⬜ Pass / ⬜ Fail

---

## Test Case 2: Cache Storage Verification
**Tujuan:** Memastikan cache tersimpan dengan benar

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Buka DevTools > Application > Cache Storage | Terlihat beberapa cache bucket |
| 2 | Cek cache `workbox-precache-*` | Berisi file HTML, JS, CSS yang di-precache |
| 3 | Navigasi ke beberapa halaman (Home, Profil, Tabung) | Halaman tersebut ter-cache |
| 4 | Cek cache `api-cache` | Berisi response API yang sudah dipanggil |
| 5 | Cek cache `image-cache` atau `cloudinary-cache` | Berisi gambar yang sudah dimuat |

**Status:** ⬜ Pass / ⬜ Fail

---

## Test Case 3: Offline - Halaman yang Sudah Dikunjungi
**Tujuan:** Memastikan halaman yang sudah di-cache bisa diakses offline

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Pastikan sudah login dan kunjungi halaman: Dashboard, Profil, Tabung Sampah | Halaman tampil normal |
| 2 | Buka DevTools > Network > Pilih "Offline" | Mode offline aktif |
| 3 | Refresh halaman Dashboard | ✅ Halaman tetap tampil |
| 4 | Navigasi ke halaman Profil | ✅ Halaman tetap tampil |
| 5 | Cek banner di atas halaman | ✅ Muncul banner merah "Anda sedang offline" |
| 6 | Data user/statistik tetap terlihat | ✅ Data dari cache tampil |

**Status:** ⬜ Pass / ⬜ Fail

---

## Test Case 4: Offline - Gambar Cached
**Tujuan:** Memastikan gambar yang sudah dimuat tetap terlihat offline

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Online: Buka halaman Produk, scroll untuk load semua gambar | Gambar tampil semua |
| 2 | Aktifkan mode Offline | Mode offline aktif |
| 3 | Refresh halaman Produk | ✅ Gambar yang sudah di-cache tetap tampil |
| 4 | Gambar yang belum pernah di-load | ⚠️ Tidak tampil (expected) |

**Status:** ⬜ Pass / ⬜ Fail

---

## Test Case 5: Offline - Fallback Page
**Tujuan:** Memastikan halaman fallback tampil untuk halaman yang belum di-cache

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Aktifkan mode Offline | Mode offline aktif |
| 2 | Navigasi ke halaman yang BELUM pernah dikunjungi | ✅ Tampil halaman offline.html dengan pesan informatif |
| 3 | Halaman offline menampilkan tombol "Coba Lagi" | ✅ Tombol berfungsi |
| 4 | Matikan mode offline, klik "Coba Lagi" | ✅ Halaman asli tampil |

**Status:** ⬜ Pass / ⬜ Fail

---

## Test Case 6: Back Online Notification
**Tujuan:** Memastikan notifikasi muncul saat kembali online

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Dalam mode Offline, pastikan banner merah tampil | Banner "Anda sedang offline" terlihat |
| 2 | Matikan mode Offline (uncheck di DevTools) | Koneksi kembali |
| 3 | Cek perubahan di UI | ✅ Banner hijau "Koneksi kembali!" muncul |
| 4 | Banner hilang setelah beberapa detik atau diklik dismiss | ✅ Banner menghilang |

**Status:** ⬜ Pass / ⬜ Fail

---

## Test Case 7: API Data Caching
**Tujuan:** Memastikan data API yang di-cache tersedia offline

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Online: Buka Dashboard, tunggu data statistik tampil | Data poin, leaderboard, aktivitas tampil |
| 2 | Aktifkan mode Offline | Mode offline aktif |
| 3 | Refresh halaman | ✅ Data statistik masih tampil dari cache |
| 4 | Cek DevTools > Network | Request ke API gagal tapi halaman tetap menampilkan data |

**Status:** ⬜ Pass / ⬜ Fail

---

## Test Case 8: PWA Install Prompt
**Tujuan:** Memastikan aplikasi bisa di-install sebagai PWA

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Buka aplikasi di Chrome | Halaman tampil |
| 2 | Cek address bar atau menu Chrome | ✅ Ada opsi "Install Mendaur" |
| 3 | Klik install | ✅ Aplikasi ter-install sebagai standalone app |
| 4 | Buka aplikasi dari shortcut | ✅ Berjalan dalam mode standalone |
| 5 | Test offline di app yang ter-install | ✅ Offline mode berfungsi sama |

**Status:** ⬜ Pass / ⬜ Fail

---

## Test Case 9: Mobile Device Testing
**Tujuan:** Memastikan PWA offline berfungsi di mobile

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Buka aplikasi di browser mobile (Chrome Android/Safari iOS) | Halaman tampil |
| 2 | Add to Home Screen / Install App | ✅ Aplikasi ter-install |
| 3 | Buka app, navigasi beberapa halaman | Halaman tersimpan di cache |
| 4 | Aktifkan Airplane Mode | Mode offline |
| 5 | Buka app dari home screen | ✅ App tetap bisa dibuka |
| 6 | Navigasi ke halaman yang sudah dikunjungi | ✅ Halaman tampil dari cache |

**Status:** ⬜ Pass / ⬜ Fail

---

## Ringkasan Hasil Pengujian

| Test Case | Deskripsi | Status |
|-----------|-----------|--------|
| TC-1 | Service Worker Registration | ⬜ |
| TC-2 | Cache Storage Verification | ⬜ |
| TC-3 | Offline - Halaman Cached | ⬜ |
| TC-4 | Offline - Gambar Cached | ⬜ |
| TC-5 | Offline - Fallback Page | ⬜ |
| TC-6 | Back Online Notification | ⬜ |
| TC-7 | API Data Caching | ⬜ |
| TC-8 | PWA Install | ⬜ |
| TC-9 | Mobile Device | ⬜ |

---

## Catatan Pengujian

**Tanggal:** ________________

**Penguji:** ________________

**Browser/Device:** ________________

**Catatan Tambahan:**
```




```

---

## Kesimpulan

⬜ **LULUS** - Semua test case passed, NF-03 terpenuhi

⬜ **TIDAK LULUS** - Ada test case yang gagal, perlu perbaikan

**Tanda Tangan Penguji:**

________________
