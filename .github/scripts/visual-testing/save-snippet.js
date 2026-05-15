/**
 * Save a Babylon.js playground snippet to the snippet server.
 *
 * Usage:
 *   node .github/scripts/visual-testing/save-snippet.js <code-file> [name] [description] [tags]
 *
 * The helper infers the snippet language from `<code-file>`:
 * `.js` defaults to JavaScript, while `.ts` and `.tsx` are saved as TypeScript snippets.
 *
 * Example:
 *   node .github/scripts/visual-testing/save-snippet.js temp_pg_mytest.js "My Test" "Test description" "particlesystem,gpu"
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

function saveSnippet(code, codeFile, name, description, tags) {
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
            path: "/",
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
    const codeFile = process.argv[2];
    if (!codeFile) {
        console.error("Usage: node .github/scripts/visual-testing/save-snippet.js <code-file> [name] [description] [tags]");
        process.exit(1);
    }

    if (!fs.existsSync(codeFile)) {
        console.error(`File not found: ${codeFile}`);
        process.exit(1);
    }

    const code = fs.readFileSync(codeFile, "utf8");
    const name = process.argv[3] || "Visual Test";
    const description = process.argv[4] || "";
    const tags = process.argv[5] || "";

    await saveSnippet(code, codeFile, name, description, tags);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
