
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

function toArabicNumber(number) {
    return String(number).replace(/\d/g, digit => '٠١٢٣٤٥٦٧٨٩'[digit]);
}

function getSurahName(surah) {
    return surah.name || surah.transliteration || surah.englishName || '';
}


function getRevelationLabel(value) {
    const revelation = String(value || '').toLowerCase();

    if (/meccan|makki|makkah|mekah/.test(revelation)) {
        return 'Makiyah';
    }

    if (/medinan|madani|madinah|medina/.test(revelation)) {
        return 'Madaniyah';
    }

    return '';
}

function getSurahNumber(surah) {
    return Number(surah.number || surah.id || 0);
}

function getSurahBySlug(slug) {
    return quran.find(surah => slugify(getSurahName(surah)) === slug);
}

function getAyahs(surah) {
    return Array.isArray(surah.ayahs) ? surah.ayahs : [];
}

module.exports = (req, res) => {
    const slug = String(req.query.slug || '').toLowerCase();

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
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="stylesheet" href="/murottal.css">
<meta name="robots" content="noindex,follow">
</head>
<body>
<main class="wrapper">
<div class="panel panel-player">
<div class="player-head">Surah tidak ditemukan</div>
<div class="player-body">
<div class="player-body-inner">
<div class="player-description">
<p>Surah yang kamu cari tidak tersedia.</p>
<a href="/murottal.html">Kembali ke daftar surah</a>
</div>
</div>
</div>
</div>
</main>
</body>
</html>`);
    }

	const name = getSurahName(surah);
	const number = getSurahNumber(surah);
	const ayahs = getAyahs(surah);
	const translationName = surah.translation || '';
	const revelation = getRevelationLabel(surah.revelation);
	const numberOfAyahs = surah.numberOfAyahs || ayahs.length;
	const surahIcon = `surah${String(number).padStart(3, '0')}`;
    const title = `Surah ${name} (${number}) - Murottal Al-Qur'an`;
    const description = `Dengarkan murottal Surah ${name} lengkap dengan teks ayat Al-Qur'an. Baca dan dengarkan Al-Qur'an secara online gratis.`;
    const canonical = `${BASE_URL}/murottal/${slug}`;

    const ayahHtml = ayahs.map((ayah, index) => {
        const arab = ayah.arab || ayah.text || ayah.arabic || '';
        const translation = ayah.translation || '';
        const ayahNumber = ayah.number && typeof ayah.number === 'object'
            ? ayah.number.inSurah
            : (ayah.numberInSurah || index + 1);

        return `
<div class="ayah-item" id="ayah-${escapeHtml(ayahNumber)}" data-ayah="${escapeHtml(ayahNumber)}">
    <p class="ayah-arab" lang="ar" dir="rtl">${escapeHtml(arab)} <span style="color:#E5AF76;font-size:21px;">۝${toArabicNumber(ayahNumber)}</span></p>
    ${translation ? `<p class="ayah-translation">${escapeHtml(translation)}</p>` : ''}
</div>`;
    }).join('\n');

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
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
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
<main class="wrapper">
<div class="panel panel-player">
	<header class="player-head surah-page-head">
		<div class="surah-page-heading">
			<span class="surah-number">${number}</span>
			<span class="surah-info">
				<span class="surah-name">${escapeHtml(name)}${revelation ? ' · ' + escapeHtml(revelation) : ''}</span>
				<span class="surah-meta">${escapeHtml(translationName)} · ${numberOfAyahs} ayat</span>
			</span>
			<span class="surah-arab" aria-hidden="true">${surahIcon}</span>
		</div>
	</header>

    <div class="footer-box">
        <div class="input-group">
            <select id="qoriSelect" aria-label="Pilih qari">
                <option value="ar.alafasy">Memuat daftar qari...</option>
            </select>
            <button id="saveQori" type="button">Simpan</button>
        </div>
    </div>

    <div class="player-body">
        <div class="glow"></div>
        <div class="player-body-inner">
            <div id="playerContent" class="ayah-list">
                ${ayahHtml}
            </div>
        </div>
    </div>

    <div class="player-controls">
        <button class="play-btn" id="playBtn" type="button" disabled>&#9654;</button>
        <span class="time" id="currentTime">0:00</span>
        <input type="range" class="seek" id="seekBar" value="0" min="0" max="100" step="1" disabled>
        <span class="time" id="duration">0:00</span>
        <span id="volumeIcon" role="button" tabindex="0" aria-label="Bisukan audio">&#128266;</span>
        <input type="range" class="volume" id="volumeBar" value="100" min="0" max="100" step="1">
    </div>
</div>
</main>

<div class="page-footer">
    <a href="/murottal.html">Kembali ke daftar surah</a>
</div>

<audio id="audioPlayer" preload="none"></audio>

<script>
(function () {
    const SURAH_NUMBER = ${number};
    const audio = document.getElementById('audioPlayer');
    const qoriSelect = document.getElementById('qoriSelect');
    const saveQoriBtn = document.getElementById('saveQori');
    const playBtn = document.getElementById('playBtn');
    const seekBar = document.getElementById('seekBar');
    const currentTimeEl = document.getElementById('currentTime');
    const durationEl = document.getElementById('duration');
    const volumeBar = document.getElementById('volumeBar');
    const volumeIcon = document.getElementById('volumeIcon');

    function formatTime(seconds) {
        if (!Number.isFinite(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const remaining = Math.floor(seconds % 60).toString().padStart(2, '0');
        return minutes + ':' + remaining;
    }

    function showToast(message) {
        let toast = document.getElementById('toast');

        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.className = 'toast';
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(toast.timer);
        toast.timer = setTimeout(function () {
            toast.classList.remove('show');
        }, 1800);
    }

    async function loadAudio() {
        try {
            const qori = qoriSelect.value || 'ar.alafasy';
            const response = await fetch(
                '/surahs/' + SURAH_NUMBER + '/audio?qori=' + encodeURIComponent(qori)
            );

            const data = await response.json();

            if (!response.ok || !data.audio) {
                throw new Error('Audio tidak tersedia');
            }

            audio.pause();
            audio.src = data.audio;
            audio.load();
            playBtn.disabled = false;
        } catch (error) {
            playBtn.disabled = true;
            showToast('Gagal memuat audio surah.');
        }
    }

    async function initQoriahs() {
        try {
            const response = await fetch('/qoriahs');

            if (!response.ok) {
                throw new Error('Gagal memuat qari');
            }

            const qoriahs = await response.json();
            const savedQori = localStorage.getItem('qoriah_murottal') || 'ar.alafasy';

            qoriSelect.innerHTML = '';

            qoriahs.forEach(function (qori) {
                qoriSelect.add(new Option(qori.name, qori.identifier));
            });

            qoriSelect.value = qoriahs.some(function (qori) {
                return qori.identifier === savedQori;
            }) ? savedQori : 'ar.alafasy';

            if (!qoriSelect.value && qoriahs.length) {
                qoriSelect.selectedIndex = 0;
            }

            await loadAudio();
        } catch (error) {
            qoriSelect.innerHTML = '';
            qoriSelect.add(new Option('Mishary Rashid Alafasy', 'ar.alafasy'));
            await loadAudio();
        }
    }

    saveQoriBtn.addEventListener('click', async function () {
        localStorage.setItem('qoriah_murottal', qoriSelect.value);
        await loadAudio();
        saveQoriBtn.textContent = 'Tersimpan';
        setTimeout(function () {
            saveQoriBtn.textContent = 'Simpan';
        }, 1200);
    });

    playBtn.addEventListener('click', async function () {
        if (audio.paused) {
            try {
                await audio.play();
            } catch (error) {
                showToast('Gagal memutar audio.');
            }
        } else {
            audio.pause();
        }
    });

    audio.addEventListener('play', function () {
        playBtn.innerHTML = '&#10073;&#10073;';
    });

    audio.addEventListener('pause', function () {
        playBtn.innerHTML = '&#9654;';
    });

    audio.addEventListener('loadedmetadata', function () {
        durationEl.textContent = formatTime(audio.duration);
        seekBar.disabled = false;
    });

    audio.addEventListener('timeupdate', function () {
        currentTimeEl.textContent = formatTime(audio.currentTime);

        if (audio.duration) {
            seekBar.value = (audio.currentTime / audio.duration) * 100;
        }
    });

    seekBar.addEventListener('input', function () {
        if (audio.duration) {
            audio.currentTime = (Number(seekBar.value) / 100) * audio.duration;
        }
    });

    volumeBar.addEventListener('input', function () {
        audio.volume = Number(volumeBar.value) / 100;
        audio.muted = audio.volume === 0;
        volumeIcon.innerHTML = audio.muted ? '&#128263;' : '&#128266;';
    });

    function toggleMute() {
        audio.muted = !audio.muted;
        volumeIcon.innerHTML = audio.muted ? '&#128263;' : '&#128266;';
    }

    volumeIcon.addEventListener('click', toggleMute);
    volumeIcon.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleMute();
        }
    });

    initQoriahs();
})();
</script>
</body>
</html>`);
};