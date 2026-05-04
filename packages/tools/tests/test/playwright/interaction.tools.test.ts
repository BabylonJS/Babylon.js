import { getGlobalConfig } from "@tools/test-tools";
import { test, expect } from "@playwright/test";

// if running in the CI we need to use the babylon snapshot when loading the tools
const snapshot = process.env.SNAPSHOT ? "?snapshot=" + process.env.SNAPSHOT : "";
const cdnPort = ":" + (process.env.CDN_PORT || 1337);
const nmeUrl = (process.env.NME_BASE_URL || getGlobalConfig().baseUrl.replace(cdnPort, process.env.NME_PORT || ":1340")) + snapshot;
const ngeUrl = (process.env.NGE_BASE_URL || getGlobalConfig().baseUrl.replace(cdnPort, process.env.NGE_PORT || ":1343")) + snapshot;
const guiUrl = (process.env.GUIEDITOR_BASE_URL || getGlobalConfig().baseUrl.replace(cdnPort, process.env.GUIEDITOR_PORT || ":1341")) + snapshot;
const nrgeUrl = (process.env.NRGE_BASE_URL || getGlobalConfig().baseUrl.replace(cdnPort, process.env.NRGE_PORT || ":1344")) + snapshot;
const fgeUrl = (process.env.FGE_BASE_URL || getGlobalConfig().baseUrl.replace(cdnPort, process.env.FGE_PORT || ":1347")) + snapshot;
const npeUrl = (process.env.NPE_BASE_URL || getGlobalConfig().baseUrl.replace(cdnPort, process.env.NPE_PORT || ":1345")) + snapshot;

async function getGraphNodeCount(page: import("@playwright/test").Page) {
    await page.waitForSelector("#graph-canvas-container", { state: "attached" });
    return await page.evaluate(() => {
        const graph = document.getElementById("graph-canvas-container");
        if (!graph) {
            throw new Error("Graph not found");
        }
        return graph.children.length;
    });
}

async function dragPaletteItemToGraph(page: import("@playwright/test").Page, nodeListSelector: string, displayText: string, targetPosition = { x: 420, y: 140 }) {
    const filterInput = page.locator(`${nodeListSelector} input[type='text']`).first();
    await filterInput.fill(displayText);

    const source = page.locator(`${nodeListSelector} .draggableLine:text-is("${displayText}")`).first();
    await expect(source).toBeVisible({ timeout: 5000 });
    await source.dragTo(page.locator(".diagram-container"), { targetPosition, force: true });
    await page.waitForTimeout(500);

    await filterInput.fill("");
}

async function expectGraphZoomsOut(page: import("@playwright/test").Page) {
    const graph = page.locator("#graph-canvas");
    await expect(graph).toBeVisible();
    await expect
        .poll(async () => {
            return await page.evaluate(() => {
                const graph = document.getElementById("graph-canvas") as HTMLCanvasElement;
                return graph.style.backgroundSize;
            });
        })
        .toMatch(/\d/);
    const graphPosition = await graph.boundingBox();
    const backgroundSize = await page.evaluate(() => {
        const graph = document.getElementById("graph-canvas") as HTMLCanvasElement;
        return graph.style.backgroundSize;
    });
    const backgroundParsed = backgroundSize.split(" ").map((size) => parseFloat(size.replace("px", "")));
    if (!graphPosition) {
        throw new Error("Graph not found");
    }
    await page.mouse.move(graphPosition.x + 40, graphPosition.y + 20, { steps: 5 });
    await page.mouse.wheel(0, 300);
    const newBackgroundSize = await page.evaluate(() => {
        const graph = document.getElementById("graph-canvas") as HTMLCanvasElement;
        return graph.style.backgroundSize;
    });
    const newBackgroundParsed = newBackgroundSize.split(" ").map((size) => parseFloat(size.replace("px", "")));
    expect(newBackgroundParsed).toHaveLength(2);
    expect(backgroundParsed[0]).toBeGreaterThan(newBackgroundParsed[0]);
    expect(backgroundParsed[1]).toBeGreaterThan(newBackgroundParsed[1]);
}

test.beforeAll(async () => {
    // Set timeout for this hook.
    test.setTimeout(30000);
});

test("NME is loaded correctly", async ({ page }) => {
    await page.goto(nmeUrl, {
        waitUntil: "load",
    });
    await page.setViewportSize({
        width: 1920,
        height: 1080,
    });
    // check visibility of both canvas AND the editor
    await expect(page.locator("#graph-canvas")).toBeVisible();
    await expect(page.locator("#nmeNodeList")).toBeVisible();
    await expect(page.locator(".nme-right-panel")).toBeVisible();
});

test("NGE is loaded correctly", async ({ page }) => {
    await page.goto(ngeUrl, {
        waitUntil: "load",
    });
    await page.setViewportSize({
        width: 1920,
        height: 1080,
    });
    // check visibility of both canvas AND the editor
    await expect(page.locator("#graph-canvas")).toBeVisible();
    await expect(page.locator("#ngeNodeList")).toBeVisible();
    await expect(page.locator(".nge-right-panel")).toBeVisible();
});

test("GUIEditor is loaded", async ({ page }) => {
    await page.goto(guiUrl, {
        waitUntil: "load",
    });
    await page.setViewportSize({
        width: 1920,
        height: 1080,
    });
    // check visibility of both canvas AND the editor
    await expect(page.locator("#workbench-canvas")).toBeVisible();
    await expect(page.locator(".left-panel")).toBeVisible();
    await expect(page.locator(".right-panel")).toBeVisible();
});

test("NRGE is loaded correctly", async ({ page }) => {
    await page.goto(nrgeUrl, {
        waitUntil: "load",
    });
    await page.setViewportSize({
        width: 1920,
        height: 1080,
    });
    // check visibility of both canvas AND the editor
    await expect(page.locator("#graph-canvas")).toBeVisible();
    await expect(page.locator("#nrgeNodeList")).toBeVisible();
    await expect(page.locator(".nrge-right-panel")).toBeVisible();
});

test("NPE is loaded correctly", async ({ page }) => {
    await page.goto(npeUrl, {
        waitUntil: "load",
    });
    await page.setViewportSize({
        width: 1920,
        height: 1080,
    });
    await expect(page.locator("#node-particle-editor-graph-root")).toBeVisible({ timeout: 30000 });
    await expect(page.locator("#graph-canvas")).toBeVisible();
    await expect(page.locator("#npeNodeList")).toBeVisible();
    await expect(page.locator(".npe-right-panel")).toBeVisible();
    await expect(page.locator(".wait-screen")).toHaveClass(/hidden/);
});

test("FGE is loaded correctly", async ({ page }) => {
    await page.goto(fgeUrl, {
        waitUntil: "load",
    });
    await page.setViewportSize({
        width: 1920,
        height: 1080,
    });
    await expect(page.locator("#flow-graph-editor-graph-root")).toBeVisible({ timeout: 30000 });
    await expect(page.locator("#graph-canvas")).toBeVisible();
    await expect(page.locator("#fgeNodeList")).toBeVisible();
    await expect(page.locator(".fge-right-panel")).toBeVisible();
    await expect(page.locator(".wait-screen")).toHaveClass(/hidden/);
});

/////// NME TESTS ///////

test("[NME] User can drag graph nodes", async ({ page }) => {
    await page.goto(nmeUrl, {
        waitUntil: "load",
    });
    await page.setViewportSize({
        width: 1920,
        height: 1080,
    });

    const node = page.locator(".FragmentOutputBlock");
    const nodePosition = await node.boundingBox();
    if (!nodePosition) {
        throw new Error("Node not found");
    }
    await page.mouse.move(nodePosition.x + 40, nodePosition.y + 20, { steps: 5 });
    await page.mouse.down();
    await page.mouse.move(nodePosition.x + 200, nodePosition.y + 200, { steps: 5 });
    await page.mouse.up();

    const newNodePosition = await node.boundingBox();
    if (!newNodePosition) {
        throw new Error("Node not found");
    }
    // check if the node has moved
    expect(newNodePosition.x).toBeGreaterThan(nodePosition.x);
    expect(newNodePosition.y).toBeGreaterThan(nodePosition.y);
});

test("[NME] User can zoom in and out of the graph", async ({ page }) => {
    await page.goto(nmeUrl, {
        waitUntil: "load",
    });
    await page.setViewportSize({
        width: 1920,
        height: 1080,
    });

    const graph = page.locator("#graph-canvas");
    const graphPosition = await graph.boundingBox();
    // check the background size of the graph
    const backgroundSize = await page.evaluate(() => {
        const graph = document.getElementById("graph-canvas") as HTMLCanvasElement;
        return graph.style.backgroundSize;
    });
    const backgroundParsed = backgroundSize.split(" ").map((size) => parseFloat(size.replace("px", "")));
    if (!graphPosition) {
        throw new Error("Graph not found");
    }
    await page.mouse.move(graphPosition.x + 40, graphPosition.y + 20, { steps: 5 });
    await page.mouse.wheel(0, 300);
    const newBackgroundSize = await page.evaluate(() => {
        const graph = document.getElementById("graph-canvas") as HTMLCanvasElement;
        return graph.style.backgroundSize;
    });
    const newBackgroundParsed = newBackgroundSize.split(" ").map((size) => parseFloat(size.replace("px", "")));
    // check if the background size has changed
    expect(newBackgroundParsed).toHaveLength(2);
    expect(backgroundParsed[0]).toBeGreaterThan(newBackgroundParsed[0]);
    expect(backgroundParsed[1]).toBeGreaterThan(newBackgroundParsed[1]);
});

test("[NME] User can add a new node to the graph", async ({ page }) => {
    await page.goto(nmeUrl, {
        waitUntil: "load",
    });
    await page.setViewportSize({
        width: 1920,
        height: 1080,
    });

    // Wait for the graph to be rendered (Vite loads the editor asynchronously)
    await page.waitForSelector("#graph-canvas-container", { state: "attached" });

    // get the number of nodes in the graph. this is the number of direct children in #graph-canvas-container
    const nodeCount = await page.evaluate(() => {
        const graph = document.getElementById("graph-canvas-container");
        if (!graph) {
            throw new Error("Graph not found");
        }
        return graph.children.length;
    });

    // get a node with innerText "Color4"
    const node = page.getByText("Color4").nth(0);
    // move to this node + 10px
    const nodePosition = await node.boundingBox();
    if (!nodePosition) {
        throw new Error("Node not found");
    }
    await page.mouse.move(nodePosition.x + 10, nodePosition.y + 10, { steps: 5 });
    await page.mouse.down();
    // move to the right
    await page.mouse.move(nodePosition.x + 400, nodePosition.y, { steps: 5 });
    await page.mouse.up();
    // check the new number of children
    const newCount = await page.evaluate(() => {
        const graph = document.getElementById("graph-canvas-container");
        if (!graph) {
            throw new Error("Graph not found");
        }
        return graph.children.length;
    });
    // expect newCount to be nodeCount + 1
    expect(newCount).toBe(nodeCount + 1);
});

///////// NGE TESTS /////////

test("[NGE] User can drag graph nodes", async ({ page }) => {
    await page.goto(ngeUrl, {
        waitUntil: "load",
    });
    await page.setViewportSize({
        width: 1920,
        height: 1080,
    });

    const node = page.locator(".GeometryOutputBlock");
    const nodePosition = await node.boundingBox();
    if (!nodePosition) {
        throw new Error("Node not found");
    }
    await page.mouse.move(nodePosition.x + 40, nodePosition.y + 20, { steps: 5 });
    await page.mouse.down();
    await page.mouse.move(nodePosition.x + 200, nodePosition.y + 200, { steps: 5 });
    await page.mouse.up();

    const newNodePosition = await node.boundingBox();
    if (!newNodePosition) {
        throw new Error("Node not found");
    }
    // check if the node has moved
    expect(newNodePosition.x).toBeGreaterThan(nodePosition.x);
    expect(newNodePosition.y).toBeGreaterThan(nodePosition.y);
});

test("[NGE] User can zoom in and out of the graph", async ({ page }) => {
    await page.goto(ngeUrl, {
        waitUntil: "load",
    });
    await page.setViewportSize({
        width: 1920,
        height: 1080,
    });

    const graph = page.locator("#graph-canvas");
    const graphPosition = await graph.boundingBox();
    // check the background size of the graph
    const backgroundSize = await page.evaluate(() => {
        const graph = document.getElementById("graph-canvas") as HTMLCanvasElement;
        return graph.style.backgroundSize;
    });
    const backgroundParsed = backgroundSize.split(" ").map((size) => parseFloat(size.replace("px", "")));
    if (!graphPosition) {
        throw new Error("Graph not found");
    }
    await page.mouse.move(graphPosition.x + 40, graphPosition.y + 20, { steps: 5 });
    await page.mouse.wheel(0, 300);
    const newBackgroundSize = await page.evaluate(() => {
        const graph = document.getElementById("graph-canvas") as HTMLCanvasElement;
        return graph.style.backgroundSize;
    });
    const newBackgroundParsed = newBackgroundSize.split(" ").map((size) => parseFloat(size.replace("px", "")));
    // check if the background size has changed
    expect(newBackgroundParsed).toHaveLength(2);
    expect(backgroundParsed[0]).toBeGreaterThan(newBackgroundParsed[0]);
    expect(backgroundParsed[1]).toBeGreaterThan(newBackgroundParsed[1]);
});

test("[NGE] User can add a new node to the graph", async ({ page }) => {
    await page.goto(ngeUrl, {
        waitUntil: "load",
    });
    await page.setViewportSize({
        width: 1920,
        height: 1080,
    });

    // Wait for the graph to be rendered (Vite loads the editor asynchronously)
    await page.waitForSelector("#graph-canvas-container", { state: "attached" });

    // get the number of nodes in the graph. this is the number of direct children in #graph-canvas-container
    const nodeCount = await page.evaluate(() => {
        const graph = document.getElementById("graph-canvas-container");
        if (!graph) {
            throw new Error("Graph not found");
        }
        return graph.children.length;
    });

    // get a node with innerText "Color4"
    const node = page.getByText("Vector3").nth(0);
    // move to this node + 10px
    const nodePosition = await node.boundingBox();
    if (!nodePosition) {
        throw new Error("Node not found");
    }
    await page.mouse.move(nodePosition.x + 10, nodePosition.y + 10, { steps: 5 });
    await page.mouse.down();
    // move to the right
    await page.mouse.move(nodePosition.x + 400, nodePosition.y, { steps: 5 });
    await page.mouse.up();
    // check the new number of children
    const newCount = await page.evaluate(() => {
        const graph = document.getElementById("graph-canvas-container");
        if (!graph) {
            throw new Error("Graph not found");
        }
        return graph.children.length;
    });
    // expect newCount to be nodeCount + 1
    expect(newCount).toBe(nodeCount + 1);
});

//////// NRGE TESTS ////////

test("[NRGE] User can drag graph nodes", async ({ page }) => {
    await page.goto(nrgeUrl, {
        waitUntil: "load",
    });
    await page.setViewportSize({
        width: 1920,
        height: 1080,
    });

    const node = page.locator(".NodeRenderGraphOutputBlock");
    const nodePosition = await node.boundingBox();
    if (!nodePosition) {
        throw new Error("Node not found");
    }
    await page.mouse.move(nodePosition.x + 40, nodePosition.y + 20, { steps: 5 });
    await page.mouse.down();
    await page.mouse.move(nodePosition.x + 200, nodePosition.y + 200, { steps: 5 });
    await page.mouse.up();

    const newNodePosition = await node.boundingBox();
    if (!newNodePosition) {
        throw new Error("Node not found");
    }
    // check if the node has moved
    expect(newNodePosition.x).toBeGreaterThan(nodePosition.x);
    expect(newNodePosition.y).toBeGreaterThan(nodePosition.y);
});

test("[NRGE] User can zoom in and out of the graph", async ({ page }) => {
    await page.goto(nrgeUrl, {
        waitUntil: "load",
    });
    await page.setViewportSize({
        width: 1920,
        height: 1080,
    });

    const graph = page.locator("#graph-canvas");
    const graphPosition = await graph.boundingBox();
    // check the background size of the graph
    const backgroundSize = await page.evaluate(() => {
        const graph = document.getElementById("graph-canvas") as HTMLCanvasElement;
        return graph.style.backgroundSize;
    });
    const backgroundParsed = backgroundSize.split(" ").map((size) => parseFloat(size.replace("px", "")));
    if (!graphPosition) {
        throw new Error("Graph not found");
    }
    await page.mouse.move(graphPosition.x + 40, graphPosition.y + 20, { steps: 5 });
    await page.mouse.wheel(0, 300);
    const newBackgroundSize = await page.evaluate(() => {
        const graph = document.getElementById("graph-canvas") as HTMLCanvasElement;
        return graph.style.backgroundSize;
    });
    const newBackgroundParsed = newBackgroundSize.split(" ").map((size) => parseFloat(size.replace("px", "")));
    // check if the background size has changed
    expect(newBackgroundParsed).toHaveLength(2);
    expect(backgroundParsed[0]).toBeGreaterThan(newBackgroundParsed[0]);
    expect(backgroundParsed[1]).toBeGreaterThan(newBackgroundParsed[1]);
});

test("[NRGE] User can add a new node to the graph", async ({ page }) => {
    await page.goto(nrgeUrl, {
        waitUntil: "load",
    });
    await page.setViewportSize({
        width: 1920,
        height: 1080,
    });

    // Wait for the graph to be rendered (Vite loads the editor asynchronously)
    await page.waitForSelector("#graph-canvas-container", { state: "attached" });

    // get the number of nodes in the graph. this is the number of direct children in #graph-canvas-container
    const nodeCount = await page.evaluate(() => {
        const graph = document.getElementById("graph-canvas-container");
        if (!graph) {
            throw new Error("Graph not found");
        }
        return graph.children.length;
    });

    // get a node with innerText "Color4"
    const node = page.getByText("ObjectList").nth(0);
    // move to this node + 10px
    const nodePosition = await node.boundingBox();
    if (!nodePosition) {
        throw new Error("Node not found");
    }
    await page.mouse.move(nodePosition.x + 10, nodePosition.y + 10, { steps: 5 });
    await page.mouse.down();
    // move to the right
    await page.mouse.move(nodePosition.x + 400, nodePosition.y, { steps: 5 });
    await page.mouse.up();
    // check the new number of children
    const newCount = await page.evaluate(() => {
        const graph = document.getElementById("graph-canvas-container");
        if (!graph) {
            throw new Error("Graph not found");
        }
        return graph.children.length;
    });
    // expect newCount to be nodeCount + 1
    expect(newCount).toBe(nodeCount + 1);
});

//////// FGE TESTS ////////

test("[FGE] User can add a new block to the graph", async ({ page }) => {
    await page.goto(fgeUrl, {
        waitUntil: "load",
    });
    await page.setViewportSize({
        width: 1920,
        height: 1080,
    });
    await expect(page.locator("#flow-graph-editor-graph-root")).toBeVisible({ timeout: 30000 });
    await page.waitForSelector("#graph-canvas-container", { state: "attached" });

    const nodeCount = await getGraphNodeCount(page);
    await dragPaletteItemToGraph(page, "#fgeNodeList", "SceneReadyEvent");
    const newCount = await getGraphNodeCount(page);

    expect(newCount).toBe(nodeCount + 1);
});

test("[FGE] User can drag graph nodes", async ({ page }) => {
    await page.goto(fgeUrl, {
        waitUntil: "load",
    });
    await page.setViewportSize({
        width: 1920,
        height: 1080,
    });
    await expect(page.locator("#flow-graph-editor-graph-root")).toBeVisible({ timeout: 30000 });

    if ((await getGraphNodeCount(page)) === 0) {
        await dragPaletteItemToGraph(page, "#fgeNodeList", "SceneReadyEvent");
    }

    const node = page.locator(".FlowGraphSceneReadyEventBlock").first();
    const nodePosition = await node.boundingBox();
    if (!nodePosition) {
        throw new Error("Node not found");
    }
    await page.mouse.move(nodePosition.x + 40, nodePosition.y + 20, { steps: 5 });
    await page.mouse.down();
    await page.mouse.move(nodePosition.x + 200, nodePosition.y + 200, { steps: 5 });
    await page.mouse.up();

    const newNodePosition = await node.boundingBox();
    if (!newNodePosition) {
        throw new Error("Node not found");
    }
    expect(newNodePosition.x).toBeGreaterThan(nodePosition.x);
    expect(newNodePosition.y).toBeGreaterThan(nodePosition.y);
});

test("[FGE] User can zoom in and out of the graph", async ({ page }) => {
    await page.goto(fgeUrl, {
        waitUntil: "load",
    });
    await page.setViewportSize({
        width: 1920,
        height: 1080,
    });
    await expect(page.locator("#flow-graph-editor-graph-root")).toBeVisible({ timeout: 30000 });

    await expectGraphZoomsOut(page);
});

//////// NPE TESTS ////////

test("[NPE] node list contains expected categories", async ({ page }) => {
    await page.goto(npeUrl, {
        waitUntil: "load",
    });
    await page.setViewportSize({
        width: 1920,
        height: 1080,
    });
    await expect(page.locator("#node-particle-editor-graph-root")).toBeVisible({ timeout: 30000 });

    for (const category of ["Inputs", "Updates", "System Nodes"]) {
        await expect(page.locator("#npeNodeList").getByText(category, { exact: false }).first()).toBeVisible();
    }
});

test("[NPE] User can add a new node to the graph", async ({ page }) => {
    await page.goto(npeUrl, {
        waitUntil: "load",
    });
    await page.setViewportSize({
        width: 1920,
        height: 1080,
    });
    await expect(page.locator("#node-particle-editor-graph-root")).toBeVisible({ timeout: 30000 });
    await page.waitForSelector("#graph-canvas-container", { state: "attached" });

    const nodeCount = await getGraphNodeCount(page);
    await dragPaletteItemToGraph(page, "#npeNodeList", "Float");
    const newCount = await getGraphNodeCount(page);

    expect(newCount).toBe(nodeCount + 1);
});

test("[NPE] User can drag graph nodes", async ({ page }) => {
    await page.goto(npeUrl, {
        waitUntil: "load",
    });
    await page.setViewportSize({
        width: 1920,
        height: 1080,
    });
    await expect(page.locator("#node-particle-editor-graph-root")).toBeVisible({ timeout: 30000 });

    if ((await getGraphNodeCount(page)) === 0) {
        await dragPaletteItemToGraph(page, "#npeNodeList", "Float");
    }

    const node = page.locator("#graph-canvas-container > *").first();
    const nodePosition = await node.boundingBox();
    if (!nodePosition) {
        throw new Error("Node not found");
    }
    await page.mouse.move(nodePosition.x + 40, nodePosition.y + 20, { steps: 5 });
    await page.mouse.down();
    await page.mouse.move(nodePosition.x + 200, nodePosition.y + 200, { steps: 5 });
    await page.mouse.up();

    const newNodePosition = await node.boundingBox();
    if (!newNodePosition) {
        throw new Error("Node not found");
    }
    expect(newNodePosition.x).toBeGreaterThan(nodePosition.x);
    expect(newNodePosition.y).toBeGreaterThan(nodePosition.y);
});

test("[NPE] User can zoom in and out of the graph", async ({ page }) => {
    await page.goto(npeUrl, {
        waitUntil: "load",
    });
    await page.setViewportSize({
        width: 1920,
        height: 1080,
    });
    await expect(page.locator("#node-particle-editor-graph-root")).toBeVisible({ timeout: 30000 });

    await expectGraphZoomsOut(page);
});

test("[NPE] representative particle blocks can be added without page errors", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await page.goto(npeUrl, {
        waitUntil: "load",
    });
    await page.setViewportSize({
        width: 1920,
        height: 1080,
    });
    await expect(page.locator("#node-particle-editor-graph-root")).toBeVisible({ timeout: 30000 });

    const nodeCount = await getGraphNodeCount(page);
    for (const block of ["Float", "Vector3", "UpdatePosition", "UpdateColor"]) {
        await dragPaletteItemToGraph(page, "#npeNodeList", block);
    }

    expect(pageErrors).toHaveLength(0);
    expect(await getGraphNodeCount(page)).toBe(nodeCount + 4);
});

//////// GUIEDITOR TESTS ////////

// single test adding, moving an element
test("[GUIEDITOR] User can add and drag graph nodes", async ({ page }) => {
    await page.goto(guiUrl, {
        waitUntil: "load",
    });
    await page.setViewportSize({
        width: 1920,
        height: 1080,
    });

    // Wait for the GUI editor to be rendered (Vite loads the editor asynchronously)
    await page.waitForSelector("#ge-sceneExplorer", { state: "attached" });

    // expect the tree to be empty - no children
    const treeChildren = await page.evaluate(() => {
        const tree = document.querySelector("#ge-sceneExplorer > div#tree > div") as HTMLElement;
        return tree.children.length;
    });

    expect(treeChildren).toBe(0);

    const node = page.getByTitle("InputText").first();
    const nodePosition = await node.boundingBox();
    if (!nodePosition) {
        throw new Error("Node not found");
    }
    await page.mouse.move(nodePosition.x + 10, nodePosition.y + 10, { steps: 5 });
    await page.mouse.down();
    await page.mouse.move(nodePosition.x + 200, nodePosition.y, { steps: 5 });
    await page.mouse.up();

    // update tree children
    const newTreeChildren = await page.evaluate(() => {
        const tree = document.querySelector("#ge-sceneExplorer > div#tree > div") as HTMLElement;
        return tree.children.length;
    });

    expect(newTreeChildren).toBe(1);

    // drag the node - it was added to the middle of the canvas
    const canvasNode = page.locator("#workbench-canvas");
    const canvasPosition = await canvasNode.boundingBox();
    if (!canvasPosition) {
        throw new Error("Canvas not found");
    }
    const center = { x: canvasPosition.x + canvasPosition.width / 2, y: canvasPosition.y + canvasPosition.height / 2 };

    await page.mouse.move(center.x + 30, center.y, { steps: 5 });

    // Ensure fonts and styles are fully loaded before taking screenshots
    await page.evaluate(() => document.fonts.ready);

    // take a screenshot (for visual inspection)
    const snapshot = await canvasNode.screenshot();
    expect(snapshot).toMatchSnapshot({
        maxDiffPixelRatio: 0.02,
    });

    await page.mouse.down();
    await page.mouse.move(center.x + 50, center.y + 50, { steps: 5 });
    await page.mouse.up();

    // take a screenshot (for visual inspection)
    const newSnapshot = await canvasNode.screenshot();
    expect(newSnapshot).toMatchSnapshot({
        maxDiffPixelRatio: 0.02,
    });
});
