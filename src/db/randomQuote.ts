import path from "node:path";

const QUOTES_FILE = path.resolve(__dirname, "quotes.json");

const getRandomQuote = () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const quotes = require(QUOTES_FILE);
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
};

const main = async () => {
    const quote = getRandomQuote();
    console.log(quote);
};

main().catch(console.error);
