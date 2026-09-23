import quran from "../../../../quran.json";
import qoriahs from "../../../../qoriah.json";

export default function handler(req, res) {
    const { identifier } = req.query;
    const number = Number(req.query.number);

    const qori = qoriahs.find(q => q.identifier === identifier);

    if (!qori) {
        return res.status(404).json({
            error: "Qori not found",
            available: qoriahs.map(q => q.identifier)
        });
    }

    if (!Number.isInteger(number) || number < 1 || number > 114) {
        return res.status(400).json({
            error: "Invalid surah number"
        });
    }

    const surah = quran.find(item => Number(item.number) === number);

    if (!surah) {
        return res.status(404).json({
            error: "Surah not found"
        });
    }

    res.status(200).json({
        qori: qori.name,
        identifier: qori.identifier,
        surah: {
            number: surah.number,
            name: surah.name
        },
        audio: `https://cdn.islamic.network/quran/audio-surah/128/${qori.identifier}/${number}.mp3`
    });
}
