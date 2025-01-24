import { getGlobalConfig } from "@tools/test-tools";
import { test, expect } from "@playwright/test";

// if running in the CI we need to use the babylon snapshot when loading the tools
const snapshot = process.env.SNAPSHOT ? "?snapshot=" + process.env.SNAPSHOT : "";
const nmeUrl = (process.env.NME_BASE_URL || getGlobalConfig().baseUrl.replace(":1337", process.env.NME_PORT || ":1340")) + snapshot;
const ngeUrl = (process.env.NGE_BASE_URL || getGlobalConfig().baseUrl.replace(":1337", process.env.NGE_PORT || ":1343")) + snapshot;
const guiUrl = (process.env.GUIEDITOR_BASE_URL || getGlobalConfig().baseUrl.replace(":1337", process.env.GUIEDITOR_PORT || ":1341")) + snapshot;
const nrgeUrl = (process.env.NRGE_BASE_URL || getGlobalConfig().baseUrl.replace(":1337", process.env.NRGE_PORT || ":1344")) + snapshot;

test.beforeAll(async () => {
    // Set timeout for this hook.
    test.setTimeout(30000);
});

test("NME is loaded correctly", async ({ page }) => {
    await page.goto(nmeUrl, {
        waitUntil: "networkidle",
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
        waitUntil: "networkidle",
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
        waitUntil: "networkidle",
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
        waitUntil: "networkidle",
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

/////// NME TESTS ///////

test("[NME] User can drag graph nodes", async ({ page }) => {
    await page.goto(nmeUrl, {
        waitUntil: "networkidle",
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
        waitUntil: "networkidle",
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
        waitUntil: "networkidle",
    });
    await page.setViewportSize({
        width: 1920,
        height: 1080,
    });

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
        waitUntil: "networkidle",
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
        waitUntil: "networkidle",
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
        waitUntil: "networkidle",
    });
    await page.setViewportSize({
        width: 1920,
        height: 1080,
    });

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
        waitUntil: "networkidle",
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
        waitUntil: "networkidle",
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
        waitUntil: "networkidle",
    });
    await page.setViewportSize({
        width: 1920,
        height: 1080,
    });

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

//////// GUIEDITOR TESTS ////////

// single test adding, moving an element
test("[GUIEDITOR] User can add and drag graph nodes", async ({ page }) => {
    await page.goto(guiUrl, {
        waitUntil: "networkidle",
    });
    await page.setViewportSize({
        width: 1920,
        height: 1080,
    });
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
