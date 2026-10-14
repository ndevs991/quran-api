import quran from "../../../quran.json";

export default function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    
    const surahNumber = Number(req.query.surah);
    const ayahNumber = Number(req.query.ayah);

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

    res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate");
    res.status(200).json({
        surah: {
            number: surah.number,
            name: surah.name
        },
        ayah
    });
}
