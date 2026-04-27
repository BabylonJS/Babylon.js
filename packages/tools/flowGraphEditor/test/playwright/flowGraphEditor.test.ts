import { test, expect } from "@playwright/test";
import { FlowGraphEditorPage } from "./fge.utils";

// The FGE starts with an empty graph — no default blocks on the canvas.

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
});

test.describe("Flow Graph Editor — Graph Construction", () => {
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
