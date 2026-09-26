import quran from "../../../../quran.json";
import qoriahs from "../../../../qoriah.json";

export default function handler(req, res) {
    const surahNumber = Number(req.query.surah);
    const ayahNumber = Number(req.query.ayah);
    const qori = req.query.qori || "ar.alafasy";

    if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) {
        return res.status(400).json({
            error: "Invalid surah number"
        });
    }

    const surah = quran.find(item => Number(item.number) === surahNumber);

    if (!surah) {
        return res.status(404).json({
            error: "Surah not found"
        });
    }

    const ayah = surah.ayahs.find(item => item.number.inSurah === ayahNumber);

    if (!ayah) {
        return res.status(404).json({
            error: "Ayah not found"
        });
    }

    const validQori = qoriahs.find(q => q.identifier === qori);

    if (!validQori) {
        return res.status(400).json({
            error: "Invalid qori identifier",
            available: qoriahs.map(q => q.identifier)
        });
    }

    res.status(200).json({
        surah: {
            number: surah.number,
            name: surah.name
        },
        ayah: ayahNumber,
        qori: validQori.name,
        audio: `https://cdn.islamic.network/quran/audio/128/${qori}/${ayah.number.inQuran}.mp3`
    });
}
