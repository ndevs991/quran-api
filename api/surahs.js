import quran from "../quran.json";

export default function handler(req, res) {
    res.status(200).json(
        quran.map(({ number, name }) => ({ number, name }))
    );
}
