import qoriah from "../qoriah.json";

export default function handler(req, res) {
    res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate");
    res.status(200).json(qoriah);
}
