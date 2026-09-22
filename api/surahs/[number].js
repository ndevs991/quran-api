import quran from "../../quran.json";

export default function handler(req, res) {
    const number = Number(req.query.number);

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

    res.status(200).json(surah);
}
