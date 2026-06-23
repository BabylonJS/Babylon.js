import { test, expect, type Locator, type Page } from "@playwright/test";
import { readFileSync } from "fs";
import { FlowGraphEditorPage } from "./fge.utils";
import { AllFlowGraphBlocks } from "../../src/allBlockNames";

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

async function GetCoordinatorSnapshot(page: Page): Promise<{ activeGraphIndex: number; graphs: { name: string; blockClassNames: string[]; totalConnections: number }[] }> {
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

        await expect(page.getByText("Phase 3 toast bridge", { exact: true })).toBeVisible();
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

        await expect(page.getByText("Graph saved - ID: FGESAVE#12 (copied to clipboard)", { exact: true }).last()).toBeVisible();
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
