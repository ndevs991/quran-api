import quran from "../quran.json";

export default function handler(req, res) {
    const q = (req.query.q || "").trim().toLowerCase();

    if (!q) {
        return res.status(400).json({
            error: "Query parameter 'q' is required"
        });
    }

    const results = [];

    for (const surah of quran) {
        for (const ayah of surah.ayahs) {
            const arab = ayah.arab || "";
            const translation = (ayah.translation || "").toLowerCase();

            if (arab.includes(q) || translation.includes(q)) {
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
        query: q,
        total: results.length,
        results
    });
}
