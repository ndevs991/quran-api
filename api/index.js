export default function handler(req, res) {
    res.status(200).json({
        name: "Quran API",
        version: "1.0.0",
        endpoints: {
            surahs: "/surahs",
            surah: "/surahs/{number}",
            qoriahs: "/qoriahs",
            random: "/random"
        }
    });
}
