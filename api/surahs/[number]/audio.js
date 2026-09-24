import quran from "../../../quran.json";
import qoriahs from "../../../qoriah.json";

export default function handler(req, res) {
    const number = Number(req.query.number);
    const qori = req.query.qori || "ar.alafasy";

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

    const validQori = qoriahs.find(q => q.identifier === qori);

    if (!validQori) {
        return res.status(400).json({
            error: "Invalid qori identifier",
            available: qoriahs.map(q => q.identifier)
        });
    }

    res.status(200).json({
        number: surah.number,
        name: surah.name,
        qori: validQori.name,
        audio: `https://cdn.islamic.network/quran/audio-surah/128/${qori}/${number}.mp3`
    });
}
