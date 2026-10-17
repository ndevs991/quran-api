import quran from "../quran.json";

export default function handler(req, res) {
    const juzList = [];

    for (const surah of quran) {
        for (const ayah of surah.ayahs) {
            const n = ayah.meta.juz;
            const inSurah = ayah.number.inSurah;

            if (!juzList[n - 1]) juzList[n - 1] = { juz: n, surahs: [] };

            const rows = juzList[n - 1].surahs;
            const last = rows[rows.length - 1];

            if (last && last.number === surah.number) {
                last.to = inSurah;
            } else {
                rows.push({ number: surah.number, from: inSurah, to: inSurah });
            }
        }
    }

    res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate");
    res.status(200).json(juzList);
}