import { lstat, readdir, readFile } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";

const reportDirectory = process.argv[2];
if (!reportDirectory) {
    throw new Error("Usage: node validate-public-report.mjs <report-directory>");
}

const allowedExtensions = new Set([".css", ".gif", ".html", ".ico", ".jpeg", ".jpg", ".js", ".mjs", ".png", ".svg", ".ttf", ".txt", ".webp", ".woff", ".woff2"]);
const blockedMarkers = ["browserstack.accesskey", "%22browserstack.accesskey%22", "cdp.browserstack.com/playwright?caps=", "data:application/zip;base64"];
const configuredSecrets = [
    ["BrowserStack access key", process.env.BROWSERSTACK_ACCESS_KEY],
    ["BrowserStack username", process.env.BROWSERSTACK_USERNAME],
];
const violations = [];
const root = resolve(reportDirectory);

const isConfiguredSecret = (value) => {
    return value && value.length >= 8 && !value.startsWith("$(");
};

const getSecretVariants = (value) => {
    return [value, encodeURIComponent(value), Buffer.from(value).toString("base64"), Buffer.from(value).toString("base64url")];
};

const scanDirectory = async (directory) => {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
        const path = join(directory, entry.name);
        const displayPath = relative(root, path);
        const stats = await lstat(path);

        if (stats.isSymbolicLink()) {
            violations.push(`${displayPath}: symbolic links are not allowed`);
            continue;
        }
        if (stats.isDirectory()) {
            await scanDirectory(path);
            continue;
        }
        if (!stats.isFile()) {
            violations.push(`${displayPath}: special files are not allowed`);
            continue;
        }

        const extension = extname(entry.name).toLowerCase();
        if (!allowedExtensions.has(extension)) {
            violations.push(`${displayPath}: file type "${extension || "(none)"}" is not allowed`);
            continue;
        }

        const contents = await readFile(path);
        const searchableContents = contents.toString("latin1").toLowerCase();
        for (const marker of blockedMarkers) {
            if (searchableContents.includes(marker)) {
                violations.push(`${displayPath}: contains blocked marker "${marker}"`);
            }
        }
        for (const [name, value] of configuredSecrets) {
            if (!isConfiguredSecret(value)) {
                continue;
            }
            for (const variant of getSecretVariants(value)) {
                if (contents.includes(Buffer.from(variant))) {
                    violations.push(`${displayPath}: contains ${name}`);
                    break;
                }
            }
        }
    }
};

await scanDirectory(root);

if (violations.length > 0) {
    process.stderr.write("Public report validation failed:\n");
    for (const violation of violations) {
        process.stderr.write(`- ${violation}\n`);
    }
    process.exitCode = 1;
} else {
    process.stdout.write("Public report validation passed.\n");
}
