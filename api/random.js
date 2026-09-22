import quran from "../quran.json";

export default function handler(req, res) {
    const surah = quran[Math.floor(Math.random() * quran.length)];

    if (!surah.ayah || !surah.ayah.length) {
        return res.status(500).json({
            error: "Surah has no ayah data"
        });
    }

    const ayah = surah.ayah[Math.floor(Math.random() * surah.ayah.length)];

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
