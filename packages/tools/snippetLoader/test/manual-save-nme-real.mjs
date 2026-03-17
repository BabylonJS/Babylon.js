/**
 * Save a real NME snippet by loading a known working one and re-saving it.
 * Run: node packages/tools/snippetLoader/test/manual-save-nme-real.mjs
 */

const SNIPPET_URL = "https://snippet.babylonjs.com";

async function main() {
    // Load real NME data from a known working snippet
    const loadRes = await fetch(SNIPPET_URL + "/2F999G/0");
    const loadData = await loadRes.json();
    const inner = JSON.parse(loadData.jsonPayload || loadData.payload);

    // Save it back as a new snippet using the same envelope format
    const body = JSON.stringify({
        payload: JSON.stringify({ nodeMaterial: inner.nodeMaterial }),
        name: "SaveSnippet Manual Test - NME (real data)",
        description: "Testing saveSnippet API with real NME serialization",
        tags: "test,saveSnippet,nme",
    });

    const saveRes = await fetch(SNIPPET_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
    });
    const result = await saveRes.json();
    const version = String(result.version ?? "0");
    const snippetId = version && version !== "0" ? result.id + "#" + version : result.id;

    console.log("=== NME Snippet (real data) ===");
    console.log("  Snippet ID :", snippetId);
    console.log("  Test URL   : https://nme.babylonjs.com/#" + result.id);

    // Verify round-trip
    const verifyRes = await fetch(SNIPPET_URL + "/" + snippetId.replace(/#/g, "/"));
    if (verifyRes.ok) {
        console.log("  Round-trip verified");
    } else {
        console.log("  Round-trip failed:", verifyRes.status);
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
