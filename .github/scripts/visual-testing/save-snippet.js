/**
 * Save a Babylon.js playground snippet to the snippet server.
 *
 * Usage:
 *   node .github/scripts/visual-testing/save-snippet.js <code-file> [name] [description] [tags] [--id <playgroundId>]
 *
 * The helper infers the snippet language from `<code-file>`:
 * `.js` defaults to JavaScript, while `.ts` and `.tsx` are saved as TypeScript snippets.
 *
 * Example:
 *   node .github/scripts/visual-testing/save-snippet.js temp_pg_mytest.js "My Test" "Test description" "particlesystem,gpu"
 *   node .github/scripts/visual-testing/save-snippet.js temp_pg_mytest.js "My Test" --id "#ABC123#0"
 *
 * Output:
 *   Saved: #ABC123#0
 *
 * The output hash is the playgroundId for config.json.
 */

const fs = require("fs");
const https = require("https");
const path = require("path");

function encodeUnicode(source) {
    const buffer = Buffer.from(source, "utf8");
    if (buffer.toString("latin1") === source) {
        return undefined;
    }

    return buffer.toString("base64");
}

function getPlaygroundSourceInfo(codeFile) {
    const extension = path.extname(codeFile).toLowerCase();

    if (extension === ".ts" || extension === ".tsx") {
        return { language: "TS", entry: `index${extension}` };
    }

    return { language: "JS", entry: "index.js" };
}

function parseExistingId(args) {
    const idIndex = args.indexOf("--id");
    if (idIndex === -1) {
        return undefined;
    }

    if (args.lastIndexOf("--id") !== idIndex) {
        throw new Error("--id can only be specified once");
    }

    const match = /^#?([A-Za-z0-9]+)(?:#\d+)?$/.exec(args[idIndex + 1] ?? "");
    if (!match) {
        throw new Error('--id requires a snippet ID or playgroundId, for example "ABC123" or "#ABC123#0"');
    }

    args.splice(idIndex, 2);
    return match[1].toUpperCase();
}

function saveSnippet(code, codeFile, name, description, tags, existingId) {
    const { language, entry } = getPlaygroundSourceInfo(codeFile);
    const v2Manifest = {
        v: 2,
        language,
        entry,
        imports: {},
        files: {
            [entry]: code,
        },
    };

    const codeToSave = JSON.stringify(v2Manifest);
    const unicode = encodeUnicode(codeToSave);
    const payload = JSON.stringify({
        code: codeToSave,
        unicode,
        engine: "WebGL2",
        version: v2Manifest.v,
    });

    const snippetData = JSON.stringify({
        payload,
        name: name || "Visual Test",
        description: description || "",
        tags: tags || "",
    });

    return new Promise((resolve, reject) => {
        const options = {
            hostname: "snippet.babylonjs.com",
            path: existingId ? `/${encodeURIComponent(existingId)}` : "/",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(snippetData),
            },
        };

        const req = https.request(options, (res) => {
            const url = `https://${options.hostname}${options.path}`;
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
                if ((res.statusCode ?? 0) < 200 || (res.statusCode ?? 0) >= 300) {
                    reject(new Error(`HTTP ${res.statusCode} for ${url}: ${data.substring(0, 200)}`));
                    return;
                }

                try {
                    const result = JSON.parse(data);
                    if (existingId && result.id !== existingId) {
                        reject(new Error(`Snippet server returned ID "${result.id}" instead of the requested "${existingId}"`));
                        return;
                    }
                    const id = `#${result.id}#${result.version}`;
                    console.log(`Saved: ${id}`);
                    resolve(result);
                } catch {
                    reject(new Error(`Failed to parse response: ${data.substring(0, 200)}`));
                }
            });
        });

        req.on("error", reject);
        req.write(snippetData);
        req.end();
    });
}

async function main() {
    const args = process.argv.slice(2);
    const existingId = parseExistingId(args);
    const codeFile = args[0];
    if (!codeFile) {
        console.error("Usage: node .github/scripts/visual-testing/save-snippet.js <code-file> [name] [description] [tags] [--id <playgroundId>]");
        process.exit(1);
    }

    if (!fs.existsSync(codeFile)) {
        console.error(`File not found: ${codeFile}`);
        process.exit(1);
    }

    const code = fs.readFileSync(codeFile, "utf8");
    const name = args[1] || "Visual Test";
    const description = args[2] || "";
    const tags = args[3] || "";

    await saveSnippet(code, codeFile, name, description, tags, existingId);
}

if (require.main === module) {
    main().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}

module.exports = { parseExistingId, saveSnippet };
