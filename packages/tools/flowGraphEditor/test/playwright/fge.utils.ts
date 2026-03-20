import { type Page, type Locator, expect } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";

const snapshot = process.env.SNAPSHOT ? "?snapshot=" + process.env.SNAPSHOT : "";

/**
 * Build the base URL for the Flow Graph Editor.
 */
export function getFgeUrl(): string {
    return (process.env.FGE_BASE_URL || getGlobalConfig().baseUrl.replace(":1337", process.env.FGE_PORT || ":1345")) + snapshot;
}

/**
 * Helper class encapsulating common Flow Graph Editor interactions for e2e tests.
 */
export class FlowGraphEditorPage {
    readonly page: Page;
    readonly baseUrl: string;

    // Root panels
    readonly editorRoot: Locator;
    readonly graphCanvas: Locator;
    readonly graphCanvasContainer: Locator;
    readonly nodeList: Locator;
    readonly rightPanel: Locator;
    readonly diagramContainer: Locator;
    readonly svgContainer: Locator;

    constructor(page: Page, baseUrl?: string) {
        this.page = page;
        this.baseUrl = baseUrl ?? getFgeUrl();
        this.editorRoot = page.locator("#flow-graph-editor-graph-root");
        this.graphCanvas = page.locator("#graph-canvas");
        this.graphCanvasContainer = page.locator("#graph-canvas-container");
        this.nodeList = page.locator("#fgeNodeList");
        this.rightPanel = page.locator(".fge-right-panel");
        this.diagramContainer = page.locator(".diagram-container");
        this.svgContainer = page.locator("#graph-svg-container");
    }

    /**
     * Navigate to the editor and wait for it to fully load.
     * Uses ?local to connect to a local CDN on 1337, or dist otherwise.
     */
    async goto(options?: { local?: boolean; snapshot?: string }) {
        let url = this.baseUrl;
        const params: string[] = [];
        if (options?.local) {
            params.push("local");
        }
        if (options?.snapshot) {
            params.push(`snapshot=${options.snapshot}`);
        }
        if (params.length) {
            url += (url.includes("?") ? "&" : "?") + params.join("&");
        }
        await this.page.goto(url, { waitUntil: "load" });
        // Wait for the editor to fully render
        await expect(this.editorRoot).toBeVisible({ timeout: 30_000 });
        await expect(this.graphCanvas).toBeVisible({ timeout: 15_000 });
    }

    /**
     * Wait for the editor to be ready (all key panels visible).
     */
    async assertEditorReady() {
        await expect(this.graphCanvas).toBeVisible();
        await expect(this.nodeList).toBeVisible();
        await expect(this.rightPanel).toBeVisible();
        // Wait screen should be hidden
        const waitScreen = this.page.locator(".wait-screen");
        await expect(waitScreen).toHaveClass(/hidden/);
    }

    /**
     * Get the number of nodes currently on the canvas.
     */
    async getNodeCount(): Promise<number> {
        return await this.page.evaluate(() => {
            const container = document.getElementById("graph-canvas-container");
            if (!container) throw new Error("graph-canvas-container not found");
            return container.children.length;
        });
    }

    /**
     * Get the number of SVG link paths (connections) in the graph.
     */
    async getLinkCount(): Promise<number> {
        return await this.page.evaluate(() => {
            const svg = document.getElementById("graph-svg-container");
            if (!svg) throw new Error("graph-svg-container not found");
            // Each connection creates two <path> elements: one visible link and one selection overlay.
            // Count only actual link paths, excluding selection-link overlays.
            return svg.querySelectorAll("path:not([class*='selection'])").length;
        });
    }

    /**
     * Locate a specific block node on the canvas by its class name.
     * E.g., "FlowGraphBranchBlock" → `.FlowGraphBranchBlock`
     */
    nodeOnCanvas(blockClassName: string): Locator {
        return this.graphCanvasContainer.locator(`.${blockClassName}`);
    }

    /**
     * Locate the nth instance (0-based) of a block on the canvas.
     * Useful when multiple blocks of the same type exist.
     */
    nthNodeOnCanvas(blockClassName: string, index: number): Locator {
        return this.graphCanvasContainer.locator(`.${blockClassName}`).nth(index);
    }

    /**
     * Locate a draggable block item in the node list palette by its display text.
     * The palette strips "FlowGraph" prefix and "Block" suffix.
     * Uses exact text matching to avoid substring collisions (e.g., "LessThan" vs "LessThanOrEqual").
     */
    paletteItem(displayText: string): Locator {
        return this.nodeList.locator(`.draggableLine:text-is("${displayText}")`);
    }

    /**
     * Add a block to the graph by dragging it from the palette to the canvas.
     * `displayText` is the label shown in the palette (e.g., "Branch", "ConsoleLog").
     * Uses the search filter to ensure the item is visible regardless of category state.
     */
    async addBlockFromPalette(displayText: string): Promise<void> {
        // Use the filter to make the palette item visible regardless of category collapse/scroll
        await this.filterNodeList(displayText);

        const source = this.paletteItem(displayText);
        await expect(source).toBeVisible({ timeout: 5000 });

        // Lay out blocks in a 3-column grid so tests with many blocks (10-14) stay within viewport.
        // Use force:true because filter panel can overlap the drop target zone.
        const nodeCount = await this.getNodeCount();
        const col = nodeCount % 3;
        const row = Math.floor(nodeCount / 3);

        await source.dragTo(this.diagramContainer, {
            targetPosition: { x: 100 + col * 220, y: 100 + row * 120 },
            force: true,
        });

        // Give the async block creation a moment to complete
        await this.page.waitForTimeout(500);

        // Clear the filter and deselect the newly added block
        await this.clearNodeListFilter();
        await this.graphCanvas.click({ position: { x: 10, y: 10 } });
        await this.page.waitForTimeout(100);
    }

    /**
     * Drag a node on the canvas by a given offset.
     */
    async dragNode(blockClassName: string, offsetX: number, offsetY: number): Promise<{ before: DOMRect; after: DOMRect }> {
        const node = this.nodeOnCanvas(blockClassName);
        await expect(node).toBeVisible();

        const box = await node.boundingBox();
        if (!box) throw new Error(`Node ${blockClassName} not found on canvas`);

        const startX = box.x + 40;
        const startY = box.y + 20;

        await this.page.mouse.move(startX, startY, { steps: 5 });
        await this.page.mouse.down();
        await this.page.mouse.move(startX + offsetX, startY + offsetY, { steps: 10 });
        await this.page.mouse.up();

        const afterBox = await node.boundingBox();
        if (!afterBox) throw new Error(`Node ${blockClassName} not found after drag`);

        return {
            before: box as DOMRect,
            after: afterBox as DOMRect,
        };
    }

    /**
     * Zoom the graph canvas by scrolling the mouse wheel.
     * Positive deltaY = zoom out, negative = zoom in.
     */
    async zoom(deltaY: number): Promise<{ before: string; after: string }> {
        const graphBox = await this.graphCanvas.boundingBox();
        if (!graphBox) throw new Error("Graph canvas not found");

        const beforeSize = await this.page.evaluate(() => {
            const g = document.getElementById("graph-canvas") as HTMLElement;
            return g.style.backgroundSize;
        });

        await this.page.mouse.move(graphBox.x + graphBox.width / 2, graphBox.y + graphBox.height / 2, { steps: 3 });
        await this.page.mouse.wheel(0, deltaY);
        await this.page.waitForTimeout(200);

        const afterSize = await this.page.evaluate(() => {
            const g = document.getElementById("graph-canvas") as HTMLElement;
            return g.style.backgroundSize;
        });

        return { before: beforeSize, after: afterSize };
    }

    /**
     * Connect two ports by dragging from a source port icon to a target port icon.
     * The graph canvas uses pointerdown → pointermove → pointerup to wire connections.
     *
     * @param sourceBlockClass - CSS class of the source node (e.g., "FlowGraphSceneReadyEventBlock")
     * @param sourcePortName - Name of the output port on the source (e.g., "out")
     * @param targetBlockClass - CSS class of the target node (e.g., "FlowGraphConsoleLogBlock")
     * @param targetPortName - Name of the input port on the target (e.g., "in")
     * @param options - Optional: sourceIndex/targetIndex for disambiguating duplicate block types
     */
    async connectPorts(
        sourceBlockClass: string,
        sourcePortName: string,
        targetBlockClass: string,
        targetPortName: string,
        options?: { sourceIndex?: number; targetIndex?: number }
    ): Promise<void> {
        const sourceNode = options?.sourceIndex !== undefined ? this.nthNodeOnCanvas(sourceBlockClass, options.sourceIndex) : this.nodeOnCanvas(sourceBlockClass);
        const targetNode = options?.targetIndex !== undefined ? this.nthNodeOnCanvas(targetBlockClass, options.targetIndex) : this.nodeOnCanvas(targetBlockClass);

        const sourcePort = this._findPortIconOnNode(sourceNode, sourcePortName, "output");
        const targetPort = this._findPortIconOnNode(targetNode, targetPortName, "input");

        await expect(sourcePort).toBeVisible({ timeout: 3000 });
        await expect(targetPort).toBeVisible({ timeout: 3000 });

        // Deselect all nodes first to prevent selected-node overlays from intercepting pointer events
        await this.graphCanvas.click({ position: { x: 10, y: 10 } });
        await this.page.waitForTimeout(100);

        await sourcePort.dragTo(targetPort);
        await this.page.waitForTimeout(300);
    }

    /**
     * Find a port icon element within a node by port name and direction.
     */
    private async _findPortIcon(blockClass: string, portName: string, direction: "input" | "output"): Promise<Locator> {
        const node = this.nodeOnCanvas(blockClass);
        return this._findPortIconOnNode(node, portName, direction);
    }

    /**
     * Find a port icon on a specific node locator.
     */
    private _findPortIconOnNode(node: Locator, portName: string, direction: "input" | "output"): Locator {
        const containerSelector = direction === "input" ? "[class*='inputsContainer']" : "[class*='outputsContainer']";
        const portsContainer = node.locator(containerSelector);

        // Find the portLine that contains a label with matching text
        const portLine = portsContainer.locator("[class*='portLine']", { has: this.page.locator(`[class*='port-label']:text-is("${portName}")`) });

        // The port icon is inside the port div
        return portLine.locator(".port-icon").first();
    }

    /**
     * Serialize the current graph by accessing the BABYLON global in the page.
     * Uses the private static _CurrentState which is accessible at runtime.
     */
    async serializeGraph(): Promise<string> {
        return await this.page.evaluate(() => {
            const editor = (globalThis as any).BABYLON.FlowGraphEditor;
            if (!editor || !editor._CurrentState) {
                throw new Error("FlowGraphEditor instance not found");
            }
            const globalState = editor._CurrentState;
            const graph = globalState.flowGraph;
            const serializationObject: any = {};
            graph.serialize(serializationObject);
            return JSON.stringify(serializationObject);
        });
    }

    /**
     * Get all block class names present on the canvas.
     */
    async getBlockClassNamesOnCanvas(): Promise<string[]> {
        return await this.page.evaluate(() => {
            const container = document.getElementById("graph-canvas-container");
            if (!container) return [];
            const names: string[] = [];
            for (const child of Array.from(container.children)) {
                // Each node visual has the block class name added as a CSS class.
                // Most end with "Block" but some (e.g. FlowGraphBezierCurveEasing) don't.
                for (const cls of Array.from(child.classList)) {
                    if (cls.startsWith("FlowGraph") && !cls.includes("__")) {
                        names.push(cls);
                    }
                }
            }
            return names;
        });
    }

    /**
     * Select a node on the canvas by clicking on it.
     */
    async selectNode(blockClassName: string): Promise<void> {
        const node = this.nodeOnCanvas(blockClassName);
        await expect(node).toBeVisible();
        const box = await node.boundingBox();
        if (!box) throw new Error(`Node ${blockClassName} not found`);
        await this.page.mouse.click(box.x + box.width / 2, box.y + 20);
        await this.page.waitForTimeout(200);
    }

    /**
     * Delete the currently selected node(s) by pressing Delete key.
     */
    async deleteSelectedNodes(): Promise<void> {
        await this.page.keyboard.press("Delete");
        await this.page.waitForTimeout(300);
    }

    /**
     * Expand a category in the node list palette.
     */
    async expandCategory(categoryLabel: string): Promise<void> {
        const category = this.nodeList.locator(".pane-title", { hasText: categoryLabel });
        // Check if the category content is collapsed
        const isExpanded = await category.evaluate((el) => {
            const container = el.closest(".pane");
            return container?.querySelector(".pane-content")?.classList.contains("hidden") === false;
        });
        if (!isExpanded) {
            await category.click();
            await this.page.waitForTimeout(200);
        }
    }

    /**
     * Filter the node list palette by typing in the search box.
     */
    async filterNodeList(text: string): Promise<void> {
        const filterInput = this.nodeList.locator("input[type='text']").first();
        await filterInput.fill(text);
        await this.page.waitForTimeout(300);
    }

    /**
     * Clear the node list filter.
     */
    async clearNodeListFilter(): Promise<void> {
        const filterInput = this.nodeList.locator("input[type='text']").first();
        await filterInput.fill("");
        await this.page.waitForTimeout(200);
    }

    /**
     * Serialize the graph and return a structured summary of blocks and their connections.
     * Useful for verifying that multi-block graphs are wired correctly.
     */
    async getGraphTopology(): Promise<{
        blocks: { className: string; signalOuts: { name: string; connectedIds: string[] }[]; signalIns: { name: string; connectedIds: string[] }[] }[];
        totalConnections: number;
    }> {
        const serialized = await this.serializeGraph();
        const parsed = JSON.parse(serialized);
        let totalConnections = 0;
        const blocks = (parsed.allBlocks || []).map((b: any) => {
            const signalOuts = (b.signalOutputs || []).map((p: any) => {
                const ids = p.connectedPointIds || [];
                totalConnections += ids.length;
                return { name: p.name, connectedIds: ids };
            });
            const signalIns = (b.signalInputs || []).map((p: any) => {
                const ids = p.connectedPointIds || [];
                return { name: p.name, connectedIds: ids };
            });
            return { className: b.className, signalOuts, signalIns };
        });
        return { blocks, totalConnections };
    }
}
