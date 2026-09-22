import quran from "../quran.json";

export default function handler(req, res) {
    const surah = quran[Math.floor(Math.random() * quran.length)];

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
