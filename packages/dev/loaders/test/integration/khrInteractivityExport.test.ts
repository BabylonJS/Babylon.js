import { expect, test } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";

declare const BABYLON: typeof import("core/index") & {
    GLTF2: { Loader: { Extensions: typeof import("loaders/glTF/2.0/Extensions/index") } };
};

test("UMD KHR_interactivity export preserves computed pointer roots and edits", async ({ page }) => {
    const { baseUrl } = getGlobalConfig();
    await page.addScriptTag({ url: `${baseUrl}/babylon.js` });
    await page.addScriptTag({ url: `${baseUrl}/loaders/babylonjs.loaders.min.js` });

    const source = {
        asset: { version: "2.0" },
        scene: 0,
        scenes: [{ nodes: [0, 1] }],
        nodes: [
            { name: "first", translation: [1, 0, 0] },
            { name: "second", translation: [2, 0, 0] },
        ],
        extensionsUsed: ["KHR_interactivity"],
        extensions: {
            KHR_interactivity: {
                graphs: [
                    {
                        types: [{ signature: "ref" }, { signature: "float3" }],
                        variables: [{ type: 0, value: ["/nodes"] }],
                        declarations: [{ op: "variable/get" }, { op: "pointer/get" }],
                        nodes: [
                            { declaration: 0, configuration: { variable: { value: [0] } } },
                            {
                                declaration: 1,
                                configuration: { pointer: { value: ["/{root}/{target}/translation"] }, type: { value: [1] } },
                                values: { root: { node: 0 }, target: { type: 0, value: ["/nodes/0"] } },
                            },
                        ],
                    },
                ],
            },
        },
    };
    const result = await page.evaluate(async (source) => {
        const engine = new BABYLON.NullEngine();
        const scene = new BABYLON.Scene(engine);
        try {
            await BABYLON.AppendSceneAsync(`data:${JSON.stringify(source)}`, scene, { pluginExtension: ".gltf" });
            const extensions = BABYLON.GLTF2.Loader.Extensions;
            const imported = extensions.GetKHRInteractivityImportResult(scene);
            if (!imported) {
                throw new Error("KHR_interactivity import result is missing.");
            }
            const graphs = imported.graphs.map(({ flowGraph }) => {
                if (!flowGraph) {
                    throw new Error("KHR_interactivity runtime graph is missing.");
                }
                return flowGraph;
            });
            const plan = extensions.CreateKHRInteractivityExportPlan(graphs, {
                document: imported.document,
                sourceGLTF: imported.glTF,
                preserveSourceDocument: true,
                defaultGraphIndex: imported.document.defaultGraphIndex,
                required: false,
            });
            const unchangedAnalysis = plan.analyze();
            const unchanged = plan.buildWithSourceIndices();
            const pointer = graphs[0].getAllBlocks().find((block) => block.metadata?.khrInteractivity?.nodeIndex === 1 && block.getDataInput("target"));
            const target = pointer?.getDataInput("target");
            if (!target) {
                throw new Error("Computed pointer target input is missing.");
            }
            Reflect.set(target, "_defaultValue", "/nodes/1");
            const editedAnalysis = plan.analyze();
            const edited = plan.buildWithSourceIndices();
            return { unchangedAnalysis, unchanged, editedAnalysis, edited };
        } finally {
            scene.dispose();
            engine.dispose();
        }
    }, source);

    expect(result.unchangedAnalysis).toMatchObject({ representable: true, diagnostics: [] });
    expect(result.unchanged.graphs).toEqual(source.extensions.KHR_interactivity.graphs);
    expect(result.editedAnalysis).toMatchObject({ representable: true, diagnostics: [] });
    const expected = structuredClone(source.extensions.KHR_interactivity.graphs);
    expected[0].nodes[1].values!.target.value = ["/nodes/1"];
    expect(result.edited.graphs).toEqual(expected);
});
