# Hangout Chrome Extension

Tambah tempat ke Hangout langsung dari **post Instagram** atau **Google Maps** — datanya terbaca otomatis saat halaman dibuka.

Download versi terbaru di halaman **/ekstensi** website Hangout (zip dibuat otomatis saat build dari folder ini lewat `npm run zip:extension`).

## Pasang (mode developer)

1. Ekstrak zip → folder `hangout-extension` (atau pakai folder `extension/` ini langsung).
2. Buka `chrome://extensions`, aktifkan **Developer mode**.
3. Klik **Load unpacked**, pilih foldernya, lalu pin ikon Hangout.
4. (Opsional) Ikon ⚙︎ di popup: ubah URL tujuan (default `https://hangout.wsningrat.com`) atau matikan panel otomatis.

## Fitur

- **Panel otomatis** di post/reel Instagram dan halaman tempat Google Maps (mengikuti navigasi di dalam kedua situs). Bisa dikecilkan jadi tombol “＋ Hangout”.
- **Instagram**: caption, foto, tag lokasi, hashtag → tag, jam buka, nama dari baris `📍`. Link Google Maps di caption dipakai untuk titik.
- **Google Maps**: nama, titik pin (`!3d…!4d…`), area dari alamat, kategori, foto.
- **Cari alamat / titik**: nama tempat/alamat (OpenStreetMap Nominatim, bias Bandung), link Google Maps (termasuk `maps.app.goo.gl`), atau koordinat `-6.9, 107.6`. Di Instagram pencarian berjalan otomatis bila titik belum ada.
- **Gabung IG + Maps**: “Cari di Google Maps” menyimpan draft IG; di halaman tempat Google Maps klik “Pakai titik ini”.
- **Klik kanan** link Google Maps → “Tambah link Google Maps ini ke Hangout”.

Semua berakhir di halaman `/tambah` website yang sudah terisi; cek lalu klik **Simpan Tempat**.

## Struktur

| File | Isi |
| --- | --- |
| `content.js` | Dimuat di Instagram & Google Maps; memasang panel (shadow DOM) dan memantau perubahan URL. |
| `panel.js` | UI panel, dipakai juga oleh popup. |
| `lib.js` | Ekstraksi halaman, parser link Maps, tebakan kategori/area, geocoding, URL prefill. |
| `background.js` | Service worker: resolve link pendek, geocoding (lepas dari CORS halaman), buka tab, menu klik kanan. |

## Catatan

- Belum ada backend: data tersimpan di localStorage domain website tujuan.
- Foto Instagram memakai link CDN yang bisa kedaluwarsa; web menampilkan placeholder kategori bila gagal dimuat.
- Selektor Instagram/Google Maps bisa berubah sewaktu-waktu; isi manual bila ada field kosong.
