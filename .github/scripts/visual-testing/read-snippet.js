/**
 * Read a Babylon.js playground snippet from the snippet server and extract the code.
 *
 * The snippet server URL format uses a slash separator: https://snippet.babylonjs.com/{ID}/{VERSION}
 * If no revision is provided, the helper defaults to revision 0.
 * Note: The # separator (for example #ABC123#5) is a playgroundId format, not a valid URL.
 *
 * Usage:
 *   node .github/scripts/visual-testing/read-snippet.js <playgroundId>
 *   node .github/scripts/visual-testing/read-snippet.js <playgroundId> [--save <output-file>]
 *
 * Examples:
 *   node .github/scripts/visual-testing/read-snippet.js "#ABC123#5"
 *   node .github/scripts/visual-testing/read-snippet.js "#ABC123#5" --save out.js
 *   node .github/scripts/visual-testing/read-snippet.js "ABC123" "5"
 *   node .github/scripts/visual-testing/read-snippet.js "ABC123"
 */

const fs = require("fs");
const https = require("https");

function parsePlaygroundId(input, versionArg) {
    const hashMatch = input.replace(/^#/, "").split("#");

    if (hashMatch.length === 2) {
        return { id: hashMatch[0], version: hashMatch[1] };
    }

    if (hashMatch.length === 1 && versionArg !== undefined) {
        return { id: hashMatch[0], version: versionArg };
    }

    if (hashMatch.length === 1) {
        return { id: hashMatch[0], version: null };
    }

    return null;
}

function fetchSnippet(id, version) {
    const normalizedVersion = version ?? "0";
    const path = `/${id}/${normalizedVersion}`;

    return new Promise((resolve, reject) => {
        const options = {
            hostname: "snippet.babylonjs.com",
            path,
            method: "GET",
        };

        const req = https.request(options, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode} for https://snippet.babylonjs.com${path}`));
                res.resume();
                return;
            }

            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
                try {
                    resolve(JSON.parse(data));
                } catch {
                    reject(new Error(`Failed to parse response: ${data.substring(0, 200)}`));
                }
            });
        });

        req.on("error", reject);
        req.end();
    });
}

function decodeBase64ToString(base64Data) {
    return Buffer.from(base64Data, "base64").toString("utf8");
}

function extractCode(snippetResponse) {
    const rawPayload = snippetResponse.jsonPayload ?? snippetResponse.payload ?? "{}";
    const payload = JSON.parse(rawPayload);
    let codeField = String(payload.code ?? "");

    if (payload.unicode) {
        codeField = decodeBase64ToString(payload.unicode);
    }

    try {
        const manifest = JSON.parse(codeField);
        if (manifest.v === 2 && manifest.files && manifest.entry) {
            return manifest.files[manifest.entry];
        }
    } catch {
        // Not a v2 manifest - treat as raw code.
    }

    return codeField;
}

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.error("Usage: node .github/scripts/visual-testing/read-snippet.js <playgroundId> [--save <output-file>]");
        console.error('  e.g. node .github/scripts/visual-testing/read-snippet.js "#ABC123#5"');
        console.error('  e.g. node .github/scripts/visual-testing/read-snippet.js "#ABC123#5" --save out.js');
        process.exit(1);
    }

    const playgroundIdArg = args[0];
    let versionArg;
    let saveFile = null;

    for (let i = 1; i < args.length; i++) {
        if (args[i] === "--save" && i + 1 < args.length) {
            saveFile = args[i + 1];
            i++;
        } else if (!versionArg && /^\d+$/.test(args[i])) {
            versionArg = args[i];
        }
    }

    const parsed = parsePlaygroundId(playgroundIdArg, versionArg);
    if (!parsed) {
        console.error(`Could not parse playground ID: ${playgroundIdArg}`);
        process.exit(1);
    }

    const response = await fetchSnippet(parsed.id, parsed.version);
    const code = extractCode(response);

    if (saveFile) {
        fs.writeFileSync(saveFile, code, "utf8");
        console.error(`Saved to ${saveFile} (${code.length} bytes)`);
    } else {
        process.stdout.write(code);
    }
}

main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
});
