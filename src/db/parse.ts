// eslint-disable-next-line @typescript-eslint/no-require-imports
const { glob, readFile, writeFile } = require("node:fs/promises");
import { encryptData } from "./encryption";
import path from "node:path";
import { ENCRYPTED_QUOTES_FILE, QUOTES_FILE, ROOT } from "./consts";


const parse = async () => {
    const allQuotes = new Set<string>();

    const pattern = `${path.resolve(ROOT)}/**/*.txt`;
    for await (const entry of glob(pattern)) {
        const lyrics = await readFile(entry, { encoding: "utf8" });
        const quotes = lyrics.split("\r\n\r\n").filter(Boolean);
        quotes.forEach((item) => allQuotes.add(item));
    }

    console.log(`Found ${allQuotes.size} unique quotes`);

    const quotesData = JSON.stringify([...allQuotes], null, 2);
    const encryptedQuotes = encryptData(quotesData);
    await writeFile(QUOTES_FILE, quotesData, { encoding: "utf8" });
    await writeFile(ENCRYPTED_QUOTES_FILE, encryptedQuotes, { encoding: "utf8" });
};

parse().catch(console.error);
