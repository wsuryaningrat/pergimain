# Hangout

Platform untuk menemukan tempat menarik dan merencanakan jalan-jalan harian berdasarkan aktivitas, lokasi, waktu, dan budget.

## Status

**Phase 1 — UI/UX (frontend only, mock data, tanpa backend).**

Data tempat adalah data demo lokasi di Bandung dengan 6 kategori: cafe, kuliner, wisata, tempat nugas, kampus/universitas, dan masjid dengan kajian rutin. Tidak ada backend, login, pembayaran, atau integrasi peta/API eksternal pada tahap ini — semua state (saved places, itinerary) disimpan secara lokal di memori browser.

## Fitur MVP

- **Discover Places** — jelajahi cafe, kuliner, wisata, tempat nugas, kampus, dan masjid kajian.
- **Search & Filter** — filter berdasarkan kategori, area, budget, rating, dan tag aktivitas.
- **Place Details** — deskripsi, foto, jam buka, kisaran harga, dan durasi kunjungan.
- **Itinerary Planner** — pilih 3–5 tempat, atur urutan kunjungan.
- **Route Overview** — estimasi waktu tempuh antartempat (simulasi berbasis jarak).
- **Budget Estimator** — perkiraan total biaya makan, tiket, dan transportasi per orang.
- **Saved Places** — simpan tempat favorit.
- **Tambah Tempat** — form kontribusi pengguna, bisa impor dari link Google Maps.
- **Ekstensi Chrome** — tambah tempat sekali klik dari post Instagram / Google Maps. Download di halaman `/ekstensi`; detail di [`extension/README.md`](extension/README.md).

## Tech Stack

React + TypeScript + Vite + Tailwind CSS v4 + React Router.

## Menjalankan secara lokal

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy

Terhubung dengan Vercel untuk deploy otomatis setiap push ke branch `main`.
