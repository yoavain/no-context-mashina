// eslint-disable-next-line @typescript-eslint/no-require-imports
const { glob, readFile, writeFile } = require("node:fs/promises");
import path from "node:path";

const ROOT = path.resolve(__dirname, "..", "..", "raw-input");
const QUOTES_FILE = path.resolve(__dirname, "quotes.json");

const parse = async () => {
    const allQuotes = new Set<string>();

    const pattern = `${path.resolve(ROOT)}/**/*.txt`;
    for await (const entry of glob(pattern)) {
        const lyrics = await readFile(entry, { encoding: "utf8" });
        const quotes = lyrics.split("\r\n\r\n").filter(Boolean);
        quotes.forEach((item) => allQuotes.add(item));
    }

    console.log(`Found ${allQuotes.size} unique quotes`);
    await writeFile(QUOTES_FILE, JSON.stringify([...allQuotes], null, 2), { encoding: "utf8" });
};

parse().catch(console.error);
