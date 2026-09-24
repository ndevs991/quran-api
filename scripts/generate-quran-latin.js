const fs = require("fs");

const BASE_URL = "https://api.npoint.io/99c279bb173a6e28359c/surat";

async function main() {
    const result = [];

    for (let surah = 1; surah <= 114; surah++) {
        console.log(`Mengambil Surah ${surah}...`);

        const response = await fetch(`${BASE_URL}/${surah}`);

        if (!response.ok) {
            throw new Error(`Gagal mengambil Surah ${surah}: ${response.status}`);
        }

        const ayahs = await response.json();

        ayahs.forEach(ayah => {
            result.push({
                surah: surah,
                ayah: Number(ayah.nomor),
                latin: ayah.tr
                    .replace(/<[^>]*>/g, "")
                    .replace(/\s+/g, " ")
                    .trim()
            });
        });
    }

    fs.writeFileSync(
        "quran-latin.json",
        JSON.stringify(result, null, 2),
        "utf8"
    );

    console.log(`Selesai: ${result.length} ayat`);
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
