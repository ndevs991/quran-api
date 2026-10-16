# Quran API

REST API gratis untuk mengakses data Al-Qur'an: teks ayat, terjemahan, tafsir, audio murottal dari berbagai qori, serta widget ayat yang bisa ditempel di situs mana pun.

🔗 **Live Demo & Dokumentasi:** https://quran-api-991.vercel.app/
🎧 **Murottal Player:** https://quran-api-991.vercel.app/murottal

## Fitur

- Data lengkap 114 surah beserta terjemahan
- Ambil ayat spesifik tanpa perlu fetch seluruh surah
- Audio murottal per surah maupun per ayat, dari beberapa qori (Alafasy, Ahmed Ajamy, Husary Mujawwad, Minshawi, Muhammad Ayyoub, Muhammad Jibreel)
- Pencarian ayat berdasarkan kata kunci (Arab & terjemahan)
- Data per juz (1–30)
- Ayat acak, bisa dibatasi ke surah tertentu
- Widget embeddable untuk menampilkan satu ayat di website lain, lengkap dengan audio

## Base URL

https://quran-api-991.vercel.app/


## Base URL

https://quran-api-991.vercel.app/

## Endpoints

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/surahs` | Daftar seluruh surah |
| GET | `/surahs/{number}` | Detail satu surah |
| GET | `/surahs/{number}/audio` | Audio full surah |
| GET | `/ayahs/{surah}/{ayah}` | Satu ayat spesifik |
| GET | `/ayahs/{surah}/{ayah}/audio` | Audio satu ayat |
| GET | `/search?q=` | Cari ayat berdasarkan kata kunci |
| GET | `/juz/{number}` | Seluruh ayat dalam satu juz |
| GET | `/random?surah=` | Ayat acak, opsional berdasarkan surah |
| GET | `/qoriahs` | Daftar qori |
| GET | `/qoriahs/{identifier}/surahs/{number}` | Audio surah berdasarkan qori |

Dokumentasi lengkap beserta contoh request dan response JSON tersedia di [halaman demo](https://quran-api-991.vercel.app/).

## Widget Ayat

Tempel satu ayat lengkap dengan teks Arab, terjemahan, dan tombol putar ke situs apa pun — blog, situs masjid, sekolah, dll. Cukup dua baris kode:

```html
<script src="https://quran-api-991.vercel.app/widget.js" async></script>
<div class="quran-ayah" data-surah="2" data-ayah="255"></div>
```

Lihat atribut yang didukung (`data-theme`, `data-qori`, dll) di [halaman dokumentasi](https://quran-api-991.vercel.app/#widget).

## Kontribusi

Issue dan pull request dipersilakan. Untuk permintaan fitur atau laporan bug, silakan buka [Issues](https://github.com/ndevs991/quran-api/issues).

## Lisensi

Gunakan secara bebas untuk proyek pribadi maupun komersial.