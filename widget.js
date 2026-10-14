(function () {
    "use strict";

    var script = document.currentScript;
    var API_BASE = script && script.src
        ? new URL(script.src).origin
        : "https://quran-api-991.vercel.app";

    var PLAY_ICON = "\u25B6\uFE0E";
    var PAUSE_ICON = "\u275A\u275A";
    var ARABIC_DIGITS = "\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669";

    var CSS = `
        :host { display: block; }

        .card {
            --bg: #ffffff;
            --fg: #1e293b;
            --muted: #64748b;
            --border: #e2e8f0;
            --accent: #2563eb;
            --on-accent: #ffffff;
            --gold: #b7791f;
            box-sizing: border-box;
            background: var(--bg);
            color: var(--fg);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 16px 18px;
            font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
            line-height: 1.6;
        }

        .card.dark {
            --bg: #111827;
            --fg: #e2e8f0;
            --muted: #94a3b8;
            --border: #1e293b;
            --accent: #7dd3fc;
            --on-accent: #0b1120;
            --gold: #E5AF76;
        }

        .head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
        }

        .ref {
            font-size: 13px;
            font-weight: 600;
            color: var(--accent);
        }

        .play {
            flex-shrink: 0;
            width: 34px;
            height: 34px;
            border: 0;
            border-radius: 50%;
            background: var(--accent);
            color: var(--on-accent);
            font-size: 13px;
            cursor: pointer;
        }

        .play:hover { opacity: 0.85; }

        .arab {
            margin: 10px 0;
            direction: rtl;
            text-align: right;
            font-family: "QuranApiAmiri", "Traditional Arabic", Tahoma, serif;
            font-size: 28px;
            line-height: 2;
        }

        .marker { color: var(--gold); }

        .trans {
            margin: 0;
            font-size: 14px;
            color: var(--muted);
        }

        .foot {
            margin-top: 12px;
            padding-top: 10px;
            border-top: 1px solid var(--border);
            font-size: 11px;
            color: var(--muted);
        }

        .foot a { color: inherit; }

        .msg {
            margin: 0;
            font-size: 13px;
            color: var(--muted);
        }
    `;

    var stopActive = null;

    function toArabicNumber(n) {
        return String(n).replace(/\d/g, function (d) { return ARABIC_DIGITS[d]; });
    }

    function ensureFont() {
        if (document.getElementById("quran-api-widget-font")) return;
        var style = document.createElement("style");
        style.id = "quran-api-widget-font";
        style.textContent = '@font-face{font-family:"QuranApiAmiri";font-style:normal;font-weight:400;font-display:swap;src:url(https://fonts.gstatic.com/s/amiri/v17/J7aRnpd8CGxBHpUrtLMA7w.woff2) format("woff2");unicode-range:U+0600-06FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE80-FEFC}';
        document.head.appendChild(style);
    }

    function el(tag, className, text) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function pickAudio(audioMap, qori) {
        var key = String(qori).replace(/^ar\./, "");
        return (audioMap && (audioMap[key] || audioMap.alafasy)) || "";
    }

    function build(card, data, surah, ayah, qori) {
        var info = data.ayah;
        card.textContent = "";

        var head = el("div", "head");
        head.appendChild(el("span", "ref", data.surah.name + " : " + info.number.inSurah));

        var play = el("button", "play", PLAY_ICON);
        play.type = "button";
        play.setAttribute("aria-label", "Putar ayat");
        head.appendChild(play);
        card.appendChild(head);

        var arab = el("p", "arab", info.arab + " ");
        arab.lang = "ar";
        arab.appendChild(el("span", "marker", "\u06DD" + toArabicNumber(info.number.inSurah)));
        card.appendChild(arab);

        card.appendChild(el("p", "trans", info.translation));

        var foot = el("div", "foot");
        var link = el("a", "", "Quran API \u00B7 dengarkan di Murottal Player");
        link.href = API_BASE + "/murottal?surah=" + surah + "&ayah=" + ayah;
        link.target = "_blank";
        link.rel = "noopener";
        foot.appendChild(link);
        card.appendChild(foot);

        var url = pickAudio(info.audio, qori);
        var audio = null;

        function setPlaying(on) {
            play.textContent = on ? PAUSE_ICON : PLAY_ICON;
        }

        function stop() {
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
            }
            setPlaying(false);
        }

        play.addEventListener("click", function () {
            if (!url) return;

            if (audio && !audio.paused) {
                stop();
                if (stopActive === stop) stopActive = null;
                return;
            }

            if (stopActive && stopActive !== stop) stopActive();
            stopActive = stop;

            if (!audio) {
                audio = new Audio(url);
                audio.addEventListener("play", function () { setPlaying(true); });
                audio.addEventListener("pause", function () { setPlaying(false); });
                audio.addEventListener("ended", function () { setPlaying(false); });
                audio.addEventListener("error", function () { setPlaying(false); });
            }
            audio.play().catch(function () { setPlaying(false); });
        });
    }

    function render(host) {
        if (host.getAttribute("data-qa-ready")) return;
        host.setAttribute("data-qa-ready", "1");

        var surah = Number(host.getAttribute("data-surah"));
        var ayah = Number(host.getAttribute("data-ayah"));
        var qori = host.getAttribute("data-qori") || "ar.alafasy";
        var theme = host.getAttribute("data-theme") === "dark" ? "dark" : "light";

        var root = host.attachShadow({ mode: "open" });
        var style = document.createElement("style");
        style.textContent = CSS;
        var card = el("div", "card " + theme);
        root.appendChild(style);
        root.appendChild(card);

        if (!Number.isInteger(surah) || surah < 1 || surah > 114 || !Number.isInteger(ayah) || ayah < 1) {
            card.appendChild(el("p", "msg", "data-surah atau data-ayah tidak valid."));
            return;
        }

        card.appendChild(el("p", "msg", "Memuat ayat ..."));

        fetch(API_BASE + "/ayahs/" + surah + "/" + ayah)
            .then(function (res) {
                if (!res.ok) throw new Error("not found");
                return res.json();
            })
            .then(function (data) { build(card, data, surah, ayah, qori); })
            .catch(function () {
                card.textContent = "";
                card.appendChild(el("p", "msg", "Ayat tidak ditemukan."));
            });
    }

    function init(scope) {
        ensureFont();
        var nodes = (scope || document).querySelectorAll(".quran-ayah");
        for (var i = 0; i < nodes.length; i++) render(nodes[i]);
    }

    window.QuranApiWidget = { init: init };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () { init(); });
    } else {
        init();
    }
})();
