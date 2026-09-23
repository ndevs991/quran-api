import quran from "../../quran.json";

export default function handler(req, res) {
    const number = Number(req.query.number);

    if (!Number.isInteger(number) || number < 1 || number > 30) {
        return res.status(400).json({
            error: "Invalid juz number"
        });
    }

    const results = [];

    for (const surah of quran) {
        for (const ayah of surah.ayahs) {
            if (ayah.meta && ayah.meta.juz === number) {
                results.push({
                    surah: {
                        number: surah.number,
                        name: surah.name
                    },
                    number: ayah.number,
                    arab: ayah.arab,
                    translation: ayah.translation
                });
            }
        }
    }

    res.status(200).json({
        juz: number,
        total: results.length,
        ayahs: results
    });
}
