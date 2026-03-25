/**
 * Save a Babylon.js playground snippet to the snippet server.
 *
 * Usage:
 *   node .github/scripts/visual-testing/save-snippet.js <code-file> [name] [description] [tags]
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

function saveSnippet(code, name, description, tags) {
    const v2Manifest = {
        v: 2,
        language: "JS",
        entry: "index.js",
        imports: {},
        files: {
            "index.js": code,
        },
    };

    const codeToSave = JSON.stringify(v2Manifest);
    const payload = JSON.stringify({
        code: codeToSave,
        engine: "WebGL2",
        version: 2,
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
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
                try {
                    const result = JSON.parse(data);
                    const id = `#${result.id}#${result.version}`;
                    console.log(`Saved: ${id}`);
                    resolve(result);
                } catch (err) {
                    console.error("Failed to parse response:", data);
                    reject(err);
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

    await saveSnippet(code, name, description, tags);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
