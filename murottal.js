const API_BASE = "";
const audio = document.getElementById("audioPlayer");
const surahListEl = document.getElementById("surahList");
const searchInput = document.getElementById("searchInput");
const qoriSelect = document.getElementById("qoriSelect");
const saveQoriBtn = document.getElementById("saveQori");
const playBtn = document.getElementById("playBtn");
const seekBar = document.getElementById("seekBar");
const currentTimeEl = document.getElementById("currentTime");
const durationEl = document.getElementById("duration");
const volumeBar = document.getElementById("volumeBar");
const volumeIcon = document.getElementById("volumeIcon");
const autoScrollBtn = document.getElementById("autoScrollBtn");
const playerBodyInner = document.querySelector(".player-body-inner");
const speedLabel = document.getElementById("speedLabel");

let surahs = [];
let activeBtn = null;
let autoScrollEnabled = true;
let isProgrammaticScroll = false;
let autoScrollSpeed = 1;
let currentAyahs = [];
let currentSurahName = "";
let activeTafsirIndex = null;
let activeTafsirSource = "kemenag";
let searchTimer;
let searchMode = "surah";
let searchRequestId = 0;  

let playMode = localStorage.getItem("playMode") === "ayah" ? "ayah" : "surah";
let currentAyahIndex = -1;
let playToken = 0;
const ayahUrlCache = new Map();
const preloader = new Audio();
preloader.preload = "auto";

document.getElementById("playModeSelect").value = playMode;  

const tafsirOverlay = document.getElementById("tafsirOverlay");
const tafsirTitle = document.getElementById("tafsirTitle");
const tafsirBody = document.getElementById("tafsirBody");

function getTafsirText(ayah, source) {
    const t = ayah.tafsir[source];
    if (!t) return "Tafsir tidak tersedia.";
    return typeof t === "string" ? t : (t.long || t.short || "Tafsir tidak tersedia.");
}

function renderTafsirBody() {
    const ayah = currentAyahs[activeTafsirIndex];
    tafsirTitle.textContent = `Tafsir Ayat ${ayah.number.inSurah}`;
    tafsirBody.textContent = getTafsirText(ayah, activeTafsirSource);

    document.querySelectorAll(".tafsir-tab").forEach(tab => {
        tab.classList.toggle("active", tab.dataset.source === activeTafsirSource);
    });
}

function openTafsir(idx) {
    activeTafsirIndex = idx;
    activeTafsirSource = "kemenag";
    renderTafsirBody();
    tafsirOverlay.classList.add("open");
}

function closeTafsir() {
    tafsirOverlay.classList.remove("open");
}

function switchTafsirTab(source) {
    activeTafsirSource = source;
    renderTafsirBody();
}

let embedAyah = null;

function openEmbed(idx) {
    embedAyah = {
        surah: Number(audio.dataset.currentNumber),
        ayah: currentAyahs[idx].number.inSurah
    };
    document.getElementById("embedTitle").textContent = `Sematkan ${currentSurahName} : ${embedAyah.ayah}`;
    renderEmbed();
    document.getElementById("embedOverlay").classList.add("open");
}

function closeEmbed() {
    document.getElementById("embedOverlay").classList.remove("open");
}

function renderEmbed() {
    const theme = document.getElementById("embedTheme").value;
    const dataTheme = theme === "dark" ? ' data-theme="dark"' : "";

    document.getElementById("embedCode").value =
`<script src="${location.origin}/widget.js" async><\/script>
<div class="quran-ayah" data-surah="${embedAyah.surah}" data-ayah="${embedAyah.ayah}"${dataTheme}></div>`;

    const preview = document.getElementById("embedPreview");
    preview.innerHTML = "";

    const div = document.createElement("div");
    div.className = "quran-ayah";
    div.dataset.surah = embedAyah.surah;
    div.dataset.ayah = embedAyah.ayah;
    div.dataset.theme = theme;
    preview.appendChild(div);

    if (window.QuranApiWidget) window.QuranApiWidget.init(preview);
}

function copyEmbedCode() {
    navigator.clipboard.writeText(document.getElementById("embedCode").value)
        .then(() => showToast("Kode disalin!"));
}  

function toggleAyahMenu(event, idx) {
    event.stopPropagation();
    const dropdown = document.getElementById(`ayahDropdown-${idx}`);
    const isOpen = dropdown.classList.contains("open");
    closeAllAyahMenus();
    if (!isOpen) dropdown.classList.add("open");
}

function closeAllAyahMenus() {
    document.querySelectorAll(".ayah-dropdown.open").forEach(el => el.classList.remove("open"));
}

async function getAyahAudioUrl(surahNumber, ayahNumber) {
    const qori = getSelectedQori();
    const key = `${qori}:${surahNumber}:${ayahNumber}`;
    if (ayahUrlCache.has(key)) return ayahUrlCache.get(key);

    const res = await fetch(`${API_BASE}/ayahs/${surahNumber}/${ayahNumber}/audio?qori=${qori}`);
    const data = await res.json();
    if (!data.audio) throw new Error("Audio tidak tersedia");

    ayahUrlCache.set(key, data.audio);
    return data.audio;
}

async function prefetchAyah(idx) {
    if (idx >= currentAyahs.length) return;
    try {
        const url = await getAyahAudioUrl(Number(audio.dataset.currentNumber), currentAyahs[idx].number.inSurah);
        preloader.src = url;
    } catch (err) {}
}

function scrollToAyahItem(el) {
    const delta = el.getBoundingClientRect().top - playerBodyInner.getBoundingClientRect().top - 12;
    if (Math.abs(delta) < 1) return;

    const before = playerBodyInner.scrollTop;
    isProgrammaticScroll = true;
    playerBodyInner.scrollTop = before + delta;
    if (playerBodyInner.scrollTop === before) isProgrammaticScroll = false;
}

function highlightCurrentAyah(idx) {
    document.querySelectorAll(".ayah-item.playing").forEach(el => el.classList.remove("playing"));

    const el = document.querySelector(`.ayah-item[data-ayah="${currentAyahs[idx].number.inSurah}"]`);
    if (!el) return;

    el.classList.add("playing");
    if (autoScrollEnabled) scrollToAyahItem(el);
}

async function playAyahAt(idx) {
    const token = ++playToken;
    const ayah = currentAyahs[idx];
    const surahNumber = Number(audio.dataset.currentNumber);

    currentAyahIndex = idx;
    highlightCurrentAyah(idx);

    try {
        const url = await getAyahAudioUrl(surahNumber, ayah.number.inSurah);
        if (token !== playToken) return;

        ayahAudio.pause();
        audio.src = url;
        await audio.play();
        prefetchAyah(idx + 1);
    } catch (err) {
        if (token === playToken) showToast("Gagal memutar ayat.");
    }
}

function setPlayMode(mode) {
    playMode = mode;
    localStorage.setItem("playMode", mode);

    const current = Number(audio.dataset.currentNumber);
    if (current) playSurahByNumber(current);
}  

document.addEventListener("click", closeAllAyahMenus);

let toastTimeout;
function showToast(message) {
    let toast = document.getElementById("toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast";
        toast.className = "toast";
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove("show"), 1800);
}

function copyAyah(idx) {
    const ayah = currentAyahs[idx];
    const text = `${ayah.arab}\n\n${ayah.translation}`;
    navigator.clipboard.writeText(text).then(() => showToast("Teks ayat disalin!"));
}

const ayahAudio = document.getElementById("ayahAudioPlayer");

async function playAyah(idx) {
    if (playMode === "ayah") {
        playAyahAt(idx);
        return;
    }  
  
    const ayah = currentAyahs[idx];
    const surahNumber = Number(audio.dataset.currentNumber);
    const qori = getSelectedQori();

    try {
        const res = await fetch(`${API_BASE}/ayahs/${surahNumber}/${ayah.number.inSurah}/audio?qori=${qori}`);
        const data = await res.json();

        audio.pause();
        ayahAudio.src = data.audio;
        ayahAudio.play();
        showToast(`Memutar ayat ${ayah.number.inSurah} ...`);
    } catch (err) {
        showToast("Gagal memutar ayat.");
    }
}

function shareAyah(ayahNumber) {
    const surahNumber = Number(audio.dataset.currentNumber);
    const url = `${location.origin}${location.pathname}?surah=${surahNumber}&ayah=${ayahNumber}`;
    if (navigator.share) {
        navigator.share({ url }).catch(() => {});
    } else {
        navigator.clipboard.writeText(url).then(() => showToast("Link ayat disalin!"));
    }
}

function wrapText(ctx, text, maxWidth) {
    const words = text.split(" ");
    const lines = [];
    let line = "";

    words.forEach(word => {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && line) {
            lines.push(line);
            line = word;
        } else {
            line = test;
        }
    });

    if (line) lines.push(line);
    return lines;
}

async function shareAyahImage(idx) {
    const ayah = currentAyahs[idx];
    const ayahNumber = ayah.number.inSurah;
    const W = 1080;
    const PAD = 90;
    const maxWidth = W - PAD * 2;

    const arabFont = "64px Amiri, 'Traditional Arabic', serif";
    const transFont = "34px Roboto, Arial, sans-serif";
    const arabText = `${ayah.arab} ۝${toArabicNumber(ayahNumber)}`;

    await document.fonts.load("64px Amiri", arabText);

    const measure = document.createElement("canvas").getContext("2d");
    measure.direction = "rtl";
    measure.font = arabFont;
    const arabLines = wrapText(measure, arabText, maxWidth);

    measure.direction = "ltr";
    measure.font = transFont;
    const transLines = wrapText(measure, ayah.translation, maxWidth);

    const arabLH = 64 * 1.9;
    const transLH = 34 * 1.55;
    const headerH = 150;
    const footerH = 130;
    const gap = 70;
    const H = headerH + arabLines.length * arabLH + gap + transLines.length * transLH + footerH;

    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#0b1120");
    bg.addColorStop(1, "#111827");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const glow = ctx.createRadialGradient(W, H, 0, W, H, 520);
    glow.addColorStop(0, "rgba(37,99,235,0.35)");
    glow.addColorStop(1, "rgba(37,99,235,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.direction = "ltr";
    ctx.font = "bold 34px Roboto, Arial, sans-serif";
    ctx.fillStyle = "#7dd3fc";
    ctx.fillText(`${currentSurahName} · Ayat ${ayahNumber}`, W / 2, headerH / 2);

    let y = headerH;

    const marker = `۝${toArabicNumber(ayahNumber)}`;
    
    ctx.direction = "rtl";
    ctx.font = arabFont;
    arabLines.forEach((line, i) => {
        const cy = y + arabLH / 2;
        const isLast = i === arabLines.length - 1;
    
        if (isLast && line.endsWith(marker)) {
            const text = line.slice(0, -marker.length).trimEnd();
            const textW = text ? ctx.measureText(text).width : 0;
            const spaceW = text ? ctx.measureText(" ").width : 0;
            const markerW = ctx.measureText(marker).width;
            const xRight = W / 2 + (textW + spaceW + markerW) / 2;
    
            ctx.textAlign = "right";
            if (text) {
                ctx.fillStyle = "#e2e8f0";
                ctx.fillText(text, xRight, cy);
            }
            ctx.fillStyle = "#E5AF76";
            ctx.fillText(marker, xRight - textW - spaceW, cy);
            ctx.textAlign = "center";
        } else {
            ctx.fillStyle = "#e2e8f0";
            ctx.fillText(line, W / 2, cy);
        }
        y += arabLH;
    });

    y += gap / 2;
    ctx.strokeStyle = "#2b3648";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 80, y);
    ctx.lineTo(W / 2 + 80, y);
    ctx.stroke();
    y += gap / 2;

    ctx.direction = "ltr";
    ctx.font = transFont;
    ctx.fillStyle = "#cbd5e1";
    transLines.forEach(line => {
        ctx.fillText(line, W / 2, y + transLH / 2);
        y += transLH;
    });

    ctx.font = "26px Roboto, Arial, sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText(`${location.host}${location.pathname}`, W / 2, H - footerH / 2);

    canvas.toBlob(async (blob) => {
        const safeName = currentSurahName.replace(/[^\w]+/g, "-");
        const fileName = `${safeName}-ayat-${ayahNumber}.png`;
        const file = new File([blob], fileName, { type: "image/png" });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({ files: [file] });
                return;
            } catch (err) {
                if (err.name === "AbortError") return;
            }
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        showToast("Gambar disimpan");
    }, "image/png");
}  

function checkUrlParams() {
    const params = new URLSearchParams(location.search);
    const surahParam = Number(params.get("surah"));
    const ayahParam = Number(params.get("ayah"));

    if (surahParam) {
        playSurahByNumber(surahParam).then(() => {
            if (ayahParam) {
                setTimeout(() => {
                    const target = document.querySelector(`.ayah-item[data-ayah="${ayahParam}"]`);
                    if (target) {
                        autoScrollEnabled = false;
                        target.scrollIntoView({ block: "nearest" });
                        target.style.transition = "background 0.4s";
                        target.style.background = "rgba(37,99,235,0.15)";
                        setTimeout(() => target.style.background = "", 2000);
                    }
                }, 300);
            }
        });
    }
}

function formatTime(sec) {
    if (!isFinite(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}

function getSelectedQori() {
    return localStorage.getItem("qoriah_murottal") || "ar.alafasy";
}

function enableAutoScroll() {
    autoScrollEnabled = true;
    autoScrollBtn.style.display = "none";

    if (playMode === "ayah") {
        const el = document.querySelector(".ayah-item.playing");
        if (el) scrollToAyahItem(el);
    }
}

function adjustScrollSpeed(delta) {
    autoScrollSpeed = Math.min(3, Math.max(0.2, +(autoScrollSpeed + delta).toFixed(1)));
    speedLabel.textContent = autoScrollSpeed.toFixed(1) + "x";
}

function populateJumpAyahSelect() {
    const select = document.getElementById("jumpAyahSelect");
    select.innerHTML = '<option value="">Ayat</option>';
    currentAyahs.forEach(ayah => {
        const opt = document.createElement("option");
        opt.value = ayah.number.inSurah;
        opt.textContent = `Ayat ${ayah.number.inSurah}`;
        select.appendChild(opt);
    });
}

function jumpToAyah(ayahNumber) {
    if (!ayahNumber) return;
  
    if (playMode === "ayah") {
        const idx = currentAyahs.findIndex(a => a.number.inSurah === Number(ayahNumber));
        if (idx !== -1) playAyahAt(idx);
        document.getElementById("jumpAyahSelect").value = "";
        return;
    }
  
    const target = document.querySelector(`.ayah-item[data-ayah="${ayahNumber}"]`);
    if (target) {
        autoScrollEnabled = false;
        autoScrollBtn.style.display = "inline-block";
        target.scrollIntoView({ block: "nearest" });
        target.style.transition = "background 0.4s";
        target.style.background = "rgba(37,99,235,0.15)";
        setTimeout(() => target.style.background = "", 2000);
    }
    document.getElementById("jumpAyahSelect").value = "";
}  

playerBodyInner.addEventListener("scroll", () => {
    if (isProgrammaticScroll) {
        isProgrammaticScroll = false;
        return;
    }
    autoScrollEnabled = false;
    autoScrollBtn.style.display = "inline-block";
});

function toggleSettingsPopover(event) {
    event.stopPropagation();
    document.getElementById("settingsPopover").classList.toggle("open");
}

document.addEventListener("click", (e) => {
    const popover = document.getElementById("settingsPopover");
    if (!popover.contains(e.target) && e.target.id !== "settingsPopover") {
        popover.classList.remove("open");
    }
});

const fontSizeSteps = [
    { size: 16, label: "Kecil" },
    { size: 18, label: "Sedang" },
    { size: 21, label: "Normal" },
    { size: 24, label: "Besar" },
    { size: 28, label: "Sangat Besar" },
    { size: 32, label: "Ekstra Besar" }
];

let fontSizeIndex = parseInt(localStorage.getItem("arabicFontSizeIndex"));
if (isNaN(fontSizeIndex) || !fontSizeSteps[fontSizeIndex]) fontSizeIndex = 2;

function applyArabicFontSize() {
    const step = fontSizeSteps[fontSizeIndex];
    document.documentElement.style.setProperty("--arabic-font-size", step.size + "px");
    document.getElementById("fontSizeLabel").textContent = step.label;
    localStorage.setItem("arabicFontSizeIndex", fontSizeIndex);
}

function adjustArabicFontSize(delta) {
    fontSizeIndex = Math.min(fontSizeSteps.length - 1, Math.max(0, fontSizeIndex + delta));
    applyArabicFontSize();
}

applyArabicFontSize();

async function loadSurahs() {
    const res = await fetch(`${API_BASE}/surahs`);
    surahs = await res.json();
    renderSurahList(surahs);
}

function renderSurahList(list) {
    surahListEl.innerHTML = "";
    list.forEach(surah => {
        const btn = document.createElement("button");
        btn.className = "surah-btn";
        btn.dataset.number = surah.number;
        btn.innerHTML = `
            <span class="surah-number">${surah.number}</span>
            <span class="surah-info">
                <span class="surah-name">${surah.name}</span>
                <span class="surah-meta">${surah.translation} · ${surah.numberOfAyahs} ayat</span>
            </span>
            <span class="surah-arab" aria-hidden="true">surah${String(surah.number).padStart(3, "0")}</span>
        `;
        btn.onclick = () => playSurahByNumber(surah.number);
        surahListEl.appendChild(btn);
    });
}

async function loadQoriahs() {
    const res = await fetch(`${API_BASE}/qoriahs`);
    const qoriahs = await res.json();
    qoriSelect.innerHTML = "";
    qoriahs.forEach(q => {
        const opt = document.createElement("option");
        opt.value = q.identifier;
        opt.textContent = q.name;
        qoriSelect.appendChild(opt);
    });
    qoriSelect.value = getSelectedQori();
}

function toArabicNumber(number) {
    return String(number).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
}

async function playSurahByNumber(number, autoplay = true) {
    const surah = surahs.find(s => s.number === number);
    if (!surah) return;

    ayahAudio.pause();
    audio.pause();
    playToken++;      

    autoScrollEnabled = true;
    autoScrollBtn.style.display = "none";

    const btn = surahListEl.querySelector(`.surah-btn[data-number="${number}"]`);
    if (activeBtn) activeBtn.classList.remove("active");
    if (btn) {
        btn.classList.add("active");
        activeBtn = btn;
    } else {
        activeBtn = null;
    }

    if (playerBodyInner.scrollTop !== 0) {
        isProgrammaticScroll = true;
        playerBodyInner.scrollTop = 0;
    }     
  
    document.getElementById("playerTitle").textContent = "Memuat ...";
    document.getElementById("playerContent").innerHTML = `<span id="playerText">Memuat ${surah.name} ...</span>`;

    try {
        const qori = getSelectedQori();
        const [detailRes, audioRes] = await Promise.all([
            fetch(`${API_BASE}/surahs/${surah.number}`),
            playMode === "surah"
                ? fetch(`${API_BASE}/surahs/${surah.number}/audio?qori=${qori}`)
                : Promise.resolve(null)
        ]);
        const detail = await detailRes.json();
        
        audio.dataset.currentNumber = surah.number;
        if (audioRes) {
            const audioData = await audioRes.json();
            audio.src = audioData.audio;
            if (autoplay) audio.play();
        }

        document.getElementById("playerTitle").textContent = `${detail.name} - ${detail.revelation}`;
        document.querySelector(".scroll-controls").style.display = "flex";
        document.querySelector(".player-head").classList.remove("idle");

        currentAyahs = detail.ayahs;
        currentSurahName = detail.name;

        populateJumpAyahSelect();

        const ayahsHtml = detail.ayahs.map((ayah, idx) => `
            <div class="ayah-item" data-ayah="${ayah.number.inSurah}">
                <div class="ayah-menu">
                    <button class="tafsir-btn" onclick="toggleAyahMenu(event, ${idx})">&#8942;</button>
                    <div class="ayah-dropdown" id="ayahDropdown-${idx}">
                        <button onclick="playAyah(${idx}); closeAllAyahMenus()">▶️ Putar Ayat</button>
                        <button onclick="openTafsir(${idx}); closeAllAyahMenus()">📖 Lihat Tafsir</button>
                        <button onclick="copyAyah(${idx}); closeAllAyahMenus()">📋 Copy</button>
                        <button onclick="shareAyah(${ayah.number.inSurah}); closeAllAyahMenus()">🔗 Bagikan</button>
                        <button onclick="shareAyahImage(${idx}); closeAllAyahMenus()">🖼️ Bagikan Gambar Ayat</button>
                        <button onclick="openEmbed(${idx}); closeAllAyahMenus()">🧩 Sematkan Ayat</button>
                    </div>
                </div>
                <p class="ayah-arab">${ayah.arab} <span style="color:#E5AF76; font-size:21px;">۝${toArabicNumber(ayah.number.inSurah)}</span></p>
                <p class="ayah-translation">${ayah.translation}</p>
            </div>
        `).join("");

        document.getElementById("playerContent").innerHTML = `
            <div class="ayah-list">${ayahsHtml}</div>
        `;

        playBtn.disabled = false;
        seekBar.disabled = false;
        if (playMode === "ayah" && autoplay) playAyahAt(0);
    } catch (err) {
        document.getElementById("playerContent").innerHTML = `<span id="playerText">Gagal memuat audio.</span>`;
    }
}

audio.onended = () => {
    if (playMode === "ayah" && currentAyahIndex + 1 < currentAyahs.length) {
        playAyahAt(currentAyahIndex + 1);
        return;
    }

    const current = Number(audio.dataset.currentNumber);
    const next = surahs.find(s => s.number === current + 1);
    if (next) {
        playSurahByNumber(next.number);
    }
};

playBtn.onclick = () => {
    ayahAudio.pause();
    if (audio.paused) {
        audio.play();
    } else {
        audio.pause();
    }
};

audio.onplay = () => {
    playBtn.innerHTML = "&#10073;&#10073;";
};

audio.onpause = () => {
    playBtn.innerHTML = "&#9654;";
};

audio.ontimeupdate = () => {
    if (audio.duration) {
        seekBar.value = (audio.currentTime / audio.duration) * 100;
        currentTimeEl.textContent = formatTime(audio.currentTime);
        durationEl.textContent = formatTime(audio.duration);

        const startOffset = 10;
        if (playMode === "surah" && autoScrollEnabled && audio.currentTime >= startOffset) {
            const inner = document.querySelector(".player-body-inner");
            const progress = (audio.currentTime - startOffset) / (audio.duration - startOffset);
            const adjustedProgress = Math.min(1, Math.max(0, progress * autoScrollSpeed));
            const maxScroll = inner.scrollHeight - inner.clientHeight;
            isProgrammaticScroll = true;
            inner.scrollTop = adjustedProgress * maxScroll;
        }
    }
};

seekBar.oninput = () => {
    if (audio.duration) {
        audio.currentTime = (seekBar.value / 100) * audio.duration;
    }
};

volumeBar.oninput = () => {
    audio.volume = volumeBar.value / 100;
    volumeIcon.innerHTML = audio.volume == 0 ? "&#128263;" : "&#128266;";
};

volumeIcon.onclick = () => {
    audio.muted = !audio.muted;
    volumeIcon.innerHTML = audio.muted ? "&#128263;" : "&#128266;";
};

searchInput.oninput = () => {
    const value = searchInput.value.trim();
    document.getElementById("searchClear").style.display = value ? "flex" : "none";

    if (searchMode === "surah") {
        const q = value.toLowerCase();
        renderSurahList(surahs.filter(s => s.name.toLowerCase().includes(q)));
        return;
    }

    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => searchAyah(value), 400);
};

function clearSearch() {
    searchInput.value = "";
    document.getElementById("searchClear").style.display = "none";
    clearTimeout(searchTimer);
    searchRequestId++;

    if (searchMode === "surah") {
        renderSurahList(surahs);
    } else {
        showSearchMessage("Ketik minimal 3 huruf untuk mencari ayat.");
    }
    searchInput.focus();
}

function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

function highlight(text, q) {
    const pattern = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return text
        .split(new RegExp(`(${pattern})`, "gi"))
        .map((part, i) => i % 2 ? `<mark>${escapeHtml(part)}</mark>` : escapeHtml(part))
        .join("");
}

function makeSnippet(text, q, before, after) {
    const pattern = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const m = new RegExp(pattern, "i").exec(text);
    if (!m || text.length <= before + after) return text;

    let start = Math.max(0, m.index - before);
    if (start > 0) start = text.lastIndexOf(" ", start) + 1;

    let end = Math.min(text.length, m.index + m[0].length + after);
    if (end < text.length) {
        const sp = text.indexOf(" ", end);
        end = sp === -1 ? text.length : sp;
    }

    return (start > 0 ? "… " : "") + text.slice(start, end) + (end < text.length ? " …" : "");
}

function showSearchMessage(text) {
    surahListEl.innerHTML = `<div class="search-info">${text}</div>`;
}

function setSearchMode(mode) {
    searchMode = mode;
    searchInput.placeholder = mode === "surah"
        ? "Cari nama surat ..."
        : "Cari ayat ...";
    clearSearch();
}

async function searchAyah(q) {
    const requestId = ++searchRequestId;

    if (q.length < 3) {
        showSearchMessage("Ketik minimal 3 huruf untuk mencari ayat.");
        return;
    }

    showSearchMessage("Mencari ...");

    try {
        const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (requestId !== searchRequestId) return;
        renderAyahResults(data, q);
    } catch (err) {
        if (requestId !== searchRequestId) return;
        showSearchMessage("Gagal mencari ayat.");
    }
}

function renderAyahResults(data, q) {
    if (!data.results || !data.results.length) {
        showSearchMessage("Tidak ada ayat yang cocok.");
        return;
    }

    const isArabic = /[\u0600-\u06FF]/.test(q);
    const shown = data.results.slice(0, 50);

    surahListEl.innerHTML = "";

    const info = document.createElement("div");
    info.className = "search-info";
    info.textContent = data.total > shown.length
        ? `${data.total} ayat ditemukan, menampilkan ${shown.length} pertama`
        : `${data.total} ayat ditemukan`;
    surahListEl.appendChild(info);

    shown.forEach(r => {
        const btn = document.createElement("button");
        btn.className = "surah-btn";
        btn.innerHTML = `
            <span class="surah-number">${r.number.inSurah}</span>
            <span class="surah-info">
                <span class="surah-name">${escapeHtml(r.surah.name)}</span>
                <span class="surah-snippet${isArabic ? " is-arab" : ""}">${highlight(isArabic ? makeSnippet(r.arab, q, 10, 50) : makeSnippet(r.translation, q, 15, 70), q)}</span>
            </span>
            <span class="surah-arab" aria-hidden="true">surah${String(r.surah.number).padStart(3, "0")}</span>
        `;
        btn.onclick = () => openAyah(r.surah.number, r.number.inSurah);
        surahListEl.appendChild(btn);
    });

    surahListEl.scrollTop = 0;
}

function openAyah(surahNumber, ayahNumber) {
    playSurahByNumber(surahNumber, false).then(() => {
        if (Number(audio.dataset.currentNumber) !== surahNumber) return;

        const idx = currentAyahs.findIndex(a => a.number.inSurah === ayahNumber);
        if (idx === -1) return;

        if (playMode === "ayah") {
            playAyahAt(idx);
            return;
        }

        const target = document.querySelector(`.ayah-item[data-ayah="${ayahNumber}"]`);
        if (target) {
            autoScrollEnabled = false;
            autoScrollBtn.style.display = "inline-block";
            target.scrollIntoView({ block: "nearest" });
            target.style.transition = "background 0.4s";
            target.style.background = "rgba(37,99,235,0.15)";
            setTimeout(() => target.style.background = "", 2000);
        }

        playAyah(idx);
    });
}

saveQoriBtn.onclick = () => {
    localStorage.setItem("qoriah_murottal", qoriSelect.value);
    saveQoriBtn.textContent = "Tersimpan";
    setTimeout(() => saveQoriBtn.textContent = "Simpan", 1200);
};

async function init() {
    await Promise.all([loadSurahs(), loadQoriahs()]);
    checkUrlParams();
}
init();
