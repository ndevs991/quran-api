import quran from "../../../quran.json";
import qoriahs from "../../../qoriah.json";

const CUSTOM_RECITERS = {
    "muhammad.thahaaljunaid": {
        name: "Muhammad Thaha Al-Junaid",
        availableSurahs: [1,2,18,39,40,46,47,48,49,50,51,52,53,54,55,56,57,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114],
        buildUrl: (number) => `https://podcasts.qurancentral.com/muhammad-taha-al-junaid/muhammad-taha-al-junaid-${String(number).padStart(3, "0")}-muslimcentral.com.mp3`
    }
};

export default function handler(req, res) {
    const number = Number(req.query.number);
    const qori = req.query.qori || "ar.alafasy";

    if (!Number.isInteger(number) || number < 1 || number > 114) {
        return res.status(400).json({
            error: "Invalid surah number"
        });
    }

    const surah = quran.find(item => Number(item.number) === number);

    if (!surah) {
        return res.status(404).json({
            error: "Surah not found"
        });
    }

    const customReciter = CUSTOM_RECITERS[qori];

    if (customReciter) {
        if (!customReciter.availableSurahs.includes(number)) {
            return res.status(404).json({
                error: "Audio untuk surah ini tidak tersedia untuk qori tersebut"
            });
        }

        return res.status(200).json({
            number: surah.number,
            name: surah.name,
            qori: customReciter.name,
            audio: customReciter.buildUrl(number)
        });
    }

    const validQori = qoriahs.find(q => q.identifier === qori);

    if (!validQori) {
        return res.status(400).json({
            error: "Invalid qori identifier",
            available: qoriahs.map(q => q.identifier)
        });
    }

    return res.status(200).json({
        number: surah.number,
        name: surah.name,
        qori: validQori.name,
        audio: `https://cdn.islamic.network/quran/audio-surah/128/${qori}/${number}.mp3`
    });
}
