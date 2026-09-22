import qoriah from "../qoriah.json";

export default function handler(req, res) {
    res.status(200).json(qoriah);
}
