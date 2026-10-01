import { test, expect, devices, type Locator, type Page } from "@playwright/test";
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { FlowGraphEditorPage } from "./fge.utils";
import { AllFlowGraphBlocks } from "../../src/allBlockNames";

function BuildJsonOnlyGlbFixture(document: object): Buffer {
    const json = Buffer.from(JSON.stringify(document));
    const jsonLength = Math.ceil(json.length / 4) * 4;
    const bytes = Buffer.alloc(20 + jsonLength, 0x20);
    bytes.writeUInt32LE(0x46546c67, 0);
    bytes.writeUInt32LE(2, 4);
    bytes.writeUInt32LE(bytes.length, 8);
    bytes.writeUInt32LE(jsonLength, 12);
    bytes.writeUInt32LE(0x4e4f534a, 16);
    json.copy(bytes, 20);
    return bytes;
}

function BuildExistingGlbFixture(
    withCompanionExtensions = false,
    withMultiPrimitiveTrigger = false,
    withAnimation = false,
    withSkin = false,
    withLosslessTokens = false,
    withHiddenRevealParent = false,
    withExternalBuffer = false,
    withProcedureNodes = false
) {
    const document: any = {
        asset: { version: "2.0", generator: "maintenance-asset-pipeline" },
        scene: 0,
        scenes: [{ name: "Assembly", nodes: [0] }],
        nodes: [
            { name: "assembly", children: [1, 2], extras: { stableId: "assembly-1" } },
            { name: "part", mesh: 0, extras: { stableId: "trigger-17" }, extensions: { EXT_vendor_meta: { code: 17 } } },
            { name: "part", mesh: 0, translation: [2, 0, 0], extras: { stableId: "target-23" } },
        ],
        meshes: [
            {
                name: "part geometry",
                primitives: [{ attributes: { POSITION: 0 }, material: 0, extensions: { KHR_materials_variants: { mappings: [{ material: 1, variants: [0] }] } } }],
            },
        ],
        buffers: [{ byteLength: 36 }],
        bufferViews: [{ buffer: 0, byteLength: 36 }],
        accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: "VEC3", min: [0, 0, 0], max: [1, 1, 0] }],
        materials: [{ name: "Base" }, { name: "Service" }],
        images: [{ name: "resource-ref", uri: "data:image/png;base64,iVBORw0KGgo=" }],
        extensionsUsed: ["KHR_materials_variants", "EXT_vendor_meta"],
        extensions: { KHR_materials_variants: { variants: [{ name: "Service" }] }, EXT_vendor_meta: { opaque: [1, 2, 3] } },
        extras: { stableAssetId: "maintenance-asset-9" },
    };
    if (withCompanionExtensions) {
        document.nodes[1].extensions.KHR_node_selectability = { extensions: { EXT_vendor_node: { trainingId: "trigger" } } };
        document.nodes[2].extensions = { KHR_node_visibility: { visible: true, extensions: { EXT_vendor_node: { trainingId: "reveal" } } } };
        document.extensionsUsed.push("KHR_node_selectability", "KHR_node_visibility", "EXT_vendor_node");
    }
    if (withHiddenRevealParent) {
        document.nodes[0].children = [1, 3];
        document.nodes.push({ name: "hidden reveal parent", children: [2], extensions: { KHR_node_visibility: { visible: false } } });
        document.extensionsUsed.push("KHR_node_visibility");
    }
    if (withMultiPrimitiveTrigger) {
        document.meshes.push({ ...document.meshes[0], primitives: [...document.meshes[0].primitives] });
        document.meshes[0].primitives.push({ ...document.meshes[0].primitives[0] });
        document.nodes[2].mesh = 1;
    }
    if (withProcedureNodes) {
        document.nodes[0].children = [1, 2, 3, 4, 5];
        document.nodes.push(
            { name: "next cue", mesh: 0, translation: [4, 0, 0], extras: { stableId: "next-cue" } },
            { name: "complete cue", mesh: 0, translation: [6, 0, 0], extras: { stableId: "complete-cue" } },
            { name: "reset control", mesh: 0, translation: [8, 0, 0], extras: { stableId: "reset-control" } }
        );
    }
    if (withAnimation) {
        const samples = Buffer.from(new Float32Array([0, 1, 2, 0, 0, 3, 0, 0]).buffer);
        document.buffers.push({ byteLength: samples.length, uri: `data:application/octet-stream;base64,${samples.toString("base64")}` });
        document.bufferViews.push({ buffer: 1, byteLength: 8 }, { buffer: 1, byteOffset: 8, byteLength: 24 });
        document.accessors.push(
            { bufferView: 1, componentType: 5126, count: 2, type: "SCALAR", min: [0], max: [1] },
            { bufferView: 2, componentType: 5126, count: 2, type: "VEC3" }
        );
        document.animations = [
            { name: "inspection", samplers: [{ input: 1, output: 2, interpolation: "LINEAR" }], channels: [{ sampler: 0, target: { node: 2, path: "translation" } }] },
        ];
    }
    let bin = Buffer.from(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]).buffer);
    if (withExternalBuffer) {
        document.buffers[0].uri = "geometry.bin";
    }
    if (withSkin) {
        const joints = Buffer.alloc(12);
        const weights = Buffer.from(new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]).buffer);
        document.nodes[0].children.push(3, 4);
        document.nodes.push({ name: "joint" }, { name: "skinned part", mesh: 1, skin: 0 });
        document.skins = [{ joints: [3], skeleton: 3 }];
        document.meshes.push({ name: "skinned geometry", primitives: [{ attributes: { POSITION: 0, JOINTS_0: 1, WEIGHTS_0: 2 } }] });
        document.bufferViews.push({ buffer: 0, byteOffset: 36, byteLength: joints.length }, { buffer: 0, byteOffset: 48, byteLength: weights.length });
        document.accessors.push({ bufferView: 1, componentType: 5121, count: 3, type: "VEC4" }, { bufferView: 2, componentType: 5126, count: 3, type: "VEC4" });
        bin = Buffer.concat([bin, joints, weights]);
        document.buffers[0].byteLength = bin.length;
    }
    const jsonText = withLosslessTokens
        ? JSON.stringify(document).replace('"stableAssetId":"maintenance-asset-9"', '"stableAssetId":9007199254740993').replace('"code":17', '"code":1e+2')
        : JSON.stringify(document);
    const json = Buffer.from(jsonText);
    const jsonLength = Math.ceil(json.length / 4) * 4;
    const vendor = Buffer.from([10, 20, 30, 40]);
    const bytes = Buffer.alloc(20 + jsonLength + (withExternalBuffer ? 0 : 8 + bin.length) + 8 + vendor.length, 0x20);
    bytes.writeUInt32LE(0x46546c67, 0);
    bytes.writeUInt32LE(2, 4);
    bytes.writeUInt32LE(bytes.length, 8);
    bytes.writeUInt32LE(jsonLength, 12);
    bytes.writeUInt32LE(0x4e4f534a, 16);
    json.copy(bytes, 20);
    let offset = 20 + jsonLength;
    if (!withExternalBuffer) {
        bytes.writeUInt32LE(bin.length, offset);
        bytes.writeUInt32LE(0x004e4942, offset + 4);
        bin.copy(bytes, offset + 8);
        offset += 8 + bin.length;
    }
    bytes.writeUInt32LE(vendor.length, offset);
    bytes.writeUInt32LE(0x31525458, offset + 4);
    vendor.copy(bytes, offset + 8);
    return { bytes, document, bin };
}

function BuildNodelessGlbFixture(withGraph: boolean, withEmptyNodes = false) {
    const document: any = {
        asset: { version: "2.0", generator: "node-free-source" },
        scene: 0,
        scenes: [{ name: "Empty scene" }],
        extensionsUsed: ["EXT_vendor_meta"],
        extensions: { EXT_vendor_meta: { stableAssetId: "scene-only-17" } },
        extras: { sourceOnly: "keep this metadata" },
    };
    if (withEmptyNodes) {
        document.nodes = [];
    }
    if (withGraph) {
        document.extensionsUsed.push("KHR_interactivity");
        document.extensionsRequired = ["KHR_interactivity"];
        document.extensions.KHR_interactivity = {
            graphs: [{ name: "Scene start", declarations: [{ op: "event/onStart" }], nodes: [{ declaration: 0 }] }],
        };
    }
    const json = Buffer.from(JSON.stringify(document));
    const jsonLength = Math.ceil(json.length / 4) * 4;
    const vendor = Buffer.from([10, 20, 30, 40]);
    const bytes = Buffer.alloc(20 + jsonLength + 8 + vendor.length, 0x20);
    bytes.writeUInt32LE(0x46546c67, 0);
    bytes.writeUInt32LE(2, 4);
    bytes.writeUInt32LE(bytes.length, 8);
    bytes.writeUInt32LE(jsonLength, 12);
    bytes.writeUInt32LE(0x4e4f534a, 16);
    json.copy(bytes, 20);
    bytes.writeUInt32LE(vendor.length, 20 + jsonLength);
    bytes.writeUInt32LE(0x31525458, 24 + jsonLength);
    vendor.copy(bytes, 28 + jsonLength);
    return { bytes, document };
}

// The FGE starts with an empty graph — no default blocks on the canvas.

function CountSerializedConnections(serializedGraph: any): number {
    let totalConnections = 0;
    for (const block of serializedGraph.allBlocks ?? []) {
        for (const port of block.signalOutputs ?? []) {
            totalConnections += port.connectedPointIds?.length ?? 0;
        }
        for (const port of block.dataOutputs ?? []) {
            totalConnections += port.connectedPointIds?.length ?? 0;
        }
    }
    return totalConnections;
}

async function GetGraphState(page: Page): Promise<number> {
    return await page.evaluate(() => {
        const editor = (globalThis as any).BABYLON?.FlowGraphEditor;
        const graph = editor?._CurrentState?.flowGraph ?? (globalThis as any).__viteFlowGraphEditorArgs?.[0]?.flowGraph;
        if (!graph) {
            throw new Error("FlowGraphEditor graph not found");
        }
        return graph.state;
    });
}

async function SimulateKhrNodeSelection(page: Page, nodeName: string, pointerId = 0): Promise<void> {
    await page.evaluate(
        ({ name, id }) => {
            const Babylon = (globalThis as any).BABYLON;
            const state = Babylon.FlowGraphEditor._CurrentState;
            const node = state.khrInteractivityImportResult.glTF.nodes.find((candidate: any) => candidate.name === name);
            const mesh = node?._primitiveBabylonMeshes?.[0] ?? node?._babylonTransformNode;
            if (!mesh) {
                throw new Error(`No selectable glTF node named ${name}`);
            }
            const pick = new Babylon.PickingInfo();
            pick.hit = true;
            pick.pickedMesh = mesh;
            pick.pickedPoint = mesh.getAbsolutePosition();
            state.sceneContext.scene.simulatePointerDown(pick, { pointerId: id });
            state.sceneContext.scene.simulatePointerUp(pick, { pointerId: id });
        },
        { name: nodeName, id: pointerId }
    );
}

async function GetKhrNodeVisibility(page: Page, nodeName: string): Promise<boolean> {
    return await page.evaluate((name) => {
        const state = (globalThis as any).BABYLON.FlowGraphEditor._CurrentState;
        const node = state.khrInteractivityImportResult.glTF.nodes.find((candidate: any) => candidate.name === name);
        if (!node?._primitiveBabylonMeshes?.length) {
            throw new Error(`No glTF primitive meshes named ${name}`);
        }
        return node._primitiveBabylonMeshes.some((mesh: any) => mesh.isVisible);
    }, nodeName);
}

async function GetDebugSnapshot(page: Page): Promise<{ isDebugMode: boolean; pendingBlockClassName: string | null; breakpointBlockClassNames: string[] }> {
    return await page.evaluate(() => {
        const state = (globalThis as any).BABYLON?.FlowGraphEditor?._CurrentState;
        const graph = state?.flowGraph ?? (globalThis as any).__viteFlowGraphEditorArgs?.[0]?.flowGraph;
        const context = graph?.getContext(state?.selectedContextIndex ?? 0);
        if (!state || !graph) {
            throw new Error("FlowGraphEditor state not found");
        }

        const breakpointBlockIds = Array.from(state._breakpointBlockIds ?? []) as string[];
        const breakpointBlockClassNames = breakpointBlockIds
            .map((id) =>
                graph
                    .getAllBlocks()
                    .find((block: any) => block.uniqueId === id)
                    ?.getClassName()
            )
            .filter(Boolean);

        return {
            isDebugMode: state.isDebugMode,
            pendingBlockClassName: context?.pendingActivation?.block?.getClassName() ?? null,
            breakpointBlockClassNames,
        };
    });
}

async function ClickGraphControl(page: Page, name: string): Promise<void> {
    await page.getByRole("button", { name, exact: true }).click();
}

async function WaitForGraphState(page: Page, state: "Stopped" | "Running"): Promise<void> {
    const expectedState = state === "Running" ? 1 : 0;
    await expect.poll(async () => await GetGraphState(page)).toBe(expectedState);
}

async function GetVariableSnapshot(
    page: Page,
    variableName: string,
    contextIndex = 0
): Promise<{ value: unknown; type: string | undefined; sceneObjectName?: string; sceneObjectInContextScene?: boolean }> {
    return await page.evaluate(
        ({ name, selectedContextIndex }) => {
            const editor = (globalThis as any).BABYLON?.FlowGraphEditor;
            const graph = editor?._CurrentState?.flowGraph ?? (globalThis as any).__viteFlowGraphEditorArgs?.[0]?.flowGraph;
            const context = graph?.getContext(selectedContextIndex);
            if (!context) {
                throw new Error("FlowGraph context not found");
            }
            const value = context.userVariables[name];
            const normalizeValue = (currentValue: any): unknown => {
                if (currentValue == null || typeof currentValue === "string" || typeof currentValue === "number" || typeof currentValue === "boolean") {
                    return currentValue;
                }
                if (currentValue?.constructor?.name === "FlowGraphInteger" && "value" in currentValue) {
                    return { value: currentValue.value };
                }
                if ("x" in currentValue && "y" in currentValue) {
                    const normalizedVector: any = { x: currentValue.x, y: currentValue.y };
                    if ("z" in currentValue) {
                        normalizedVector.z = currentValue.z;
                    }
                    if ("w" in currentValue) {
                        normalizedVector.w = currentValue.w;
                    }
                    return normalizedVector;
                }
                if ("r" in currentValue && "g" in currentValue && "b" in currentValue) {
                    const normalizedColor: any = { r: currentValue.r, g: currentValue.g, b: currentValue.b };
                    if ("a" in currentValue) {
                        normalizedColor.a = currentValue.a;
                    }
                    return normalizedColor;
                }
                return currentValue;
            };
            if (value && typeof value === "object" && "uniqueId" in value) {
                const scene = context.getScene();
                const sceneObjects = [...scene.meshes, ...scene.transformNodes, ...scene.cameras, ...scene.lights, ...scene.materials, ...scene.animationGroups];
                return {
                    value: value.uniqueId,
                    type: context.getVariableType(name),
                    sceneObjectName: value.name,
                    sceneObjectInContextScene: sceneObjects.includes(value),
                };
            }
            return { value: normalizeValue(value), type: context.getVariableType(name) };
        },
        { name: variableName, selectedContextIndex: contextIndex }
    );
}

async function GetContextSnapshot(page: Page): Promise<{ selectedContextIndex: number; contexts: { index: number; uniqueId: string; name: string }[] }> {
    return await page.evaluate(() => {
        const state = (globalThis as any).BABYLON?.FlowGraphEditor?._CurrentState;
        if (!state) {
            throw new Error("FlowGraphEditor state not found");
        }
        return {
            selectedContextIndex: state.selectedContextIndex,
            contexts: state.getContextList(),
        };
    });
}

async function GetCoordinatorSnapshot(page: Page): Promise<{
    activeGraphIndex: number;
    dispatchEventsSynchronously: boolean;
    hasHostResolver: boolean;
    graphs: { name: string; blockClassNames: string[]; totalConnections: number }[];
}> {
    return await page.evaluate(() => {
        const state = (globalThis as any).BABYLON?.FlowGraphEditor?._CurrentState;
        const coordinator = state?.coordinator;
        if (!state || !coordinator) {
            throw new Error("FlowGraphEditor coordinator not found");
        }

        const countConnections = (serializedGraph: any) => {
            let total = 0;
            for (const block of serializedGraph.allBlocks ?? []) {
                for (const port of block.signalOutputs ?? []) {
                    total += port.connectedPointIds?.length ?? 0;
                }
                for (const port of block.dataOutputs ?? []) {
                    total += port.connectedPointIds?.length ?? 0;
                }
            }
            return total;
        };

        return {
            activeGraphIndex: state.activeGraphIndex,
            dispatchEventsSynchronously: coordinator.dispatchEventsSynchronously,
            hasHostResolver: !!coordinator.config.hostResolver,
            graphs: coordinator.flowGraphs.map((graph: any) => {
                const serializedGraph: any = {};
                graph.serialize(serializedGraph);
                return {
                    name: graph.name,
                    blockClassNames: graph.getAllBlocks().map((block: any) => block.getClassName()),
                    totalConnections: countConnections(serializedGraph),
                };
            }),
        };
    });
}

async function GetSceneContextSnapshot(
    page: Page
): Promise<{ sceneUid: string; source: string | null; snippetId: string; meshNames: string[]; transformNodeNames: string[]; cameraNames: string[]; lightNames: string[] } | null> {
    return await page.evaluate(() => {
        const state = (globalThis as any).BABYLON?.FlowGraphEditor?._CurrentState;
        const scene = state?.sceneContext?.scene;
        if (!state || !scene) {
            return null;
        }
        return {
            sceneUid: scene.uid,
            source: state.sceneSource,
            snippetId: state.snippetId,
            meshNames: scene.meshes.map((mesh: any) => mesh.name),
            transformNodeNames: scene.transformNodes.map((node: any) => node.name),
            cameraNames: scene.cameras.map((camera: any) => camera.name),
            lightNames: scene.lights.map((light: any) => light.name),
        };
    });
}

async function StrictImportKhrInteractivityAsync(page: Page, fileName: string, bytes: Uint8Array): Promise<{ graphCount: number; errorCount: number }> {
    return await page.evaluate(
        async ({ name, data }) => {
            const Babylon = (globalThis as any).BABYLON;
            const key = name.toLowerCase();
            const file = new File([new Uint8Array(data)], name, {
                type: name.endsWith(".glb") ? "model/gltf-binary" : "model/gltf+json",
            });
            Babylon.FilesInputStore.FilesToLoad[key] = file;
            const canvas = document.createElement("canvas");
            const engine = new Babylon.Engine(canvas, false);
            let scene: any = null;
            try {
                scene = await Babylon.LoadSceneAsync(name, engine, {
                    rootUrl: "file:",
                    pluginOptions: {
                        gltf: {
                            extensionOptions: {
                                KHR_interactivity: {
                                    autoStart: false,
                                    parseOnly: true,
                                    strictValidation: true,
                                },
                            },
                        },
                    },
                });
                const importResult = Babylon.GLTF2.Loader.Extensions.GetKHRInteractivityImportResult(scene);
                if (!importResult) {
                    throw new Error("Strict KHR_interactivity import result was not created.");
                }
                return {
                    graphCount: importResult.graphs.length,
                    errorCount: importResult.document.diagnostics.filter((diagnostic: { severity: string }) => diagnostic.severity === "error").length,
                };
            } finally {
                scene?.dispose();
                engine.dispose();
                delete Babylon.FilesInputStore.FilesToLoad[key];
            }
        },
        { name: fileName, data: Array.from(bytes) }
    );
}

async function UndockRightSidePaneAsync(page: Page): Promise<Page> {
    const menuButtons = page.locator('button[aria-haspopup="menu"]');
    let rightmostMenuButton = -1;
    let rightmostX = -1;
    for (let index = 0; index < (await menuButtons.count()); index++) {
        const box = await menuButtons.nth(index).boundingBox();
        if (box && box.y < 120 && box.x > rightmostX) {
            rightmostMenuButton = index;
            rightmostX = box.x;
        }
    }
    expect(rightmostMenuButton).toBeGreaterThanOrEqual(0);
    const popupPromise = page.context().waitForEvent("page");
    await menuButtons.nth(rightmostMenuButton).click();
    await page.getByRole("menuitem", { name: "Undock", exact: true }).click();
    return await popupPromise;
}

async function GetDefaultSceneBoxInfo(page: Page): Promise<{ sceneUid: string; source: string | null; boxX: number }> {
    return await page.evaluate(() => {
        const state = (globalThis as any).BABYLON?.FlowGraphEditor?._CurrentState;
        const scene = state?.sceneContext?.scene;
        const box = scene?.getMeshByName("box");
        if (!state || !scene || !box) {
            throw new Error("Default preview scene box not found");
        }
        return { sceneUid: scene.uid, source: state.sceneSource, boxX: box.position.x };
    });
}

async function GetScenePreviewSnapshot(
    page: Page,
    meshName: string
): Promise<{ sceneUid: string; source: string | null; snippetId: string; meshX: number; meshNames: string[] } | null> {
    return await page.evaluate((name) => {
        const state = (globalThis as any).BABYLON?.FlowGraphEditor?._CurrentState;
        const scene = state?.sceneContext?.scene;
        const mesh = scene?.getMeshByName(name);
        if (!state || !scene || !mesh) {
            return null;
        }
        return {
            sceneUid: scene.uid,
            source: state.sceneSource,
            snippetId: state.snippetId,
            meshX: mesh.position.x,
            meshNames: scene.meshes.map((sceneMesh: any) => sceneMesh.name),
        };
    }, meshName);
}

async function GetSceneAssetSnapshot(page: Page, meshName: string): Promise<{ sceneUid: string; uniqueId: number; name: string } | null> {
    return await page.evaluate((name) => {
        const state = (globalThis as any).BABYLON?.FlowGraphEditor?._CurrentState;
        const scene = state?.sceneContext?.scene;
        const mesh = scene?.getMeshByName(name);
        if (!scene || !mesh) {
            return null;
        }
        return { sceneUid: scene.uid, uniqueId: mesh.uniqueId, name: mesh.name };
    }, meshName);
}

async function GetBlockSnapshot(
    page: Page,
    blockClassName: string,
    index = 0
): Promise<{
    className: string;
    config: any;
    dataInputs: { name: string; typeName: string | undefined; defaultValue: any }[];
    dataOutputs: { name: string; typeName: string | undefined; defaultValue: any }[];
}> {
    return await page.evaluate(
        ({ className, blockIndex }) => {
            const editor = (globalThis as any).BABYLON?.FlowGraphEditor;
            const graph = editor?._CurrentState?.flowGraph ?? (globalThis as any).__viteFlowGraphEditorArgs?.[0]?.flowGraph;
            const blocks = graph?.getAllBlocks().filter((block: any) => block.getClassName() === className) ?? [];
            const block = blocks[blockIndex];
            if (!block) {
                throw new Error(`${className} at index ${blockIndex} not found`);
            }

            const normalizeValue = (value: any): any => {
                if (value == null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
                    return value;
                }
                if (Array.isArray(value)) {
                    return value.map((item) => normalizeValue(item));
                }
                if (value?.constructor?.name === "FlowGraphInteger" && "value" in value) {
                    return { typeName: "FlowGraphInteger", value: value.value };
                }
                const constructorName = value.constructor?.name?.replace(/^_/, "");
                if (typeof value.asArray === "function" && constructorName === "Matrix") {
                    return { typeName: "Matrix", values: value.asArray() };
                }
                if ("uniqueId" in value && "name" in value) {
                    return { typeName: value.getClassName?.() ?? value.constructor?.name, uniqueId: value.uniqueId, name: value.name };
                }
                if ("x" in value && "y" in value) {
                    const explicitTypeName = typeof value.typeName === "string" && /^[A-Z]/.test(value.typeName) ? value.typeName : undefined;
                    const inferredTypeName =
                        explicitTypeName ?? ("w" in value ? (constructorName === "Quaternion" ? "Quaternion" : "Vector4") : "z" in value ? "Vector3" : "Vector2");
                    const vectorValue: any = { typeName: inferredTypeName, x: value.x, y: value.y };
                    if ("z" in value) {
                        vectorValue.z = value.z;
                    }
                    if ("w" in value) {
                        vectorValue.w = value.w;
                    }
                    return vectorValue;
                }
                if (typeof value.typeName === "string") {
                    return { typeName: value.typeName };
                }

                const normalizedObject: Record<string, any> = {};
                for (const [key, nestedValue] of Object.entries(value)) {
                    normalizedObject[key] = normalizeValue(nestedValue);
                }
                return normalizedObject;
            };

            const normalizeConnection = (connection: any) => ({
                name: connection.name,
                typeName: connection.richType?.typeName,
                defaultValue: normalizeValue(connection._defaultValue),
            });

            return {
                className: block.getClassName(),
                config: normalizeValue(block.config),
                dataInputs: block.dataInputs.map(normalizeConnection),
                dataOutputs: block.dataOutputs.map(normalizeConnection),
            };
        },
        { className: blockClassName, blockIndex: index }
    );
}

function PropertiesPane(page: Page) {
    return page.getByText("Properties", { exact: true }).first().locator("xpath=ancestor::*[.//button[.//text()='General']][1]");
}

function PropertyControl(page: Page, label: string, occurrence: "first" | "last" = "first") {
    const controls = PropertiesPane(page)
        .getByText(label, { exact: true })
        .locator("xpath=ancestor::*[.//input or .//*[@role='combobox'] or .//*[@role='switch'] or .//button][1]");
    return occurrence === "last" ? controls.last() : controls.first();
}

async function FillPropertyText(page: Page, label: string, value: string, occurrence: "first" | "last" = "first"): Promise<void> {
    const input = PropertyControl(page, label, occurrence).locator("input").first();
    await expect(input).toBeVisible();
    await input.fill(value);
    await input.press("Enter");
}

async function FillPropertyNumber(page: Page, label: string, value: string, occurrence: "first" | "last" = "first"): Promise<void> {
    const input = PropertyControl(page, label, occurrence).locator("input").first();
    await expect(input).toBeVisible();
    await input.fill(value);
    await input.press("Enter");
}

async function SelectPropertyOption(page: Page, label: string, optionName: string, occurrence: "first" | "last" = "first"): Promise<void> {
    const combobox = PropertyControl(page, label, occurrence).getByRole("combobox").first();
    await expect(combobox).toBeVisible();
    await combobox.click();
    await page.getByRole("option", { name: optionName, exact: true }).click();
}

async function SelectPropertyComboboxOption(page: Page, label: string, optionName: string, occurrence: "first" | "last" = "first"): Promise<void> {
    const combobox = PropertyControl(page, label, occurrence).getByRole("combobox").first();
    await expect(combobox).toBeVisible();
    await combobox.click();
    await combobox.fill(optionName);
    await page.getByRole("option", { name: optionName, exact: true }).click();
}

async function ExpandProperty(page: Page, label: string, occurrence: "first" | "last" = "first"): Promise<void> {
    const expandButton = PropertyControl(page, label, occurrence).getByRole("button", { name: "Expand/Collapse property" }).first();
    await expect(expandButton).toBeVisible();
    await expandButton.click();
}

function VariableCard(page: Page, variableName: string): Locator {
    return page.locator("[class*='fui-Card']").filter({ hasText: variableName }).first();
}

async function AddVariableFromPanel(page: Page, variableName: string): Promise<Locator> {
    await page.getByRole("button", { name: /Add (a new )?variable/i }).click();
    const nameInput = page.locator("input:focus");
    await expect(nameInput).toBeVisible();
    await nameInput.fill(variableName);
    await nameInput.press("Enter");

    const variableCard = VariableCard(page, variableName);
    await expect(variableCard).toBeVisible();
    return variableCard;
}

async function SelectVariableType(page: Page, variableCard: Locator, typeName: string): Promise<void> {
    await variableCard.getByRole("combobox").click();
    await page.getByRole("option", { name: typeName, exact: true }).click();
}

async function FillVariableNumberInputs(variableCard: Locator, values: string[]): Promise<void> {
    const inputs = variableCard.locator("input[type='number']");
    await expect(inputs).toHaveCount(values.length);
    for (let index = 0; index < values.length; index++) {
        await inputs.nth(index).fill(values[index]);
    }
}

async function SelectExecutionContext(page: Page, contextName: string): Promise<void> {
    const dropdown = page.getByRole("combobox", { name: "Execution context" });
    await expect(dropdown).toBeVisible();
    await dropdown.click();
    await page.getByRole("option", { name: contextName, exact: true }).click();
}

async function RenameSelectedExecutionContext(page: Page, contextName: string): Promise<void> {
    await page.getByRole("button", { name: "Rename selected context" }).click();
    const input = page.locator("input:focus");
    await expect(input).toBeVisible();
    await input.fill(contextName);
    await input.press("Enter");
}

async function RenameGraphTab(page: Page, currentName: string, newName: string): Promise<void> {
    await page.getByRole("tab", { name: new RegExp(currentName) }).dblclick();
    const input = page.locator("input:focus");
    await expect(input).toBeVisible();
    await input.fill(newName);
    await input.press("Enter");
}

const PreviewSceneSnippetCode = `
var createScene = function(engine, canvas) {
    var scene = new BABYLON.Scene(engine);
    var camera = new BABYLON.ArcRotateCamera("snippetCamera", -Math.PI / 4, Math.PI / 3, 6, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    new BABYLON.HemisphericLight("snippetLight", new BABYLON.Vector3(0, 1, 0), scene);
    var box = BABYLON.CreateBox("snippetBox", { size: 1 }, scene);
    box.position.x = 1;
    return scene;
};
`;

function GetPaletteDisplayName(blockClassName: string): string {
    const withoutPrefix = blockClassName.startsWith("FlowGraph") ? blockClassName.slice("FlowGraph".length) : blockClassName;
    return withoutPrefix.replace("Block", "");
}

const PaletteSmokeCategories = Object.entries(AllFlowGraphBlocks).map(([categoryName, blockClassNames]) => ({
    categoryName,
    blocks: blockClassNames.map((blockClassName) => ({
        blockClassName,
        displayName: GetPaletteDisplayName(blockClassName),
    })),
}));

test.describe("Flow Graph Editor — Loading", () => {
    test("editor loads with all panels visible", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();
    });

    test("editor starts with an empty canvas", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        const count = await fge.getNodeCount();
        expect(count).toBe(0);
    });

    test("loads a flow graph snippet from the URL hash", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("SceneReadyEvent");
        const serializedGraph = await fge.serializeGraph();
        const snippetId = "FGEHASH";
        const version = "7";

        await page.route(`https://snippet.babylonjs.com/${snippetId}/${version}`, async (route) => {
            await route.fulfill({
                contentType: "application/json",
                body: JSON.stringify({ jsonPayload: JSON.stringify({ flowGraph: serializedGraph }) }),
            });
        });

        await page.goto(`${fge.baseUrl}#${snippetId}#${version}`, { waitUntil: "load" });
        await fge.assertEditorReady();

        await expect(page.getByRole("log", { name: "Flow graph log" })).toContainText(`Flow graph loaded from snippet ${snippetId}#${version}`);
        await expect(fge.nodeOnCanvas("FlowGraphSceneReadyEventBlock")).toBeVisible();
    });

    test("node list palette contains expected categories", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        // Check that key categories exist in the palette
        for (const category of ["Events", "Control Flow", "Math", "Data Access", "Utility"]) {
            await expect(page.getByText(category, { exact: false }).first()).toBeVisible();
        }
    });
});

test.describe("Flow Graph Editor — Node Operations", () => {
    test("user can add a block from the palette", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        const before = await fge.getNodeCount();
        await fge.addBlockFromPalette("SceneReadyEvent");
        const after = await fge.getNodeCount();

        expect(after).toBe(before + 1);
        // Verify the block has the correct class on the canvas
        await expect(fge.nodeOnCanvas("FlowGraphSceneReadyEventBlock")).toBeVisible();
    });

    test("user can add multiple blocks", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("SceneReadyEvent");
        await fge.addBlockFromPalette("ConsoleLog");
        await fge.addBlockFromPalette("Branch");

        const count = await fge.getNodeCount();
        expect(count).toBe(3);

        const blockNames = await fge.getBlockClassNamesOnCanvas();
        expect(blockNames).toContain("FlowGraphSceneReadyEventBlock");
        expect(blockNames).toContain("FlowGraphConsoleLogBlock");
        expect(blockNames).toContain("FlowGraphBranchBlock");
    });

    test("user can drag a node to a new position", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("SceneReadyEvent");

        const { before, after } = await fge.dragNode("FlowGraphSceneReadyEventBlock", 150, 100);
        expect(after.x).toBeGreaterThan(before.x);
        expect(after.y).toBeGreaterThan(before.y);
    });

    test("connections follow their nodes when a node is dragged", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        // Reproduces the stranded-loading-flag bug: on a fresh (empty) editor the initial
        // build defers to sortGraph(), which used to early-return on 0 nodes without clearing
        // the canvas _isLoading flag. That left link refreshes disabled, so dragging a node
        // moved the box but froze its connections in place.
        await fge.addBlockFromPalette("SceneReadyEvent");
        await fge.addBlockFromPalette("ConsoleLog");
        await fge.connectPorts("FlowGraphSceneReadyEventBlock", "out", "FlowGraphConsoleLogBlock", "in");

        expect(await fge.getLinkCount()).toBeGreaterThanOrEqual(1);

        const before = await fge.getLinkPaths();
        await fge.dragNode("FlowGraphConsoleLogBlock", 160, 120);
        const after = await fge.getLinkPaths();

        // The link geometry must change to follow the moved node.
        expect(after).not.toEqual(before);
    });

    test("user can delete a node", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("ConsoleLog");
        expect(await fge.getNodeCount()).toBe(1);

        await fge.selectNode("FlowGraphConsoleLogBlock");
        await fge.deleteSelectedNodes();

        expect(await fge.getNodeCount()).toBe(0);
    });

    test("user can zoom in and out", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        // Zoom out (positive deltaY)
        const { before, after } = await fge.zoom(300);
        const parseBgSize = (s: string) => s.split(" ").map((v) => parseFloat(v));
        const beforeParsed = parseBgSize(before);
        const afterParsed = parseBgSize(after);

        expect(afterParsed).toHaveLength(2);
        expect(beforeParsed[0]).toBeGreaterThan(afterParsed[0]);
    });

    test("block header and port labels do not overflow the node bounds", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        // Use blocks with long names that are most likely to overflow
        await fge.addBlockFromPalette("PlayAnimation");
        await fge.addBlockFromPalette("ReceiveCustomEvent");
        await fge.addBlockFromPalette("QuaternionFromDirections");

        const blocksToCheck = ["FlowGraphPlayAnimationBlock", "FlowGraphReceiveCustomEventBlock", "FlowGraphQuaternionFromDirectionsBlock"];

        for (const blockClass of blocksToCheck) {
            const node = fge.nodeOnCanvas(blockClass);
            const nodeBox = await node.boundingBox();
            expect(nodeBox).not.toBeNull();

            // Check header text doesn't overflow
            const header = node.locator("[class*='header']").first();
            const headerBox = await header.boundingBox();
            if (headerBox && nodeBox) {
                expect(headerBox.x + headerBox.width).toBeLessThanOrEqual(nodeBox.x + nodeBox.width + 1);
            }

            // Check all port labels don't overflow the node width
            const portLabels = node.locator("[class*='port-label']");
            const count = await portLabels.count();
            for (let i = 0; i < count; i++) {
                const labelBox = await portLabels.nth(i).boundingBox();
                if (labelBox && nodeBox) {
                    expect(labelBox.x + labelBox.width).toBeLessThanOrEqual(nodeBox.x + nodeBox.width + 1);
                }
            }
        }
    });
});

test.describe("Flow Graph Editor — Palette Smoke", () => {
    for (const { categoryName, blocks } of PaletteSmokeCategories) {
        test(`all ${categoryName.replace(/_/g, " ")} blocks can be added, selected, serialized, and deleted`, async ({ page }) => {
            test.setTimeout(Math.max(60_000, blocks.length * 10_000));

            const fge = new FlowGraphEditorPage(page);
            await fge.goto();
            await fge.assertEditorReady();

            for (const block of blocks) {
                await test.step(`${block.blockClassName} (${block.displayName})`, async () => {
                    await fge.addBlockFromPalette(block.displayName);
                    await expect(fge.nodeOnCanvas(block.blockClassName), `${block.blockClassName} should be visible on the canvas`).toBeVisible();

                    await fge.selectNode(block.blockClassName);

                    const serializedGraph = JSON.parse(await fge.serializeGraph());
                    const serializedClassNames = (serializedGraph.allBlocks ?? []).map((serializedBlock: any) => serializedBlock.className);
                    expect(serializedClassNames, `${block.blockClassName} should be serialized`).toContain(block.blockClassName);

                    await fge.deleteSelectedNodes();
                    await expect(fge.nodeOnCanvas(block.blockClassName), `${block.blockClassName} should be removed from the canvas`).toHaveCount(0);
                    expect(await fge.getNodeCount()).toBe(0);
                });
            }
        });
    }
});

test.describe("Flow Graph Editor — Node List Filter", () => {
    test("filtering the node list shows matching blocks", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.filterNodeList("Branch");

        // The Branch block should be visible
        await expect(fge.paletteItem("Branch")).toBeVisible();
        // Unrelated blocks should be hidden
        await expect(fge.paletteItem("SceneReadyEvent")).not.toBeVisible();
    });

    test("clearing the filter restores all blocks", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.filterNodeList("Branch");
        await fge.clearNodeListFilter();

        // Multiple categories should be visible again
        await expect(fge.paletteItem("SceneReadyEvent")).toBeVisible();
    });

    test("filtering remains usable after multiple searches", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.filterNodeList("ConsoleLog");
        await expect(fge.paletteItem("ConsoleLog")).toBeVisible();

        await fge.filterNodeList("SceneReadyEvent");
        await expect(fge.paletteItem("SceneReadyEvent")).toBeVisible();

        await fge.clearNodeListFilter();
        await expect(fge.paletteItem("Branch")).toBeVisible();
    });
});

test.describe("Flow Graph Editor — Shell and Panels", () => {
    test("help and how-to-use toolbar buttons open their dialogs", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await page.getByRole("button", { name: "Help", exact: true }).click();
        await expect(page.getByText("Flow Graph Editor — Help", { exact: true })).toBeVisible();
        await expect(page.getByRole("button", { name: "Variables Panel" })).toBeVisible();
        await page.getByRole("button", { name: "Variables Panel" }).click();
        await expect(page.getByText("Managing Variables", { exact: true })).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(page.getByText("Flow Graph Editor — Help", { exact: true })).not.toBeVisible();

        await page.getByRole("button", { name: "How to Use (embed code samples)", exact: true }).click();
        await expect(page.getByText("How to Use This Flow Graph", { exact: true })).toBeVisible();
        await expect(page.getByText("Method 1: From Snippet Server", { exact: true })).toBeVisible();
        await expect(page.getByText("ParseCoordinatorAsync")).toBeVisible();
        await expect(page.getByRole("button", { name: "Copy" })).toHaveCount(2);
        await page.keyboard.press("Escape");
        await expect(page.getByText("How to Use This Flow Graph", { exact: true })).not.toBeVisible();
    });

    test("shell panes remain usable while adding editing and deleting a variable", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        for (const paneTitle of ["Nodes", "Properties", "Scene Preview", "Variables"]) {
            await expect(page.getByText(paneTitle, { exact: true }).first()).toBeVisible();
        }

        await page.setViewportSize({ width: 980, height: 720 });
        await expect(fge.graphCanvas).toBeVisible();
        await expect(page.getByText("Variables", { exact: true }).first()).toBeVisible();
        await expect(page.getByText("Scene Preview", { exact: true }).first()).toBeVisible();

        await page.getByRole("button", { name: /Add (a new )?variable/i }).click();
        const nameInput = page.locator("input:focus");
        await expect(nameInput).toBeVisible();
        await nameInput.fill("phaseThreeVariable");
        await page.keyboard.press("Enter");

        const variableCard = page.locator("[class*='fui-Card']").filter({ hasText: "phaseThreeVariable" }).first();
        await expect(variableCard).toBeVisible();

        await variableCard.getByRole("combobox").click();
        await page.getByRole("option", { name: "String", exact: true }).click();

        const valueInput = variableCard.locator("input").last();
        await expect(valueInput).toBeVisible();
        await valueInput.fill("edited through the shell");

        await expect
            .poll(async () => await GetVariableSnapshot(page, "phaseThreeVariable"))
            .toMatchObject({
                value: "edited through the shell",
                type: "string",
            });

        await variableCard.getByRole("button").first().click();
        await expect(variableCard).not.toBeVisible();
    });

    test("toast and dialog bridge messages render through the modular shell", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await page.evaluate(() => {
            const state = (globalThis as any).BABYLON?.FlowGraphEditor?._CurrentState;
            if (!state) {
                throw new Error("FlowGraphEditor state not found");
            }

            state.onToastNotification.notifyObservers({ message: "Phase 3 toast bridge", severity: "success" });
            state.stateManager.onErrorMessageDialogRequiredObservable.notifyObservers("Phase 3 dialog bridge");
        });

        await expect(page.locator(".fui-ToastTitle").filter({ hasText: "Phase 3 toast bridge" })).toBeVisible();
        await expect(page.getByText("Phase 3 dialog bridge", { exact: true })).toBeVisible();
        await page.getByRole("button", { name: "OK" }).click();
        await expect(page.getByText("Phase 3 dialog bridge", { exact: true })).not.toBeVisible();
    });
});

test.describe("Flow Graph Editor — Persistence and Scenes", () => {
    test("saves a graph to the snippet server through the UI", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("SceneReadyEvent");
        await fge.addBlockFromPalette("ConsoleLog");
        await fge.connectPorts("FlowGraphSceneReadyEventBlock", "out", "FlowGraphConsoleLogBlock", "in");

        let postedBody: any = null;
        await page.route(/^https:\/\/snippet\.babylonjs\.com(?:\/.*)?$/, async (route) => {
            if (route.request().method() !== "POST") {
                await route.abort();
                return;
            }
            postedBody = JSON.parse(route.request().postData() ?? "{}");
            await route.fulfill({
                contentType: "application/json",
                body: JSON.stringify({ id: "FGESAVE", version: "12" }),
            });
        });

        await page.getByRole("button", { name: "Save to snippet server", exact: true }).click();

        await expect(page.locator(".fui-ToastTitle").filter({ hasText: "Graph saved - ID: FGESAVE#12 (copied to clipboard)" })).toBeVisible();
        await expect.poll(async () => await page.evaluate(() => location.hash)).toBe("#FGESAVE#12");
        await expect.poll(async () => postedBody).not.toBeNull();

        const snippetPayload = JSON.parse(postedBody.payload);
        const savedGraphPayload = JSON.parse(snippetPayload.flowGraph);
        const savedGraph = savedGraphPayload._flowGraphs[savedGraphPayload.activeGraphIndex ?? 0];
        expect(CountSerializedConnections(savedGraph)).toBe(1);
        expect(savedGraph.allBlocks.map((block: any) => block.className)).toEqual(expect.arrayContaining(["FlowGraphSceneReadyEventBlock", "FlowGraphConsoleLogBlock"]));
    });

    test("loads a graph from the snippet server prompt", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("SceneReadyEvent");
        const serializedGraph = await fge.serializeGraph();
        await fge.selectNode("FlowGraphSceneReadyEventBlock");
        await fge.deleteSelectedNodes();
        await expect.poll(async () => await fge.getNodeCount()).toBe(0);

        const snippetId = "FGELOAD#3";
        await page.route("https://snippet.babylonjs.com/FGELOAD/3", async (route) => {
            await route.fulfill({
                contentType: "application/json",
                body: JSON.stringify({ jsonPayload: JSON.stringify({ flowGraph: serializedGraph }) }),
            });
        });

        page.once("dialog", async (dialog) => {
            expect(dialog.type()).toBe("prompt");
            await dialog.accept(snippetId);
        });
        await page.getByRole("button", { name: "Load from snippet server", exact: true }).click();

        await expect.poll(async () => await fge.getNodeCount()).toBe(1);
        await expect(fge.nodeOnCanvas("FlowGraphSceneReadyEventBlock")).toBeVisible();
        await expect(page.getByRole("log", { name: "Flow graph log" })).toContainText(`Flow graph loaded from snippet ${snippetId}`);
        await expect.poll(async () => await page.evaluate(() => location.hash)).toBe(`#${snippetId}`);
    });

    test("loads and resets a mocked preview scene snippet", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        let snippetRequests = 0;
        await page.route("https://snippet.babylonjs.com/FGEPREVIEW/2", async (route) => {
            snippetRequests++;
            await route.fulfill({
                contentType: "application/json",
                body: JSON.stringify({ jsonPayload: JSON.stringify({ code: PreviewSceneSnippetCode }) }),
            });
        });

        const previewSnippetInput = page.getByPlaceholder("Playground ID or URL...");
        await previewSnippetInput.fill("FGEPREVIEW#2");
        await previewSnippetInput.press("Enter");

        await expect
            .poll(async () => await GetScenePreviewSnapshot(page, "snippetBox"))
            .toMatchObject({
                source: "snippet",
                snippetId: "FGEPREVIEW#2",
                meshX: 1,
            });
        const originalScene = await GetScenePreviewSnapshot(page, "snippetBox");
        expect(originalScene).not.toBeNull();
        expect(originalScene!.meshNames).toContain("snippetBox");

        const popup = await UndockRightSidePaneAsync(page);
        await expect(popup.getByText("Scene Preview", { exact: true }).first()).toBeVisible();
        await popup.close();
        await expect.poll(async () => (await GetScenePreviewSnapshot(page, "snippetBox"))?.sceneUid).toBe(originalScene!.sceneUid);

        await fge.addBlockFromPalette("SceneReadyEvent");
        await fge.addBlockFromPalette("SetProperty");

        await page.evaluate(() => {
            const state = (globalThis as any).BABYLON?.FlowGraphEditor?._CurrentState;
            const graph = state?.flowGraph;
            const context = graph?.getContext(0) ?? graph?.createContext();
            const box = state?.sceneContext?.scene.getMeshByName("snippetBox");
            const sceneReadyBlock = graph?.getAllBlocks().find((block: any) => block.getClassName() === "FlowGraphSceneReadyEventBlock");
            const setPropertyBlock = graph?.getAllBlocks().find((block: any) => block.getClassName() === "FlowGraphSetPropertyBlock");
            if (!context || !box || !sceneReadyBlock || !setPropertyBlock) {
                throw new Error("Preview snippet reset test could not prepare graph");
            }

            sceneReadyBlock.getSignalOutput("out").connectTo(setPropertyBlock.getSignalInput("in"));
            setPropertyBlock.getDataInput("object").setValue(box, context);
            setPropertyBlock.getDataInput("propertyName").setValue("position.x", context);
            setPropertyBlock.getDataInput("value").setValue(6, context);
            state.onBuiltObservable.notifyObservers();
        });

        await ClickGraphControl(page, "Start");
        await WaitForGraphState(page, "Running");
        await expect.poll(async () => (await GetScenePreviewSnapshot(page, "snippetBox"))?.meshX).toBe(6);

        await ClickGraphControl(page, "Reset");
        await WaitForGraphState(page, "Stopped");
        await expect.poll(async () => (await GetScenePreviewSnapshot(page, "snippetBox"))?.sceneUid).not.toBe(originalScene!.sceneUid);
        await expect
            .poll(async () => await GetScenePreviewSnapshot(page, "snippetBox"))
            .toMatchObject({
                source: "snippet",
                snippetId: "FGEPREVIEW#2",
                meshX: 1,
            });
        expect(snippetRequests).toBeGreaterThanOrEqual(2);
    });
});

test.describe("Flow Graph Editor — Property Editor Matrix", () => {
    test("constant block type and value editors update serialized config and port type", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("Constant");
        await fge.selectNode("FlowGraphConstantBlock");

        await SelectPropertyOption(page, "Type", "String", "last");
        await FillPropertyText(page, "Value", "phase five constant");
        await expect
            .poll(async () => await GetBlockSnapshot(page, "FlowGraphConstantBlock"))
            .toMatchObject({
                config: { value: "phase five constant", _valueTypeName: "string" },
                dataOutputs: expect.arrayContaining([expect.objectContaining({ name: "output", typeName: "string" })]),
            });

        await SelectPropertyOption(page, "Type", "Vector3", "last");
        await ExpandProperty(page, "Value");
        await FillPropertyNumber(page, "X", "1", "last");
        await FillPropertyNumber(page, "Y", "2", "last");
        await FillPropertyNumber(page, "Z", "3", "last");

        await expect
            .poll(async () => await GetBlockSnapshot(page, "FlowGraphConstantBlock"))
            .toMatchObject({
                config: { value: { typeName: "Vector3", x: 1, y: 2, z: 3 }, _valueTypeName: "Vector3" },
                dataOutputs: expect.arrayContaining([expect.objectContaining({ name: "output", typeName: "Vector3" })]),
            });
    });

    test("variable picker follows variable rename and delete flows", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await page.getByRole("button", { name: /Add (a new )?variable/i }).click();
        const nameInput = page.locator("input:focus");
        await expect(nameInput).toBeVisible();
        await nameInput.fill("phaseFiveVariable");
        await nameInput.press("Enter");

        const variableCard = page.locator("[class*='fui-Card']").filter({ hasText: "phaseFiveVariable" }).first();
        await expect(variableCard).toBeVisible();

        await fge.addBlockFromPalette("GetVariable");
        await fge.addBlockFromPalette("SetVariable");

        await fge.selectNode("FlowGraphGetVariableBlock");
        await SelectPropertyComboboxOption(page, "Variable", "phaseFiveVariable");
        await expect.poll(async () => await GetBlockSnapshot(page, "FlowGraphGetVariableBlock")).toMatchObject({ config: { variable: "phaseFiveVariable" } });

        await fge.selectNode("FlowGraphSetVariableBlock");
        await SelectPropertyComboboxOption(page, "Variable", "phaseFiveVariable");
        await expect.poll(async () => await GetBlockSnapshot(page, "FlowGraphSetVariableBlock")).toMatchObject({ config: { variable: "phaseFiveVariable" } });

        await variableCard.getByText("phaseFiveVariable", { exact: true }).first().dblclick();
        const renameInput = page.locator("input:focus");
        await expect(renameInput).toBeVisible();
        await renameInput.fill("phaseFiveRenamed");
        await renameInput.press("Enter");

        await expect.poll(async () => await GetBlockSnapshot(page, "FlowGraphGetVariableBlock")).toMatchObject({ config: { variable: "phaseFiveRenamed" } });
        await expect.poll(async () => await GetBlockSnapshot(page, "FlowGraphSetVariableBlock")).toMatchObject({ config: { variable: "phaseFiveRenamed" } });

        const renamedVariableCard = page.locator("[class*='fui-Card']").filter({ hasText: "phaseFiveRenamed" }).first();
        await expect(renamedVariableCard).toBeVisible();
        await renamedVariableCard.getByRole("button").first().click();

        await expect.poll(async () => await fge.getNodeCount()).toBe(0);
        await expect(renamedVariableCard).not.toBeVisible();
    });

    test("get asset picker stores named scene selections and rebinds after reset", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();
        await expect.poll(async () => (await GetDefaultSceneBoxInfo(page)).source).toBe("default");

        await fge.addBlockFromPalette("GetAsset");
        await fge.selectNode("FlowGraphGetAssetBlock");

        await SelectPropertyOption(page, "Asset Type", "Mesh");
        await SelectPropertyOption(page, "Asset", "box");

        const firstBox = await GetSceneAssetSnapshot(page, "box");
        expect(firstBox).not.toBeNull();
        await expect
            .poll(async () => await GetBlockSnapshot(page, "FlowGraphGetAssetBlock"))
            .toMatchObject({
                config: {
                    type: "Mesh",
                    index: { value: firstBox!.uniqueId },
                    useIndexAsUniqueId: true,
                    _assetName: "box",
                },
            });

        await ClickGraphControl(page, "Reset");
        await WaitForGraphState(page, "Stopped");
        await fge.selectNode("FlowGraphGetAssetBlock");

        const reboundBox = await GetSceneAssetSnapshot(page, "box");
        expect(reboundBox).not.toBeNull();
        expect(reboundBox!.sceneUid).not.toBe(firstBox!.sceneUid);
        await expect
            .poll(async () => await GetBlockSnapshot(page, "FlowGraphGetAssetBlock"))
            .toMatchObject({
                config: {
                    index: { value: reboundBox!.uniqueId },
                    useIndexAsUniqueId: true,
                    _assetName: "box",
                },
            });
    });

    test("custom event editors update event id and dynamic payload ports without duplicates", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("SendCustomEvent");
        await fge.selectNode("FlowGraphSendCustomEventBlock");

        await FillPropertyText(page, "Event ID", "phase-five-event");
        await FillPropertyText(page, "Name", "payload", "last");
        await SelectPropertyOption(page, "Type", "String", "last");
        await page.getByRole("button", { name: "Add Entry" }).click();

        await expect
            .poll(async () => await GetBlockSnapshot(page, "FlowGraphSendCustomEventBlock"))
            .toMatchObject({
                config: { eventId: "phase-five-event", eventData: { payload: { type: { typeName: "string" } } } },
                dataInputs: expect.arrayContaining([expect.objectContaining({ name: "payload", typeName: "string", defaultValue: "" })]),
            });

        await FillPropertyText(page, "Name", "payload", "last");
        await page.getByRole("button", { name: "Add Entry" }).click();

        await expect
            .poll(async () => await GetBlockSnapshot(page, "FlowGraphSendCustomEventBlock"))
            .toMatchObject({
                config: { eventData: { payload: { type: { typeName: "string" } } } },
            });
        expect((await GetBlockSnapshot(page, "FlowGraphSendCustomEventBlock")).dataInputs.filter((input) => input.name === "payload")).toHaveLength(1);

        await page.getByRole("button", { name: "Remove payload" }).click();
        await expect.poll(async () => (await GetBlockSnapshot(page, "FlowGraphSendCustomEventBlock")).dataInputs.some((input) => input.name === "payload")).toBe(false);
    });

    test("get and set property path editors update config and connection defaults", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("GetProperty");
        await fge.selectNode("FlowGraphGetPropertyBlock");
        await FillPropertyText(page, "propertyName", "position.x");
        await expect
            .poll(async () => await GetBlockSnapshot(page, "FlowGraphGetPropertyBlock"))
            .toMatchObject({
                dataInputs: expect.arrayContaining([expect.objectContaining({ name: "propertyName", typeName: "string", defaultValue: "position.x" })]),
            });

        await fge.addBlockFromPalette("SetProperty");
        await fge.selectNode("FlowGraphSetPropertyBlock");
        await FillPropertyText(page, "propertyName", "position.y");
        await expect
            .poll(async () => await GetBlockSnapshot(page, "FlowGraphSetPropertyBlock"))
            .toMatchObject({
                dataInputs: expect.arrayContaining([expect.objectContaining({ name: "propertyName", typeName: "string", defaultValue: "position.y" })]),
            });
    });
});

test.describe("Flow Graph Editor — Port Connections", () => {
    test("accepts compatible signal and data port connections", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("SceneReadyEvent");
        await fge.addBlockFromPalette("ConsoleLog");
        await fge.addBlockFromPalette("Constant");

        await fge.selectNode("FlowGraphConstantBlock");
        await SelectPropertyOption(page, "Type", "String", "last");

        await fge.connectPorts("FlowGraphSceneReadyEventBlock", "out", "FlowGraphConsoleLogBlock", "in");
        await fge.connectPorts("FlowGraphConstantBlock", "output", "FlowGraphConsoleLogBlock", "logType");

        await expect.poll(async () => await fge.getLinkCount()).toBeGreaterThanOrEqual(2);

        const topology = await fge.getGraphTopology();
        const sceneReadyBlock = topology.blocks.find((block) => block.className === "FlowGraphSceneReadyEventBlock");
        const constantBlock = topology.blocks.find((block) => block.className === "FlowGraphConstantBlock");

        expect(topology.totalConnections).toBe(2);
        expect(sceneReadyBlock?.signalOuts.find((port) => port.name === "out")?.connectedIds).toHaveLength(1);
        expect(constantBlock?.dataOuts.find((port) => port.name === "output")?.connectedIds).toHaveLength(1);
    });

    test("rejects incompatible data port types without changing topology", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("Constant");
        await fge.addBlockFromPalette("Branch");

        await fge.selectNode("FlowGraphConstantBlock");
        await SelectPropertyOption(page, "Type", "String", "last");

        await fge.connectPorts("FlowGraphConstantBlock", "output", "FlowGraphBranchBlock", "condition");

        await expect(page.getByText(/Type mismatch: cannot connect/i)).toBeVisible();
        expect((await fge.getGraphTopology()).totalConnections).toBe(0);
        expect(await fge.getLinkCount()).toBe(0);

        await page.getByRole("button", { name: "OK" }).click();
        await expect(page.getByText(/Type mismatch: cannot connect/i)).not.toBeVisible();
    });

    test("rejects signal to data port drops without changing topology", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("SceneReadyEvent");
        await fge.addBlockFromPalette("Branch");

        await fge.connectPorts("FlowGraphSceneReadyEventBlock", "out", "FlowGraphBranchBlock", "condition");

        await expect(page.getByText("Incompatible connection types")).toBeVisible();
        expect((await fge.getGraphTopology()).totalConnections).toBe(0);
        expect(await fge.getLinkCount()).toBe(0);

        await page.getByRole("button", { name: "OK" }).click();
        await expect(page.getByText("Incompatible connection types")).not.toBeVisible();
    });
});

test.describe("Flow Graph Editor — Variables Panel Types", () => {
    test("edits boolean vector color integer and scene object values from the variables panel", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();
        await expect.poll(async () => (await GetDefaultSceneBoxInfo(page)).source).toBe("default");

        const booleanCard = await AddVariableFromPanel(page, "phaseSevenBool");
        await SelectVariableType(page, booleanCard, "Boolean");
        await booleanCard.getByRole("switch").click();
        await expect.poll(async () => await GetVariableSnapshot(page, "phaseSevenBool")).toMatchObject({ value: true, type: "boolean" });

        const integerCard = await AddVariableFromPanel(page, "phaseSevenInteger");
        await SelectVariableType(page, integerCard, "Integer");
        await FillVariableNumberInputs(integerCard, ["8.7"]);
        await expect.poll(async () => await GetVariableSnapshot(page, "phaseSevenInteger")).toMatchObject({ value: { value: 9 }, type: "FlowGraphInteger" });

        const vectorCard = await AddVariableFromPanel(page, "phaseSevenVector");
        await SelectVariableType(page, vectorCard, "Vector3");
        await FillVariableNumberInputs(vectorCard, ["1", "2", "3"]);
        await expect.poll(async () => await GetVariableSnapshot(page, "phaseSevenVector")).toMatchObject({ value: { x: 1, y: 2, z: 3 }, type: "Vector3" });

        const colorCard = await AddVariableFromPanel(page, "phaseSevenColor");
        await SelectVariableType(page, colorCard, "Color4");
        await FillVariableNumberInputs(colorCard, ["0.1", "0.2", "0.3", "0.4"]);
        await expect.poll(async () => await GetVariableSnapshot(page, "phaseSevenColor")).toMatchObject({ value: { r: 0.1, g: 0.2, b: 0.3, a: 0.4 }, type: "Color4" });

        const meshCard = await AddVariableFromPanel(page, "phaseSevenMesh");
        await SelectVariableType(page, meshCard, "Mesh");
        await meshCard.locator("select").selectOption({ label: "box" });
        await expect.poll(async () => await GetVariableSnapshot(page, "phaseSevenMesh")).toMatchObject({ type: "Mesh", sceneObjectName: "box", sceneObjectInContextScene: true });
    });
});

test.describe("Flow Graph Editor — Context Management", () => {
    test("creates renames switches and removes contexts while preserving scoped variable values", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        if ((await GetContextSnapshot(page)).contexts.length === 0) {
            await page.getByRole("button", { name: "Add execution context" }).click();
        }
        await expect.poll(async () => (await GetContextSnapshot(page)).contexts.length).toBeGreaterThanOrEqual(1);

        await RenameSelectedExecutionContext(page, "Primary Context");
        await expect.poll(async () => (await GetContextSnapshot(page)).contexts[0]?.name).toBe("Primary Context");

        await page.getByRole("button", { name: "Add execution context" }).click();
        await expect.poll(async () => (await GetContextSnapshot(page)).selectedContextIndex).toBe(1);
        await RenameSelectedExecutionContext(page, "Secondary Context");
        await expect.poll(async () => (await GetContextSnapshot(page)).contexts.map((context) => context.name)).toEqual(["Primary Context", "Secondary Context"]);

        await page.evaluate(() => {
            const state = (globalThis as any).BABYLON?.FlowGraphEditor?._CurrentState;
            const graph = state?.flowGraph;
            const primaryContext = graph?.getContext(0);
            const secondaryContext = graph?.getContext(1);
            if (!state || !primaryContext || !secondaryContext) {
                throw new Error("FlowGraph contexts not found");
            }

            primaryContext.setVariable("sharedContextValue", "primary");
            primaryContext.setVariableType("sharedContextValue", "string");
            secondaryContext.setVariable("sharedContextValue", "secondary");
            secondaryContext.setVariableType("sharedContextValue", "string");
            state.onSelectedContextChanged.notifyObservers(state.selectedContextIndex);
        });

        const sharedVariableCard = VariableCard(page, "sharedContextValue");
        await expect(sharedVariableCard).toBeVisible();
        await expect(sharedVariableCard.locator("input").last()).toHaveValue("secondary");

        await SelectExecutionContext(page, "Primary Context");
        await expect.poll(async () => (await GetContextSnapshot(page)).selectedContextIndex).toBe(0);
        await expect(sharedVariableCard.locator("input").last()).toHaveValue("primary");
        await sharedVariableCard.locator("input").last().fill("primary edited");

        await expect.poll(async () => await GetVariableSnapshot(page, "sharedContextValue", 0)).toMatchObject({ value: "primary edited", type: "string" });
        await expect.poll(async () => await GetVariableSnapshot(page, "sharedContextValue", 1)).toMatchObject({ value: "secondary", type: "string" });

        await SelectExecutionContext(page, "Secondary Context");
        await expect.poll(async () => (await GetContextSnapshot(page)).selectedContextIndex).toBe(1);
        await expect(sharedVariableCard.locator("input").last()).toHaveValue("secondary");

        await page.getByRole("button", { name: "Remove selected context" }).click();
        await expect.poll(async () => (await GetContextSnapshot(page)).contexts.map((context) => context.name)).toEqual(["Primary Context"]);
        await expect.poll(async () => (await GetContextSnapshot(page)).selectedContextIndex).toBe(0);
        await expect.poll(async () => await GetVariableSnapshot(page, "sharedContextValue", 0)).toMatchObject({ value: "primary edited", type: "string" });
        await expect(page.getByRole("log", { name: "Flow graph log" })).toContainText("Removed context 1.");
    });
});

test.describe("Flow Graph Editor — Graph Tabs Preview Files and glTF Import", () => {
    test("renames switches and closes graph tabs while preserving graph-specific layout and connections", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        const originalGraphName = (await fge.getGraphNames())[0];
        await RenameGraphTab(page, originalGraphName, "Logic Graph");
        await expect.poll(async () => (await GetCoordinatorSnapshot(page)).graphs.map((graph) => graph.name)).toEqual(["Logic Graph"]);

        await fge.addBlockFromPalette("SceneReadyEvent");
        await fge.addBlockFromPalette("Branch");
        await fge.addBlockFromPalette("ConsoleLog");
        await fge.connectPorts("FlowGraphSceneReadyEventBlock", "out", "FlowGraphBranchBlock", "in");
        await fge.connectPorts("FlowGraphBranchBlock", "onTrue", "FlowGraphConsoleLogBlock", "in");
        await fge.dragNode("FlowGraphBranchBlock", 0, 180);
        const branchPosition = await fge.getNodeCanvasPosition("FlowGraphBranchBlock");

        await fge.addGraphTab();
        await RenameGraphTab(page, (await fge.getGraphNames())[1], "Scratch Graph");
        await expect.poll(async () => (await GetCoordinatorSnapshot(page)).activeGraphIndex).toBe(1);
        await expect
            .poll(async () => await GetCoordinatorSnapshot(page))
            .toMatchObject({
                dispatchEventsSynchronously: true,
                hasHostResolver: false,
            });
        await fge.addBlockFromPalette("Constant");
        await expect.poll(async () => await fge.getNodeCount()).toBe(1);

        await fge.selectGraphTab("Logic Graph");
        await expect.poll(async () => await fge.getNodeCount()).toBe(3);
        await expect.poll(async () => await fge.getLinkCount()).toBeGreaterThanOrEqual(2);
        await expect.poll(async () => await fge.getNodeCanvasPosition("FlowGraphBranchBlock")).toEqual(branchPosition);

        await fge.selectGraphTab("Scratch Graph");
        await expect.poll(async () => await fge.getNodeCount()).toBe(1);
        await expect(fge.nodeOnCanvas("FlowGraphConstantBlock")).toBeVisible();

        await fge.closeGraphTab("Scratch Graph");
        await expect
            .poll(async () => await GetCoordinatorSnapshot(page))
            .toMatchObject({
                activeGraphIndex: 0,
                graphs: [
                    {
                        name: "Logic Graph",
                        totalConnections: 2,
                        blockClassNames: expect.arrayContaining(["FlowGraphSceneReadyEventBlock", "FlowGraphBranchBlock", "FlowGraphConsoleLogBlock"]),
                    },
                ],
            });
        await expect.poll(async () => await fge.getNodeCanvasPosition("FlowGraphBranchBlock")).toEqual(branchPosition);
    });

    test("loads a dropped local glTF preview scene and keeps it selected on reset", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();
        const defaultScene = await GetSceneContextSnapshot(page);
        expect(defaultScene?.source).toBe("default");

        await page.evaluate(() => {
            const gltf = JSON.stringify({
                asset: { version: "2.0", generator: "FGE Phase 10 test" },
                scene: 0,
                scenes: [{ nodes: [0] }],
                nodes: [{ name: "phaseTenNode" }],
                extensionsUsed: ["KHR_materials_variants"],
                extensions: { KHR_materials_variants: { variants: [{ name: "service state" }] } },
            });
            const file = new File([gltf], "phaseTenScene.gltf", { type: "model/gltf+json" });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            const target = document.querySelector("canvas") ?? document.body;
            target.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer }));
        });

        await expect
            .poll(async () => await GetSceneContextSnapshot(page))
            .toMatchObject({
                source: "file",
                snippetId: "",
                transformNodeNames: expect.arrayContaining(["phaseTenNode"]),
            });
        const fileScene = await GetSceneContextSnapshot(page);
        expect(fileScene?.sceneUid).not.toBe(defaultScene?.sceneUid);
        await expect(page.getByRole("button", { name: "New behavior" })).toBeEnabled();
        await expect(page.getByRole("button", { name: "New behavior" })).toHaveAttribute("title", /Create a glTF selection behavior/i);

        await ClickGraphControl(page, "Reset");
        await WaitForGraphState(page, "Stopped");
        await expect
            .poll(async () => await GetSceneContextSnapshot(page))
            .toMatchObject({
                sceneUid: fileScene!.sceneUid,
                source: "file",
                transformNodeNames: expect.arrayContaining(["phaseTenNode"]),
            });
    });

    test("retains an imported graph when a graphless scene replaces its owning scene", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto({ local: true });
        await fge.assertEditorReady();
        await fge.addBlockFromPalette("SceneReadyEvent");
        const serializedGraph = JSON.parse(await fge.serializeGraph());

        const graphBearingGltf = {
            asset: { version: "2.0" },
            scene: 0,
            scenes: [{ nodes: [0] }],
            nodes: [{ name: "graphBearingSceneNode" }],
            extensionsUsed: ["BABYLON_flow_graph"],
            extensions: { BABYLON_flow_graph: { flowGraph: serializedGraph } },
        };
        await page.evaluate((source) => {
            const file = new File([JSON.stringify(source)], "graphBearingScene.gltf", { type: "model/gltf+json" });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            (document.querySelector("canvas") ?? document.body).dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer }));
        }, graphBearingGltf);

        await expect(page.getByRole("log", { name: "Flow graph log" })).toContainText('Imported flow graph from "graphBearingScene.gltf"');
        await page.evaluate(() => {
            const state = (globalThis as any).BABYLON?.FlowGraphEditor?._CurrentState;
            (globalThis as any).__graphBearingSceneState = {
                coordinator: state.coordinator,
                flowGraph: state.flowGraph,
                scene: state.sceneContext.scene,
            };
        });

        const graphlessGltf = {
            asset: { version: "2.0" },
            scene: 0,
            scenes: [{ nodes: [0] }],
            nodes: [{ name: "graphlessSceneNode" }],
        };
        await page.evaluate((source) => {
            const file = new File([JSON.stringify(source)], "graphlessScene.gltf", { type: "model/gltf+json" });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            (document.querySelector("canvas") ?? document.body).dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer }));
        }, graphlessGltf);

        await expect.poll(async () => (await GetSceneContextSnapshot(page))?.transformNodeNames).toContain("graphlessSceneNode");
        await expect
            .poll(
                async () =>
                    await page.evaluate(() => {
                        const state = (globalThis as any).BABYLON?.FlowGraphEditor?._CurrentState;
                        const before = (globalThis as any).__graphBearingSceneState;
                        const scene = state.sceneContext.scene;
                        return {
                            coordinatorRetained: state.coordinator === before.coordinator,
                            graphRetained: state.flowGraph === before.flowGraph,
                            graphMembership: state.coordinator.flowGraphs.includes(state.flowGraph),
                            coordinatorScene: state.coordinator.config.scene === scene,
                            graphScene: state.flowGraph.scene === scene,
                            newSceneRegistered: (globalThis as any).BABYLON.FlowGraphCoordinator.SceneCoordinators.get(scene)?.includes(state.coordinator) ?? false,
                            oldSceneCoordinatorCount: (globalThis as any).BABYLON.FlowGraphCoordinator.SceneCoordinators.get(before.scene)?.length,
                            oldSceneDisposed: before.scene.isDisposed,
                        };
                    })
            )
            .toEqual({
                coordinatorRetained: true,
                graphRetained: true,
                graphMembership: true,
                coordinatorScene: true,
                graphScene: true,
                newSceneRegistered: true,
                oldSceneCoordinatorCount: 0,
                oldSceneDisposed: true,
            });
        await ClickGraphControl(page, "Start");
        await WaitForGraphState(page, "Running");
        await ClickGraphControl(page, "Stop");
        await WaitForGraphState(page, "Stopped");
    });

    test("rejects graphless scene replacement while editing a borrowed live-host graph", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto({ local: true });
        await fge.assertEditorReady();
        await fge.addBlockFromPalette("SceneReadyEvent");
        await ClickGraphControl(page, "Start");
        await WaitForGraphState(page, "Running");
        await page.evaluate(() => {
            const state = (globalThis as any).BABYLON?.FlowGraphEditor?._CurrentState;
            state.hostScene = state.sceneContext.scene;
            state.sceneSource = "host";
            (globalThis as any).__borrowedHostStateBeforeGraphlessDrop = {
                sceneContext: state.sceneContext,
                coordinator: state.coordinator,
                flowGraph: state.flowGraph,
                engineCount: (globalThis as any).BABYLON.EngineStore.Instances.length,
            };
        });

        const graphlessGltf = {
            asset: { version: "2.0" },
            scene: 0,
            scenes: [{ nodes: [0] }],
            nodes: [{ name: "rejectedHostReplacementNode" }],
        };
        await page.evaluate((source) => {
            const file = new File([JSON.stringify(source)], "hostGraphlessScene.gltf", { type: "model/gltf+json" });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            (document.querySelector("canvas") ?? document.body).dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer }));
        }, graphlessGltf);

        await expect(page.getByRole("log", { name: "Flow graph log" })).toContainText("Graphless scene replacement is unavailable while editing a borrowed live-host graph.");
        await expect
            .poll(
                async () =>
                    await page.evaluate(() => {
                        const state = (globalThis as any).BABYLON?.FlowGraphEditor?._CurrentState;
                        const before = (globalThis as any).__borrowedHostStateBeforeGraphlessDrop;
                        return {
                            sceneContext: state.sceneContext === before.sceneContext,
                            coordinator: state.coordinator === before.coordinator,
                            flowGraph: state.flowGraph === before.flowGraph,
                            graphMembership: state.coordinator.flowGraphs.includes(state.flowGraph),
                            running: state.flowGraph.state,
                            engineCount: (globalThis as any).BABYLON.EngineStore.Instances.length === before.engineCount,
                            stagedNodePublished: !!state.sceneContext.scene.getTransformNodeByName("rejectedHostReplacementNode"),
                        };
                    })
            )
            .toEqual({
                sceneContext: true,
                coordinator: true,
                flowGraph: true,
                graphMembership: true,
                running: 1,
                engineCount: true,
                stagedNodePublished: false,
            });
    });

    test("rejects graphless scene replacement for KHR_interactivity runtime services", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto({ local: true });
        await fge.assertEditorReady();

        const khrGltf = {
            asset: { version: "2.0" },
            scene: 0,
            scenes: [{ nodes: [0] }],
            nodes: [{ name: "khrRuntimeNode" }],
            extensionsUsed: ["KHR_interactivity"],
            extensions: {
                KHR_interactivity: {
                    graphs: [{ name: "KHR Runtime", declarations: [{ op: "event/onStart" }], nodes: [{ declaration: 0 }] }],
                },
            },
        };
        await page.evaluate((source) => {
            const file = new File([JSON.stringify(source)], "khrRuntimeScene.gltf", { type: "model/gltf+json" });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            (document.querySelector("canvas") ?? document.body).dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer }));
        }, khrGltf);
        await expect.poll(async () => await fge.getGraphNames()).toEqual(["KHR Runtime"]);
        await page.evaluate(() => {
            const state = (globalThis as any).BABYLON?.FlowGraphEditor?._CurrentState;
            (globalThis as any).__khrRuntimeStateBeforeGraphlessDrop = {
                sceneContext: state.sceneContext,
                coordinator: state.coordinator,
                flowGraph: state.flowGraph,
                hostResolver: state.coordinator.config.hostResolver,
                engineCount: (globalThis as any).BABYLON.EngineStore.Instances.length,
            };
        });

        const graphlessGltf = {
            asset: { version: "2.0" },
            scene: 0,
            scenes: [{ nodes: [0] }],
            nodes: [{ name: "rejectedKhrReplacementNode" }],
        };
        await page.evaluate((source) => {
            const file = new File([JSON.stringify(source)], "khrGraphlessScene.gltf", { type: "model/gltf+json" });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            (document.querySelector("canvas") ?? document.body).dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer }));
        }, graphlessGltf);

        await expect(page.getByRole("log", { name: "Flow graph log" })).toContainText(
            "Graphless scene replacement is unavailable for KHR_interactivity imports because their runtime services belong to the current asset."
        );
        await expect
            .poll(
                async () =>
                    await page.evaluate(() => {
                        const state = (globalThis as any).BABYLON?.FlowGraphEditor?._CurrentState;
                        const before = (globalThis as any).__khrRuntimeStateBeforeGraphlessDrop;
                        return {
                            sceneContext: state.sceneContext === before.sceneContext,
                            coordinator: state.coordinator === before.coordinator,
                            flowGraph: state.flowGraph === before.flowGraph,
                            graphMembership: state.coordinator.flowGraphs.includes(state.flowGraph),
                            hostResolver: state.coordinator.config.hostResolver === before.hostResolver,
                            synchronousDispatch: state.coordinator.dispatchEventsSynchronously,
                            importScoped: state.hasImportScopedRuntime,
                            engineCount: (globalThis as any).BABYLON.EngineStore.Instances.length === before.engineCount,
                            stagedNodePublished: !!state.sceneContext.scene.getTransformNodeByName("rejectedKhrReplacementNode"),
                        };
                    })
            )
            .toEqual({
                sceneContext: true,
                coordinator: true,
                flowGraph: true,
                graphMembership: true,
                hostResolver: true,
                synchronousDispatch: false,
                importScoped: true,
                engineCount: true,
                stagedNodePublished: false,
            });
        await ClickGraphControl(page, "Start");
        await WaitForGraphState(page, "Running");
        await ClickGraphControl(page, "Stop");
        await WaitForGraphState(page, "Stopped");
    });

    test("loads flow graphs from glTF extension files and leaves the graph unchanged when the extension is absent", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("SceneReadyEvent");
        await fge.addBlockFromPalette("ConsoleLog");
        await fge.connectPorts("FlowGraphSceneReadyEventBlock", "out", "FlowGraphConsoleLogBlock", "in");
        const serializedGraph = JSON.parse(await fge.serializeGraph());

        await fge.goto();
        await fge.assertEditorReady();
        await expect.poll(async () => await fge.getNodeCount()).toBe(0);

        const graphGltf = {
            asset: { version: "2.0", generator: "FGE Phase 11 test" },
            extensionsUsed: ["BABYLON_flow_graph"],
            extensions: { BABYLON_flow_graph: { flowGraph: serializedGraph } },
        };
        await page.locator("input[type='file'][accept='.glb,.gltf']").setInputFiles({
            name: "phaseElevenGraph.gltf",
            mimeType: "model/gltf+json",
            buffer: Buffer.from(JSON.stringify(graphGltf)),
        });

        await expect.poll(async () => await fge.getNodeCount()).toBe(2);
        await expect.poll(async () => await fge.getLinkCount()).toBeGreaterThanOrEqual(1);
        await expect(page.getByRole("log", { name: "Flow graph log" })).toContainText("Flow graph loaded from glTF file");
        await expect(page.getByRole("button", { name: /Export glTF/i })).toHaveCount(0);

        const topologyBeforeMissingExtension = await fge.getGraphTopology();
        await page.locator("input[type='file'][accept='.glb,.gltf']").setInputFiles({
            name: "phaseElevenNoGraph.gltf",
            mimeType: "model/gltf+json",
            buffer: Buffer.from(JSON.stringify({ asset: { version: "2.0" }, scenes: [{ nodes: [] }], scene: 0 })),
        });

        await expect(page.getByRole("log", { name: "Flow graph log" })).toContainText("No BABYLON_flow_graph extension found in this file");
        expect(await fge.getGraphTopology()).toEqual(topologyBeforeMissingExtension);
    });

    test("keeps the current scene and graph when a dropped KHR_interactivity file has no graphs", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto({ local: true });
        await fge.assertEditorReady();
        await fge.addBlockFromPalette("SceneReadyEvent");
        await page.evaluate(() => {
            const state = (globalThis as any).BABYLON?.FlowGraphEditor?._CurrentState;
            (globalThis as any).__sceneGraphPairBeforeFailedFile = {
                sceneContext: state.sceneContext,
                coordinator: state.coordinator,
                flowGraph: state.flowGraph,
                engineCount: (globalThis as any).BABYLON.EngineStore.Instances.length,
            };
        });

        const invalidKhrGltf = {
            asset: { version: "2.0" },
            scene: 0,
            scenes: [{ nodes: [0] }],
            nodes: [{ name: "failedKhrNode" }],
            extensionsUsed: ["KHR_interactivity"],
            extensions: { KHR_interactivity: { graphs: [] } },
        };
        await page.evaluate((source) => {
            const file = new File([JSON.stringify(source)], "zeroKhrGraphs.gltf", { type: "model/gltf+json" });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            (document.querySelector("canvas") ?? document.body).dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer }));
        }, invalidKhrGltf);

        await expect(page.getByRole("log", { name: "Flow graph log" })).toContainText("A Flow Graph coordinator must contain at least one graph.");
        await expect
            .poll(
                async () =>
                    await page.evaluate(() => {
                        const state = (globalThis as any).BABYLON?.FlowGraphEditor?._CurrentState;
                        const before = (globalThis as any).__sceneGraphPairBeforeFailedFile;
                        return {
                            sceneContext: state.sceneContext === before.sceneContext,
                            coordinator: state.coordinator === before.coordinator,
                            flowGraph: state.flowGraph === before.flowGraph,
                            engineCount: (globalThis as any).BABYLON.EngineStore.Instances.length === before.engineCount,
                            failedNodePublished: !!state.sceneContext.scene.getTransformNodeByName("failedKhrNode"),
                        };
                    })
            )
            .toEqual({ sceneContext: true, coordinator: true, flowGraph: true, engineCount: true, failedNodePublished: false });
        await ClickGraphControl(page, "Start");
        await WaitForGraphState(page, "Running");
        await ClickGraphControl(page, "Stop");
        await WaitForGraphState(page, "Stopped");
    });

    test("rejects malformed BABYLON_flow_graph data without publishing its staged scene", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();
        await fge.addBlockFromPalette("SceneReadyEvent");
        await page.evaluate(() => {
            const state = (globalThis as any).BABYLON?.FlowGraphEditor?._CurrentState;
            (globalThis as any).__sceneGraphPairBeforeMalformedCustomGraph = {
                sceneContext: state.sceneContext,
                coordinator: state.coordinator,
                flowGraph: state.flowGraph,
                engineCount: (globalThis as any).BABYLON.EngineStore.Instances.length,
            };
        });

        const malformedCustomGraphGltf = {
            asset: { version: "2.0" },
            scene: 0,
            scenes: [{ nodes: [0] }],
            nodes: [{ name: "failedCustomGraphNode" }],
            extensionsUsed: ["BABYLON_flow_graph"],
            extensions: { BABYLON_flow_graph: { flowGraph: { _flowGraphs: [] } } },
        };
        await page.evaluate((source) => {
            const file = new File([JSON.stringify(source)], "malformedCustomGraph.gltf", { type: "model/gltf+json" });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            (document.querySelector("canvas") ?? document.body).dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer }));
        }, malformedCustomGraphGltf);

        const log = page.getByRole("log", { name: "Flow graph log" });
        await expect(log).toContainText("Failed to load file: A Flow Graph coordinator must contain at least one graph.");
        await expect(log).not.toContainText('Loaded "malformedCustomGraph.gltf"');
        await expect
            .poll(
                async () =>
                    await page.evaluate(() => {
                        const state = (globalThis as any).BABYLON?.FlowGraphEditor?._CurrentState;
                        const before = (globalThis as any).__sceneGraphPairBeforeMalformedCustomGraph;
                        return {
                            sceneContext: state.sceneContext === before.sceneContext,
                            coordinator: state.coordinator === before.coordinator,
                            flowGraph: state.flowGraph === before.flowGraph,
                            engineCount: (globalThis as any).BABYLON.EngineStore.Instances.length === before.engineCount,
                            failedNodePublished: !!state.sceneContext.scene.getTransformNodeByName("failedCustomGraphNode"),
                        };
                    })
            )
            .toEqual({ sceneContext: true, coordinator: true, flowGraph: true, engineCount: true, failedNodePublished: false });
    });

    test("imports every KHR_interactivity graph, falls back from an invalid default, and preserves imported composites", async ({ page }) => {
        test.setTimeout(60_000);
        const fge = new FlowGraphEditorPage(page);
        await fge.goto({ local: true });
        await fge.assertEditorReady();
        await expect(page.getByText("glTF: Interactivity Imported", { exact: true })).toHaveCount(0);

        const graphGltf = {
            asset: { version: "2.0", generator: "FGE KHR_interactivity Phase 1 test" },
            extensionsUsed: ["KHR_interactivity", "EXT_vendor_interactivity"],
            extensions: {
                KHR_interactivity: {
                    graph: 3,
                    graphs: [
                        {
                            name: "Startup",
                            declarations: [{ op: "event/onStart" }, { op: "flow/sequence" }],
                            nodes: [
                                { declaration: 0, values: {}, flows: { out: { node: 1 } } },
                                { declaration: 1, flows: { "0": { node: 2 } } },
                                { declaration: 1, flows: { "0": { node: 3 } } },
                                { declaration: 1, flows: { "0": { node: 4 } } },
                                { declaration: 1, flows: { "0": { node: 5 } } },
                                { declaration: 1, flows: { "0": { node: 6 } } },
                                { declaration: 1, flows: { "0": { node: 7 } } },
                                { declaration: 1 },
                            ],
                        },
                        {
                            name: "Vendor behavior",
                            types: [{ signature: "float" }],
                            declarations: [
                                {
                                    op: "vendor/doThing",
                                    extension: "EXT_vendor_interactivity",
                                    inputValueSockets: { amount: { type: 0 } },
                                    outputValueSockets: { result: { type: 0 } },
                                },
                            ],
                            nodes: [{ declaration: 0, values: { amount: { type: 0, value: [2] } } }],
                        },
                        {
                            name: "Composite",
                            types: [{ signature: "ref" }, { signature: "float3" }],
                            declarations: [{ op: "event/onStart" }, { op: "pointer/get" }, { op: "math/abs" }],
                            nodes: [
                                { declaration: 0 },
                                {
                                    declaration: 1,
                                    configuration: { pointer: { value: ["/nodes/{target}/translation"] }, type: { value: [1] } },
                                    values: { target: { type: 0, value: ["/nodes/0"] } },
                                },
                                {
                                    declaration: 2,
                                    values: { a: { node: 1, type: 1 } },
                                },
                            ],
                        },
                        {
                            name: "Invalid core graph",
                            declarations: [{ op: "core/doesNotExist" }],
                            nodes: [{ declaration: 0 }],
                        },
                    ],
                },
            },
        };
        await page.evaluate((source) => {
            const file = new File([JSON.stringify(source)], "khrInteractivityPhaseOne.gltf", { type: "model/gltf+json" });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            const target = document.querySelector("canvas") ?? document.body;
            target.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer }));
        }, graphGltf);

        await expect.poll(async () => await fge.getGraphNames()).toEqual(["Startup", "Vendor behavior", "Composite", "Invalid core graph"]);
        await expect
            .poll(async () => await GetCoordinatorSnapshot(page))
            .toMatchObject({
                activeGraphIndex: 0,
                dispatchEventsSynchronously: false,
                hasHostResolver: true,
            });

        const saveButton = page.getByRole("button", { name: "Save", exact: true });
        await expect(saveButton).toBeDisabled();
        await saveButton.hover();
        await expect(page.getByRole("tooltip")).toContainText("KHR_interactivity graphs use import-scoped runtime services");
        await expect(page.getByRole("log", { name: "Flow graph log" })).toContainText(
            "KHR_interactivity graphs use import-scoped runtime services; JSON save and reload are unavailable for this import."
        );
        await fge.selectGraphTab("Vendor behavior");
        const unsupportedNode = fge.nodeOnCanvas("FlowGraphUnsupportedInteractivityBlock");
        await expect(unsupportedNode).toBeVisible();
        await expect(unsupportedNode).toContainText("amount");
        await expect(unsupportedNode).toContainText("result");
        await expect(unsupportedNode).toContainText("glTF");
        await expect(page.getByRole("log", { name: "Flow graph log" })).toContainText('Unknown core operation "core/doesNotExist"');
        await expect(page.getByRole("log", { name: "Flow graph log" })).toContainText("KHR_interactivity compatibility mode ignored 1 non-blocking source conformance issue(s)");
        await expect(page.getByRole("log", { name: "Flow graph log" })).not.toContainText('"values" must contain at least one property when present');

        await fge.selectGraphTab("Composite");
        const pointerFrameTitle = page.getByText("pointer/get · glTF node 1", { exact: true });
        await expect(pointerFrameTitle).toBeVisible();
        const pointerFrameComment = pointerFrameTitle.locator("..").locator("..").locator("[class*='frame-comments']");
        await expect(pointerFrameComment).toContainText("/extensions/KHR_interactivity/graphs/2/nodes/1");
        expect(
            await pointerFrameComment.evaluate((comment) => {
                const frameBounds = comment.parentElement!.getBoundingClientRect();
                const commentBounds = comment.getBoundingClientRect();
                return commentBounds.left >= frameBounds.left && commentBounds.right <= frameBounds.right;
            })
        ).toBe(true);
        await expect(page.locator("#graph-canvas-container .FlowGraphGetPropertyBlock[class*='hidden']")).toHaveCount(1);
        await expect(page.locator("#graph-canvas-container .FlowGraphJsonPointerParserBlock[class*='hidden']")).toHaveCount(1);
        await expect(fge.nodeOnCanvas("FlowGraphAbsBlock")).toBeVisible();

        const topologyBeforeSort = await fge.getGraphTopology();
        const pointerParserBeforeSort = topologyBeforeSort.blocks.find((block) => block.className === "FlowGraphJsonPointerParserBlock")!;
        expect(pointerParserBeforeSort.dataIns).toEqual([{ name: "target", connectedIds: [] }]);
        expect(topologyBeforeSort.totalConnections).toBe(4);

        await page.getByRole("button", { name: /Sort graph/ }).click();
        await fge.selectGraphTab("Startup");
        await fge.selectGraphTab("Composite");

        expect(await fge.getGraphTopology()).toEqual(topologyBeforeSort);
        const compositeFrame = await page.evaluate(() => {
            const state = (globalThis as any).BABYLON?.FlowGraphEditor?._CurrentState;
            const graph = state?.flowGraph;
            const editorData = graph?._editorData;
            const frame = editorData?.frames?.find((candidate: any) => candidate.name === "pointer/get · glTF node 1");
            if (!graph || !frame) {
                throw new Error("Imported pointer/get frame not found");
            }
            const blocks = graph.getAllBlocks();
            const blockByFrameId = new Map(blocks.map((block: any) => [editorData.map[block.uniqueId], block]));
            const locations = new Map(editorData.locations.map((location: any) => [location.blockId, location]));
            const nextBlock = blocks.find((block: any) => block.getClassName() === "FlowGraphAbsBlock");
            const nextBlockLocation: any = locations.get(nextBlock?.uniqueId);
            return {
                blockClassNames: frame.blocks.map((frameBlockId: number) => blockByFrameId.get(frameBlockId)?.getClassName()).sort(),
                relativePositions: frame.blocks.map((frameBlockId: number) => {
                    const block = blockByFrameId.get(frameBlockId);
                    const location: any = locations.get(block?.uniqueId);
                    return { x: location.x - frame.x, y: location.y - frame.y };
                }),
                width: frame.width,
                height: frame.height,
                right: frame.x + frame.width,
                nextBlockX: nextBlockLocation.x,
            };
        });
        expect(compositeFrame.blockClassNames).toEqual(["FlowGraphGetPropertyBlock", "FlowGraphJsonPointerParserBlock"]);
        for (const position of compositeFrame.relativePositions) {
            expect(position.x).toBeGreaterThanOrEqual(0);
            expect(position.y).toBeGreaterThanOrEqual(0);
            expect(position.x).toBeLessThan(compositeFrame.width);
            expect(position.y).toBeLessThan(compositeFrame.height);
        }
        expect(compositeFrame.right).toBeLessThanOrEqual(compositeFrame.nextBlockX);
        await expect(page.getByText("pointer/get · glTF node 1", { exact: true })).toBeVisible();
        await expect(page.locator("#graph-canvas-container .FlowGraphGetPropertyBlock[class*='hidden']")).toHaveCount(1);
        await expect(page.locator("#graph-canvas-container .FlowGraphJsonPointerParserBlock[class*='hidden']")).toHaveCount(1);

        await fge.selectGraphTab("Startup");
        const importedLeftPositions = await page
            .locator("#graph-canvas-container")
            .evaluate((container) =>
                [...container.children].filter((element) => !element.className.includes("hidden")).map((element) => Math.round(element.getBoundingClientRect().left))
            );
        expect(new Set(importedLeftPositions).size).toBeGreaterThan(1);

        await page.evaluate(() => {
            const state = (globalThis as any).BABYLON?.FlowGraphEditor?._CurrentState;
            (globalThis as any).__khrCoordinatorBeforeFailedLoad = state?.coordinator;
        });
        const khrJson = await page.evaluate(() => {
            const state = (globalThis as any).BABYLON?.FlowGraphEditor?._CurrentState;
            const graphData: any = {};
            state.flowGraph.serialize(graphData);
            graphData.allBlocks[0].metadata = { khrInteractivity: { graphIndex: 0, nodeIndex: 0 } };
            return { _flowGraphs: [graphData] };
        });
        const jsonInput = page.locator("input[type='file'][accept='.json']");
        await jsonInput.setInputFiles({
            name: "unsupported-khr-reload.json",
            mimeType: "application/json",
            buffer: Buffer.from(JSON.stringify(khrJson)),
        });
        await expect(page.getByRole("log", { name: "Flow graph log" })).toContainText(
            "Error loading flow graph: Error: KHR_interactivity graphs use import-scoped runtime services"
        );
        await expect
            .poll(
                async () =>
                    await page.evaluate(() => {
                        const state = (globalThis as any).BABYLON?.FlowGraphEditor?._CurrentState;
                        return state.coordinator === (globalThis as any).__khrCoordinatorBeforeFailedLoad && state.coordinator.flowGraphs.includes(state.flowGraph);
                    })
            )
            .toBe(true);

        await jsonInput.setInputFiles({
            name: "empty-coordinator.json",
            mimeType: "application/json",
            buffer: Buffer.from(JSON.stringify({ _flowGraphs: [] })),
        });
        await expect(page.getByRole("log", { name: "Flow graph log" })).toContainText("A Flow Graph coordinator must contain at least one graph.");
        await expect
            .poll(
                async () =>
                    await page.evaluate(() => {
                        const state = (globalThis as any).BABYLON?.FlowGraphEditor?._CurrentState;
                        return state.coordinator === (globalThis as any).__khrCoordinatorBeforeFailedLoad && state.coordinator.flowGraphs.includes(state.flowGraph);
                    })
            )
            .toBe(true);

        const malformedJson = await page.evaluate(() => {
            const state = (globalThis as any).BABYLON?.FlowGraphEditor?._CurrentState;
            const graphData: any = {};
            state.flowGraph.serialize(graphData);
            delete graphData.metadata;
            graphData.allBlocks.forEach((block: any) => delete block.metadata);
            graphData.allBlocks[0].signalOutputs.push({
                uniqueId: "unmapped-output",
                name: "unmappedOutput",
                _connectionType: 1,
                connectedPointIds: [],
            });
            return { _flowGraphs: [graphData] };
        });
        await jsonInput.setInputFiles({
            name: "malformed-flow-graph.json",
            mimeType: "application/json",
            buffer: Buffer.from(JSON.stringify(malformedJson)),
        });
        await expect(page.getByRole("log", { name: "Flow graph log" })).toContainText("Could not find signal output with name unmappedOutput");
        await expect
            .poll(
                async () =>
                    await page.evaluate(() => {
                        const state = (globalThis as any).BABYLON?.FlowGraphEditor?._CurrentState;
                        return state.coordinator === (globalThis as any).__khrCoordinatorBeforeFailedLoad && state.coordinator.flowGraphs.includes(state.flowGraph);
                    })
            )
            .toBe(true);

        await page.getByRole("button", { name: "Enable Debug Mode" }).click();
        await expect.poll(async () => (await GetDebugSnapshot(page)).isDebugMode).toBe(true);
        await ClickGraphControl(page, "Start");
        await WaitForGraphState(page, "Running");
        await ClickGraphControl(page, "Stop");
        await WaitForGraphState(page, "Stopped");
        await ClickGraphControl(page, "Reset");
        await WaitForGraphState(page, "Stopped");

        await fge.selectGraphTab("Invalid core graph");
        await expect.poll(async () => await fge.getNodeCount()).toBe(0);
    });

    for (const withExtensionObject of [true, false]) {
        test(`reset restores imported KHR node defaults ${withExtensionObject ? "with" : "without"} extension objects`, async ({ page }) => {
            const fge = new FlowGraphEditorPage(page);
            await fge.goto({ local: true });
            await fge.assertEditorReady();

            const positions = Buffer.from(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]).buffer);
            const source = {
                asset: { version: "2.0" },
                scene: 0,
                scenes: [{ nodes: [0, 1] }],
                nodes: [
                    {
                        name: "defaultVisibleNode",
                        mesh: 0,
                        ...(withExtensionObject ? { extensions: { KHR_node_visibility: {}, KHR_node_selectability: {}, KHR_node_hoverability: {} } } : {}),
                    },
                    { name: "unrelatedNode", mesh: 0, translation: [2, 0, 0] },
                ],
                meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
                buffers: [{ byteLength: positions.length, uri: `data:application/octet-stream;base64,${positions.toString("base64")}` }],
                bufferViews: [{ buffer: 0, byteLength: positions.length }],
                accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: "VEC3", min: [0, 0, 0], max: [1, 1, 0] }],
                extensionsUsed: ["KHR_interactivity", "KHR_node_visibility", "KHR_node_selectability", "KHR_node_hoverability"],
                extensionsRequired: ["KHR_interactivity", "KHR_node_visibility", "KHR_node_selectability", "KHR_node_hoverability"],
                extensions: {
                    KHR_interactivity: {
                        graph: 0,
                        graphs: [
                            {
                                name: "Disable node on start",
                                types: [{ signature: "bool" }],
                                declarations: [{ op: "event/onStart" }, { op: "pointer/set" }],
                                nodes: [
                                    { declaration: 0, flows: { out: { node: 1, socket: "in" } } },
                                    {
                                        declaration: 1,
                                        configuration: { pointer: { value: ["/nodes/0/extensions/KHR_node_visibility/visible"] }, type: { value: [0] } },
                                        values: { value: { type: 0, value: [false] } },
                                        flows: { out: { node: 2, socket: "in" } },
                                    },
                                    {
                                        declaration: 1,
                                        configuration: { pointer: { value: ["/nodes/0/extensions/KHR_node_selectability/selectable"] }, type: { value: [0] } },
                                        values: { value: { type: 0, value: [false] } },
                                        flows: { out: { node: 3, socket: "in" } },
                                    },
                                    {
                                        declaration: 1,
                                        configuration: { pointer: { value: ["/nodes/0/extensions/KHR_node_hoverability/hoverable"] }, type: { value: [0] } },
                                        values: { value: { type: 0, value: [false] } },
                                    },
                                ],
                            },
                        ],
                    },
                },
            };
            await page.evaluate((gltf) => {
                const file = new File([JSON.stringify(gltf)], "default-visible.gltf", { type: "model/gltf+json" });
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                (document.querySelector("canvas") ?? document.body).dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer }));
            }, source);
            await expect.poll(async () => await fge.getGraphNames()).toEqual(["Disable node on start"]);
            const nodeState = () =>
                page.evaluate(() => {
                    const state = (globalThis as any).BABYLON.FlowGraphEditor._CurrentState;
                    const node = state.khrInteractivityImportResult.glTF.nodes[0];
                    return {
                        sceneUid: state.sceneContext.scene.uid,
                        authoredVisible: node.extensions?.KHR_node_visibility?.visible,
                        authoredSelectable: node.extensions?.KHR_node_selectability?.selectable,
                        authoredHoverable: node.extensions?.KHR_node_hoverability?.hoverable,
                        transformVisible: node._babylonTransformNode.isVisible,
                        primitiveVisible: node._primitiveBabylonMeshes[0].isVisible,
                        primitivePickable: node._primitiveBabylonMeshes[0].isPickable,
                        primitiveHoverable: node._primitiveBabylonMeshes[0]._isPointerMovePickable,
                        unrelatedVisible: state.khrInteractivityImportResult.glTF.nodes[1]._primitiveBabylonMeshes[0].isVisible,
                        unrelatedPickable: state.khrInteractivityImportResult.glTF.nodes[1]._primitiveBabylonMeshes[0].isPickable,
                        unrelatedHoverable: state.khrInteractivityImportResult.glTF.nodes[1]._primitiveBabylonMeshes[0]._isPointerMovePickable,
                    };
                });
            const initial = await nodeState();
            expect(initial).toMatchObject({
                authoredVisible: undefined,
                authoredSelectable: undefined,
                authoredHoverable: undefined,
                transformVisible: true,
                primitiveVisible: true,
            });
            expect(initial.primitivePickable).toBe(true);
            expect(initial.primitiveHoverable).toBe(true);
            await page.evaluate(() => {
                const mesh = (globalThis as any).BABYLON.FlowGraphEditor._CurrentState.khrInteractivityImportResult.glTF.nodes[1]._primitiveBabylonMeshes[0];
                mesh.isVisible = false;
                mesh.isPickable = false;
                mesh._isPointerMovePickable = false;
            });

            await ClickGraphControl(page, "Start");
            await expect
                .poll(async () => await nodeState())
                .toMatchObject({ transformVisible: false, primitiveVisible: false, primitivePickable: false, primitiveHoverable: false });
            await ClickGraphControl(page, "Reset");
            await expect
                .poll(async () => await nodeState())
                .toMatchObject({
                    sceneUid: initial.sceneUid,
                    authoredVisible: undefined,
                    authoredSelectable: undefined,
                    authoredHoverable: undefined,
                    transformVisible: true,
                    primitiveVisible: true,
                    primitivePickable: true,
                    primitiveHoverable: true,
                    unrelatedVisible: false,
                    unrelatedPickable: false,
                    unrelatedHoverable: false,
                });
            await ClickGraphControl(page, "Start");
            await expect.poll(async () => await nodeState()).toMatchObject({ primitiveVisible: false, primitivePickable: false, primitiveHoverable: false });
            await ClickGraphControl(page, "Reset");
            await expect.poll(async () => await nodeState()).toMatchObject({ primitiveVisible: true, primitivePickable: true, primitiveHoverable: true });
        });
    }

    test("retains a node-free KHR source GLB for source-preserving graph export", async ({ page }) => {
        const { bytes, document } = BuildNodelessGlbFixture(true);
        const fge = new FlowGraphEditorPage(page);
        await fge.goto({ local: true });
        await fge.assertEditorReady();
        await page.evaluate(
            (data) => {
                const file = new File([new Uint8Array(data)], "node-free-interaction.glb", { type: "model/gltf-binary" });
                const transfer = new DataTransfer();
                transfer.items.add(file);
                (document.querySelector("canvas") ?? document.body).dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
            },
            [...bytes]
        );

        await expect(page.getByRole("log", { name: "Flow graph log" })).toContainText('Imported 1 KHR_interactivity graph(s) from "node-free-interaction.glb"');
        await expect.poll(async () => await fge.getGraphNames()).toEqual(["Scene start"]);
        await expect
            .poll(async () =>
                page.evaluate(() => {
                    const source = (globalThis as any).BABYLON.FlowGraphEditor._CurrentState.sourceGlb;
                    return source ? { name: source.file.name, nodeCount: source.nodeCount } : null;
                })
            )
            .toEqual({ name: "node-free-interaction.glb", nodeCount: 0 });
        await expect(page.getByRole("button", { name: "Export KHR glTF", exact: true })).toBeDisabled();
        await expect(page.getByRole("button", { name: "Export KHR GLB", exact: true })).toBeEnabled();
        const downloadPromise = page.waitForEvent("download", (download) => download.suggestedFilename() === "node-free-interaction-edited.glb");
        await page.getByRole("button", { name: "Export KHR GLB", exact: true }).click();
        const exportedBytes = readFileSync((await (await downloadPromise).path())!);
        const jsonLength = exportedBytes.readUInt32LE(12);
        const exportedDocument = JSON.parse(exportedBytes.subarray(20, 20 + jsonLength).toString("utf8"));
        expect(exportedDocument.nodes).toBeUndefined();
        expect(exportedDocument.asset).toEqual(document.asset);
        expect(exportedDocument.extras).toEqual(document.extras);
        expect(exportedDocument.extensions.EXT_vendor_meta).toEqual(document.extensions.EXT_vendor_meta);
        expect(exportedDocument.extensions.KHR_interactivity.graphs[0].name).toBe("Scene start");
        expect(exportedBytes.subarray(20 + jsonLength)).toEqual(bytes.subarray(20 + bytes.readUInt32LE(12)));
    });

    test("retains a node-free split glTF graph for source-preserving export", async ({ page }) => {
        const { document } = BuildNodelessGlbFixture(true);
        const source = JSON.stringify(document);
        const fge = new FlowGraphEditorPage(page);
        await fge.goto({ local: true });
        await fge.assertEditorReady();
        await page.evaluate((json) => {
            const transfer = new DataTransfer();
            transfer.items.add(new File([json], "node-free-interaction.gltf", { type: "model/gltf+json" }));
            (document.querySelector("canvas") ?? document.body).dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
        }, source);
        await expect(page.getByRole("log", { name: "Flow graph log" })).toContainText('Imported 1 KHR_interactivity graph(s) from "node-free-interaction.gltf"');
        await expect(page.getByRole("button", { name: "New behavior" })).not.toBeVisible();
        await expect
            .poll(async () =>
                page.evaluate(() => {
                    const source = (globalThis as any).BABYLON.FlowGraphEditor._CurrentState.sourceGltf;
                    return source ? { name: source.file.name, nodeCount: source.nodeCount } : null;
                })
            )
            .toEqual({ name: "node-free-interaction.gltf", nodeCount: 0 });
        await expect(page.getByRole("button", { name: "Export KHR glTF", exact: true })).toBeEnabled();
        await expect(page.getByRole("button", { name: "Export KHR GLB", exact: true })).toBeDisabled();
        const downloadPromise = page.waitForEvent("download", (download) => download.suggestedFilename() === "node-free-interaction-edited.gltf");
        await page.getByRole("button", { name: "Export KHR glTF", exact: true }).click();
        const exported = readFileSync((await (await downloadPromise).path())!, "utf8");
        expect(JSON.parse(exported).nodes).toBeUndefined();
        expect(JSON.parse(exported).extensions.EXT_vendor_meta).toEqual(document.extensions.EXT_vendor_meta);
        expect(JSON.parse(exported).extensions.KHR_interactivity.graphs[0].name).toBe("Scene start");
    });

    test("keeps mesh authoring disabled for a node-free graphless GLB", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto({ local: true });
        await fge.assertEditorReady();
        for (const [name, withEmptyNodes] of [
            ["omitted-nodes.glb", false],
            ["empty-nodes.glb", true],
        ] as const) {
            const { bytes } = BuildNodelessGlbFixture(false, withEmptyNodes);
            await page.evaluate(
                ({ data, fileName }) => {
                    const file = new File([new Uint8Array(data)], fileName, { type: "model/gltf-binary" });
                    const transfer = new DataTransfer();
                    transfer.items.add(file);
                    (document.querySelector("canvas") ?? document.body).dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
                },
                { data: [...bytes], fileName: name }
            );

            await expect.poll(async () => (await GetSceneContextSnapshot(page))?.source).toBe("file");
            await expect
                .poll(async () =>
                    page.evaluate(() => {
                        const source = (globalThis as any).BABYLON.FlowGraphEditor._CurrentState.sourceGlb;
                        return source ? { name: source.file.name, nodeCount: source.nodeCount } : null;
                    })
                )
                .toEqual({ name, nodeCount: 0 });
            await expect(page.getByRole("button", { name: "New behavior" })).toBeDisabled();
        }
    });

    test("adds a behavior to an existing GLB without reserializing its scene or resources", async ({ page }, testInfo) => {
        test.setTimeout(90_000);
        const { bytes, document } = BuildExistingGlbFixture(true, true);
        const fge = new FlowGraphEditorPage(page);
        await fge.goto({ local: true });
        await fge.assertEditorReady();

        await page.evaluate(
            (data) => {
                const file = new File([new Uint8Array(data)], "existing-assembly.glb", { type: "model/gltf-binary" });
                const transfer = new DataTransfer();
                transfer.items.add(file);
                const target = document.querySelector("canvas") ?? document.body;
                target.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
            },
            [...bytes]
        );
        await expect.poll(async () => (await GetSceneContextSnapshot(page))?.source).toBe("file");
        await expect(page.getByRole("button", { name: "New behavior" })).toBeEnabled();
        await page.getByRole("button", { name: "New behavior" }).click();
        const triggerSelect = page.getByRole("combobox", { name: "Trigger mesh" });
        const revealSelect = page.getByRole("combobox", { name: "Mesh to reveal" });
        await triggerSelect.click();
        await page.getByRole("option", { name: /glTF node 1/ }).click();
        await revealSelect.click();
        await page.getByRole("option", { name: /glTF node 2/ }).click();
        await expect(page.getByRole("button", { name: "Create behavior" })).toBeEnabled();
        await page.screenshot({ path: testInfo.outputPath("khr-existing-glb-authoring.png"), fullPage: true });
        const downloadPromise = page.waitForEvent("download", (download) => download.suggestedFilename() === "existing-assembly-behavior.glb");
        await page.getByRole("button", { name: "Create behavior" }).click();
        const download = await downloadPromise;
        const downloadPath = await download.path();
        expect(downloadPath).not.toBeNull();
        const authoredBytes = readFileSync(downloadPath!);
        const jsonLength = authoredBytes.readUInt32LE(12);
        const authored = JSON.parse(authoredBytes.subarray(20, 20 + jsonLength).toString("utf8"));
        expect(authoredBytes.subarray(20 + jsonLength)).toEqual(bytes.subarray(20 + bytes.readUInt32LE(12)));
        expect(authored.extensions.KHR_interactivity.graphs[0].nodes[0].configuration.nodeIndex.value).toEqual([1]);
        expect(authored.extensions.KHR_interactivity.graphs[0].nodes[1].configuration.pointer.value).toEqual(["/nodes/2/extensions/KHR_node_visibility/visible"]);
        expect(authored.nodes[1].extensions.KHR_node_selectability).toEqual(document.nodes[1].extensions.KHR_node_selectability);
        expect(authored.nodes[2].extensions.KHR_node_visibility).toEqual({ ...document.nodes[2].extensions.KHR_node_visibility, visible: false });
        delete authored.extensions.KHR_interactivity;
        authored.nodes[2].extensions.KHR_node_visibility.visible = true;
        authored.extensionsUsed = document.extensionsUsed;
        delete authored.extensionsRequired;
        expect(authored).toEqual(document);
        expect(await StrictImportKhrInteractivityAsync(page, "strict-existing-assembly.glb", authoredBytes)).toEqual({ graphCount: 1, errorCount: 0 });
        await expect.poll(async () => await fge.getGraphNames()).toEqual(["Select to reveal"]);
        const importedNodes = await page.evaluate(() => {
            const nodes = (globalThis as any).BABYLON.FlowGraphEditor._CurrentState.khrInteractivityImportResult.glTF.nodes;
            return {
                triggerName: nodes[1].name,
                revealName: nodes[2].name,
                triggerClass: nodes[1]._babylonTransformNode.getClassName(),
                triggerPrimitiveCount: nodes[1]._primitiveBabylonMeshes.length,
                revealClass: nodes[2]._babylonTransformNode.getClassName(),
                revealPrimitiveCount: nodes[2]._primitiveBabylonMeshes.length,
            };
        });
        expect(importedNodes).toEqual({
            triggerName: "part",
            revealName: "part",
            triggerClass: "TransformNode",
            triggerPrimitiveCount: 2,
            revealClass: "Mesh",
            revealPrimitiveCount: 1,
        });
        await ClickGraphControl(page, "Start");
        await WaitForGraphState(page, "Running");
        const selectNode = async (nodeIndex: number, primitiveIndex: number) =>
            await page.evaluate(
                ({ nodeIndex, primitiveIndex }) => {
                    const Babylon = (globalThis as any).BABYLON;
                    const state = Babylon.FlowGraphEditor._CurrentState;
                    const mesh = state.khrInteractivityImportResult.glTF.nodes[nodeIndex]._primitiveBabylonMeshes[primitiveIndex];
                    const pick = new Babylon.PickingInfo();
                    pick.hit = true;
                    pick.pickedMesh = mesh;
                    pick.pickedPoint = mesh.getAbsolutePosition();
                    state.sceneContext.scene.simulatePointerDown(pick, { pointerId: 0 });
                    state.sceneContext.scene.simulatePointerUp(pick, { pointerId: 0 });
                },
                { nodeIndex, primitiveIndex }
            );
        const revealVisible = async () =>
            await page.evaluate(() =>
                (globalThis as any).BABYLON.FlowGraphEditor._CurrentState.khrInteractivityImportResult.glTF.nodes[2]._primitiveBabylonMeshes.some((mesh: any) => mesh.isVisible)
            );
        await selectNode(2, 0);
        expect(await revealVisible()).toBe(false);
        await selectNode(1, 1);
        await expect.poll(revealVisible).toBe(true);
        await expect(page.getByRole("button", { name: "Export KHR GLB", exact: true })).toBeEnabled();
        await page.evaluate(() => {
            const graph = (globalThis as any).BABYLON.FlowGraphEditor._CurrentState.coordinator.flowGraphs[0];
            const pointerSet = graph.getAllBlocks().find((block: any) => block.metadata?.khrInteractivity?.operation === "pointer/set");
            if (!pointerSet) {
                throw new Error("Imported pointer/set block was not found");
            }
            pointerSet.getDataInput("value")._defaultValue = false;
            graph.name = "Edited selection";
        });
        const editedDownloadPromise = page.waitForEvent("download", (download) => download.suggestedFilename() === "existing-assembly-behavior-edited.glb");
        await page.getByRole("button", { name: "Export KHR GLB", exact: true }).click();
        const editedDownload = await editedDownloadPromise;
        const editedBytes = readFileSync((await editedDownload.path())!);
        const edited = JSON.parse(editedBytes.subarray(20, 20 + editedBytes.readUInt32LE(12)).toString("utf8"));
        expect(editedBytes.subarray(20 + editedBytes.readUInt32LE(12))).toEqual(authoredBytes.subarray(20 + authoredBytes.readUInt32LE(12)));
        expect(edited.extensions.KHR_interactivity.graphs[0].name).toBe("Edited selection");
        expect(edited.extensions.KHR_interactivity.graphs[0].nodes[1].values.value.value).toEqual([false]);
        expect(await StrictImportKhrInteractivityAsync(page, "strict-edited-assembly.glb", editedBytes)).toEqual({ graphCount: 1, errorCount: 0 });
        await page.evaluate(
            (data) => {
                const transfer = new DataTransfer();
                transfer.items.add(new File([new Uint8Array(data)], "reopened-assembly.glb", { type: "model/gltf-binary" }));
                (document.querySelector("canvas") ?? document.body).dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
            },
            [...editedBytes]
        );
        await expect.poll(async () => await page.evaluate(() => (globalThis as any).BABYLON.FlowGraphEditor._CurrentState.sourceGlb?.file.name)).toBe("reopened-assembly.glb");
        await expect.poll(async () => await fge.getGraphNames()).toEqual(["Edited selection"]);
        await page.evaluate(() => {
            const graph = (globalThis as any).BABYLON.FlowGraphEditor._CurrentState.coordinator.flowGraphs[0];
            const pointerSet = graph.getAllBlocks().find((block: any) => block.metadata?.khrInteractivity?.operation === "pointer/set");
            pointerSet.getDataInput("value")._defaultValue = true;
        });
        const reopenedDownloadPromise = page.waitForEvent("download", (download) => download.suggestedFilename() === "reopened-assembly-edited.glb");
        await page.getByRole("button", { name: "Export KHR GLB", exact: true }).click();
        const reopenedBytes = readFileSync((await (await reopenedDownloadPromise).path())!);
        const reopened = JSON.parse(reopenedBytes.subarray(20, 20 + reopenedBytes.readUInt32LE(12)).toString("utf8"));
        expect(reopened.extensions.KHR_interactivity.graphs[0].nodes[1].values.value.value).toEqual([true]);
        expect(reopenedBytes.subarray(20 + reopenedBytes.readUInt32LE(12))).toEqual(editedBytes.subarray(20 + editedBytes.readUInt32LE(12)));
        await page.screenshot({ path: testInfo.outputPath("khr-existing-glb-authored.png"), fullPage: true });
    });

    test("authors, saves and reopens real native flat companions with a bound texture", async ({ page, browserName }, testInfo) => {
        test.skip(browserName !== "chromium", "Native drag injection requires Chromium's browser protocol.");
        test.setTimeout(90_000);
        const folder = mkdtempSync(join(tmpdir(), "fge-flat-drop-"));
        try {
            const fixture = BuildExistingGlbFixture(true, false, false, false, false, false, true);
            fixture.document.buffers[0].uri = "meshes/geometry.bin";
            fixture.document.images = [{ uri: "textures/diffuse.png" }];
            fixture.document.textures = [{ source: 0 }];
            fixture.document.materials[0].pbrMetallicRoughness = { baseColorTexture: { index: 0 } };
            const fge = new FlowGraphEditorPage(page);
            await fge.goto({ local: true });
            const png = await page.evaluate(() => {
                const canvas = document.createElement("canvas");
                canvas.width = canvas.height = 1;
                const context = canvas.getContext("2d")!;
                context.fillStyle = "red";
                context.fillRect(0, 0, 1, 1);
                return canvas.toDataURL().split(",")[1];
            });
            const main = join(folder, "flat-assembly.gltf");
            const bin = join(folder, "geometry.bin");
            const texture = join(folder, "diffuse.png");
            writeFileSync(main, JSON.stringify(fixture.document));
            writeFileSync(bin, fixture.bin);
            writeFileSync(texture, Buffer.from(png, "base64"));
            const drop = async (files: string[]) => {
                const canvas = (await page.locator("canvas").first().boundingBox())!;
                const session = await page.context().newCDPSession(page);
                for (const type of ["dragEnter", "dragOver", "drop"] as const) {
                    await session.send("Input.dispatchDragEvent", {
                        type,
                        x: canvas.x + canvas.width / 2,
                        y: canvas.y + canvas.height / 2,
                        data: { items: [], files, dragOperationsMask: 1 },
                    });
                }
                await session.detach();
            };
            await page.evaluate(() => {
                window.addEventListener(
                    "drop",
                    (event) => {
                        (globalThis as any).__nativeFlatPaths = Array.from(event.dataTransfer!.items).map((item) => item.webkitGetAsEntry()?.fullPath);
                    },
                    { once: true, capture: true }
                );
            });
            await drop([main, bin, texture]);
            expect(await page.evaluate(() => (globalThis as any).__nativeFlatPaths)).toEqual(["/flat-assembly.gltf", "/geometry.bin", "/diffuse.png"]);
            const loadedTexture = async () =>
                await page.evaluate(async () => {
                    const state = (globalThis as any).BABYLON.FlowGraphEditor._CurrentState;
                    const texture = state.sceneContext.scene.materials.find((material: any) => material.name === "Base")?.albedoTexture;
                    if (!texture || !texture.isReady()) {
                        return null;
                    }
                    return { name: state.sourceGltf?.file.name, pixel: Array.from(await texture.readPixels()) };
                });
            await expect
                .poll(loadedTexture, { message: "Native basename-only companions must load automatically, including the bound image" })
                .toEqual({ name: "flat-assembly.gltf", pixel: [255, 0, 0, 255] });
            await expect(page.getByRole("dialog", { name: "Complete glTF import" })).not.toBeVisible();
            await page.getByRole("button", { name: "New behavior" }).click();
            await page.getByRole("combobox", { name: "Trigger mesh" }).click();
            await page.getByRole("option", { name: /glTF node 1/ }).click();
            await page.getByRole("combobox", { name: "Mesh to reveal" }).click();
            await page.getByRole("option", { name: /glTF node 2/ }).click();
            const authoredDownload = page.waitForEvent("download", (download) => download.suggestedFilename() === "flat-assembly-behavior.gltf");
            await page.getByRole("button", { name: "Create behavior" }).click();
            await authoredDownload;
            await expect.poll(loadedTexture).toEqual({ name: "flat-assembly-behavior.gltf", pixel: [255, 0, 0, 255] });
            await expect(page.getByRole("button", { name: "Add reaction" })).toBeEnabled();
            const exported = page.waitForEvent("download", (download) => download.suggestedFilename().endsWith("-edited.gltf"));
            await page.getByRole("button", { name: "Export KHR glTF" }).click();
            const saved = readFileSync((await (await exported).path())!);
            expect(JSON.parse(saved.toString()).images[0].uri).toBe("textures/diffuse.png");
            const reopened = join(folder, "reopened.gltf");
            writeFileSync(reopened, saved);
            await page.reload();
            await fge.assertEditorReady();
            await drop([reopened, bin, texture]);
            await expect.poll(loadedTexture).toEqual({ name: "reopened.gltf", pixel: [255, 0, 0, 255] });
            await page.screenshot({ path: testInfo.outputPath("khr-native-flat-texture-reopened.png"), fullPage: true });

            // A known wrong-directory image must ask the user, retaining the active asset.
            const duplicate = join(folder, "other");
            mkdirSync(duplicate);
            writeFileSync(join(duplicate, "diffuse.png"), Buffer.from(png, "base64"));
            const identity = await page.evaluate(() => (globalThis as any).BABYLON.FlowGraphEditor._CurrentState.sceneContext.scene.uid);
            await drop([reopened, bin, duplicate]);
            const dialog = page.getByRole("dialog", { name: "Complete glTF import" });
            await expect(dialog).toContainText("textures/diffuse.png");
            await expect(page.getByRole("log", { name: "Flow graph log", includeHidden: true })).toContainText("Missing companion file for textures/diffuse.png");
            expect(await page.evaluate(() => (globalThis as any).BABYLON.FlowGraphEditor._CurrentState.sceneContext.scene.uid)).toBe(identity);
            expect(await loadedTexture(), "A failed import must retain the active scene's texture bytes").toEqual({ name: "reopened.gltf", pixel: [255, 0, 0, 255] });
            await dialog.getByLabel("Companion file for textures/diffuse.png").setInputFiles(texture);
            await dialog.getByRole("button", { name: "Use file and retry" }).click();
            await expect.poll(loadedTexture).toEqual({ name: "reopened.gltf", pixel: [255, 0, 0, 255] });
        } finally {
            rmSync(folder, { recursive: true, force: true });
        }
    });

    for (const scenario of ["encoded image aliases and parent-directory buffers", "literal percent in the main filename"]) {
        test(`loads bound textures with ${scenario}`, async ({ page }) => {
            const fixture = BuildExistingGlbFixture(true, false, false, false, false, false, true);
            const aliases = scenario.startsWith("encoded");
            fixture.document.buffers[0].uri = aliases ? "../meshes/geometry.bin" : "geometry.bin";
            fixture.document.images = aliases
                ? [{ uri: "../textures/%C3%89chantillon%20%231%2520.png" }, { uri: "../textures/./Échantillon%20%231%2520.png" }]
                : [{ uri: "paint.png" }];
            fixture.document.textures = fixture.document.images.map((_: unknown, source: number) => ({ source }));
            for (let index = 0; index < fixture.document.textures.length; index++) {
                fixture.document.materials[index].pbrMetallicRoughness = { baseColorTexture: { index } };
            }
            const fge = new FlowGraphEditorPage(page);
            await fge.goto({ local: true });
            await page.evaluate(
                ({ source, buffer, aliases }) => {
                    const transfer = new DataTransfer();
                    const add = (file: File, path: string) => {
                        Object.defineProperty(file, "webkitRelativePath", { value: path });
                        transfer.items.add(file);
                    };
                    const name = aliases ? "encoded.gltf" : "assembly %.gltf";
                    add(new File([JSON.stringify(source)], name), `asset/scenes/${name}`);
                    add(new File([new Uint8Array(buffer)], "geometry.bin"), aliases ? "asset/meshes/geometry.bin" : "asset/scenes/geometry.bin");
                    const canvas = document.createElement("canvas");
                    canvas.width = canvas.height = 1;
                    const context = canvas.getContext("2d")!;
                    context.fillStyle = "blue";
                    context.fillRect(0, 0, 1, 1);
                    const bytes = Uint8Array.from(atob(canvas.toDataURL().split(",")[1]), (char) => char.charCodeAt(0));
                    const textureName = aliases ? "Échantillon #1%20.png" : "paint.png";
                    add(new File([bytes], textureName, { type: "image/png" }), aliases ? `asset/textures/${textureName}` : `asset/scenes/${textureName}`);
                    (document.querySelector("canvas") ?? document.body).dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
                },
                { source: fixture.document, buffer: [...fixture.bin], aliases }
            );
            await expect
                .poll(
                    async () =>
                        page.evaluate(async () => {
                            const state = (globalThis as any).BABYLON.FlowGraphEditor._CurrentState;
                            if (!state.sourceGltf) {
                                return null;
                            }
                            const textures = state.sceneContext.scene.materials
                                .filter((material: any) => material.name === "Base" || material.name === "Service")
                                .map((material: any) => material.albedoTexture);
                            if (textures.some((texture: any) => texture && !texture.isReady())) {
                                return null;
                            }
                            return {
                                name: state.sourceGltf.file.name,
                                pixels: await Promise.all(textures.filter(Boolean).map(async (texture: any) => Array.from(await texture.readPixels()))),
                            };
                        }),
                    { message: "The actual buffer and image loaders must agree with companion matching" }
                )
                .toEqual({
                    name: aliases ? "encoded.gltf" : "assembly %.gltf",
                    pixels: aliases
                        ? [
                              [0, 0, 255, 255],
                              [0, 0, 255, 255],
                          ]
                        : [[0, 0, 255, 255]],
                });
            await expect(page.getByRole("dialog", { name: "Complete glTF import" })).not.toBeVisible();
        });
    }

    test("imports a real nested folder drop with same-named textures", async ({ page, browserName }) => {
        test.skip(browserName !== "chromium", "Native directory drag injection requires Chromium's browser protocol.");
        const folder = mkdtempSync(join(tmpdir(), "fge-folder-drop-"));
        const asset = join(folder, "asset");
        try {
            const fixture = BuildExistingGlbFixture(true, false, false, false, false, false, true);
            fixture.document.buffers[0].uri = "meshes/geometry.bin";
            fixture.document.images = [{ uri: "textures/red/diffuse.png" }, { uri: "textures/blue/diffuse.png" }];
            fixture.document.textures = [{ source: 0 }, { source: 1 }];
            for (let index = 0; index < 2; index++) {
                fixture.document.materials[index].pbrMetallicRoughness = { baseColorTexture: { index } };
            }
            const fge = new FlowGraphEditorPage(page);
            await fge.goto({ local: true });
            const pngs = await page.evaluate(() =>
                Object.fromEntries(
                    ["red", "blue"].map((color) => {
                        const canvas = document.createElement("canvas");
                        canvas.width = canvas.height = 1;
                        const context = canvas.getContext("2d")!;
                        context.fillStyle = color;
                        context.fillRect(0, 0, 1, 1);
                        return [color, canvas.toDataURL().split(",")[1]];
                    })
                )
            );
            mkdirSync(join(asset, "meshes"), { recursive: true });
            for (const color of ["red", "blue"]) {
                mkdirSync(join(asset, "textures", color), { recursive: true });
                writeFileSync(join(asset, "textures", color, "diffuse.png"), Buffer.from(pngs[color], "base64"));
            }
            writeFileSync(join(asset, "assembly.gltf"), JSON.stringify(fixture.document));
            writeFileSync(join(asset, "meshes", "geometry.bin"), fixture.bin);
            await page.evaluate(() => {
                window.addEventListener(
                    "drop",
                    (event) => {
                        const entry = event.dataTransfer?.items[0].webkitGetAsEntry();
                        (globalThis as any).__nativeFolderDrop = { directory: entry?.isDirectory, name: entry?.name };
                    },
                    { capture: true, once: true }
                );
            });
            const canvas = await page.locator("canvas").first().boundingBox();
            expect(canvas).not.toBeNull();
            const session = await page.context().newCDPSession(page);
            const data = { items: [], files: [asset], dragOperationsMask: 1 };
            for (const type of ["dragEnter", "dragOver", "drop"] as const) {
                await session.send("Input.dispatchDragEvent", { type, x: canvas!.x + canvas!.width / 2, y: canvas!.y + canvas!.height / 2, data });
            }
            await session.detach();
            expect(await page.evaluate(() => (globalThis as any).__nativeFolderDrop)).toEqual({ directory: true, name: "asset" });
            await expect.poll(async () => page.evaluate(() => (globalThis as any).BABYLON.FlowGraphEditor._CurrentState.sourceGltf?.file.name)).toBe("assembly.gltf");
            const paths = await page.evaluate(async () => {
                const source = (globalThis as any).BABYLON.FlowGraphEditor._CurrentState.sourceGltf;
                return {
                    sourcePath: source.sourcePath,
                    files: await Promise.all(
                        source.companionFiles
                            .filter((file: File) => file.name === "diffuse.png")
                            .map(async (file: File & { correctName: string }) => [file.webkitRelativePath, file.size, file.correctName])
                    ),
                };
            });
            expect(paths.sourcePath).toBe("asset/assembly.gltf");
            expect(paths.files.map((entry: string[]) => entry[0])).toEqual(["", ""]);
            expect(paths.files.every((entry: (string | number)[]) => Number(entry[1]) > 0)).toBe(true);
            expect(
                await page.evaluate(async () => {
                    const scene = (globalThis as any).BABYLON.FlowGraphEditor._CurrentState.sceneContext.scene;
                    return await Promise.all(
                        ["Base", "Service"].map(async (name) => Array.from(await scene.materials.find((material: any) => material.name === name).albedoTexture.readPixels()))
                    );
                })
            ).toEqual([
                [255, 0, 0, 255],
                [0, 0, 255, 255],
            ]);
            await expect(page.getByRole("dialog", { name: "Complete glTF import" })).not.toBeVisible();
            expect(paths.files.map((entry: string[]) => entry[2]).sort()).toEqual(["asset/textures/blue/diffuse.png", "asset/textures/red/diffuse.png"]);
            const identity = await page.evaluate(() => (globalThis as any).BABYLON.FlowGraphEditor._CurrentState.sceneContext.scene.uid);
            rmSync(join(asset, "textures", "blue", "diffuse.png"));
            // A different drop root has the URI-shaped path, but is unrelated to asset/assembly.gltf.
            const wrongRoot = join(folder, "textures");
            mkdirSync(join(wrongRoot, "blue"), { recursive: true });
            writeFileSync(join(wrongRoot, "blue", "diffuse.png"), Buffer.from(pngs.blue, "base64"));
            const retry = await page.context().newCDPSession(page);
            for (const type of ["dragEnter", "dragOver", "drop"] as const) {
                await retry.send("Input.dispatchDragEvent", {
                    type,
                    x: canvas!.x + canvas!.width / 2,
                    y: canvas!.y + canvas!.height / 2,
                    data: { ...data, files: [asset, wrongRoot] },
                });
            }
            await retry.detach();
            await expect(page.getByRole("dialog", { name: "Complete glTF import" })).toContainText("textures/blue/diffuse.png");
            expect(await page.evaluate(() => (globalThis as any).BABYLON.FlowGraphEditor._CurrentState.sceneContext.scene.uid)).toBe(identity);
        } finally {
            rmSync(folder, { recursive: true, force: true });
        }
    });

    test("authors and extends a split glTF while preserving JSON tokens and companion buffer paths", async ({ page, browser }, testInfo) => {
        test.setTimeout(90_000);
        const { document, bin } = BuildExistingGlbFixture(true, false, false, false, false, false, true);
        document.buffers[0].uri = "meshes/geometry.bin";
        document.images.push({ name: "red texture", uri: "textures/red/diffuse.png" }, { name: "blue texture", uri: "textures/blue/diffuse.png" });
        const source = JSON.stringify(document).replace('"stableAssetId":"maintenance-asset-9"', '"stableAssetId":9007199254740993');
        const fge = new FlowGraphEditorPage(page);
        await fge.goto({ local: true });
        await fge.assertEditorReady();
        await page.evaluate(
            ({ json, buffer }) => {
                const transfer = new DataTransfer();
                const mainFile = new File([json], "split-assembly.gltf", { type: "model/gltf+json" });
                const companion = new File([new Uint8Array(buffer)], "geometry.bin");
                Object.defineProperty(mainFile, "webkitRelativePath", { value: "asset/split-assembly.gltf" });
                Object.defineProperty(companion, "webkitRelativePath", { value: "asset/meshes/geometry.bin" });
                transfer.items.add(mainFile);
                transfer.items.add(companion);
                for (const color of ["red", "blue"]) {
                    const texture = new File(["texture"], "diffuse.png", { type: "image/png" });
                    Object.defineProperty(texture, "webkitRelativePath", { value: `asset/textures/${color}/diffuse.png` });
                    transfer.items.add(texture);
                }
                (document.querySelector("canvas") ?? document.body).dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
            },
            { json: source, buffer: [...bin] }
        );
        await expect.poll(async () => (await GetSceneContextSnapshot(page))?.source).toBe("file");
        await expect(page.getByRole("button", { name: "New behavior" })).toBeEnabled();
        await page.getByRole("button", { name: "New behavior" }).click();
        await expect(page.getByTestId("external-resource-warning-dialog")).toContainText("meshes/geometry.bin");
        await page.getByRole("combobox", { name: "Trigger mesh" }).click();
        await page.getByRole("option", { name: /glTF node 1/ }).click();
        await page.getByRole("combobox", { name: "Mesh to reveal" }).click();
        await page.getByRole("option", { name: /glTF node 2/ }).click();
        await page.screenshot({ path: testInfo.outputPath("khr-split-gltf-authoring.png"), fullPage: true });
        const firstDownload = page.waitForEvent("download", (download) => download.suggestedFilename() === "split-assembly-behavior.gltf");
        await page.getByRole("button", { name: "Create behavior" }).click();
        const authored = readFileSync((await (await firstDownload).path())!, "utf8");
        expect(authored).toContain('"stableAssetId":9007199254740993');
        expect(JSON.parse(authored).buffers[0].uri).toBe("meshes/geometry.bin");
        await expect(page.getByRole("button", { name: "Add reaction" })).toBeEnabled();
        await page.getByRole("button", { name: "Add reaction" }).click();
        await page.getByRole("combobox", { name: "Event" }).click();
        await page.getByRole("option", { name: /onSelect.*glTF node 1/ }).click();
        await page.getByRole("combobox", { name: "Target mesh" }).click();
        await page.getByRole("option", { name: /glTF node 1/ }).click();
        await page.getByRole("combobox", { name: "Action" }).click();
        await page.getByRole("option", { name: "Hide target" }).click();
        await page.screenshot({ path: testInfo.outputPath("khr-split-gltf-add-reaction.png"), fullPage: true });
        const secondDownload = page.waitForEvent("download", {
            predicate: (download) => download.suggestedFilename() === "split-assembly-behavior-reaction.gltf",
            timeout: 30_000,
        });
        await page.getByRole("dialog").getByRole("button", { name: "Add reaction" }).click();
        const reacted = readFileSync((await (await secondDownload).path())!, "utf8");
        const graph = JSON.parse(reacted).extensions.KHR_interactivity.graphs[0];
        expect(reacted).toContain('"stableAssetId":9007199254740993');
        expect(JSON.parse(reacted).buffers[0].uri).toBe("meshes/geometry.bin");
        expect(graph.declarations[graph.nodes[graph.nodes[0].flows.out.node].declaration].op).toBe("flow/sequence");
        await expect(page.getByRole("button", { name: "Export KHR glTF" })).toBeEnabled();
        await expect(page.getByRole("button", { name: "Export KHR GLB" })).toBeDisabled();
        const editedDownload = page.waitForEvent("download", (download) => download.suggestedFilename() === "split-assembly-behavior-reaction-edited.gltf");
        await page.getByRole("button", { name: "Export KHR glTF" }).click();
        const edited = readFileSync((await (await editedDownload).path())!, "utf8");
        expect(edited).toContain('"stableAssetId":9007199254740993');
        expect(JSON.parse(edited).buffers[0].uri).toBe("meshes/geometry.bin");
        expect(JSON.parse(edited).images.map((image: { uri: string }) => image.uri)).toContain("textures/blue/diffuse.png");

        const reopened = await browser.newContext();
        try {
            const reopenedPage = await reopened.newPage();
            const reopenedEditor = new FlowGraphEditorPage(reopenedPage);
            await reopenedEditor.goto({ local: true });
            await reopenedEditor.assertEditorReady();
            await reopenedPage.evaluate(
                ({ json, buffer }) => {
                    const transfer = new DataTransfer();
                    const mainFile = new File([json], "reopened-split.gltf", { type: "model/gltf+json" });
                    const companion = new File([new Uint8Array(buffer)], "geometry.bin");
                    Object.defineProperty(mainFile, "webkitRelativePath", { value: "asset/reopened-split.gltf" });
                    Object.defineProperty(companion, "webkitRelativePath", { value: "asset/meshes/geometry.bin" });
                    transfer.items.add(mainFile);
                    transfer.items.add(companion);
                    for (const color of ["red", "blue"]) {
                        const texture = new File(["texture"], "diffuse.png", { type: "image/png" });
                        Object.defineProperty(texture, "webkitRelativePath", { value: `asset/textures/${color}/diffuse.png` });
                        transfer.items.add(texture);
                    }
                    (document.querySelector("canvas") ?? document.body).dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
                },
                { json: edited, buffer: [...bin] }
            );
            await expect.poll(async () => (await GetSceneContextSnapshot(reopenedPage))?.source).toBe("file");
            await expect(reopenedPage.getByRole("button", { name: "Add reaction" })).toBeEnabled();
            await expect(reopenedPage.getByRole("log", { name: "Flow graph log" })).not.toContainText("Failed to load file");
        } finally {
            await reopened.close();
        }
    });

    test("rejects missing or ambiguous split glTF companions without replacing the scene", async ({ page }) => {
        const { document } = BuildExistingGlbFixture(true, false, false, false, false, false, true);
        const fge = new FlowGraphEditorPage(page);
        await fge.goto({ local: true });
        await fge.assertEditorReady();
        const originalScene = await GetSceneContextSnapshot(page);
        await page.evaluate((source) => {
            const transfer = new DataTransfer();
            transfer.items.add(new File([JSON.stringify(source)], "missing-resource.gltf", { type: "model/gltf+json" }));
            (document.querySelector("canvas") ?? document.body).dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
        }, document);
        const recoveryDialog = page.getByRole("dialog", { name: "Complete glTF import" });
        await expect(recoveryDialog).toContainText("geometry.bin");
        await expect(recoveryDialog).toContainText("Your current scene is still available");
        await expect(recoveryDialog.getByRole("button", { name: "Use file and retry" })).toBeDisabled();
        expect(await GetSceneContextSnapshot(page)).toEqual(originalScene);
        await recoveryDialog.getByRole("button", { name: "Cancel import" }).click();
        await expect(recoveryDialog).not.toBeVisible();
        await expect(page.getByRole("log", { name: "Flow graph log" })).toContainText("Missing companion file for geometry.bin");

        document.images.push({ name: "red texture", uri: "textures/red/diffuse.png" });
        await page.evaluate((source) => {
            const transfer = new DataTransfer();
            transfer.items.add(new File([JSON.stringify(source)], "ambiguous-resource.gltf", { type: "model/gltf+json" }));
            transfer.items.add(new File(["buffer"], "geometry.bin"));
            transfer.items.add(new File(["red"], "diffuse.png"));
            transfer.items.add(new File(["blue"], "diffuse.png"));
            (document.querySelector("canvas") ?? document.body).dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
        }, document);
        await expect(recoveryDialog).toContainText("textures/red/diffuse.png");
        expect(await GetSceneContextSnapshot(page)).toEqual(originalScene);
    });

    test("recovers an ambiguous split glTF import by choosing each same-named texture", async ({ page }, testInfo) => {
        const { document, bin } = BuildExistingGlbFixture(true, false, false, false, false, false, true);
        document.images.push({ name: "red texture", uri: "textures/red/diffuse.png" }, { name: "blue texture", uri: "textures/blue/diffuse.png" });
        const fge = new FlowGraphEditorPage(page);
        await fge.goto({ local: true });
        await fge.assertEditorReady();
        await page.evaluate(
            ({ source, buffer }) => {
                const transfer = new DataTransfer();
                transfer.items.add(new File([JSON.stringify(source)], "ambiguous-textures.gltf", { type: "model/gltf+json" }));
                transfer.items.add(new File([new Uint8Array(buffer)], "geometry.bin"));
                transfer.items.add(new File(["red"], "diffuse.png"));
                transfer.items.add(new File(["blue"], "diffuse.png"));
                (document.querySelector("canvas") ?? document.body).dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
            },
            { source: document, buffer: [...bin] }
        );
        const dialog = page.getByRole("dialog", { name: "Complete glTF import" });
        await expect(dialog).toContainText("textures/red/diffuse.png");
        await page.waitForTimeout(400);
        await page.screenshot({ path: testInfo.outputPath("khr-companion-recovery-desktop.png"), fullPage: true });
        await dialog.getByLabel("Companion file for textures/red/diffuse.png").setInputFiles({ name: "diffuse.png", mimeType: "image/png", buffer: Buffer.from("red") });
        await dialog.getByRole("button", { name: "Use file and retry" }).click();
        await expect(dialog).toContainText("textures/blue/diffuse.png");
        await dialog.getByLabel("Companion file for textures/blue/diffuse.png").setInputFiles({ name: "diffuse.png", mimeType: "image/png", buffer: Buffer.from("blue") });
        await dialog.getByRole("button", { name: "Use file and retry" }).click();
        await expect(dialog).not.toBeVisible();
        await expect.poll(async () => (await GetSceneContextSnapshot(page))?.source).toBe("file");
        await expect.poll(async () => page.evaluate(() => (globalThis as any).BABYLON.FlowGraphEditor._CurrentState.sourceGltf?.companionOverrides?.size)).toBe(2);

        await page.getByRole("button", { name: "New behavior" }).click();
        await page.getByRole("combobox", { name: "Trigger mesh" }).click();
        await page.getByRole("option", { name: /glTF node 1/ }).click();
        await page.getByRole("combobox", { name: "Mesh to reveal" }).click();
        await page.getByRole("option", { name: /glTF node 2/ }).click();
        const downloadPromise = page.waitForEvent("download", (download) => download.suggestedFilename() === "ambiguous-textures-behavior.gltf");
        await page.getByRole("button", { name: "Create behavior" }).click();
        const authored = JSON.parse(readFileSync((await (await downloadPromise).path())!, "utf8"));
        expect(authored.images.map((image: { uri: string }) => image.uri)).toContain("textures/blue/diffuse.png");
        await expect(page.getByRole("button", { name: "Add reaction" })).toBeEnabled();
    });

    test("asks for both resource bindings when one flat image could belong to either path", async ({ page }) => {
        const fixture = BuildExistingGlbFixture(true, false, false, false, false, false, true);
        fixture.document.images = [{ uri: "red/diffuse.png" }, { uri: "blue/diffuse.png" }];
        fixture.document.textures = [{ source: 0 }, { source: 1 }];
        for (let index = 0; index < 2; index++) {
            fixture.document.materials[index].pbrMetallicRoughness = { baseColorTexture: { index } };
        }
        const fge = new FlowGraphEditorPage(page);
        await fge.goto({ local: true });
        const pngs = await page.evaluate(() =>
            Object.fromEntries(
                ["red", "blue"].map((color) => {
                    const canvas = document.createElement("canvas");
                    canvas.width = canvas.height = 1;
                    const context = canvas.getContext("2d")!;
                    context.fillStyle = color;
                    context.fillRect(0, 0, 1, 1);
                    return [color, canvas.toDataURL().split(",")[1]];
                })
            )
        );
        await page.evaluate(
            ({ source, buffer, blue }) => {
                const transfer = new DataTransfer();
                transfer.items.add(new File([JSON.stringify(source)], "single-image.gltf"));
                transfer.items.add(new File([new Uint8Array(buffer)], "geometry.bin"));
                transfer.items.add(new File([Uint8Array.from(atob(blue), (character) => character.charCodeAt(0))], "diffuse.png", { type: "image/png" }));
                (document.querySelector("canvas") ?? document.body).dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
            },
            { source: fixture.document, buffer: [...fixture.bin], blue: pngs.blue }
        );
        const dialog = page.getByRole("dialog", { name: "Complete glTF import" });
        await expect(dialog, "The importer must not assume that the lone flat file belongs to the first URI").toContainText("red/diffuse.png");
        await dialog.getByLabel("Companion file for red/diffuse.png").setInputFiles({ name: "red-choice.png", mimeType: "image/png", buffer: Buffer.from(pngs.red, "base64") });
        await dialog.getByRole("button", { name: "Use file and retry" }).click();
        await expect(dialog).toContainText("blue/diffuse.png");
        await dialog.getByLabel("Companion file for blue/diffuse.png").setInputFiles({ name: "blue-choice.png", mimeType: "image/png", buffer: Buffer.from(pngs.blue, "base64") });
        await dialog.getByRole("button", { name: "Use file and retry" }).click();
        const pixels = async () =>
            await page.evaluate(async () => {
                const state = (globalThis as any).BABYLON.FlowGraphEditor._CurrentState;
                if (!state.sourceGltf || state.sourceGltf.companionOverrides.size !== 2) {
                    return null;
                }
                return await Promise.all(
                    ["Base", "Service"].map(async (name) =>
                        Array.from(await state.sceneContext.scene.materials.find((material: any) => material.name === name).albedoTexture.readPixels())
                    )
                );
            });
        await expect.poll(pixels).toEqual([
            [255, 0, 0, 255],
            [0, 0, 255, 255],
        ]);
        await expect(dialog).not.toBeVisible();
        await page.getByRole("button", { name: "New behavior" }).click();
        await page.getByRole("combobox", { name: "Trigger mesh" }).click();
        await page.getByRole("option", { name: /glTF node 1/ }).click();
        await page.getByRole("combobox", { name: "Mesh to reveal" }).click();
        await page.getByRole("option", { name: /glTF node 2/ }).click();
        const download = page.waitForEvent("download");
        await page.getByRole("button", { name: "Create behavior" }).click();
        await download;
        await expect.poll(pixels).toEqual([
            [255, 0, 0, 255],
            [0, 0, 255, 255],
        ]);
        await expect(page.getByRole("button", { name: "Add reaction" })).toBeEnabled();
    });

    test("keeps the resource store intact for a prototype-named companion", async ({ page }) => {
        const fixture = BuildExistingGlbFixture(true, false, false, false, false, false, true);
        fixture.document.buffers[0].uri = "__proto__";
        const fge = new FlowGraphEditorPage(page);
        await fge.goto({ local: true });
        await page.evaluate(
            ({ source, buffer }) => {
                const store = (globalThis as any).BABYLON.FilesInputStore.FilesToLoad;
                (globalThis as any).__fileStorePrototype = Object.getPrototypeOf(store);
                const transfer = new DataTransfer();
                transfer.items.add(new File([JSON.stringify(source)], "reserved-name.gltf"));
                transfer.items.add(new File([new Uint8Array(buffer)], "__proto__"));
                (document.querySelector("canvas") ?? document.body).dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
            },
            { source: fixture.document, buffer: [...fixture.bin] }
        );
        await expect.poll(async () => page.evaluate(() => (globalThis as any).BABYLON.FlowGraphEditor._CurrentState.sourceGltf?.file.name)).toBe("reserved-name.gltf");
        expect(
            await page.evaluate(() => Object.getPrototypeOf((globalThis as any).BABYLON.FilesInputStore.FilesToLoad) === (globalThis as any).__fileStorePrototype),
            "A companion filename must create a file entry without changing the resource store's prototype"
        ).toBe(true);
        expect(await page.evaluate(() => Object.hasOwn((globalThis as any).BABYLON.FilesInputStore.FilesToLoad, "__proto__"))).toBe(true);
        const failed = BuildExistingGlbFixture(true, false, false, false, false, false, true);
        failed.document.buffers[0].uri = "__proto__";
        await page.evaluate((source) => {
            const transfer = new DataTransfer();
            transfer.items.add(new File([JSON.stringify(source)], "failed-reserved-name.gltf"));
            transfer.items.add(new File([], "__proto__"));
            (document.querySelector("canvas") ?? document.body).dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
        }, failed.document);
        await expect(page.getByRole("log", { name: "Flow graph log" })).toContainText("Failed to load file");
        expect(
            await page.evaluate(() => ({
                prototypeIntact: Object.getPrototypeOf((globalThis as any).BABYLON.FilesInputStore.FilesToLoad) === (globalThis as any).__fileStorePrototype,
                bytes: (globalThis as any).BABYLON.FilesInputStore.FilesToLoad["__proto__"].size,
            }))
        ).toEqual({ prototypeIntact: true, bytes: fixture.bin.length });
    });

    test("lets the user replace an incorrect companion choice without dropping the asset again", async ({ page }) => {
        const { document, bin } = BuildExistingGlbFixture(true, false, false, false, false, false, true);
        const fge = new FlowGraphEditorPage(page);
        await fge.goto({ local: true });
        await fge.assertEditorReady();
        await page.evaluate((source) => {
            const transfer = new DataTransfer();
            transfer.items.add(new File([JSON.stringify(source)], "replace-companion.gltf", { type: "model/gltf+json" }));
            (document.querySelector("canvas") ?? document.body).dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
        }, document);
        const dialog = page.getByRole("dialog", { name: "Complete glTF import" });
        await expect(dialog).toContainText("geometry.bin");
        await dialog.getByLabel("Companion file for geometry.bin").setInputFiles({ name: "geometry.bin", mimeType: "application/octet-stream", buffer: Buffer.alloc(0) });
        await dialog.getByRole("button", { name: "Use file and retry" }).click();
        await expect(dialog).toContainText("The selected file did not load");
        await dialog.getByLabel("Companion file for geometry.bin").setInputFiles({ name: "geometry.bin", mimeType: "application/octet-stream", buffer: bin });
        await dialog.getByRole("button", { name: "Use file and retry" }).click();
        await expect(dialog).not.toBeVisible();
        await expect.poll(async () => (await GetSceneContextSnapshot(page))?.source).toBe("file");
    });

    test("keeps the active scene's resource mapping after a failed companion import", async ({ page }) => {
        const { document, bin } = BuildExistingGlbFixture(true, false, false, false, false, false, true);
        const fge = new FlowGraphEditorPage(page);
        await fge.goto({ local: true });
        await fge.assertEditorReady();
        await page.evaluate(
            ({ source, buffer }) => {
                const transfer = new DataTransfer();
                transfer.items.add(new File([JSON.stringify(source)], "active-source.gltf", { type: "model/gltf+json" }));
                transfer.items.add(new File([new Uint8Array(buffer)], "geometry.bin"));
                (document.querySelector("canvas") ?? document.body).dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
            },
            { source: document, buffer: [...bin] }
        );
        await expect.poll(async () => (await GetSceneContextSnapshot(page))?.source).toBe("file");
        await page.evaluate(() => {
            (globalThis as any).__activeGeometryFile = (globalThis as any).BABYLON.FilesInputStore.FilesToLoad["geometry.bin"];
        });
        const activeScene = await GetSceneContextSnapshot(page);
        document.images.push({ name: "red texture", uri: "textures/red/diffuse.png" });
        await page.evaluate(
            ({ source, buffer }) => {
                const transfer = new DataTransfer();
                transfer.items.add(new File([JSON.stringify(source)], "failed-source.gltf", { type: "model/gltf+json" }));
                transfer.items.add(new File([new Uint8Array(buffer)], "geometry.bin"));
                transfer.items.add(new File(["red"], "diffuse.png"));
                transfer.items.add(new File(["blue"], "diffuse.png"));
                (document.querySelector("canvas") ?? document.body).dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
            },
            { source: document, buffer: [...bin] }
        );
        await expect(page.getByRole("dialog", { name: "Complete glTF import" })).toContainText("textures/red/diffuse.png");
        expect(await GetSceneContextSnapshot(page)).toEqual(activeScene);
        expect(await page.evaluate(() => (globalThis as any).BABYLON.FilesInputStore.FilesToLoad["geometry.bin"] === (globalThis as any).__activeGeometryFile)).toBe(true);
    });

    test("offers a companion file chooser on a mobile viewport", async ({ browser }, testInfo) => {
        const { document, bin } = BuildExistingGlbFixture(true, false, false, false, false, false, true);
        const context = await browser.newContext({ ...devices["Pixel 7"], isMobile: browser.browserType().name() !== "firefox", acceptDownloads: true });
        try {
            const page = await context.newPage();
            const fge = new FlowGraphEditorPage(page);
            await fge.goto({ local: true });
            await fge.assertEditorReady();
            await page.evaluate((source) => {
                const transfer = new DataTransfer();
                transfer.items.add(new File([JSON.stringify(source)], "mobile-split.gltf", { type: "model/gltf+json" }));
                (document.querySelector("canvas") ?? document.body).dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
            }, document);
            const dialog = page.getByRole("dialog", { name: "Complete glTF import" });
            await expect(dialog).toContainText("geometry.bin");
            await expect(dialog).toBeInViewport();
            await page.waitForTimeout(400);
            await page.screenshot({ path: testInfo.outputPath("khr-companion-recovery-touch.png"), fullPage: true });
            await dialog.getByLabel("Companion file for geometry.bin").setInputFiles({ name: "geometry.bin", mimeType: "application/octet-stream", buffer: bin });
            await dialog.getByRole("button", { name: "Use file and retry" }).tap();
            await expect(dialog).not.toBeVisible();
            await expect.poll(async () => (await GetSceneContextSnapshot(page))?.source).toBe("file");
        } finally {
            await context.close();
        }
    });

    test("warns that an authored GLB still needs its external buffer when downloaded and reopened", async ({ page, browser }, testInfo) => {
        test.setTimeout(90_000);
        const { bytes, bin } = BuildExistingGlbFixture(false, false, false, false, false, false, true);
        const fge = new FlowGraphEditorPage(page);
        await fge.goto({ local: true });
        await fge.assertEditorReady();
        await page.evaluate(
            ({ glb, buffer }) => {
                const transfer = new DataTransfer();
                transfer.items.add(new File([new Uint8Array(glb)], "external-assembly.glb", { type: "model/gltf-binary" }));
                transfer.items.add(new File([new Uint8Array(buffer)], "geometry.bin"));
                (document.querySelector("canvas") ?? document.body).dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
            },
            { glb: [...bytes], buffer: [...bin] }
        );
        await expect.poll(async () => (await GetSceneContextSnapshot(page))?.source).toBe("file");
        await page.getByRole("button", { name: "New behavior" }).click();
        await expect(page.getByTestId("external-resource-warning-dialog")).toContainText("geometry.bin");
        await page.getByRole("combobox", { name: "Trigger mesh" }).click();
        await page.getByRole("option", { name: /glTF node 1/ }).click();
        await page.getByRole("combobox", { name: "Mesh to reveal" }).click();
        await page.getByRole("option", { name: /glTF node 2/ }).click();
        await page.screenshot({ path: testInfo.outputPath("khr-existing-glb-external-resource-warning.png"), fullPage: true });
        const downloadPromise = page.waitForEvent("download", (download) => download.suggestedFilename() === "external-assembly-behavior.glb");
        await page.getByRole("button", { name: "Create behavior" }).click();
        const download = await downloadPromise;
        const authoredBytes = readFileSync((await download.path())!);
        await expect(page.getByTestId("external-resource-warning-status")).toContainText("geometry.bin");
        const jsonLength = authoredBytes.readUInt32LE(12);
        expect(JSON.parse(authoredBytes.subarray(20, 20 + jsonLength).toString("utf8")).buffers[0].uri).toBe("geometry.bin");

        const reopened = await browser.newContext();
        try {
            const reopenedPage = await reopened.newPage();
            const reopenedEditor = new FlowGraphEditorPage(reopenedPage);
            await reopenedEditor.goto({ local: true });
            await reopenedEditor.assertEditorReady();
            await reopenedPage.evaluate(
                (glb) => {
                    const transfer = new DataTransfer();
                    transfer.items.add(new File([new Uint8Array(glb)], "external-assembly-behavior.glb", { type: "model/gltf-binary" }));
                    (document.querySelector("canvas") ?? document.body).dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
                },
                [...authoredBytes]
            );
            await expect(reopenedPage.getByText(/Could not load|Unable to load|Failed to load/i).first()).toBeVisible();
            await reopenedPage.evaluate(
                ({ glb, buffer }) => {
                    const transfer = new DataTransfer();
                    transfer.items.add(new File([new Uint8Array(glb)], "external-assembly-behavior.glb", { type: "model/gltf-binary" }));
                    transfer.items.add(new File([new Uint8Array(buffer)], "geometry.bin"));
                    (document.querySelector("canvas") ?? document.body).dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
                },
                { glb: [...authoredBytes], buffer: [...bin] }
            );
            await expect.poll(async () => (await GetSceneContextSnapshot(reopenedPage))?.source).toBe("file");
            await expect.poll(async () => await reopenedEditor.getGraphNames()).toEqual(["Select to reveal"]);
        } finally {
            await reopened.close();
        }
    });

    test("does not offer a skinned mesh under its unrelated reparented assembly node", async ({ page }) => {
        const { bytes } = BuildExistingGlbFixture(false, false, false, true);
        const fge = new FlowGraphEditorPage(page);
        await fge.goto({ local: true });
        await fge.assertEditorReady();
        await page.evaluate(
            (data) => {
                const file = new File([new Uint8Array(data)], "skinned-assembly.glb", { type: "model/gltf-binary" });
                const transfer = new DataTransfer();
                transfer.items.add(file);
                (document.querySelector("canvas") ?? document.body).dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
            },
            [...bytes]
        );
        await expect.poll(async () => (await GetSceneContextSnapshot(page))?.source).toBe("file");
        const skinOwnership = await page.evaluate(() => {
            const scene = (globalThis as any).BABYLON.FlowGraphEditor._CurrentState.sceneContext.scene;
            const mesh = scene.meshes.find((candidate: any) => candidate.skeleton);
            return { skinnedMesh: mesh?.name, parentPointers: mesh?.parent?._internalMetadata?.gltf?.pointers, skeletonCount: scene.skeletons.length };
        });
        expect(skinOwnership).toMatchObject({ skinnedMesh: "skinned part", parentPointers: ["/nodes/0"], skeletonCount: 1 });
        await page.getByRole("button", { name: "New behavior" }).click();
        await page.getByRole("combobox", { name: "Trigger mesh" }).click();
        await expect(page.getByRole("option", { name: /skinned part/ })).toHaveCount(0);
        await expect(page.getByRole("option", { name: /glTF node 1/ })).toBeVisible();
        await expect(page.getByRole("option", { name: /glTF node 2/ })).toBeVisible();
    });

    test("preserves untouched JSON number tokens in a downloaded source GLB", async ({ page }) => {
        const { bytes } = BuildExistingGlbFixture(false, false, false, false, true);
        const fge = new FlowGraphEditorPage(page);
        await fge.goto({ local: true });
        await fge.assertEditorReady();
        await page.evaluate(
            (data) => {
                const file = new File([new Uint8Array(data)], "large-id-assembly.glb", { type: "model/gltf-binary" });
                const transfer = new DataTransfer();
                transfer.items.add(file);
                (document.querySelector("canvas") ?? document.body).dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
            },
            [...bytes]
        );
        await expect.poll(async () => (await GetSceneContextSnapshot(page))?.source).toBe("file");
        await page.getByRole("button", { name: "New behavior" }).click();
        await page.getByRole("combobox", { name: "Trigger mesh" }).click();
        await page.getByRole("option", { name: /glTF node 1/ }).click();
        await page.getByRole("combobox", { name: "Mesh to reveal" }).click();
        await page.getByRole("option", { name: /glTF node 2/ }).click();
        const downloadPromise = page.waitForEvent("download", (download) => download.suggestedFilename() === "large-id-assembly-behavior.glb");
        await page.getByRole("button", { name: "Create behavior" }).click();
        const authoredBytes = readFileSync((await (await downloadPromise).path())!);
        const authoredJson = authoredBytes.subarray(20, 20 + authoredBytes.readUInt32LE(12)).toString("utf8");
        expect(authoredJson).toContain('"stableAssetId":9007199254740993');
        expect(authoredJson).toContain('"code":1e+2');
        expect(authoredBytes.subarray(20 + authoredBytes.readUInt32LE(12))).toEqual(bytes.subarray(20 + bytes.readUInt32LE(12)));
        expect(await StrictImportKhrInteractivityAsync(page, "strict-large-id.glb", authoredBytes)).toEqual({ graphCount: 1, errorCount: 0 });
    });

    test("explains why an animated GLB cannot use the selection-only template", async ({ page }, testInfo) => {
        const { bytes } = BuildExistingGlbFixture(false, false, true);
        const fge = new FlowGraphEditorPage(page);
        await fge.goto({ local: true });
        await fge.assertEditorReady();
        await page.evaluate(
            (data) => {
                const file = new File([new Uint8Array(data)], "animated-assembly.glb", { type: "model/gltf-binary" });
                const transfer = new DataTransfer();
                transfer.items.add(file);
                (document.querySelector("canvas") ?? document.body).dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
            },
            [...bytes]
        );
        await expect.poll(async () => (await GetSceneContextSnapshot(page))?.source).toBe("file");
        const originalScene = await GetSceneContextSnapshot(page);
        let downloads = 0;
        page.on("download", () => downloads++);
        await page.getByRole("button", { name: "New behavior" }).click();
        await expect(page.getByText(/This asset has animations.*explicit animation behavior/i)).toBeVisible();
        await page.getByRole("combobox", { name: "Trigger mesh" }).click();
        await page.getByRole("option", { name: /glTF node 1/ }).click();
        await page.getByRole("combobox", { name: "Mesh to reveal" }).click();
        await page.getByRole("option", { name: /glTF node 2/ }).click();
        await expect(page.getByRole("button", { name: "Create behavior" })).toBeDisabled();
        await page.screenshot({ path: testInfo.outputPath("khr-animated-glb-unsupported.png"), fullPage: true });
        expect(downloads).toBe(0);
        expect(await GetSceneContextSnapshot(page)).toEqual(originalScene);
        expect(await fge.getGraphNames()).toEqual(["Graph 1"]);
    });

    test("rejects a reveal target beneath a hidden source ancestor without downloading or changing the scene", async ({ page }, testInfo) => {
        const { bytes } = BuildExistingGlbFixture(false, false, false, false, false, true);
        const fge = new FlowGraphEditorPage(page);
        await fge.goto({ local: true });
        await fge.assertEditorReady();
        await page.evaluate(
            (data) => {
                const file = new File([new Uint8Array(data)], "hidden-reveal.glb", { type: "model/gltf-binary" });
                const transfer = new DataTransfer();
                transfer.items.add(file);
                (document.querySelector("canvas") ?? document.body).dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
            },
            [...bytes]
        );
        await expect.poll(async () => (await GetSceneContextSnapshot(page))?.source).toBe("file");
        const originalScene = await GetSceneContextSnapshot(page);
        let downloads = 0;
        page.on("download", () => downloads++);
        await page.getByRole("button", { name: "New behavior" }).click();
        await page.getByRole("combobox", { name: "Trigger mesh" }).click();
        await page.getByRole("option", { name: /glTF node 1/ }).click();
        await page.getByRole("combobox", { name: "Mesh to reveal" }).click();
        await page.getByRole("option", { name: /glTF node 2/ }).click();
        await page.getByRole("button", { name: "Create behavior" }).click();

        await expect(page.getByRole("log", { name: "Flow graph log" })).toContainText("A reveal ancestor disables visibility.");
        await page.screenshot({ path: testInfo.outputPath("khr-hidden-reveal-ancestor.png"), fullPage: true });
        expect(downloads).toBe(0);
        expect(await GetSceneContextSnapshot(page)).toEqual(originalScene);
        expect(await fge.getGraphNames()).toEqual(["Graph 1"]);
    });

    test("authors a resettable two-step procedure in an existing GLB", async ({ page }, testInfo) => {
        test.setTimeout(90_000);
        const { bytes, document } = BuildExistingGlbFixture(false, true, false, false, false, false, false, true);
        const fge = new FlowGraphEditorPage(page);
        await fge.goto({ local: true });
        await fge.assertEditorReady();
        await page.evaluate(
            (data) => {
                const file = new File([new Uint8Array(data)], "procedure.glb", { type: "model/gltf-binary" });
                const transfer = new DataTransfer();
                transfer.items.add(file);
                (document.querySelector("canvas") ?? document.body).dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
            },
            [...bytes]
        );
        await expect.poll(async () => (await GetSceneContextSnapshot(page))?.source).toBe("file");
        await page.getByRole("button", { name: "New behavior" }).click();
        await page.getByRole("combobox", { name: "Behavior type" }).click();
        await page.getByRole("option", { name: "Two-step procedure" }).click();
        await page.getByRole("combobox", { name: "First part" }).click();
        await page
            .getByRole("option", { name: /glTF node 1\)/ })
            .first()
            .click();
        await page.getByRole("combobox", { name: "Second part" }).click();
        await page
            .getByRole("option", { name: /glTF node 1\)/ })
            .last()
            .click();
        await expect(page.getByRole("button", { name: "Create behavior" })).toBeDisabled();
        for (const [label, index] of [
            ["Second part", 2],
            ["Next-step cue", 3],
            ["Completion cue", 4],
            ["Reset control", 5],
        ] as const) {
            await page.getByRole("combobox", { name: label }).click();
            await page.getByRole("option", { name: new RegExp(`glTF node ${index}\\)`) }).click();
        }
        await expect(page.getByRole("button", { name: "Create behavior" })).toBeEnabled();
        await page.screenshot({ path: testInfo.outputPath("khr-two-step-procedure-dialog.png"), fullPage: true });
        const downloadPromise = page.waitForEvent("download", (download) => download.suggestedFilename() === "procedure-behavior.glb");
        await page.getByRole("button", { name: "Create behavior" }).click();
        const downloadPath = await (await downloadPromise).path();
        const authoredBytes = readFileSync(downloadPath!);
        const jsonLength = authoredBytes.readUInt32LE(12);
        const authored = JSON.parse(authoredBytes.subarray(20, 20 + jsonLength).toString("utf8"));
        expect(authoredBytes.subarray(20 + jsonLength)).toEqual(bytes.subarray(20 + bytes.readUInt32LE(12)));
        expect(authored.nodes.map((node: any) => ({ name: node.name, extras: node.extras, children: node.children }))).toEqual(
            document.nodes.map((node: any) => ({ name: node.name, extras: node.extras, children: node.children }))
        );
        expect(await StrictImportKhrInteractivityAsync(page, "strict-procedure.glb", authoredBytes)).toEqual({ graphCount: 1, errorCount: 0 });
        await expect.poll(async () => await fge.getGraphNames()).toEqual(["Two-step procedure"]);
        await page.screenshot({ path: testInfo.outputPath("khr-two-step-procedure-graph.png"), fullPage: true });

        await expect(page.getByRole("button", { name: "Export KHR GLB", exact: true })).toBeEnabled();
        const savedDownloadPromise = page.waitForEvent("download", (download) => download.suggestedFilename() === "procedure-behavior-edited.glb");
        await page.getByRole("button", { name: "Export KHR GLB", exact: true }).click();
        const savedBytes = readFileSync((await (await savedDownloadPromise).path())!);
        expect(savedBytes.subarray(20 + savedBytes.readUInt32LE(12))).toEqual(authoredBytes.subarray(20 + jsonLength));
        expect(await StrictImportKhrInteractivityAsync(page, "strict-saved-procedure.glb", savedBytes)).toEqual({ graphCount: 1, errorCount: 0 });

        const select = async (index: number, pointerId = 0, pointerType: "mouse" | "xr" | "xr-near" = "mouse") =>
            page.evaluate(
                ({ nodeIndex, id, type }) => {
                    const Babylon = (globalThis as any).BABYLON;
                    const state = Babylon.FlowGraphEditor._CurrentState;
                    const mesh = state.khrInteractivityImportResult.glTF.nodes[nodeIndex]._primitiveBabylonMeshes[0];
                    const pick = new Babylon.PickingInfo();
                    pick.hit = true;
                    pick.pickedMesh = mesh;
                    pick.pickedPoint = mesh.getAbsolutePosition();
                    state.sceneContext.scene.simulatePointerDown(pick, { pointerId: id, pointerType: type });
                    state.sceneContext.scene.simulatePointerUp(pick, { pointerId: id, pointerType: type });
                },
                { nodeIndex: index, id: pointerId, type: pointerType }
            );
        const cues = () =>
            page.evaluate(() => {
                const nodes = (globalThis as any).BABYLON.FlowGraphEditor._CurrentState.khrInteractivityImportResult.glTF.nodes;
                return [3, 4].map((index) => nodes[index]._primitiveBabylonMeshes.some((mesh: any) => mesh.isVisible));
            });
        await ClickGraphControl(page, "Start");
        await WaitForGraphState(page, "Running");
        expect(await cues()).toEqual([false, false]);
        await select(2);
        expect(await cues()).toEqual([false, false]);
        await select(1);
        await expect.poll(cues).toEqual([true, false]);
        await select(1);
        expect(await cues()).toEqual([true, false]);
        await select(2);
        await expect.poll(cues).toEqual([false, true]);
        await select(2);
        expect(await cues()).toEqual([false, true]);
        await select(5);
        await expect.poll(cues).toEqual([false, false]);
        await select(2);
        expect(await cues()).toEqual([false, false]);
        await select(1);
        await select(2);
        await expect.poll(cues).toEqual([false, true]);
        await ClickGraphControl(page, "Reset");
        await WaitForGraphState(page, "Stopped");
        await expect.poll(cues).toEqual([false, false]);
        await ClickGraphControl(page, "Start");
        await WaitForGraphState(page, "Running");
        // Transient XR selection may use a new pointer ID for each pinch; near-hand picks use xr-near.
        await page.evaluate(() => {
            const Babylon = (globalThis as any).BABYLON;
            const state = Babylon.FlowGraphEditor._CurrentState;
            const mesh = state.khrInteractivityImportResult.glTF.nodes[1]._primitiveBabylonMeshes[0];
            const pick = new Babylon.PickingInfo();
            pick.hit = true;
            pick.pickedMesh = mesh;
            state.sceneContext.scene.simulatePointerMove(pick, { pointerId: 201, pointerType: "xr" });
        });
        expect(await cues()).toEqual([false, false]);
        await select(2, 202, "xr");
        expect(await cues()).toEqual([false, false]);
        await select(1, 203, "xr");
        await expect.poll(cues).toEqual([true, false]);
        await select(2, 304, "xr-near");
        await expect.poll(cues).toEqual([false, true]);
        await select(5, 305, "xr-near");
        await expect.poll(cues).toEqual([false, false]);
    });

    test("creates a procedure from a new scene and exports a strict GLB", async ({ page }) => {
        test.setTimeout(90_000);
        const fge = new FlowGraphEditorPage(page);
        await fge.goto({ local: true });
        await fge.assertEditorReady();
        await page.evaluate(() => {
            const Babylon = (globalThis as any).BABYLON;
            const context = Babylon.FlowGraphEditor._CurrentState.sceneContext;
            Babylon.CreateBox("nextCue", {}, context.scene);
            Babylon.CreateBox("completionCue", {}, context.scene);
            context.refresh();
        });
        await page.getByRole("button", { name: "New behavior" }).click();
        await page.getByRole("combobox", { name: "Behavior type" }).click();
        await page.getByRole("option", { name: "Two-step procedure" }).click();
        for (const [label, name] of [
            ["First part", "box"],
            ["Second part", "sphere"],
            ["Next-step cue", "nextCue"],
            ["Completion cue", "completionCue"],
            ["Reset control", "cylinder"],
        ] as const) {
            await page.getByRole("combobox", { name: label }).click();
            await page.getByRole("option", { name: new RegExp(`^${name} \\(#`) }).click();
        }
        await expect(page.getByRole("button", { name: "Create behavior" })).toBeEnabled();
        await page.getByRole("button", { name: "Create behavior" }).click();
        await expect.poll(async () => await fge.getGraphNames()).toEqual(["Two-step procedure"]);
        const downloadPromise = page.waitForEvent("download", { predicate: (download) => download.suggestedFilename().endsWith(".glb"), timeout: 15_000 });
        await page.getByRole("button", { name: "Export KHR GLB", exact: true }).click();
        const path = await (await downloadPromise).path();
        expect(await StrictImportKhrInteractivityAsync(page, "scene-procedure.glb", readFileSync(path!))).toEqual({ graphCount: 1, errorCount: 0 });
    });

    test("does not silently take over animations while authoring from a new scene", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto({ local: true });
        await fge.assertEditorReady();
        await page.evaluate(() => {
            const Babylon = (globalThis as any).BABYLON;
            const state = Babylon.FlowGraphEditor._CurrentState;
            const box = state.sceneContext.scene.getMeshByName("box");
            const animation = new Babylon.Animation("inspection", "position", 30, Babylon.Animation.ANIMATIONTYPE_VECTOR3, Babylon.Animation.ANIMATIONLOOPMODE_CYCLE);
            animation.setKeys([
                { frame: 0, value: new Babylon.Vector3(0, 0, 0) },
                { frame: 30, value: new Babylon.Vector3(1, 0, 0) },
            ]);
            box.animations.push(animation);
        });
        const originalScene = await GetSceneContextSnapshot(page);
        await page.getByRole("button", { name: "New behavior" }).click();
        await page.getByRole("combobox", { name: "Trigger mesh" }).click();
        await page.getByRole("option", { name: /^box \(#/ }).click();
        await page.getByRole("combobox", { name: "Mesh to reveal" }).click();
        await page.getByRole("option", { name: /^sphere \(#/ }).click();
        await page.getByRole("button", { name: "Create behavior" }).click();
        await expect(page.getByRole("log", { name: "Flow graph log" })).toContainText("animated GLBs need explicit animation behavior", { timeout: 10_000 });
        expect(await GetSceneContextSnapshot(page)).toEqual(originalScene);
        expect(await fge.getGraphNames()).toEqual(["Graph 1"]);
    });

    test("keeps two-step procedure authoring usable with touch on a narrow viewport", async ({ browser }, testInfo) => {
        test.setTimeout(90_000);
        const context = await browser.newContext({ ...devices["Pixel 7"], isMobile: browser.browserType().name() !== "firefox", acceptDownloads: true });
        try {
            const page = await context.newPage();
            const fge = new FlowGraphEditorPage(page);
            await fge.goto({ local: true });
            await fge.assertEditorReady();
            const { bytes } = BuildExistingGlbFixture(false, false, false, false, false, false, false, true);
            await page.evaluate(
                (data) => {
                    const file = new File([new Uint8Array(data)], "touch-procedure.glb", { type: "model/gltf-binary" });
                    const transfer = new DataTransfer();
                    transfer.items.add(file);
                    (document.querySelector("canvas") ?? document.body).dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
                },
                [...bytes]
            );
            await expect.poll(async () => (await GetSceneContextSnapshot(page))?.source).toBe("file");
            await page.getByRole("button", { name: "New behavior" }).tap();
            await page.getByRole("combobox", { name: "Behavior type" }).tap();
            await page.getByRole("option", { name: "Two-step procedure" }).tap();
            const dialog = page.getByRole("dialog", { name: "New glTF two-step procedure" });
            await expect(dialog).toBeInViewport();
            const bounds = await dialog.boundingBox();
            expect(bounds).not.toBeNull();
            expect(bounds!.x).toBeGreaterThanOrEqual(0);
            expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
            for (const [label, index] of [
                ["First part", 1],
                ["Second part", 2],
                ["Next-step cue", 3],
                ["Completion cue", 4],
                ["Reset control", 5],
            ] as const) {
                await page.getByRole("combobox", { name: label }).tap();
                await page.getByRole("option", { name: new RegExp(`glTF node ${index}\\)`) }).tap();
            }
            await expect(page.getByRole("button", { name: "Create behavior" })).toBeEnabled();
            await page.screenshot({ path: testInfo.outputPath("khr-two-step-procedure-touch.png"), fullPage: true });
            const downloadPromise = page.waitForEvent("download", { timeout: 15_000 });
            await page.getByRole("button", { name: "Create behavior" }).tap();
            expect((await downloadPromise).suggestedFilename()).toBe("touch-procedure-behavior.glb");
            await expect.poll(async () => await fge.getGraphNames()).toEqual(["Two-step procedure"]);
        } finally {
            await context.close();
        }
    });

    test("authors an existing GLB with touch input on a mobile viewport", async ({ browser }, testInfo) => {
        test.setTimeout(90_000);
        const context = await browser.newContext({ ...devices["Pixel 7"], isMobile: browser.browserType().name() !== "firefox", acceptDownloads: true });
        try {
            const page = await context.newPage();
            const fge = new FlowGraphEditorPage(page);
            await fge.goto({ local: true });
            await fge.assertEditorReady();
            const { bytes } = BuildExistingGlbFixture();
            await page.evaluate(
                (data) => {
                    const file = new File([new Uint8Array(data)], "mobile-assembly.glb", { type: "model/gltf-binary" });
                    const transfer = new DataTransfer();
                    transfer.items.add(file);
                    (document.querySelector("canvas") ?? document.body).dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
                },
                [...bytes]
            );
            await expect.poll(async () => (await GetSceneContextSnapshot(page))?.source).toBe("file");
            await expect(page.getByRole("button", { name: "New behavior" })).toBeEnabled();
            await page.getByRole("button", { name: "New behavior" }).tap();
            await page.getByRole("combobox", { name: "Trigger mesh" }).tap();
            await page.getByRole("option", { name: /glTF node 1/ }).tap();
            await page.getByRole("combobox", { name: "Mesh to reveal" }).tap();
            await page.getByRole("option", { name: /glTF node 2/ }).tap();
            await expect(page.getByRole("button", { name: "Create behavior" })).toBeEnabled();
            await page.screenshot({ path: testInfo.outputPath("khr-existing-glb-touch.png"), fullPage: true });
            const downloadPromise = page.waitForEvent("download");
            await page.getByRole("button", { name: "Create behavior" }).tap();
            expect((await downloadPromise).suggestedFilename()).toBe("mobile-assembly-behavior.glb");
            await expect.poll(async () => await fge.getGraphNames()).toEqual(["Select to reveal"]);
            await page.getByRole("button", { name: "Add reaction" }).tap();
            const reactionDialog = page.getByRole("dialog", { name: "Add a reaction to an existing event" });
            await expect(reactionDialog).toBeInViewport();
            const bounds = await reactionDialog.boundingBox();
            expect(bounds).not.toBeNull();
            expect(bounds!.x).toBeGreaterThanOrEqual(0);
            expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
            await page.getByRole("combobox", { name: "Event" }).tap();
            await page.getByRole("option", { name: /onSelect.*glTF node 1/ }).tap();
            await page.getByRole("combobox", { name: "Target mesh" }).tap();
            await page.getByRole("option", { name: /glTF node 1/ }).tap();
            await page.getByRole("combobox", { name: "Action" }).tap();
            await page.getByRole("option", { name: "Hide target" }).tap();
            await page.screenshot({ path: testInfo.outputPath("khr-add-reaction-touch.png"), fullPage: true });
            const reactionDownload = page.waitForEvent("download", { timeout: 30_000 });
            await reactionDialog.getByRole("button", { name: "Add reaction" }).tap();
            expect((await reactionDownload).suggestedFilename()).toBe("mobile-assembly-behavior-reaction.glb");
        } finally {
            await context.close();
        }
    });

    test("authors a select-to-reveal KHR_interactivity graph from an empty scene", async ({ page }, testInfo) => {
        test.setTimeout(90_000);
        const fge = new FlowGraphEditorPage(page);
        await fge.goto({ local: true });
        await fge.assertEditorReady();

        await page.getByRole("button", { name: "New behavior" }).click();
        const triggerSelect = page.getByRole("combobox", { name: "Trigger mesh" });
        const revealSelect = page.getByRole("combobox", { name: "Mesh to reveal" });
        await expect(triggerSelect).toBeVisible();
        await triggerSelect.click();
        await page.getByRole("option", { name: /^box \(#/ }).click();
        await revealSelect.click();
        await page.getByRole("option", { name: /^sphere \(#/ }).click();
        await page.screenshot({ path: testInfo.outputPath("khr-selection-authoring.png"), fullPage: true });
        await page.getByRole("button", { name: "Create behavior" }).click();

        await expect(page.getByRole("log", { name: "Flow graph log" })).toContainText('Imported 1 KHR_interactivity graph(s) from "selectionReveal.glb"');
        await expect.poll(async () => await fge.getGraphNames()).toEqual(["Select to reveal"]);
        await expect(page.getByText("Select part", { exact: true })).toBeInViewport();
        await expect(page.getByText("Reveal part", { exact: true })).toBeInViewport();
        await page.screenshot({ path: testInfo.outputPath("khr-selection-created-graph.png"), fullPage: true });
        await expect
            .poll(
                async () =>
                    await page.evaluate(() => {
                        const state = (globalThis as any).BABYLON.FlowGraphEditor._CurrentState;
                        const source = state.khrInteractivityImportResult;
                        const revealNode = source.glTF.nodes.find((node: any) => node.name === "sphere");
                        return {
                            ready: !!source && !!revealNode,
                            selected: source?.document.graphs[0].source.nodes[0].configuration.nodeIndex.value[0],
                            revealVisible: revealNode?._primitiveBabylonMeshes?.some((mesh: any) => mesh.isVisible),
                        };
                    })
            )
            .toMatchObject({ ready: true, revealVisible: false });

        await SimulateKhrNodeSelection(page, "box");
        expect(await GetKhrNodeVisibility(page, "sphere")).toBe(false);
        await ClickGraphControl(page, "Start");
        await WaitForGraphState(page, "Running");
        await SimulateKhrNodeSelection(page, "cylinder");
        expect(await GetKhrNodeVisibility(page, "sphere")).toBe(false);
        await SimulateKhrNodeSelection(page, "box");
        await expect.poll(async () => await GetKhrNodeVisibility(page, "sphere")).toBe(true);

        await ClickGraphControl(page, "Reset");
        await WaitForGraphState(page, "Stopped");
        await expect.poll(async () => await GetKhrNodeVisibility(page, "sphere")).toBe(false);
        await ClickGraphControl(page, "Start");
        await WaitForGraphState(page, "Running");
        await SimulateKhrNodeSelection(page, "box", 1);
        await expect.poll(async () => await GetKhrNodeVisibility(page, "sphere")).toBe(true);

        const downloadPromise = page.waitForEvent("download", (download) => download.suggestedFilename().endsWith(".glb"));
        await page.getByRole("button", { name: "Export KHR GLB", exact: true }).click();
        const download = await downloadPromise;
        const path = await download.path();
        expect(path).not.toBeNull();
        expect(await StrictImportKhrInteractivityAsync(page, "authoredSelection.glb", readFileSync(path!))).toEqual({ graphCount: 1, errorCount: 0 });
    });

    test("keeps selection authoring usable on a narrow viewport", async ({ page }, testInfo) => {
        await page.setViewportSize({ width: 390, height: 844 });
        const fge = new FlowGraphEditorPage(page);
        await fge.goto({ local: true });
        await fge.assertEditorReady();

        await page.getByRole("button", { name: "New behavior" }).click();
        const dialog = page.getByRole("dialog", { name: "New glTF selection behavior" });
        await expect(dialog).toBeVisible();
        const bounds = await dialog.boundingBox();
        expect(bounds).not.toBeNull();
        expect(bounds!.x).toBeGreaterThanOrEqual(0);
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);

        const triggerSelect = page.getByRole("combobox", { name: "Trigger mesh" });
        const revealSelect = page.getByRole("combobox", { name: "Mesh to reveal" });
        await triggerSelect.click();
        await page.getByRole("option", { name: /^box \(#/ }).click();
        await revealSelect.click();
        await page.getByRole("option", { name: /^box \(#/ }).click();
        await expect(page.getByRole("button", { name: "Create behavior" })).toBeDisabled();
        await revealSelect.click();
        await page.getByRole("option", { name: /^sphere \(#/ }).click();
        await expect(page.getByRole("button", { name: "Create behavior" })).toBeEnabled();
        await page.screenshot({ path: testInfo.outputPath("khr-selection-authoring-narrow.png"), fullPage: true });
        await page.getByRole("button", { name: "Create behavior" }).click();
        await expect.poll(async () => await fge.getGraphNames()).toEqual(["Select to reveal"]);
    });

    test("authors the selection behavior with touch input on a mobile viewport", async ({ browser }, testInfo) => {
        test.setTimeout(90_000);
        const context = await browser.newContext({ ...devices["Pixel 7"], isMobile: browser.browserType().name() !== "firefox" });
        try {
            const page = await context.newPage();
            const fge = new FlowGraphEditorPage(page);
            await fge.goto({ local: true });
            await fge.assertEditorReady();

            await page.getByRole("button", { name: "New behavior" }).tap();
            const dialog = page.getByRole("dialog", { name: "New glTF selection behavior" });
            await expect(dialog).toBeInViewport();
            await page.getByRole("combobox", { name: "Trigger mesh" }).tap();
            await page.getByRole("option", { name: /^box \(#/ }).tap();
            await page.getByRole("combobox", { name: "Mesh to reveal" }).tap();
            await page.getByRole("option", { name: /^sphere \(#/ }).tap();
            await page.screenshot({ path: testInfo.outputPath("khr-selection-authoring-touch.png"), fullPage: true });
            await page.getByRole("button", { name: "Create behavior" }).tap();
            await expect.poll(async () => await fge.getGraphNames()).toEqual(["Select to reveal"]);
        } finally {
            await context.close();
        }
    });

    test("binds a multi-primitive trigger beside a duplicate-named mesh by exported node identity", async ({ page }) => {
        test.setTimeout(90_000);
        const fge = new FlowGraphEditorPage(page);
        await fge.goto({ local: true });
        await fge.assertEditorReady();

        const ids = await page.evaluate(() => {
            const scene = (globalThis as any).BABYLON.FlowGraphEditor._CurrentState.sceneContext.scene;
            const trigger = scene.getMeshByName("box");
            const reveal = scene.getMeshByName("sphere");
            const parent = scene.getMeshByName("cylinder");
            trigger.name = "part";
            reveal.name = "part";
            reveal.parent = parent;
            const indexCount = trigger.getTotalIndices();
            const firstIndexCount = Math.floor(indexCount / 6) * 3;
            trigger.subMeshes = [];
            new (globalThis as any).BABYLON.SubMesh(0, 0, trigger.getTotalVertices(), 0, firstIndexCount, trigger);
            new (globalThis as any).BABYLON.SubMesh(0, 0, trigger.getTotalVertices(), firstIndexCount, indexCount - firstIndexCount, trigger);
            return { trigger: trigger.uniqueId, reveal: reveal.uniqueId };
        });

        await page.getByRole("button", { name: "New behavior" }).click();
        await page.getByRole("combobox", { name: "Trigger mesh" }).click();
        await page.getByRole("option", { name: `part (#${ids.trigger})`, exact: true }).click();
        await page.getByRole("combobox", { name: "Mesh to reveal" }).click();
        await page.getByRole("option", { name: `part (#${ids.reveal})`, exact: true }).click();
        await page.getByRole("button", { name: "Create behavior" }).click();
        await expect.poll(async () => await fge.getGraphNames()).toEqual(["Select to reveal"]);

        const exportedIdentity = await page.evaluate(() => {
            const source = (globalThis as any).BABYLON.FlowGraphEditor._CurrentState.khrInteractivityImportResult;
            const graph = source.document.graphs[0].source;
            const triggerIndex = graph.nodes[0].configuration.nodeIndex.value[0];
            const revealIndex = Number(graph.nodes[1].configuration.pointer.value[0].split("/")[2]);
            const parentIndex = source.glTF.nodes.findIndex((node: any) => node.name === "cylinder");
            return {
                triggerIndex,
                revealIndex,
                triggerName: source.glTF.nodes[triggerIndex].name,
                revealName: source.glTF.nodes[revealIndex].name,
                nested: source.glTF.nodes[parentIndex].children?.includes(revealIndex) ?? false,
                revealVisible: source.glTF.nodes[revealIndex]._primitiveBabylonMeshes?.some((mesh: any) => mesh.isVisible),
                triggerPrimitiveCount: source.glTF.meshes[source.glTF.nodes[triggerIndex].mesh].primitives.length,
                triggerRuntimeClass: source.glTF.nodes[triggerIndex]._babylonTransformNode?.getClassName(),
            };
        });
        expect(exportedIdentity.triggerIndex).not.toBe(exportedIdentity.revealIndex);
        expect(exportedIdentity).toMatchObject({
            triggerName: "part",
            revealName: "part",
            nested: true,
            revealVisible: false,
            triggerPrimitiveCount: 2,
            triggerRuntimeClass: "TransformNode",
        });

        await ClickGraphControl(page, "Start");
        await WaitForGraphState(page, "Running");
        await page.evaluate((revealIndex) => {
            const Babylon = (globalThis as any).BABYLON;
            const state = Babylon.FlowGraphEditor._CurrentState;
            const mesh = state.khrInteractivityImportResult.glTF.nodes[revealIndex]._primitiveBabylonMeshes[0];
            const pick = new Babylon.PickingInfo();
            pick.hit = true;
            pick.pickedMesh = mesh;
            pick.pickedPoint = mesh.getAbsolutePosition();
            state.sceneContext.scene.simulatePointerDown(pick, { pointerId: 0 });
            state.sceneContext.scene.simulatePointerUp(pick, { pointerId: 0 });
        }, exportedIdentity.revealIndex);
        expect(
            await page.evaluate((revealIndex) => {
                const node = (globalThis as any).BABYLON.FlowGraphEditor._CurrentState.khrInteractivityImportResult.glTF.nodes[revealIndex];
                return node._primitiveBabylonMeshes.some((mesh: any) => mesh.isVisible);
            }, exportedIdentity.revealIndex)
        ).toBe(false);
        await page.evaluate((triggerIndex) => {
            const Babylon = (globalThis as any).BABYLON;
            const state = Babylon.FlowGraphEditor._CurrentState;
            const node = state.khrInteractivityImportResult.glTF.nodes[triggerIndex];
            const mesh = node._primitiveBabylonMeshes?.[0] ?? node._babylonTransformNode;
            const pick = new Babylon.PickingInfo();
            pick.hit = true;
            pick.pickedMesh = mesh;
            pick.pickedPoint = mesh.getAbsolutePosition();
            state.sceneContext.scene.simulatePointerDown(pick, { pointerId: 0 });
            state.sceneContext.scene.simulatePointerUp(pick, { pointerId: 0 });
        }, exportedIdentity.triggerIndex);
        await expect
            .poll(
                async () =>
                    await page.evaluate((revealIndex) => {
                        const node = (globalThis as any).BABYLON.FlowGraphEditor._CurrentState.khrInteractivityImportResult.glTF.nodes[revealIndex];
                        return node._primitiveBabylonMeshes?.some((mesh: any) => mesh.isVisible);
                    }, exportedIdentity.revealIndex)
            )
            .toBe(true);
    });

    test("exports and re-imports ratified KHR_interactivity glTF and GLB with actionable diagnostics", async ({ page }) => {
        test.setTimeout(90_000);
        const fge = new FlowGraphEditorPage(page);
        await fge.goto({ local: true });
        await fge.assertEditorReady();

        const source = {
            asset: { version: "2.0", generator: "FGE KHR export E2E" },
            scene: 0,
            scenes: [{ nodes: [0] }],
            nodes: [{ name: "interactiveNode" }],
            extensionsUsed: ["KHR_interactivity"],
            extensionsRequired: ["KHR_interactivity"],
            extensions: {
                KHR_interactivity: {
                    graphs: [
                        {
                            name: "Interaction",
                            types: [{ signature: "float" }, { signature: "float2" }],
                            variables: [{ type: 0, value: [1] }],
                            declarations: [{ op: "event/onStart" }, { op: "variable/interpolate" }],
                            nodes: [
                                { declaration: 0, flows: { out: { node: 1 } } },
                                {
                                    declaration: 1,
                                    configuration: { variable: { value: [0] }, useSlerp: { value: [false] } },
                                    values: {
                                        value: { type: 0, value: [5] },
                                        duration: { type: 0, value: [1] },
                                        p1: { type: 1, value: [0, 0] },
                                        p2: { type: 1, value: [1, 1] },
                                    },
                                },
                            ],
                        },
                    ],
                },
            },
        };
        await page.evaluate((gltf) => {
            const file = new File([JSON.stringify(gltf)], "interaction.gltf", { type: "model/gltf+json" });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            (document.querySelector("canvas") ?? document.body).dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer }));
        }, source);
        await expect.poll(async () => await fge.getNodeCount()).toBe(6);
        await expect
            .poll(
                async () =>
                    await page.evaluate(() => {
                        const state = (globalThis as any).BABYLON?.FlowGraphEditor?._CurrentState;
                        const playAnimation = state?.flowGraph
                            ?.getAllBlocks()
                            .find((block: any) => block.metadata?.khrInteractivity?.operation === "variable/interpolate" && block.metadata?.khrInteractivity?.role === 2);
                        return playAnimation?.metadata?.khrInteractivity?.generatedInputDefaults?.speed?.runtimeValueFingerprint;
                    })
            )
            .toBeDefined();
        const importedScene = await GetSceneContextSnapshot(page);
        const snippetInput = page.getByPlaceholder("Playground ID or URL...");
        await snippetInput.fill("ABC123");
        await snippetInput.press("Enter");
        await expect(page.getByRole("log", { name: "Flow graph log" })).toContainText("Replace the KHR_interactivity file instead of changing its preview scene");
        expect((await GetSceneContextSnapshot(page))?.sceneUid).toBe(importedScene?.sceneUid);

        const gltfDownloadPromise = page.waitForEvent("download", (download) => download.suggestedFilename().endsWith(".gltf"));
        await page.getByRole("button", { name: "Export KHR glTF", exact: true }).click();
        const gltfDownload = await gltfDownloadPromise;
        const gltfPath = await gltfDownload.path();
        expect(gltfPath).not.toBeNull();
        const exportedGltf = readFileSync(gltfPath!, "utf8");
        const exportedJson = JSON.parse(exportedGltf);
        expect(exportedJson.extensions.KHR_interactivity.graphs[0]).toEqual(source.extensions.KHR_interactivity.graphs[0]);
        expect(exportedJson.extensionsUsed).toContain("KHR_interactivity");
        expect(exportedJson.extensionsRequired).toContain("KHR_interactivity");
        expect(await StrictImportKhrInteractivityAsync(page, "strictRoundTrip.gltf", Buffer.from(exportedGltf))).toEqual({ graphCount: 1, errorCount: 0 });

        await page.evaluate((content) => {
            const file = new File([content], "roundTrip.gltf", { type: "model/gltf+json" });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            (document.querySelector("canvas") ?? document.body).dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer }));
        }, exportedGltf);
        await expect(page.getByRole("log", { name: "Flow graph log" })).toContainText('Imported 1 KHR_interactivity graph(s) from "roundTrip.gltf"');
        await expect.poll(async () => await fge.getNodeCount()).toBe(6);
        await expect(page.getByRole("button", { name: "Export KHR GLB", exact: true })).toBeDisabled();

        const sourceGlb = BuildJsonOnlyGlbFixture(source);
        await page.evaluate((bytes) => {
            const file = new File([new Uint8Array(bytes)], "interaction.glb", { type: "model/gltf-binary" });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            (document.querySelector("canvas") ?? document.body).dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer }));
        }, Array.from(sourceGlb));
        await expect(page.getByRole("log", { name: "Flow graph log" })).toContainText('Imported 1 KHR_interactivity graph(s) from "interaction.glb"');
        await expect.poll(async () => await fge.getNodeCount()).toBe(6);
        await expect(page.getByRole("button", { name: "Export KHR GLB", exact: true })).toBeEnabled();

        const glbDownloadPromise = page.waitForEvent("download", (download) => download.suggestedFilename().endsWith(".glb"));
        await page.getByRole("button", { name: "Export KHR GLB", exact: true }).click();
        const glbDownload = await glbDownloadPromise;
        const glbPath = await glbDownload.path();
        expect(glbPath).not.toBeNull();
        const exportedGlb = readFileSync(glbPath!);
        expect(exportedGlb.subarray(0, 4).toString("utf8")).toBe("glTF");
        expect(await StrictImportKhrInteractivityAsync(page, "strictRoundTrip.glb", exportedGlb)).toEqual({ graphCount: 1, errorCount: 0 });

        await page.evaluate((bytes) => {
            const file = new File([new Uint8Array(bytes)], "roundTrip.glb", { type: "model/gltf-binary" });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            (document.querySelector("canvas") ?? document.body).dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer }));
        }, Array.from(exportedGlb));
        await expect(page.getByRole("log", { name: "Flow graph log" })).toContainText('Imported 1 KHR_interactivity graph(s) from "roundTrip.glb"');
        await expect.poll(async () => await fge.getNodeCount()).toBe(6);

        const beforeUndock = await page.evaluate(() => {
            const state = (globalThis as any).BABYLON.FlowGraphEditor._CurrentState;
            const canvas = state.sceneContext.scene.getEngine().getRenderingCanvas();
            return { sceneUid: state.sceneContext.scene.uid, connected: canvas.isConnected, inMainDocument: canvas.ownerDocument === document };
        });
        expect(beforeUndock).toMatchObject({ connected: true, inMainDocument: true });

        const popup = await UndockRightSidePaneAsync(page);
        await expect(popup.getByText("Scene Preview", { exact: true }).first()).toBeVisible();
        await expect
            .poll(
                async () =>
                    await page.evaluate(() => {
                        const state = (globalThis as any).BABYLON.FlowGraphEditor._CurrentState;
                        const canvas = state.sceneContext.scene.getEngine().getRenderingCanvas();
                        return { connected: canvas.isConnected, inMainDocument: canvas.ownerDocument === document };
                    })
            )
            .toEqual({ connected: true, inMainDocument: false });
        const beforeResize = await page.evaluate(() => {
            const state = (globalThis as any).BABYLON.FlowGraphEditor._CurrentState;
            const canvas = state.sceneContext.scene.getEngine().getRenderingCanvas();
            return { width: canvas.clientWidth, height: canvas.clientHeight };
        });
        await popup.setViewportSize({ width: 820, height: 620 });
        await expect
            .poll(
                async () =>
                    await page.evaluate(
                        ({ previousWidth, previousHeight }) => {
                            const state = (globalThis as any).BABYLON.FlowGraphEditor._CurrentState;
                            const engine = state.sceneContext.scene.getEngine();
                            const canvas = engine.getRenderingCanvas();
                            return (
                                (canvas.clientWidth !== previousWidth || canvas.clientHeight !== previousHeight) &&
                                Math.abs(engine.getRenderWidth() - canvas.clientWidth) <= 1 &&
                                Math.abs(engine.getRenderHeight() - canvas.clientHeight) <= 1
                            );
                        },
                        { previousWidth: beforeResize.width, previousHeight: beforeResize.height }
                    )
            )
            .toBe(true);
        const beforeRedockFrameId = await page.evaluate(() => {
            const state = (globalThis as any).BABYLON.FlowGraphEditor._CurrentState;
            return state.sceneContext.scene.getEngine().frameId;
        });
        await popup.close();
        await expect
            .poll(
                async () =>
                    await page.evaluate(() => {
                        const state = (globalThis as any).BABYLON.FlowGraphEditor._CurrentState;
                        return state.sceneContext.scene.getEngine().frameId;
                    })
            )
            .toBeGreaterThan(beforeRedockFrameId);
        const renderChainSample = await page.evaluate(async () => {
            const state = (globalThis as any).BABYLON.FlowGraphEditor._CurrentState;
            const engine = state.sceneContext.scene.getEngine();
            const startEngineFrame = engine.frameId;
            const browserFrameCount = 12;
            await new Promise<void>((resolve) => {
                let currentFrame = 0;
                const sampleFrame = () => {
                    currentFrame++;
                    if (currentFrame === browserFrameCount) {
                        resolve();
                    } else {
                        requestAnimationFrame(sampleFrame);
                    }
                };
                requestAnimationFrame(sampleFrame);
            });
            return { browserFrameCount, engineFrameCount: engine.frameId - startEngineFrame };
        });
        expect(renderChainSample.engineFrameCount).toBeGreaterThan(0);
        expect(renderChainSample.engineFrameCount).toBeLessThanOrEqual(renderChainSample.browserFrameCount + 2);
        await expect
            .poll(
                async () =>
                    await page.evaluate(() => {
                        const state = (globalThis as any).BABYLON.FlowGraphEditor._CurrentState;
                        const canvas = state.sceneContext.scene.getEngine().getRenderingCanvas();
                        return { sceneUid: state.sceneContext.scene.uid, connected: canvas.isConnected, inMainDocument: canvas.ownerDocument === document };
                    })
            )
            .toEqual({ sceneUid: beforeUndock.sceneUid, connected: true, inMainDocument: true });

        await fge.addBlockFromPalette("Constant");
        await page.evaluate(() => {
            (globalThis as any).BABYLON?.FlowGraphEditor?._CurrentState?.stateManager.onSelectionChangedObservable.notifyObservers(null);
        });
        await page.getByRole("button", { name: "Export KHR GLB", exact: true }).click();
        await expect(page.getByRole("log", { name: "Flow graph log" })).toContainText("KHR_interactivity export error");
        await expect(page.getByRole("log", { name: "Flow graph log" })).toContainText("has no KHR_interactivity inverse mapping");
    });
});

test.describe("Flow Graph Editor — Graph Construction", () => {
    test("starting the graph does not stop existing scene animation groups", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await page.evaluate(() => {
            const editor = (globalThis as any).BABYLON?.FlowGraphEditor;
            const args = (globalThis as any).__viteFlowGraphEditorArgs;
            const sceneCandidates = [editor?._CurrentState?.sceneContext?.scene, args?.[0]?.flowGraph?.scene, (globalThis as any).BABYLON?.EngineStore?.LastCreatedScene].filter(
                Boolean
            );
            const scenes = Array.from(new Set(sceneCandidates));
            if (scenes.length === 0) {
                throw new Error("Flow Graph Editor scene not found");
            }
            (globalThis as any).__fgeAnimationStopCalled = false;
            for (const scene of scenes) {
                scene.animationGroups.push({
                    name: "alreadyPlaying",
                    uniqueId: 999999,
                    isPlaying: true,
                    targetedAnimations: [],
                    stop: () => {
                        (globalThis as any).__fgeAnimationStopCalled = true;
                    },
                    dispose: () => {},
                });
            }
        });

        await ClickGraphControl(page, "Start");

        await WaitForGraphState(page, "Running");
        expect(await page.evaluate(() => (globalThis as any).__fgeAnimationStopCalled)).toBe(false);
    });

    test("string variables can be edited from the variables panel", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await page.getByRole("button", { name: /Add (a new )?variable/i }).click();
        const nameInput = page.locator("input:focus");
        await expect(nameInput).toBeVisible();
        await nameInput.fill("stringVariable");
        await page.keyboard.press("Enter");

        const variableCard = page.locator("[class*='fui-Card']").filter({ hasText: "stringVariable" }).first();
        await expect(variableCard).toBeVisible();

        await variableCard.getByRole("combobox").click();
        await page.getByRole("option", { name: "String", exact: true }).click();

        const valueInput = variableCard.locator("input").last();
        await expect(valueInput).toBeVisible();
        await valueInput.fill("hello from the editor");

        await expect
            .poll(async () => await GetVariableSnapshot(page, "stringVariable"))
            .toMatchObject({
                value: "hello from the editor",
                type: "string",
            });
    });

    test("variables, types, and scene object values persist across start stop and reset", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();
        await expect.poll(async () => (await GetDefaultSceneBoxInfo(page)).source).toBe("default");

        await page.evaluate(() => {
            const state = (globalThis as any).BABYLON?.FlowGraphEditor?._CurrentState;
            const graph = state?.flowGraph;
            const context = graph?.getContext(0) ?? graph?.createContext();
            const box = state?.sceneContext?.scene.getMeshByName("box");
            if (!state || !context || !box) {
                throw new Error("FlowGraphEditor state, context, or default box not found");
            }

            context.setVariable("message", "persist me");
            context.setVariableType("message", "string");
            context.setVariable("count", 42);
            context.setVariableType("count", "number");
            context.setVariable("meshChoice", box);
            context.setVariableType("meshChoice", "Mesh");
            state.onBuiltObservable.notifyObservers();
        });

        await ClickGraphControl(page, "Start");
        await WaitForGraphState(page, "Running");
        await expect.poll(async () => await GetVariableSnapshot(page, "message")).toMatchObject({ value: "persist me", type: "string" });
        await expect.poll(async () => await GetVariableSnapshot(page, "count")).toMatchObject({ value: 42, type: "number" });
        await expect
            .poll(async () => await GetVariableSnapshot(page, "meshChoice"))
            .toMatchObject({
                type: "Mesh",
                sceneObjectName: "box",
                sceneObjectInContextScene: true,
            });

        await ClickGraphControl(page, "Stop");
        await WaitForGraphState(page, "Stopped");
        await expect.poll(async () => await GetVariableSnapshot(page, "message")).toMatchObject({ value: "persist me", type: "string" });
        await expect
            .poll(async () => await GetVariableSnapshot(page, "meshChoice"))
            .toMatchObject({
                type: "Mesh",
                sceneObjectName: "box",
                sceneObjectInContextScene: true,
            });

        await ClickGraphControl(page, "Reset");
        await WaitForGraphState(page, "Stopped");
        await expect.poll(async () => await GetVariableSnapshot(page, "message")).toMatchObject({ value: "persist me", type: "string" });
        await expect.poll(async () => await GetVariableSnapshot(page, "count")).toMatchObject({ value: 42, type: "number" });
        await expect
            .poll(async () => await GetVariableSnapshot(page, "meshChoice"))
            .toMatchObject({
                type: "Mesh",
                sceneObjectName: "box",
                sceneObjectInContextScene: true,
            });
    });

    test("KeyDown events fire for any key, direct code filters, and variable code filters", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("KeyDownEvent");
        await fge.addBlockFromPalette("SetVariable");
        await fge.addBlockFromPalette("KeyDownEvent");
        await fge.addBlockFromPalette("SetVariable");
        await fge.addBlockFromPalette("KeyDownEvent");
        await fge.addBlockFromPalette("GetVariable");
        await fge.addBlockFromPalette("SetVariable");

        await page.evaluate(() => {
            const state = (globalThis as any).BABYLON?.FlowGraphEditor?._CurrentState;
            const graph = state?.flowGraph;
            const context = graph?.getContext(0) ?? graph?.createContext();
            if (!context) {
                throw new Error("FlowGraph context not found");
            }

            const keyBlocks = graph.getAllBlocks().filter((block: any) => block.getClassName() === "FlowGraphKeyDownEventBlock");
            const setVariableBlocks = graph.getAllBlocks().filter((block: any) => block.getClassName() === "FlowGraphSetVariableBlock");
            const getVariableBlock = graph.getAllBlocks().find((block: any) => block.getClassName() === "FlowGraphGetVariableBlock");
            if (keyBlocks.length !== 3 || setVariableBlocks.length !== 3 || !getVariableBlock) {
                throw new Error("Expected keyboard variable test blocks were not created");
            }

            context.setVariable("anyKeyCode", "none");
            context.setVariableType("anyKeyCode", "string");
            context.setVariable("directKeyCode", "none");
            context.setVariableType("directKeyCode", "string");
            context.setVariable("variableKeyCode", "none");
            context.setVariableType("variableKeyCode", "string");
            context.setVariable("keyFilter", "KeyA");
            context.setVariableType("keyFilter", "string");

            const variableNames = ["anyKeyCode", "directKeyCode", "variableKeyCode"];
            for (let blockIndex = 0; blockIndex < setVariableBlocks.length; blockIndex++) {
                const setVariableBlock = setVariableBlocks[blockIndex];
                setVariableBlock.config.variable = variableNames[blockIndex];
                keyBlocks[blockIndex].getSignalOutput("out").connectTo(setVariableBlock.getSignalInput("in"));
                keyBlocks[blockIndex].getDataOutput("keyCode").connectTo(setVariableBlock.getDataInput("value"));
            }

            keyBlocks[1].getDataInput("key").setValue("KeyA", context);
            getVariableBlock.config.variable = "keyFilter";
            getVariableBlock.getDataOutput("value").connectTo(keyBlocks[2].getDataInput("key"));
            state.onBuiltObservable.notifyObservers();
        });

        await ClickGraphControl(page, "Start");
        await WaitForGraphState(page, "Running");
        await expect.poll(async () => await page.evaluate(() => document.activeElement?.tagName)).toBe("CANVAS");

        await page.keyboard.press("b");
        await expect.poll(async () => await GetVariableSnapshot(page, "anyKeyCode")).toMatchObject({ value: "KeyB" });
        await expect.poll(async () => await GetVariableSnapshot(page, "directKeyCode")).toMatchObject({ value: "none" });
        await expect.poll(async () => await GetVariableSnapshot(page, "variableKeyCode")).toMatchObject({ value: "none" });

        await page.keyboard.press("a");
        await expect.poll(async () => await GetVariableSnapshot(page, "anyKeyCode")).toMatchObject({ value: "KeyA" });
        await expect.poll(async () => await GetVariableSnapshot(page, "directKeyCode")).toMatchObject({ value: "KeyA" });
        await expect.poll(async () => await GetVariableSnapshot(page, "variableKeyCode")).toMatchObject({ value: "KeyA" });
    });

    test("reset recreates the default scene after graph execution mutates it", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        const originalScene = await GetDefaultSceneBoxInfo(page);
        expect(originalScene.source).toBe("default");
        expect(originalScene.boxX).toBe(-1.5);

        await fge.addBlockFromPalette("SceneReadyEvent");
        await fge.addBlockFromPalette("SetProperty");

        await page.evaluate(() => {
            const state = (globalThis as any).BABYLON?.FlowGraphEditor?._CurrentState;
            const graph = state?.flowGraph;
            const context = graph?.getContext(0) ?? graph?.createContext();
            const box = state?.sceneContext?.scene.getMeshByName("box");
            const sceneReadyBlock = graph?.getAllBlocks().find((block: any) => block.getClassName() === "FlowGraphSceneReadyEventBlock");
            const setPropertyBlock = graph?.getAllBlocks().find((block: any) => block.getClassName() === "FlowGraphSetPropertyBlock");
            if (!context || !box || !sceneReadyBlock || !setPropertyBlock) {
                throw new Error("Default scene reset test could not prepare graph");
            }

            sceneReadyBlock.getSignalOutput("out").connectTo(setPropertyBlock.getSignalInput("in"));
            setPropertyBlock.getDataInput("object").setValue(box, context);
            setPropertyBlock.getDataInput("propertyName").setValue("position.x", context);
            setPropertyBlock.getDataInput("value").setValue(4, context);
            state.onBuiltObservable.notifyObservers();
        });

        await ClickGraphControl(page, "Start");
        await WaitForGraphState(page, "Running");
        await expect.poll(async () => (await GetDefaultSceneBoxInfo(page)).boxX).toBe(4);

        await ClickGraphControl(page, "Reset");
        await WaitForGraphState(page, "Stopped");
        await expect.poll(async () => (await GetDefaultSceneBoxInfo(page)).sceneUid).not.toBe(originalScene.sceneUid);
        await expect.poll(async () => await GetDefaultSceneBoxInfo(page)).toMatchObject({ source: "default", boxX: -1.5 });
    });

    test("build a SceneReady → ConsoleLog graph", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("SceneReadyEvent");
        await fge.addBlockFromPalette("ConsoleLog");

        expect(await fge.getNodeCount()).toBe(2);

        await fge.connectPorts("FlowGraphSceneReadyEventBlock", "out", "FlowGraphConsoleLogBlock", "in");

        const linkCount = await fge.getLinkCount();
        expect(linkCount).toBeGreaterThanOrEqual(1);
    });

    test("serialized graph contains expected blocks after connecting nodes", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        const pageErrors: string[] = [];
        page.on("pageerror", (err) => pageErrors.push(err.message));

        await fge.addBlockFromPalette("SceneReadyEvent");
        await fge.addBlockFromPalette("ConsoleLog");
        await fge.connectPorts("FlowGraphSceneReadyEventBlock", "out", "FlowGraphConsoleLogBlock", "in");

        const topology = await fge.getGraphTopology();
        const blockNames = topology.blocks.map((block) => block.className);

        expect(pageErrors).toHaveLength(0);
        expect(topology.totalConnections).toBe(1);
        expect(blockNames).toContain("FlowGraphSceneReadyEventBlock");
        expect(blockNames).toContain("FlowGraphConsoleLogBlock");
    });

    test("save and load JSON preserves visual connections", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("SceneReadyEvent");
        await fge.addBlockFromPalette("ConsoleLog");
        await fge.addBlockFromPalette("GetVariable");

        await fge.connectPorts("FlowGraphSceneReadyEventBlock", "out", "FlowGraphConsoleLogBlock", "in");
        await fge.connectPorts("FlowGraphGetVariableBlock", "value", "FlowGraphConsoleLogBlock", "message");

        await expect.poll(async () => await fge.getLinkCount()).toBeGreaterThanOrEqual(2);
        expect((await fge.getGraphTopology()).totalConnections).toBe(2);

        const downloadPromise = page.waitForEvent("download");
        await page.getByRole("button", { name: "Save", exact: true }).click();
        const download = await downloadPromise;
        const downloadPath = await download.path();
        if (!downloadPath) {
            throw new Error("Saved flow graph download did not produce a local file path");
        }
        const savedJson = JSON.parse(readFileSync(downloadPath, "utf8"));
        const savedGraph = savedJson._flowGraphs?.[savedJson.activeGraphIndex ?? 0] ?? savedJson;
        expect(CountSerializedConnections(savedGraph)).toBe(2);

        await page.locator("input[type='file'][accept='.json']").setInputFiles(downloadPath);

        await expect.poll(async () => await fge.getNodeCount()).toBe(3);
        await expect.poll(async () => await fge.getLinkCount()).toBeGreaterThanOrEqual(2);
    });

    test("adding and removing a graph preserves existing graph connections and layout", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("SceneReadyEvent");
        await fge.addBlockFromPalette("Branch");
        await fge.addBlockFromPalette("ConsoleLog");

        await fge.connectPorts("FlowGraphSceneReadyEventBlock", "out", "FlowGraphBranchBlock", "in");
        await fge.connectPorts("FlowGraphBranchBlock", "onTrue", "FlowGraphConsoleLogBlock", "in");

        await fge.dragNode("FlowGraphBranchBlock", 0, 180);
        const branchPositionBefore = await fge.getNodeCanvasPosition("FlowGraphBranchBlock");

        expect((await fge.getGraphTopology()).totalConnections).toBe(2);
        await expect.poll(async () => await fge.getLinkCount()).toBeGreaterThanOrEqual(2);

        const originalGraphName = (await fge.getGraphNames())[0];
        await fge.addGraphTab();
        const newGraphName = (await fge.getGraphNames())[1];
        await expect.poll(async () => await fge.getNodeCount()).toBe(0);

        await fge.selectGraphTab(originalGraphName);

        expect((await fge.getGraphTopology()).totalConnections).toBe(2);
        await expect.poll(async () => await fge.getLinkCount()).toBeGreaterThanOrEqual(2);
        await expect.poll(async () => await fge.getNodeCanvasPosition("FlowGraphBranchBlock")).toEqual(branchPositionBefore);

        await fge.selectGraphTab(newGraphName);
        await fge.closeGraphTab(newGraphName);

        expect((await fge.getGraphTopology()).totalConnections).toBe(2);
        await expect.poll(async () => await fge.getLinkCount()).toBeGreaterThanOrEqual(2);
        await expect.poll(async () => await fge.getNodeCanvasPosition("FlowGraphBranchBlock")).toEqual(branchPositionBefore);
    });

    test("clicking a validation badge logs its block issues", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("ConsoleLog");
        await page.getByRole("button", { name: "Validate graph" }).click();

        const badge = fge.nodeOnCanvas("FlowGraphConsoleLogBlock").locator("[class*='validationBadge']");
        await expect(badge).toBeVisible();
        await expect(badge).toHaveAttribute("role", "button");
        await expect(badge).toHaveAttribute("tabindex", "0");
        await expect(badge).toHaveAttribute("aria-label", "Show validation errors");

        const log = page.getByRole("log", { name: "Flow graph log" });
        const countBlockLogEntries = async () => ((await log.textContent())?.match(/FlowGraphConsoleLogBlock/g) ?? []).length;
        const beforeCount = await countBlockLogEntries();

        await badge.click();

        await expect.poll(countBlockLogEntries).toBeGreaterThan(beforeCount);
        await expect(log).toContainText("FlowGraphConsoleLogBlock");

        const afterClickCount = await countBlockLogEntries();
        await badge.focus();
        await page.keyboard.press("Enter");

        await expect.poll(countBlockLogEntries).toBeGreaterThan(afterClickCount);

        await expect(log).toContainText("[Error]");
        await expect(log).toContainText("[Warn]");
    });

    test("debug mode can pause on a breakpoint and continue execution", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("SceneReadyEvent");
        await fge.addBlockFromPalette("ConsoleLog");
        await fge.connectPorts("FlowGraphSceneReadyEventBlock", "out", "FlowGraphConsoleLogBlock", "in");

        await page.getByRole("button", { name: "Enable Debug Mode" }).click();
        await expect.poll(async () => (await GetDebugSnapshot(page)).isDebugMode).toBe(true);

        await fge.selectNode("FlowGraphConsoleLogBlock");
        await page.keyboard.press("F9");

        const consoleLogBreakpoint = fge.nodeOnCanvas("FlowGraphConsoleLogBlock").locator("[class*='breakpointBadge']");
        await expect(consoleLogBreakpoint).toBeVisible();
        await expect.poll(async () => (await GetDebugSnapshot(page)).breakpointBlockClassNames).toContain("FlowGraphConsoleLogBlock");

        await ClickGraphControl(page, "Start");

        await expect.poll(async () => (await GetDebugSnapshot(page)).pendingBlockClassName).toBe("FlowGraphConsoleLogBlock");
        await expect(page.getByText("Breakpoint", { exact: true })).toBeVisible();
        await expect(consoleLogBreakpoint).toHaveClass(/breakpointPaused/);
        await expect(page.getByRole("button", { name: /Continue/ })).toBeEnabled();
        await expect(page.getByRole("button", { name: /Step/ })).toBeEnabled();
        await expect(page.getByRole("log", { name: "Flow graph log" })).toContainText("Breakpoint hit: FlowGraphConsoleLogBlock");

        await page.getByRole("button", { name: /Continue/ }).click();

        await expect.poll(async () => (await GetDebugSnapshot(page)).pendingBlockClassName).toBe(null);
        await expect(page.getByText("Running", { exact: true })).toBeVisible();
        await expect(consoleLogBreakpoint).toHaveClass(/breakpointActive/);

        const topology = await fge.getGraphTopology();
        expect(topology.totalConnections).toBe(1);
        expect(topology.blocks.map((block) => block.className)).toEqual(expect.arrayContaining(["FlowGraphSceneReadyEventBlock", "FlowGraphConsoleLogBlock"]));
    });

    test("step advances from a breakpoint to the next execution block", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("SceneReadyEvent");
        await fge.addBlockFromPalette("Sequence");
        await fge.addBlockFromPalette("ConsoleLog");
        await fge.connectPorts("FlowGraphSceneReadyEventBlock", "out", "FlowGraphSequenceBlock", "in");
        await fge.connectPorts("FlowGraphSequenceBlock", "out_0", "FlowGraphConsoleLogBlock", "in");

        await page.getByRole("button", { name: "Enable Debug Mode" }).click();
        await fge.selectNode("FlowGraphSequenceBlock");
        await page.keyboard.press("F9");

        const sequenceBreakpoint = fge.nodeOnCanvas("FlowGraphSequenceBlock").locator("[class*='breakpointBadge']");
        await expect(sequenceBreakpoint).toBeVisible();

        await ClickGraphControl(page, "Start");
        await expect.poll(async () => (await GetDebugSnapshot(page)).pendingBlockClassName).toBe("FlowGraphSequenceBlock");
        await expect(sequenceBreakpoint).toHaveClass(/breakpointPaused/);

        await page.getByRole("button", { name: /Step/ }).click();

        await expect.poll(async () => (await GetDebugSnapshot(page)).pendingBlockClassName).toBe("FlowGraphConsoleLogBlock");
        await expect(page.getByRole("log", { name: "Flow graph log" })).toContainText("Breakpoint hit: FlowGraphConsoleLogBlock");
        await expect(fge.nodeOnCanvas("FlowGraphConsoleLogBlock").locator("[class*='breakpointBadge']")).toHaveClass(/breakpointPaused/);
        await expect(sequenceBreakpoint).toHaveClass(/breakpointActive/);

        await page.getByRole("button", { name: /Continue/ }).click();
        await expect.poll(async () => (await GetDebugSnapshot(page)).pendingBlockClassName).toBe(null);
        expect((await fge.getGraphTopology()).totalConnections).toBe(2);
    });

    test("SceneReady → Branch with both true/false paths wired to ConsoleLog", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("SceneReadyEvent");
        await fge.addBlockFromPalette("Branch");
        await fge.addBlockFromPalette("ConsoleLog");
        await fge.addBlockFromPalette("ConsoleLog");

        expect(await fge.getNodeCount()).toBe(4);

        // Wire: SceneReady.out → Branch.in
        await fge.connectPorts("FlowGraphSceneReadyEventBlock", "out", "FlowGraphBranchBlock", "in");
        // Wire: Branch.true → ConsoleLog[0].in
        await fge.connectPorts("FlowGraphBranchBlock", "onTrue", "FlowGraphConsoleLogBlock", "in", { targetIndex: 0 });
        // Wire: Branch.onFalse → ConsoleLog[1].in
        await fge.connectPorts("FlowGraphBranchBlock", "onFalse", "FlowGraphConsoleLogBlock", "in", { targetIndex: 1 });

        // Verify all 3 connections via serialization
        const topology = await fge.getGraphTopology();
        expect(topology.totalConnections).toBe(3);
        expect(topology.blocks).toHaveLength(4);
    });

    test("SceneReady → ForLoop → ConsoleLog with completed path", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("SceneReadyEvent");
        await fge.addBlockFromPalette("ForLoop");
        await fge.addBlockFromPalette("ConsoleLog");
        await fge.addBlockFromPalette("ConsoleLog");

        expect(await fge.getNodeCount()).toBe(4);

        // SceneReady → ForLoop
        await fge.connectPorts("FlowGraphSceneReadyEventBlock", "out", "FlowGraphForLoopBlock", "in");
        // ForLoop.executionFlow → ConsoleLog[0] (loop body)
        await fge.connectPorts("FlowGraphForLoopBlock", "executionFlow", "FlowGraphConsoleLogBlock", "in", { targetIndex: 0 });
        // ForLoop.completed → ConsoleLog[1] (after loop)
        await fge.connectPorts("FlowGraphForLoopBlock", "completed", "FlowGraphConsoleLogBlock", "in", { targetIndex: 1 });

        const topology = await fge.getGraphTopology();
        expect(topology.totalConnections).toBe(3);
    });

    test("SceneReady → WhileLoop → ConsoleLog", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("SceneReadyEvent");
        await fge.addBlockFromPalette("WhileLoop");
        await fge.addBlockFromPalette("ConsoleLog");

        // SceneReady → WhileLoop
        await fge.connectPorts("FlowGraphSceneReadyEventBlock", "out", "FlowGraphWhileLoopBlock", "in");
        // WhileLoop.executionFlow → ConsoleLog (loop body)
        await fge.connectPorts("FlowGraphWhileLoopBlock", "executionFlow", "FlowGraphConsoleLogBlock", "in");

        const topology = await fge.getGraphTopology();
        expect(topology.totalConnections).toBe(2);
    });

    test("SceneReady → FlipFlop → two ConsoleLog blocks (onOn/onOff)", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("SceneReadyEvent");
        await fge.addBlockFromPalette("FlipFlop");
        await fge.addBlockFromPalette("ConsoleLog");
        await fge.addBlockFromPalette("ConsoleLog");

        expect(await fge.getNodeCount()).toBe(4);

        await fge.connectPorts("FlowGraphSceneReadyEventBlock", "out", "FlowGraphFlipFlopBlock", "in");
        await fge.connectPorts("FlowGraphFlipFlopBlock", "onOn", "FlowGraphConsoleLogBlock", "in", { targetIndex: 0 });
        await fge.connectPorts("FlowGraphFlipFlopBlock", "onOff", "FlowGraphConsoleLogBlock", "in", { targetIndex: 1 });

        const topology = await fge.getGraphTopology();
        expect(topology.totalConnections).toBe(3);
    });

    test("SceneReady → DoN → ConsoleLog with data output", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("SceneReadyEvent");
        await fge.addBlockFromPalette("DoN");
        await fge.addBlockFromPalette("ConsoleLog");

        // SceneReady → DoN
        await fge.connectPorts("FlowGraphSceneReadyEventBlock", "out", "FlowGraphDoNBlock", "in");
        // DoN.out → ConsoleLog
        await fge.connectPorts("FlowGraphDoNBlock", "out", "FlowGraphConsoleLogBlock", "in");

        const topology = await fge.getGraphTopology();
        expect(topology.totalConnections).toBe(2);
        expect(topology.blocks.map((b) => b.className)).toContain("FlowGraphDoNBlock");
    });

    test("SceneReady → Sequence(out_0) → ConsoleLog", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("SceneReadyEvent");
        await fge.addBlockFromPalette("Sequence");
        await fge.addBlockFromPalette("ConsoleLog");

        await fge.connectPorts("FlowGraphSceneReadyEventBlock", "out", "FlowGraphSequenceBlock", "in");
        await fge.connectPorts("FlowGraphSequenceBlock", "out_0", "FlowGraphConsoleLogBlock", "in");

        const topology = await fge.getGraphTopology();
        expect(topology.totalConnections).toBe(2);
    });

    test("PointerDown → Throttle → ConsoleLog", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("PointerDownEvent");
        await fge.addBlockFromPalette("Throttle");
        await fge.addBlockFromPalette("ConsoleLog");

        await fge.connectPorts("FlowGraphPointerDownEventBlock", "out", "FlowGraphThrottleBlock", "in");
        await fge.connectPorts("FlowGraphThrottleBlock", "out", "FlowGraphConsoleLogBlock", "in");

        const topology = await fge.getGraphTopology();
        expect(topology.totalConnections).toBe(2);
    });

    test("PointerDown → Debounce → ConsoleLog", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("PointerDownEvent");
        await fge.addBlockFromPalette("Debounce");
        await fge.addBlockFromPalette("ConsoleLog");

        await fge.connectPorts("FlowGraphPointerDownEventBlock", "out", "FlowGraphDebounceBlock", "in");
        await fge.connectPorts("FlowGraphDebounceBlock", "out", "FlowGraphConsoleLogBlock", "in");

        const topology = await fge.getGraphTopology();
        expect(topology.totalConnections).toBe(2);
    });

    test("SceneReady → SetDelay → ConsoleLog chain", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("SceneReadyEvent");
        await fge.addBlockFromPalette("SetDelay");
        await fge.addBlockFromPalette("ConsoleLog");

        await fge.connectPorts("FlowGraphSceneReadyEventBlock", "out", "FlowGraphSetDelayBlock", "in");
        await fge.connectPorts("FlowGraphSetDelayBlock", "out", "FlowGraphConsoleLogBlock", "in");

        const topology = await fge.getGraphTopology();
        expect(topology.totalConnections).toBe(2);
    });

    test("SceneReady → PlayAnimation → StopAnimation on done", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("SceneReadyEvent");
        await fge.addBlockFromPalette("PlayAnimation");
        await fge.addBlockFromPalette("StopAnimation");

        await fge.connectPorts("FlowGraphSceneReadyEventBlock", "out", "FlowGraphPlayAnimationBlock", "in");
        // When animation is done, stop it
        await fge.connectPorts("FlowGraphPlayAnimationBlock", "done", "FlowGraphStopAnimationBlock", "in");

        const topology = await fge.getGraphTopology();
        expect(topology.totalConnections).toBe(2);
    });

    test("SceneReady → SetVariable → GetVariable → SetProperty chain", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("SceneReadyEvent");
        await fge.addBlockFromPalette("SetVariable");
        await fge.addBlockFromPalette("SetProperty");

        // Signal chain: SceneReady → SetVariable → SetProperty
        await fge.connectPorts("FlowGraphSceneReadyEventBlock", "out", "FlowGraphSetVariableBlock", "in");
        await fge.connectPorts("FlowGraphSetVariableBlock", "out", "FlowGraphSetPropertyBlock", "in");

        const topology = await fge.getGraphTopology();
        expect(topology.totalConnections).toBe(2);
    });

    test("MeshPick → Branch → SetProperty / ConsoleLog (data + execution wiring)", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("MeshPickEvent");
        await fge.addBlockFromPalette("Branch");
        await fge.addBlockFromPalette("SetProperty");
        await fge.addBlockFromPalette("ConsoleLog");

        expect(await fge.getNodeCount()).toBe(4);

        // MeshPick → Branch
        await fge.connectPorts("FlowGraphMeshPickEventBlock", "out", "FlowGraphBranchBlock", "in");
        // Branch.true → SetProperty
        await fge.connectPorts("FlowGraphBranchBlock", "onTrue", "FlowGraphSetPropertyBlock", "in");
        // Branch.onFalse → ConsoleLog
        await fge.connectPorts("FlowGraphBranchBlock", "onFalse", "FlowGraphConsoleLogBlock", "in");

        const topology = await fge.getGraphTopology();
        expect(topology.totalConnections).toBe(3);
    });

    test("delete a connection by deleting the target block", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("SceneReadyEvent");
        await fge.addBlockFromPalette("ConsoleLog");

        await fge.connectPorts("FlowGraphSceneReadyEventBlock", "out", "FlowGraphConsoleLogBlock", "in");
        expect(await fge.getLinkCount()).toBe(1);

        // Delete ConsoleLog — should also remove the link
        await fge.selectNode("FlowGraphConsoleLogBlock");
        await fge.deleteSelectedNodes();

        expect(await fge.getNodeCount()).toBe(1);
        expect(await fge.getLinkCount()).toBe(0);
    });
});

test.describe("Flow Graph Editor — Custom Events", () => {
    test("SendCustomEvent and ReceiveCustomEvent can be created and connected", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        const pageErrors: string[] = [];
        page.on("pageerror", (err) => pageErrors.push(err.message));

        await fge.addBlockFromPalette("SendCustomEvent");
        await fge.addBlockFromPalette("ReceiveCustomEvent");

        expect(pageErrors).toHaveLength(0);
        expect(await fge.getNodeCount()).toBe(2);

        const blockNames = await fge.getBlockClassNamesOnCanvas();
        expect(blockNames).toContain("FlowGraphSendCustomEventBlock");
        expect(blockNames).toContain("FlowGraphReceiveCustomEventBlock");
    });

    test("SceneReady → SendCustomEvent and ReceiveCustomEvent → ConsoleLog graph", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        const pageErrors: string[] = [];
        page.on("pageerror", (err) => pageErrors.push(err.message));

        await fge.addBlockFromPalette("SceneReadyEvent");
        await fge.addBlockFromPalette("SendCustomEvent");
        await fge.addBlockFromPalette("ReceiveCustomEvent");
        await fge.addBlockFromPalette("ConsoleLog");

        expect(await fge.getNodeCount()).toBe(4);
        expect(pageErrors).toHaveLength(0);

        // Wire: SceneReady.out → SendCustomEvent.in
        await fge.connectPorts("FlowGraphSceneReadyEventBlock", "out", "FlowGraphSendCustomEventBlock", "in");
        // Wire: ReceiveCustomEvent.out → ConsoleLog.in
        await fge.connectPorts("FlowGraphReceiveCustomEventBlock", "out", "FlowGraphConsoleLogBlock", "in");

        const topology = await fge.getGraphTopology();
        expect(topology.totalConnections).toBe(2);
        expect(topology.blocks).toHaveLength(4);

        // Verify each specific block is in the serialized output
        const classNames = topology.blocks.map((b) => b.className);
        expect(classNames).toContain("FlowGraphSceneReadyEventBlock");
        expect(classNames).toContain("FlowGraphSendCustomEventBlock");
        expect(classNames).toContain("FlowGraphReceiveCustomEventBlock");
        expect(classNames).toContain("FlowGraphConsoleLogBlock");
    });

    test("ReceiveCustomEvent has expected ports", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("ReceiveCustomEvent");

        const node = fge.nodeOnCanvas("FlowGraphReceiveCustomEventBlock");
        // Event blocks should have "out" and "done" (async) output ports
        await expect(node.locator("[class*='port-label']:text-is('out')")).toBeVisible();
        await expect(node.locator("[class*='port-label']:text-is('done')")).toBeVisible();
        await expect(node.locator("[class*='port-label']:text-is('error')")).toBeVisible();
    });

    test("SendCustomEvent has expected ports", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("SendCustomEvent");

        const node = fge.nodeOnCanvas("FlowGraphSendCustomEventBlock");
        // Execution block with out signal: should have "in", "out", "error"
        await expect(node.locator("[class*='port-label']:text-is('in')")).toBeVisible();
        await expect(node.locator("[class*='port-label']:text-is('out')")).toBeVisible();
        await expect(node.locator("[class*='port-label']:text-is('error')")).toBeVisible();
    });
});

test.describe("Flow Graph Editor — Math Blocks", () => {
    test("add arithmetic blocks to the graph", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("Add");
        await fge.addBlockFromPalette("Subtract");
        await fge.addBlockFromPalette("Multiply");

        expect(await fge.getNodeCount()).toBe(3);

        const blockNames = await fge.getBlockClassNamesOnCanvas();
        expect(blockNames).toContain("FlowGraphAddBlock");
        expect(blockNames).toContain("FlowGraphSubtractBlock");
        expect(blockNames).toContain("FlowGraphMultiplyBlock");
    });

    test("add comparison blocks to the graph", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("Equality");
        await fge.addBlockFromPalette("LessThan");

        expect(await fge.getNodeCount()).toBe(2);

        const blockNames = await fge.getBlockClassNamesOnCanvas();
        expect(blockNames).toContain("FlowGraphEqualityBlock");
        expect(blockNames).toContain("FlowGraphLessThanBlock");
    });
});

test.describe("Flow Graph Editor — Data Blocks", () => {
    test("add variable blocks", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("SetVariable");
        await fge.addBlockFromPalette("GetVariable");

        expect(await fge.getNodeCount()).toBe(2);

        const blockNames = await fge.getBlockClassNamesOnCanvas();
        expect(blockNames).toContain("FlowGraphGetVariableBlock");
        expect(blockNames).toContain("FlowGraphSetVariableBlock");
    });

    test("add constant block", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("Constant");

        expect(await fge.getNodeCount()).toBe(1);
        await expect(fge.nodeOnCanvas("FlowGraphConstantBlock")).toBeVisible();
    });

    test("add all data access blocks", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        const dataBlocks = [
            { palette: "Constant", className: "FlowGraphConstantBlock" },
            { palette: "GetProperty", className: "FlowGraphGetPropertyBlock" },
            { palette: "SetProperty", className: "FlowGraphSetPropertyBlock" },
            { palette: "GetVariable", className: "FlowGraphGetVariableBlock" },
            { palette: "SetVariable", className: "FlowGraphSetVariableBlock" },
            { palette: "GetAsset", className: "FlowGraphGetAssetBlock" },
            { palette: "JsonPointerParser", className: "FlowGraphJsonPointerParserBlock" },
            { palette: "ArrayIndex", className: "FlowGraphArrayIndexBlock" },
            { palette: "IndexOf", className: "FlowGraphIndexOfBlock" },
            { palette: "DataSwitch", className: "FlowGraphDataSwitchBlock" },
        ];

        // Listen for page errors — blocks requiring special config should not throw
        const pageErrors: string[] = [];
        page.on("pageerror", (err) => pageErrors.push(err.message));

        for (const block of dataBlocks) {
            await fge.addBlockFromPalette(block.palette);
        }

        expect(pageErrors).toHaveLength(0);
        expect(await fge.getNodeCount()).toBe(dataBlocks.length);

        const blockNames = await fge.getBlockClassNamesOnCanvas();
        for (const block of dataBlocks) {
            expect(blockNames).toContain(block.className);
        }
    });
});

test.describe("Flow Graph Editor — Event Blocks", () => {
    test("add all event block types", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        const eventBlocks = [
            { palette: "SceneReadyEvent", className: "FlowGraphSceneReadyEventBlock" },
            { palette: "SceneTickEvent", className: "FlowGraphSceneTickEventBlock" },
            { palette: "MeshPickEvent", className: "FlowGraphMeshPickEventBlock" },
            { palette: "PointerDownEvent", className: "FlowGraphPointerDownEventBlock" },
            { palette: "PointerUpEvent", className: "FlowGraphPointerUpEventBlock" },
            { palette: "PointerMoveEvent", className: "FlowGraphPointerMoveEventBlock" },
            { palette: "PointerOverEvent", className: "FlowGraphPointerOverEventBlock" },
            { palette: "PointerOutEvent", className: "FlowGraphPointerOutEventBlock" },
            { palette: "ReceiveCustomEvent", className: "FlowGraphReceiveCustomEventBlock" },
            { palette: "SendCustomEvent", className: "FlowGraphSendCustomEventBlock" },
        ];

        const pageErrors: string[] = [];
        page.on("pageerror", (err) => pageErrors.push(err.message));

        for (const block of eventBlocks) {
            await fge.addBlockFromPalette(block.palette);
        }

        expect(pageErrors).toHaveLength(0);
        expect(await fge.getNodeCount()).toBe(eventBlocks.length);

        const blockNames = await fge.getBlockClassNamesOnCanvas();
        for (const block of eventBlocks) {
            expect(blockNames).toContain(block.className);
        }
    });

    test("each event block has an 'out' signal port", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        // Use a representative subset — all event blocks derive from the same base
        const eventBlocks = [
            { palette: "SceneReadyEvent", className: "FlowGraphSceneReadyEventBlock" },
            { palette: "MeshPickEvent", className: "FlowGraphMeshPickEventBlock" },
            { palette: "PointerMoveEvent", className: "FlowGraphPointerMoveEventBlock" },
            { palette: "ReceiveCustomEvent", className: "FlowGraphReceiveCustomEventBlock" },
        ];

        for (const block of eventBlocks) {
            await fge.addBlockFromPalette(block.palette);
            // Verify the "out" port label exists
            const node = fge.nodeOnCanvas(block.className);
            const outPort = node.locator("[class*='port-label']", { hasText: "out" });
            await expect(outPort).toBeVisible({ timeout: 3000 });
        }
    });

    test("connect SceneReadyEvent to each execution block type", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("SceneReadyEvent");
        await fge.addBlockFromPalette("ConsoleLog");

        await fge.connectPorts("FlowGraphSceneReadyEventBlock", "out", "FlowGraphConsoleLogBlock", "in");
        expect(await fge.getLinkCount()).toBe(1);
    });

    test("connect MeshPickEvent to Branch", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("MeshPickEvent");
        await fge.addBlockFromPalette("Branch");

        await fge.connectPorts("FlowGraphMeshPickEventBlock", "out", "FlowGraphBranchBlock", "in");
        expect(await fge.getLinkCount()).toBe(1);
    });

    test("connect PointerDownEvent to SetDelay", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("PointerDownEvent");
        await fge.addBlockFromPalette("SetDelay");

        await fge.connectPorts("FlowGraphPointerDownEventBlock", "out", "FlowGraphSetDelayBlock", "in");
        expect(await fge.getLinkCount()).toBe(1);
    });
});

test.describe("Flow Graph Editor — Control Flow Blocks", () => {
    test("add all control flow blocks", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        const controlFlowBlocks = [
            { palette: "Branch", className: "FlowGraphBranchBlock" },
            { palette: "ForLoop", className: "FlowGraphForLoopBlock" },
            { palette: "WhileLoop", className: "FlowGraphWhileLoopBlock" },
            { palette: "Switch", className: "FlowGraphSwitchBlock" },
            { palette: "Sequence", className: "FlowGraphSequenceBlock" },
            { palette: "MultiGate", className: "FlowGraphMultiGateBlock" },
            { palette: "FlipFlop", className: "FlowGraphFlipFlopBlock" },
            { palette: "DoN", className: "FlowGraphDoNBlock" },
            { palette: "WaitAll", className: "FlowGraphWaitAllBlock" },
            { palette: "SetDelay", className: "FlowGraphSetDelayBlock" },
            { palette: "CancelDelay", className: "FlowGraphCancelDelayBlock" },
            { palette: "CallCounter", className: "FlowGraphCallCounterBlock" },
            { palette: "Debounce", className: "FlowGraphDebounceBlock" },
            { palette: "Throttle", className: "FlowGraphThrottleBlock" },
        ];

        const pageErrors: string[] = [];
        page.on("pageerror", (err) => pageErrors.push(err.message));

        for (const block of controlFlowBlocks) {
            await fge.addBlockFromPalette(block.palette);
        }

        expect(pageErrors).toHaveLength(0);
        expect(await fge.getNodeCount()).toBe(controlFlowBlocks.length);

        const blockNames = await fge.getBlockClassNamesOnCanvas();
        for (const block of controlFlowBlocks) {
            expect(blockNames).toContain(block.className);
        }
    });

    test("Branch block has true/false output signals", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("Branch");

        const node = fge.nodeOnCanvas("FlowGraphBranchBlock");
        await expect(node.locator("[class*='port-label']", { hasText: "onTrue" })).toBeVisible();
        await expect(node.locator("[class*='port-label']", { hasText: "onFalse" })).toBeVisible();
        await expect(node.locator("[class*='port-label']", { hasText: "condition" })).toBeVisible();
    });

    test("ForLoop block has expected ports", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("ForLoop");

        const node = fge.nodeOnCanvas("FlowGraphForLoopBlock");
        // Use :text-is for exact matching — "in" would otherwise match "initialIndex", "incrementIndex"
        await expect(node.locator("[class*='port-label']:text-is('in')")).toBeVisible();
        await expect(node.locator("[class*='port-label']:text-is('executionFlow')")).toBeVisible();
        await expect(node.locator("[class*='port-label']:text-is('completed')")).toBeVisible();
    });

    test("connect SceneReady → Sequence → two ConsoleLog blocks", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("SceneReadyEvent");
        await fge.addBlockFromPalette("Sequence");

        expect(await fge.getNodeCount()).toBe(2);

        await fge.connectPorts("FlowGraphSceneReadyEventBlock", "out", "FlowGraphSequenceBlock", "in");
        expect(await fge.getLinkCount()).toBeGreaterThanOrEqual(1);
    });
});

test.describe("Flow Graph Editor — Animation Blocks", () => {
    test("add all animation blocks", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        const animBlocks = [
            { palette: "PlayAnimation", className: "FlowGraphPlayAnimationBlock" },
            { palette: "StopAnimation", className: "FlowGraphStopAnimationBlock" },
            { palette: "PauseAnimation", className: "FlowGraphPauseAnimationBlock" },
            { palette: "Interpolation", className: "FlowGraphInterpolationBlock" },
        ];

        const pageErrors: string[] = [];
        page.on("pageerror", (err) => pageErrors.push(err.message));

        for (const block of animBlocks) {
            await fge.addBlockFromPalette(block.palette);
        }

        expect(pageErrors).toHaveLength(0);
        expect(await fge.getNodeCount()).toBe(animBlocks.length);

        const blockNames = await fge.getBlockClassNamesOnCanvas();
        for (const block of animBlocks) {
            expect(blockNames).toContain(block.className);
        }
    });

    test("connect SceneReady → PlayAnimation", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("SceneReadyEvent");
        await fge.addBlockFromPalette("PlayAnimation");

        await fge.connectPorts("FlowGraphSceneReadyEventBlock", "out", "FlowGraphPlayAnimationBlock", "in");
        expect(await fge.getLinkCount()).toBe(1);
    });
});

test.describe("Flow Graph Editor — Utility Blocks", () => {
    test("add all utility blocks", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        const utilBlocks = [
            { palette: "ConsoleLog", className: "FlowGraphConsoleLogBlock" },
            { palette: "Easing", className: "FlowGraphEasingBlock" },
            { palette: "BezierCurveEasing", className: "FlowGraphBezierCurveEasing" },
            { palette: "Context", className: "FlowGraphContextBlock" },
            { palette: "CodeExecution", className: "FlowGraphCodeExecutionBlock" },
            { palette: "FunctionReference", className: "FlowGraphFunctionReference" },
            { palette: "Debug", className: "FlowGraphDebugBlock" },
        ];

        const pageErrors: string[] = [];
        page.on("pageerror", (err) => pageErrors.push(err.message));

        for (const block of utilBlocks) {
            await fge.addBlockFromPalette(block.palette);
        }

        expect(pageErrors).toHaveLength(0);
        expect(await fge.getNodeCount()).toBe(utilBlocks.length);

        const blockNames = await fge.getBlockClassNamesOnCanvas();
        for (const block of utilBlocks) {
            expect(blockNames).toContain(block.className);
        }
    });
});

test.describe("Flow Graph Editor — Serialization", () => {
    test("empty graph serializes correctly", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        const serialized = await fge.serializeGraph();
        const parsed = JSON.parse(serialized);

        // Empty graph should have allBlocks as empty array
        expect(parsed.allBlocks).toBeDefined();
        expect(parsed.allBlocks).toHaveLength(0);
    });

    test("graph with blocks serializes all blocks", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("SceneReadyEvent");
        await fge.addBlockFromPalette("ConsoleLog");
        await fge.addBlockFromPalette("Branch");

        const serialized = await fge.serializeGraph();
        const parsed = JSON.parse(serialized);

        expect(parsed.allBlocks).toHaveLength(3);

        const classNames = parsed.allBlocks.map((b: any) => b.className);
        expect(classNames).toContain("FlowGraphSceneReadyEventBlock");
        expect(classNames).toContain("FlowGraphConsoleLogBlock");
        expect(classNames).toContain("FlowGraphBranchBlock");
    });

    test("connected graph serializes connections", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        await fge.addBlockFromPalette("SceneReadyEvent");
        await fge.addBlockFromPalette("ConsoleLog");

        // Connect them
        await fge.connectPorts("FlowGraphSceneReadyEventBlock", "out", "FlowGraphConsoleLogBlock", "in");

        const serialized = await fge.serializeGraph();
        const parsed = JSON.parse(serialized);

        expect(parsed.allBlocks).toHaveLength(2);

        // Check that at least one block has a connected port
        const hasConnection = parsed.allBlocks.some(
            (b: any) => b.signalOutputs?.some((p: any) => p.connectedPointIds?.length > 0) || b.signalInputs?.some((p: any) => p.connectedPointIds?.length > 0)
        );
        expect(hasConnection).toBe(true);
    });
});

test.describe("Flow Graph Editor — Keyboard Shortcuts", () => {
    test("Ctrl+F opens the search dialog", async ({ page }) => {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto();
        await fge.assertEditorReady();

        // Focus the diagram area first
        await fge.diagramContainer.click();
        await page.keyboard.press("Control+f");

        // The search UI should become visible
        const searchInput = page.locator("[class*='search'] input, [class*='find'] input").first();
        await expect(searchInput).toBeVisible({ timeout: 3000 });
    });
});
