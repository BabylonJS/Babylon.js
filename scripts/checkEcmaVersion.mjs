import { readFileSync } from "node:fs";
import { parse } from "acorn";

const [version, ...files] = process.argv.slice(2);
if (version !== "es6" || files.length === 0) {
    console.error("Usage: node scripts/checkEcmaVersion.mjs es6 <file>...");
    process.exit(1);
}

for (const file of files) {
    try {
        parse(readFileSync(file, "utf8"), { ecmaVersion: 2015, sourceType: "script" });
    } catch (error) {
        console.error(`${file}: ${error.message}`);
        process.exitCode = 1;
    }
}
