const murottalPage = require('../lib/murottal-page');

module.exports = function handler(req, res) {
    if (req.query.slug) {
        return murottalPage(req, res);
    }

    return res.status(200).json({
        name: "Quran API",
        version: "1.0.0",
        endpoints: {
            surahs: "/surahs",
            surah: "/surahs/{number}",
            qoriahs: "/qoriahs",
            random: "/random"
        }
    });
};