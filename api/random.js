import quran from "../quran.json";

export default function handler(req, res) {
    let surah;

    if (req.query.surah) {
        const number = Number(req.query.surah);

        if (!Number.isInteger(number) || number < 1 || number > 114) {
            return res.status(400).json({
                error: "Invalid surah number"
            });
        }

        surah = quran.find(item => Number(item.number) === number);

        if (!surah) {
            return res.status(404).json({
                error: "Surah not found"
            });
        }
    } else {
        surah = quran[Math.floor(Math.random() * quran.length)];
    }

    if (!surah.ayahs || !surah.ayahs.length) {
        return res.status(500).json({
            error: "Surah has no ayahs data"
        });
    }

    const ayah = surah.ayahs[Math.floor(Math.random() * surah.ayahs.length)];

    res.status(200).json({
        number: surah.number,
        name: surah.name,
        bismillah: surah.bismillah?.arab || "",
        arab: ayah.arab || "",
        translation: ayah.translation || "",
        numberInSurah: ayah.number?.inSurah || null,
        audio: ayah.audio?.alafasy || ""
    });
}
