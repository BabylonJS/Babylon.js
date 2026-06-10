/**
 * Flow Graph MCP Server – Parse-Ready Structural Validation Tests
 *
 * Validates that JSON exported by FlowGraphManager has the exact structure
 * that Babylon.js ParseCoordinatorAsync/ParseFlowGraphAsync expects at runtime.
 * Verifies classNames, connection shapes, config keys, and context layout.
 */

import { FlowGraphManager, resetUniqueIdCounter } from "../../src/flowGraphManager";
import * as fs from "fs";
import * as path from "path";

// ─── helpers ──────────────────────────────────────────────────────────────

function getBlockId(result: ReturnType<FlowGraphManager["addBlock"]>): number {
    if (typeof result === "string") throw new Error(result);
    return result.id;
}

function parseCoordinator(mgr: FlowGraphManager, name: string): any {
    const json = mgr.exportJSON(name)!;
    expect(json).toBeTruthy();
    return JSON.parse(json);
}

function expectValidConnection(conn: any, type: 0 | 1): void {
    expect(typeof conn.uniqueId).toBe("string");
    expect(typeof conn.name).toBe("string");
    expect(conn._connectionType).toBe(type);
    expect(Array.isArray(conn.connectedPointIds)).toBe(true);
}

// ═══════════════════════════════════════════════════════════════════════════

describe("Flow Graph MCP Server – Parse-Ready Validation", () => {
    beforeEach(() => {
        resetUniqueIdCounter();
    });

    // ── Test 1: Coordinator envelope ─────────────────────────────────────

    it("coordinator JSON has _flowGraphs array and dispatchEventsSynchronously flag", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");
        getBlockId(mgr.addBlock("g", "SceneReadyEvent"));

        const parsed = parseCoordinator(mgr, "g");

        expect(typeof parsed.dispatchEventsSynchronously).toBe("boolean");
        expect(Array.isArray(parsed._flowGraphs)).toBe(true);
        expect(parsed._flowGraphs.length).toBe(1);
    });

    // ── Test 2: Flow graph has allBlocks + executionContexts ─────────────

    it("flow graph has allBlocks array and executionContexts array", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");
        getBlockId(mgr.addBlock("g", "SceneReadyEvent"));

        const parsed = parseCoordinator(mgr, "g");
        const fg = parsed._flowGraphs[0];

        expect(Array.isArray(fg.allBlocks)).toBe(true);
        expect(fg.allBlocks.length).toBe(1);
        expect(Array.isArray(fg.executionContexts)).toBe(true);
        expect(fg.executionContexts.length).toBe(1);
    });

    // ── Test 3: Block className follows FlowGraph*Block convention ───────

    it("all block classNames start with FlowGraph and end with Block", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");
        getBlockId(mgr.addBlock("g", "SceneReadyEvent"));
        getBlockId(mgr.addBlock("g", "ConsoleLog"));
        getBlockId(mgr.addBlock("g", "Branch"));
        getBlockId(mgr.addBlock("g", "Add"));
        getBlockId(mgr.addBlock("g", "Constant"));

        const parsed = parseCoordinator(mgr, "g");
        for (const block of parsed._flowGraphs[0].allBlocks) {
            expect(block.className).toMatch(/^FlowGraph.*Block$/);
        }
    });

    // ── Test 4: Block has all required serialization keys ────────────────

    it("each block has className, uniqueId, config, and 4 connection arrays", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");
        getBlockId(mgr.addBlock("g", "ConsoleLog", "log", { message: "hello" }));

        const parsed = parseCoordinator(mgr, "g");
        const block = parsed._flowGraphs[0].allBlocks[0];

        expect(typeof block.className).toBe("string");
        expect(typeof block.uniqueId).toBe("string");
        expect(typeof block.config).toBe("object");
        expect(Array.isArray(block.dataInputs)).toBe(true);
        expect(Array.isArray(block.dataOutputs)).toBe(true);
        expect(Array.isArray(block.signalInputs)).toBe(true);
        expect(Array.isArray(block.signalOutputs)).toBe(true);
    });

    // ── Test 5: Connection shape validation ──────────────────────────────

    it("connections have uniqueId, name, _connectionType, and connectedPointIds", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");
        const eventId = getBlockId(mgr.addBlock("g", "SceneReadyEvent"));
        const logId = getBlockId(mgr.addBlock("g", "ConsoleLog"));
        mgr.connectSignal("g", eventId, "out", logId, "in");

        const parsed = parseCoordinator(mgr, "g");
        for (const block of parsed._flowGraphs[0].allBlocks) {
            for (const si of block.signalInputs) expectValidConnection(si, 0);
            for (const so of block.signalOutputs) expectValidConnection(so, 1);
            for (const di of block.dataInputs) expectValidConnection(di, 0);
            for (const dout of block.dataOutputs) expectValidConnection(dout, 1);
        }
    });

    // ── Test 6: Signal connections reference valid counterpart ────────────

    it("signal connections reference uniqueIds that exist in the graph", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");
        const eventId = getBlockId(mgr.addBlock("g", "SceneReadyEvent"));
        const branchId = getBlockId(mgr.addBlock("g", "Branch"));
        const log1Id = getBlockId(mgr.addBlock("g", "ConsoleLog", "trueLog"));
        const log2Id = getBlockId(mgr.addBlock("g", "ConsoleLog", "falseLog"));

        mgr.connectSignal("g", eventId, "out", branchId, "in");
        mgr.connectSignal("g", branchId, "onTrue", log1Id, "in");
        mgr.connectSignal("g", branchId, "onFalse", log2Id, "in");

        const parsed = parseCoordinator(mgr, "g");
        const blocks = parsed._flowGraphs[0].allBlocks;

        // Collect all signal input uniqueIds
        const allSignalInIds = new Set<string>();
        for (const block of blocks) {
            for (const si of block.signalInputs) {
                allSignalInIds.add(si.uniqueId);
            }
        }

        // Every signal output's connectedPointIds should reference a signal input
        for (const block of blocks) {
            for (const so of block.signalOutputs) {
                for (const ref of so.connectedPointIds) {
                    expect(allSignalInIds.has(ref)).toBe(true);
                }
            }
        }
    });

    // ── Test 7: Data connections reference valid counterpart ─────────────

    it("data connections reference uniqueIds that exist in the graph", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");
        const constId = getBlockId(mgr.addBlock("g", "Constant", "num", { value: 42 }));
        const addId = getBlockId(mgr.addBlock("g", "Add"));
        mgr.connectData("g", constId, "output", addId, "a");

        const parsed = parseCoordinator(mgr, "g");
        const blocks = parsed._flowGraphs[0].allBlocks;

        // Collect all data output uniqueIds
        const allDataOutIds = new Set<string>();
        for (const block of blocks) {
            for (const dout of block.dataOutputs) {
                allDataOutIds.add(dout.uniqueId);
            }
        }

        // Every data input's connectedPointIds should reference a data output
        for (const block of blocks) {
            for (const di of block.dataInputs) {
                for (const ref of di.connectedPointIds) {
                    expect(allDataOutIds.has(ref)).toBe(true);
                }
            }
        }
    });

    // ── Test 8: Execution context structure ──────────────────────────────

    it("execution context has uniqueId and _userVariables", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");
        mgr.setVariable("g", "score", 100);
        getBlockId(mgr.addBlock("g", "SceneReadyEvent"));

        const parsed = parseCoordinator(mgr, "g");
        const ctx = parsed._flowGraphs[0].executionContexts[0];

        expect(typeof ctx.uniqueId).toBe("string");
        expect(typeof ctx._userVariables).toBe("object");
        expect(ctx._userVariables.score).toBe(100);
    });

    // ── Test 9: Config values survive serialization ──────────────────────

    it("config values are preserved in exported JSON", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");
        getBlockId(mgr.addBlock("g", "Constant", "myConst", { value: 3.14, type: "number" }));
        getBlockId(mgr.addBlock("g", "MeshPickEvent", "pick", { targetMesh: "myMesh" }));
        getBlockId(mgr.addBlock("g", "ReceiveCustomEvent", "rcv", { eventId: "onDamage" }));

        const parsed = parseCoordinator(mgr, "g");
        const blocks = parsed._flowGraphs[0].allBlocks;

        const constBlock = blocks.find((b: any) => b.className === "FlowGraphConstantBlock");
        expect(constBlock.config.value).toBe(3.14);
        expect(constBlock.config.type).toBe("number");

        const pickBlock = blocks.find((b: any) => b.className === "FlowGraphMeshPickEventBlock");
        expect(pickBlock.config.targetMesh).toBe("myMesh");

        const rcvBlock = blocks.find((b: any) => b.className === "FlowGraphReceiveCustomEventBlock");
        expect(rcvBlock.config.eventId).toBe("onDamage");
    });

    // ── Test 10: Data connections include richType metadata ──────────────

    it("data connections include richType and className metadata", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");
        getBlockId(mgr.addBlock("g", "Add"));

        const parsed = parseCoordinator(mgr, "g");
        const block = parsed._flowGraphs[0].allBlocks[0];

        for (const di of block.dataInputs) {
            expect(typeof di.className).toBe("string");
            expect(di.richType).toBeDefined();
            expect(typeof di.richType.typeName).toBe("string");
        }
        for (const dout of block.dataOutputs) {
            expect(typeof dout.className).toBe("string");
        }
    });

    // ── Test 11: Existing example file has valid structure ───────────────

    it("SphereClickRotateGround.flowgraph.json has valid coordinator structure", () => {
        const examplePath = path.resolve(__dirname, "..", "..", "SphereClickRotateGround.flowgraph.json");
        if (!fs.existsSync(examplePath)) {
            // Skip if the example file doesn't exist
            return;
        }
        const json = fs.readFileSync(examplePath, "utf-8");
        const parsed = JSON.parse(json);

        expect(parsed._flowGraphs).toBeDefined();
        expect(Array.isArray(parsed._flowGraphs)).toBe(true);
        expect(parsed._flowGraphs.length).toBeGreaterThan(0);

        const fg = parsed._flowGraphs[0];
        expect(Array.isArray(fg.allBlocks)).toBe(true);
        expect(Array.isArray(fg.executionContexts)).toBe(true);

        for (const block of fg.allBlocks) {
            expect(typeof block.className).toBe("string");
            expect(block.className).toMatch(/^FlowGraph/);
            expect(typeof block.uniqueId).toBe("string");
        }
    });

    // ── Test 12: Import existing example and re-export matches ───────────

    it("imports SphereClickRotateGround example and re-exports with same block count", () => {
        const examplePath = path.resolve(__dirname, "..", "..", "SphereClickRotateGround.flowgraph.json");
        if (!fs.existsSync(examplePath)) {
            return;
        }
        const json = fs.readFileSync(examplePath, "utf-8");
        const original = JSON.parse(json);

        const mgr = new FlowGraphManager();
        const result = mgr.importJSON("imported", json);
        expect(result).toBe("OK");

        const reexported = mgr.exportJSON("imported")!;
        const parsed = JSON.parse(reexported);

        expect(parsed._flowGraphs[0].allBlocks.length).toBe(original._flowGraphs[0].allBlocks.length);
    });

    // ── Test 13: Generated examples have valid structure ─────────────────

    it("all generated example files have valid coordinator structure", () => {
        const examplesDir = path.resolve(__dirname, "..", "..", "examples");
        if (!fs.existsSync(examplesDir)) {
            return;
        }

        const files = fs.readdirSync(examplesDir).filter((f) => f.endsWith(".json"));
        expect(files.length).toBeGreaterThan(0);

        for (const file of files) {
            const json = fs.readFileSync(path.join(examplesDir, file), "utf-8");
            const parsed = JSON.parse(json);

            expect(parsed._flowGraphs).toBeDefined();
            expect(parsed._flowGraphs.length).toBe(1);

            const fg = parsed._flowGraphs[0];
            expect(Array.isArray(fg.allBlocks)).toBe(true);
            expect(Array.isArray(fg.executionContexts)).toBe(true);

            for (const block of fg.allBlocks) {
                expect(block.className).toMatch(/^FlowGraph.*Block$/);
                expect(typeof block.uniqueId).toBe("string");
                expect(Array.isArray(block.dataInputs)).toBe(true);
                expect(Array.isArray(block.dataOutputs)).toBe(true);
                expect(Array.isArray(block.signalInputs)).toBe(true);
                expect(Array.isArray(block.signalOutputs)).toBe(true);
            }
        }
    });

    // ── Test 14: UniqueIds are unique across graph ──────────────────────

    it("all uniqueIds across blocks and connections are unique", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");
        const eventId = getBlockId(mgr.addBlock("g", "SceneReadyEvent"));
        const branchId = getBlockId(mgr.addBlock("g", "Branch"));
        const constId = getBlockId(mgr.addBlock("g", "Constant", "num", { value: 1 }));
        const logId = getBlockId(mgr.addBlock("g", "ConsoleLog"));

        mgr.connectSignal("g", eventId, "out", branchId, "in");
        mgr.connectSignal("g", branchId, "onTrue", logId, "in");
        mgr.connectData("g", constId, "output", branchId, "condition");

        const parsed = parseCoordinator(mgr, "g");
        const allIds = new Set<string>();

        for (const block of parsed._flowGraphs[0].allBlocks) {
            expect(allIds.has(block.uniqueId)).toBe(false);
            allIds.add(block.uniqueId);

            for (const conn of [...block.signalInputs, ...block.signalOutputs, ...block.dataInputs, ...block.dataOutputs]) {
                expect(allIds.has(conn.uniqueId)).toBe(false);
                allIds.add(conn.uniqueId);
            }
        }
    });

    // ── Test 15: Graph-level export has same blocks as coordinator ───────

    it("graph-level export has same block structure as coordinator export", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");
        getBlockId(mgr.addBlock("g", "SceneReadyEvent"));
        getBlockId(mgr.addBlock("g", "ConsoleLog"));

        const coordJson = JSON.parse(mgr.exportJSON("g")!);
        const graphJson = JSON.parse(mgr.exportGraphJSON("g")!);

        // Graph-level should have allBlocks and executionContexts directly
        expect(graphJson.allBlocks.length).toBe(coordJson._flowGraphs[0].allBlocks.length);
        expect(graphJson.executionContexts.length).toBe(coordJson._flowGraphs[0].executionContexts.length);
        expect(graphJson._flowGraphs).toBeUndefined();
    });
});
