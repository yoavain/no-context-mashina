import { ENCRYPTED_QUOTES_FILE } from "./consts";
import { readFile } from "node:fs/promises";
import { decryptData } from "./encryption";

export const getRandomQuote = async () => {
    const encryptedQuotes = await readFile(ENCRYPTED_QUOTES_FILE, { encoding: "utf8" });
    const quotes = JSON.parse(decryptData(encryptedQuotes));
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
};
