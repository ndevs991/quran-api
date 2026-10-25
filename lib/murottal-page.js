const quran = require('../quran.json');

const BASE_URL = 'https://quran-api-991.vercel.app';

function slugify(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/[’']/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getSurahName(surah) {
    return surah.name || surah.transliteration || surah.englishName || '';
}

function getSurahNumber(surah) {
    return Number(surah.number || surah.id || 0);
}

function getSurahBySlug(slug) {
    return quran.find(surah => slugify(getSurahName(surah)) === slug);
}

function getAudioUrl(surah) {
    return surah.audio ||
        surah.audio_url ||
        surah.audioUrl ||
        '';
}

function getAyahs(surah) {
    return Array.isArray(surah.ayahs) ? surah.ayahs : [];
}

module.exports = (req, res) => {
    const slug = String(
        req.query.slug || ''
    ).toLowerCase();

    if (!slug) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.end('Slug surah tidak ditemukan.');
    }

    const surah = getSurahBySlug(slug);

    if (!surah) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.end(`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Surah Tidak Ditemukan | Quran API</title>
<meta name="robots" content="noindex,follow">
</head>
<body>
<h1>Surah tidak ditemukan</h1>
<p>Surah yang kamu cari tidak tersedia.</p>
<a href="/murottal">Kembali ke daftar surah</a>
</body>
</html>`);
    }

    const name = getSurahName(surah);
    const number = getSurahNumber(surah);
    const ayahs = getAyahs(surah);
    const title = `Surah ${name} (${number}) - Murottal Al-Qur'an`;
    const description = `Dengarkan murottal Surah ${name} lengkap dengan teks ayat Al-Qur'an. Baca dan dengarkan Al-Qur'an secara online gratis.`;
    const canonical = `${BASE_URL}/murottal/${slug}`;
    const audioUrl = getAudioUrl(surah);

    const ayahHtml = ayahs.map((ayah, index) => {
        const arab = ayah.arab ||
            ayah.text ||
            ayah.arabic ||
            '';

        const translation = ayah.translation ||
            ayah.transliteration ||
            '';

        const ayahNumber =
            ayah.numberInSurah ||
            ayah.number ||
            index + 1;

        return `
        <article class="ayah" id="ayah-${escapeHtml(ayahNumber)}">
            <div class="ayah-number">${escapeHtml(ayahNumber)}</div>
            <p class="ayah-arab" lang="ar" dir="rtl">${escapeHtml(arab)}</p>
            ${translation ? `<p class="ayah-translation">${escapeHtml(translation)}</p>` : ''}
        </article>`;
    }).join('\n');

    const audioPlayer = audioUrl
        ? `<audio id="surah-audio" controls preload="none">
               <source src="${escapeHtml(audioUrl)}" type="audio/mpeg">
               Browser kamu tidak mendukung pemutar audio.
           </audio>`
        : `<p class="audio-unavailable">Audio surah belum tersedia.</p>`;

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600');

    return res.end(`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">

<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${escapeHtml(canonical)}">

<meta property="og:type" content="article">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${escapeHtml(canonical)}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">

<link rel="stylesheet" href="/murottal.css">
</head>
<body>
<main class="container">
    <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="/">Beranda</a>
        <span aria-hidden="true">/</span>
        <a href="/murottal">Murottal</a>
        <span aria-hidden="true">/</span>
        <span>${escapeHtml(name)}</span>
    </nav>

    <header class="surah-header">
        <h1>Surah ${escapeHtml(name)}</h1>
        <p>Surah ke-${number} · ${ayahs.length} ayat</p>
    </header>

    <section class="panel panel-player" aria-label="Pemutar murottal">
        <h2>Murottal Surah ${escapeHtml(name)}</h2>
        ${audioPlayer}
    </section>

    <section class="ayah-list" aria-label="Ayat Al-Qur'an">
        ${ayahHtml || '<p>Data ayat belum tersedia.</p>'}
    </section>

    <footer>
        <a href="/murottal">Kembali ke daftar surah</a>
    </footer>
</main>
</body>
</html>`);
};