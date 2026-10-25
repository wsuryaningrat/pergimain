# PergiMain

Platform untuk menemukan tempat menarik dan merencanakan jalan-jalan harian berdasarkan aktivitas, lokasi, waktu, dan budget.

## Status

**Phase 1 — UI/UX (frontend only, mock data, tanpa backend).**

Seluruh data tempat adalah data simulasi (demo) berisi 16 lokasi di Bandung: cafe, kuliner, wisata, dan tempat nugas. Tidak ada backend, login, pembayaran, atau integrasi peta/API eksternal pada tahap ini — semua state (saved places, itinerary) disimpan secara lokal di memori browser.

## Fitur MVP

- **Discover Places** — jelajahi cafe, kuliner, wisata, dan tempat nugas.
- **Search & Filter** — filter berdasarkan kategori, area, budget, rating, dan tag aktivitas.
- **Place Details** — deskripsi, foto, jam buka, kisaran harga, dan durasi kunjungan.
- **Itinerary Planner** — pilih 3–5 tempat, atur urutan kunjungan.
- **Route Overview** — estimasi waktu tempuh antartempat (simulasi berbasis jarak).
- **Budget Estimator** — perkiraan total biaya makan, tiket, dan transportasi per orang.
- **Saved Places** — simpan tempat favorit.

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
