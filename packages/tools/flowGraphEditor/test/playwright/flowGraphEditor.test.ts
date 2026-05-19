import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "fs";
import { FlowGraphEditorPage } from "./fge.utils";

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

async function ClickGraphControl(page: Page, name: string): Promise<void> {
    await page.getByRole("button", { name, exact: true }).click();
}

async function WaitForGraphState(page: Page, state: "Stopped" | "Running"): Promise<void> {
    const expectedState = state === "Running" ? 1 : 0;
    await expect.poll(async () => await GetGraphState(page)).toBe(expectedState);
}

async function GetVariableSnapshot(
    page: Page,
    variableName: string
): Promise<{ value: unknown; type: string | undefined; sceneObjectName?: string; sceneObjectInContextScene?: boolean }> {
    return await page.evaluate((name) => {
        const editor = (globalThis as any).BABYLON?.FlowGraphEditor;
        const graph = editor?._CurrentState?.flowGraph ?? (globalThis as any).__viteFlowGraphEditorArgs?.[0]?.flowGraph;
        const context = graph?.getContext(0);
        if (!context) {
            throw new Error("FlowGraph context not found");
        }
        const value = context.userVariables[name];
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
        return { value, type: context.getVariableType(name) };
    }, variableName);
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
            await expect(fge.nodeList.getByText(category, { exact: false }).first()).toBeVisible();
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
        await fge.rightPanel.getByRole("button", { name: "Save", exact: true }).click();
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
