/**
 * Quick manual test: saves a playground snippet and an NME snippet
 * to the real snippet server and prints the IDs.
 *
 * Run: node packages/tools/snippetLoader/test/manual-save-test.mjs
 */

const SNIPPET_URL = "https://snippet.babylonjs.com";

async function saveSnippet(innerPayload, metadata = {}) {
    const body = JSON.stringify({
        payload: JSON.stringify(innerPayload),
        name: metadata.name ?? "",
        description: metadata.description ?? "",
        tags: metadata.tags ?? "",
    });

    const res = await fetch(SNIPPET_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
    });

    if (!res.ok) {
        throw new Error(`Save failed: ${res.status} ${res.statusText}`);
    }

    const result = await res.json();
    const id = result.id;
    const version = String(result.version ?? "0");
    const snippetId = version && version !== "0" ? `${id}#${version}` : id;
    return { snippetId, id, version };
}

// --- Playground V1 code snippet ---
async function savePlayground() {
    const code = `var createScene = function (engine, canvas) {
    var scene = new BABYLON.Scene(engine);
    var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.attachControl(canvas, true);
    var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 2 }, scene);
    sphere.position.y = 1;
    var ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 6, height: 6 }, scene);
    return scene;
};`;

    const result = await saveSnippet({ code, engine: "WebGL2" }, { name: "SaveSnippet Manual Test - PG", description: "Testing saveSnippet API", tags: "test,saveSnippet" });

    console.log("\n=== Playground Snippet ===");
    console.log(`  Snippet ID : ${result.snippetId}`);
    console.log(`  Test URL   : https://playground.babylonjs.com/#${result.id}`);
    return result;
}

// --- NME data snippet ---
async function saveNME() {
    const nmeData = {
        customType: "BABYLON.NodeMaterial",
        outputNodes: [1],
        blocks: [
            {
                customType: "BABYLON.VertexOutputBlock",
                id: 0,
                name: "VertexOutput",
                inputs: [{ name: "vector", inputName: "vector", targetBlockId: 2, targetConnectionName: "output" }],
            },
            {
                customType: "BABYLON.FragmentOutputBlock",
                id: 1,
                name: "FragmentOutput",
                inputs: [{ name: "rgba", inputName: "rgba", targetBlockId: 3, targetConnectionName: "output" }],
            },
            {
                customType: "BABYLON.InputBlock",
                id: 2,
                name: "position",
                type: 8,
                mode: 1,
                systemValue: 8,
                animationType: 0,
                isConstant: false,
            },
            {
                customType: "BABYLON.InputBlock",
                id: 3,
                name: "color",
                type: 16,
                mode: 0,
                animationType: 0,
                isConstant: false,
                value: [1, 0.5, 0.2, 1],
            },
        ],
    };

    const result = await saveSnippet(
        { nodeMaterial: JSON.stringify(nmeData) },
        { name: "SaveSnippet Manual Test - NME", description: "Testing saveSnippet API for NME", tags: "test,saveSnippet,nme" }
    );

    console.log("\n=== NME Snippet ===");
    console.log(`  Snippet ID : ${result.snippetId}`);
    console.log(`  Test URL   : https://nme.babylonjs.com/#${result.id}`);
    return result;
}

// --- Verify round-trip by fetching back ---
async function verifyLoad(snippetId, label) {
    const path = snippetId.replace(/#/g, "/");
    const res = await fetch(`${SNIPPET_URL}/${path}`);
    if (!res.ok) {
        console.error(`  ❌ ${label}: Failed to load back: ${res.status}`);
        return;
    }
    const data = await res.json();
    console.log(`  ✅ ${label}: Loaded back successfully (name: "${data.name}", payload length: ${(data.payload || "").length} chars)`);
}

async function main() {
    console.log("Saving snippets to", SNIPPET_URL, "...\n");

    const pg = await savePlayground();
    const nme = await saveNME();

    console.log("\n--- Verifying round-trip ---");
    await verifyLoad(pg.snippetId, "Playground");
    await verifyLoad(nme.snippetId, "NME");

    console.log("\nDone!");
}

main().catch((err) => {
    console.error("Error:", err);
    process.exit(1);
});
