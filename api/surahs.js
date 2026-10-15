import quran from "../quran.json";

export default function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate");
    res.status(200).json(
        quran.map(({ number, name, translation, numberOfAyahs }) => ({
            number,
            name,
            translation,
            numberOfAyahs
        }))
    );
}
