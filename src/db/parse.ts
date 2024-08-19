// eslint-disable-next-line @typescript-eslint/no-require-imports
const { glob, readFile, writeFile } = require("node:fs/promises");
import { Logger } from "../logger";
import { encryptData } from "./encryption";
import path from "node:path";
import { ENCRYPTED_QUOTES_FILE, QUOTES_FILE } from "./consts";

const { SOURCE } = process.env;


const parse = async () => {
    const allQuotes = new Set<string>();

    const pattern = `${path.resolve(SOURCE)}/**/*.txt`;
    for await (const entry of glob(pattern)) {
        const lyrics = await readFile(entry, { encoding: "utf8" });
        const quotes = lyrics.split("\r\n\r\n").filter(Boolean);
        quotes.forEach((item) => {
            if (item.length > 140) {
                throw new Error(`Quote exceeds 140 characters for file ${entry}: ${item}`);
            }
            allQuotes.add(item);
        });
    }

    Logger.log(`Found ${allQuotes.size} unique quotes`);

    const quotesData = JSON.stringify([...allQuotes], null, 2);
    const encryptedQuotes = encryptData(quotesData);
    await writeFile(QUOTES_FILE, quotesData, { encoding: "utf8" });
    await writeFile(ENCRYPTED_QUOTES_FILE, encryptedQuotes, { encoding: "utf8" });
};

parse().catch(Logger.error);
