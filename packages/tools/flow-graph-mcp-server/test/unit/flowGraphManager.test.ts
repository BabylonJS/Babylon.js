/**
 * Flow Graph MCP Server – FlowGraphManager Validation Tests
 *
 * Creates flow graphs via FlowGraphManager, exports them to JSON,
 * validates the JSON structure, and exercises core operations.
 */

import { FlowGraphManager, resetUniqueIdCounter } from "../../src/flowGraphManager";
import { FlowGraphBlockRegistry } from "../../src/blockRegistry";

// ─── Test Helpers ─────────────────────────────────────────────────────────

function getBlockId(result: ReturnType<FlowGraphManager["addBlock"]>): number {
    if (typeof result === "string") {
        throw new Error(result);
    }
    return result.id;
}

function getBlockResult(result: ReturnType<FlowGraphManager["addBlock"]>): { id: number; name: string; uniqueId: string; warnings?: string[] } {
    if (typeof result === "string") {
        throw new Error(result);
    }
    return result;
}

function validateCoordinatorJSON(json: string, label: string): any {
    let parsed: any;
    try {
        parsed = JSON.parse(json);
    } catch {
        throw new Error(`${label}: invalid JSON`);
    }
    expect(parsed._flowGraphs).toBeDefined();
    expect(Array.isArray(parsed._flowGraphs)).toBe(true);
    expect(parsed._flowGraphs.length).toBe(1);
    expect(Array.isArray(parsed._flowGraphs[0].allBlocks)).toBe(true);
    expect(Array.isArray(parsed._flowGraphs[0].executionContexts)).toBe(true);
    expect(typeof parsed.dispatchEventsSynchronously).toBe("boolean");
    return parsed;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Tests
// ═══════════════════════════════════════════════════════════════════════════

describe("Flow Graph MCP Server – FlowGraphManager Validation", () => {
    beforeEach(() => {
        resetUniqueIdCounter();
    });

    // ── Test 1: Basic lifecycle ─────────────────────────────────────────

    it("supports create, list, delete lifecycle", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("a");
        mgr.createGraph("b");

        const list = mgr.listGraphs();
        expect(list).toContain("a");
        expect(list).toContain("b");

        expect(mgr.deleteGraph("a")).toBe(true);
        expect(mgr.listGraphs()).not.toContain("a");
        expect(mgr.deleteGraph("nonexistent")).toBe(false);
    });

    // ── Test 2: Create graph with default context ───────────────────────

    it("creates graph with one default execution context", () => {
        const mgr = new FlowGraphManager();
        const graph = mgr.createGraph("test");
        expect(graph.contexts.length).toBe(1);
        expect(graph.contexts[0]._userVariables).toEqual({});
        expect(graph.contexts[0].uniqueId).toBeDefined();
    });

    // ── Test 3: Add blocks ────────────────────────────────────────────

    it("adds blocks with auto-generated and custom names", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");

        const r1 = getBlockResult(mgr.addBlock("g", "SceneReadyEvent"));
        expect(r1.id).toBe(1);
        expect(r1.name).toContain("SceneReadyEvent");

        const r2 = getBlockResult(mgr.addBlock("g", "ConsoleLog", "myLogger"));
        expect(r2.id).toBe(2);
        expect(r2.name).toBe("myLogger");
    });

    // ── Test 4: Unknown block type ──────────────────────────────────────

    it("rejects unknown block types", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");

        const result = mgr.addBlock("g", "NonExistentBlock");
        expect(typeof result).toBe("string");
        expect(result as string).toContain("Unknown block type");
    });

    // ── Test 5: Missing graph error ─────────────────────────────────────

    it("returns errors when graph not found", () => {
        const mgr = new FlowGraphManager();

        expect(typeof mgr.addBlock("nope", "ConsoleLog")).toBe("string");
        expect(mgr.removeBlock("nope", 1)).toContain("not found");
        expect(mgr.setBlockConfig("nope", 1, {})).toContain("not found");
        expect(mgr.connectSignal("nope", 1, "out", 2, "in")).toContain("not found");
        expect(mgr.connectData("nope", 1, "out", 2, "in")).toContain("not found");
        expect(mgr.exportJSON("nope")).toBeNull();
        expect(mgr.validateGraph("nope")[0]).toContain("not found");
    });

    // ── Test 6: Signal connections ───────────────────────────────────────

    it("connects signal output to signal input", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");

        const eventId = getBlockId(mgr.addBlock("g", "SceneReadyEvent"));
        const logId = getBlockId(mgr.addBlock("g", "ConsoleLog", "log", { message: "Hello!" }));

        // SceneReadyEvent has both "out" and "done"; connecting "out" auto-remaps to "done"
        expect(mgr.connectSignal("g", eventId, "out", logId, "in")).toBe("OK");

        // Verify the connection
        const graph = mgr.getGraph("g")!;
        const event = graph.blocks.find((b) => b.id === eventId)!;
        const log = graph.blocks.find((b) => b.id === logId)!;
        const doneSignal = event.serialized.signalOutputs.find((o) => o.name === "done")!;
        const inSignal = log.serialized.signalInputs.find((i) => i.name === "in")!;

        // Signal connections: output stores input's uniqueId
        expect(doneSignal.connectedPointIds).toContain(inSignal.uniqueId);
    });

    // ── Test 7: Data connections ────────────────────────────────────────

    it("connects data output to data input", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");

        const constId = getBlockId(mgr.addBlock("g", "Constant", "num42", { value: 42 }));
        const addId = getBlockId(mgr.addBlock("g", "Add", "adder"));

        expect(mgr.connectData("g", constId, "output", addId, "a")).toBe("OK");

        // Data connections: input stores output's uniqueId
        const graph = mgr.getGraph("g")!;
        const constBlock = graph.blocks.find((b) => b.id === constId)!;
        const addBlock = graph.blocks.find((b) => b.id === addId)!;
        const output = constBlock.serialized.dataOutputs.find((o) => o.name === "output")!;
        const input = addBlock.serialized.dataInputs.find((i) => i.name === "a")!;

        expect(input.connectedPointIds).toContain(output.uniqueId);
    });

    // ── Test 8: Signal output→done auto-remap for event blocks ──────────

    it("auto-remaps 'out' to 'done' for event blocks with done output", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");

        const pickId = getBlockId(mgr.addBlock("g", "MeshPickEvent"));
        const logId = getBlockId(mgr.addBlock("g", "ConsoleLog"));

        // Connecting "out" should actually connect "done" for MeshPickEvent
        expect(mgr.connectSignal("g", pickId, "out", logId, "in")).toBe("OK");

        const graph = mgr.getGraph("g")!;
        const pick = graph.blocks.find((b) => b.id === pickId)!;
        const log = graph.blocks.find((b) => b.id === logId)!;
        const doneSignal = pick.serialized.signalOutputs.find((o) => o.name === "done")!;
        const inSignal = log.serialized.signalInputs.find((i) => i.name === "in")!;

        expect(doneSignal.connectedPointIds).toContain(inSignal.uniqueId);
    });

    // ── Test 9: Data port alias resolution ──────────────────────────────

    it("resolves data port aliases (value↔output, value↔input)", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");

        const constId = getBlockId(mgr.addBlock("g", "Constant", "c"));
        const logId = getBlockId(mgr.addBlock("g", "ConsoleLog"));

        // "value" is an alias for "output" on Constant
        expect(mgr.connectData("g", constId, "value", logId, "message")).toBe("OK");
    });

    // ── Test 10: Disconnect signal ──────────────────────────────────────

    it("disconnects signal output", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");

        const eventId = getBlockId(mgr.addBlock("g", "SceneReadyEvent"));
        const logId = getBlockId(mgr.addBlock("g", "ConsoleLog"));

        mgr.connectSignal("g", eventId, "out", logId, "in");
        expect(mgr.disconnectSignal("g", eventId, "out")).toBe("OK");

        const graph = mgr.getGraph("g")!;
        const event = graph.blocks.find((b) => b.id === eventId)!;
        const outSignal = event.serialized.signalOutputs.find((o) => o.name === "out")!;
        expect(outSignal.connectedPointIds.length).toBe(0);
    });

    // ── Test 11: Disconnect data ────────────────────────────────────────

    it("disconnects data input", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");

        const constId = getBlockId(mgr.addBlock("g", "Constant"));
        const logId = getBlockId(mgr.addBlock("g", "ConsoleLog"));

        mgr.connectData("g", constId, "output", logId, "message");
        expect(mgr.disconnectData("g", logId, "message")).toBe("OK");

        const graph = mgr.getGraph("g")!;
        const log = graph.blocks.find((b) => b.id === logId)!;
        const msgInput = log.serialized.dataInputs.find((i) => i.name === "message")!;
        expect(msgInput.connectedPointIds.length).toBe(0);
    });

    // ── Test 12: Remove block cleans up connections ─────────────────────

    it("removes block and cleans up all connections", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");

        const eventId = getBlockId(mgr.addBlock("g", "SceneReadyEvent"));
        const logId = getBlockId(mgr.addBlock("g", "ConsoleLog"));

        mgr.connectSignal("g", eventId, "out", logId, "in");
        expect(mgr.removeBlock("g", logId)).toBe("OK");

        const graph = mgr.getGraph("g")!;
        expect(graph.blocks.length).toBe(1);

        // The event's signal output should be cleaned up
        const event = graph.blocks[0];
        const outSignal = event.serialized.signalOutputs.find((o) => o.name === "out")!;
        expect(outSignal.connectedPointIds.length).toBe(0);
    });

    // ── Test 13: Set block config ───────────────────────────────────────

    it("merges config into existing block", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");

        const logId = getBlockId(mgr.addBlock("g", "ConsoleLog", "log", { message: "initial" }));
        expect(mgr.setBlockConfig("g", logId, { message: "updated" })).toBe("OK");

        const graph = mgr.getGraph("g")!;
        const log = graph.blocks.find((b) => b.id === logId)!;
        expect(log.serialized.config.message).toBe("updated");
    });

    // ── Test 14: Config alias normalization ──────────────────────────────

    it("normalizes config aliases (variableName→variable, eventName→eventId)", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");

        const setVarId = getBlockId(mgr.addBlock("g", "SetVariable", "sv", { variableName: "counter" }));
        const graph = mgr.getGraph("g")!;
        const setVar = graph.blocks.find((b) => b.id === setVarId)!;
        expect(setVar.serialized.config.variable).toBe("counter");
        expect(setVar.serialized.config.variableName).toBeUndefined();
    });

    // ── Test 15: Context variables ──────────────────────────────────────

    it("sets and retrieves context variables", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");

        expect(mgr.setVariable("g", "score", 0)).toBe("OK");
        expect(mgr.setVariable("g", "playerName", "Alice")).toBe("OK");

        const graph = mgr.getGraph("g")!;
        expect(graph.contexts[0]._userVariables.score).toBe(0);
        expect(graph.contexts[0]._userVariables.playerName).toBe("Alice");
    });

    // ── Test 16: Dynamic signal outputs (Sequence) ──────────────────────

    it("generates dynamic signal outputs for Sequence block", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");

        const seqId = getBlockId(mgr.addBlock("g", "Sequence", "seq", { outputSignalCount: 3 }));
        const graph = mgr.getGraph("g")!;
        const seq = graph.blocks.find((b) => b.id === seqId)!;

        const outNames = seq.serialized.signalOutputs.map((o) => o.name);
        expect(outNames).toContain("out_0");
        expect(outNames).toContain("out_1");
        expect(outNames).toContain("out_2");
    });

    // ── Test 17: Dynamic signal outputs (Switch with cases) ─────────────

    it("generates case signal outputs for Switch block", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");

        const switchId = getBlockId(mgr.addBlock("g", "Switch", "sw", { cases: ["a", "b", "c"] }));
        const graph = mgr.getGraph("g")!;
        const sw = graph.blocks.find((b) => b.id === switchId)!;

        const outNames = sw.serialized.signalOutputs.map((o) => o.name);
        expect(outNames).toContain("case_0");
        expect(outNames).toContain("case_1");
        expect(outNames).toContain("case_2");
    });

    // ── Test 18: Dynamic signal inputs (WaitAll) ────────────────────────

    it("generates dynamic signal inputs for WaitAll block", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");

        const waitId = getBlockId(mgr.addBlock("g", "WaitAll", "wait", { inputSignalCount: 2 }));
        const graph = mgr.getGraph("g")!;
        const wait = graph.blocks.find((b) => b.id === waitId)!;

        const inNames = wait.serialized.signalInputs.map((i) => i.name);
        expect(inNames).toContain("in_0");
        expect(inNames).toContain("in_1");
    });

    // ── Test 19: Config-to-data-input propagation ───────────────────────

    it("propagates config values to matching data input defaults", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");

        const delayId = getBlockId(mgr.addBlock("g", "SetDelay", "delay", { duration: 2000 }));
        const graph = mgr.getGraph("g")!;
        const delay = graph.blocks.find((b) => b.id === delayId)!;

        const durationInput = delay.serialized.dataInputs.find((i) => i.name === "duration");
        expect(durationInput).toBeDefined();
        expect(durationInput!.defaultValue).toBe(2000);
    });

    // ── Test 20: Config key warning for unknown keys ────────────────────

    it("warns about unknown config keys", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");

        const result = getBlockResult(mgr.addBlock("g", "ConsoleLog", "log", { message: "ok", bogusKey: 123 }));
        expect(result.warnings).toBeDefined();
        expect(result.warnings!.some((w) => w.includes("bogusKey"))).toBe(true);
    });

    // ── Test 21: Export coordinator JSON ─────────────────────────────────

    it("exports valid coordinator-level JSON", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");

        getBlockId(mgr.addBlock("g", "SceneReadyEvent", "event"));
        getBlockId(mgr.addBlock("g", "ConsoleLog", "log", { message: "hello" }));

        const json = mgr.exportJSON("g")!;
        const parsed = validateCoordinatorJSON(json, "coordinator export");

        expect(parsed._flowGraphs[0].allBlocks.length).toBe(2);

        // Verify block structure
        const block0 = parsed._flowGraphs[0].allBlocks[0];
        expect(block0.className).toBeDefined();
        expect(block0.uniqueId).toBeDefined();
        expect(Array.isArray(block0.dataInputs)).toBe(true);
        expect(Array.isArray(block0.dataOutputs)).toBe(true);
        expect(Array.isArray(block0.signalInputs)).toBe(true);
        expect(Array.isArray(block0.signalOutputs)).toBe(true);
    });

    // ── Test 22: Export graph-level JSON ─────────────────────────────────

    it("exports graph-level JSON (without coordinator wrapper)", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");

        getBlockId(mgr.addBlock("g", "SceneReadyEvent"));

        const json = mgr.exportGraphJSON("g")!;
        const parsed = JSON.parse(json);

        expect(parsed.allBlocks).toBeDefined();
        expect(parsed.executionContexts).toBeDefined();
        expect(parsed._flowGraphs).toBeUndefined();
    });

    // ── Test 23: Import coordinator JSON round-trip ──────────────────────

    it("round-trips through coordinator-level export and import", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("original");

        const eventId = getBlockId(mgr.addBlock("original", "SceneReadyEvent", "event"));
        const logId = getBlockId(mgr.addBlock("original", "ConsoleLog", "log", { message: "test" }));
        mgr.connectSignal("original", eventId, "out", logId, "in");

        const json1 = mgr.exportJSON("original")!;
        expect(mgr.importJSON("copy", json1)).toBe("OK");

        const json2 = mgr.exportJSON("copy")!;
        const parsed1 = JSON.parse(json1);
        const parsed2 = JSON.parse(json2);

        expect(parsed2._flowGraphs[0].allBlocks.length).toBe(parsed1._flowGraphs[0].allBlocks.length);
    });

    // ── Test 24: Import graph-level JSON ─────────────────────────────────

    it("imports graph-level JSON (without coordinator wrapper)", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("src");

        getBlockId(mgr.addBlock("src", "SceneReadyEvent"));
        const graphJson = mgr.exportGraphJSON("src")!;

        expect(mgr.importJSON("dest", graphJson)).toBe("OK");
        const graph = mgr.getGraph("dest");
        expect(graph).toBeDefined();
        expect(graph!.blocks.length).toBe(1);
    });

    // ── Test 25: Validation - empty graph ───────────────────────────────

    it("validation warns on empty graph", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");

        const issues = mgr.validateGraph("g");
        expect(issues.some((i) => i.includes("empty"))).toBe(true);
    });

    // ── Test 26: Validation - no event blocks ───────────────────────────

    it("validation warns when no event blocks present", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");

        getBlockId(mgr.addBlock("g", "ConsoleLog"));

        const issues = mgr.validateGraph("g");
        expect(issues.some((i) => i.includes("No event blocks"))).toBe(true);
    });

    // ── Test 27: Validation - unconnected signal input ──────────────────

    it("validation warns about execution blocks with no incoming signal", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");

        getBlockId(mgr.addBlock("g", "SceneReadyEvent"));
        getBlockId(mgr.addBlock("g", "ConsoleLog", "orphanedLog"));

        const issues = mgr.validateGraph("g");
        expect(issues.some((i) => i.includes("orphanedLog") && i.includes("no incoming signal"))).toBe(true);
    });

    // ── Test 28: Validation - valid graph passes ────────────────────────

    it("validation passes on a well-formed graph", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");

        const eventId = getBlockId(mgr.addBlock("g", "SceneReadyEvent", "event"));
        const logId = getBlockId(mgr.addBlock("g", "ConsoleLog", "log", { message: "hello" }));
        mgr.connectSignal("g", eventId, "out", logId, "in");

        const issues = mgr.validateGraph("g");
        expect(issues.some((i) => i.includes("No issues found"))).toBe(true);
    });

    // ── Test 29: Validation - mesh event without target ─────────────────

    it("validation warns about MeshPickEvent without target mesh", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");

        getBlockId(mgr.addBlock("g", "MeshPickEvent", "pick"));

        const issues = mgr.validateGraph("g");
        expect(issues.some((i) => i.includes("no target mesh"))).toBe(true);
    });

    // ── Test 30: Describe graph ─────────────────────────────────────────

    it("describeGraph returns useful Markdown output", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");

        const eventId = getBlockId(mgr.addBlock("g", "SceneReadyEvent", "event"));
        const logId = getBlockId(mgr.addBlock("g", "ConsoleLog", "log"));
        mgr.connectSignal("g", eventId, "out", logId, "in");

        const desc = mgr.describeGraph("g");
        expect(desc).toContain("Flow Graph: g");
        expect(desc).toContain("event");
        expect(desc).toContain("log");
        expect(desc).toContain("connected");
    });

    // ── Test 31: Describe block ─────────────────────────────────────────

    it("describeBlock returns detailed block information", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");

        const logId = getBlockId(mgr.addBlock("g", "ConsoleLog", "myLog", { message: "test" }));

        const desc = mgr.describeBlock("g", logId);
        expect(desc).toContain("myLog");
        expect(desc).toContain("ConsoleLog");
        expect(desc).toContain("message");
        expect(desc).toContain("Signal Inputs");
    });

    // ── Test 32: Block registry completeness ────────────────────────────

    it("block registry has all major categories", () => {
        const categories = new Set<string>();
        for (const info of Object.values(FlowGraphBlockRegistry)) {
            categories.add(info.category);
        }

        for (const expected of ["Event", "Execution", "ControlFlow", "Animation", "Data", "Math", "Vector", "Matrix", "Combine", "Extract", "Conversion", "Utility"]) {
            expect(categories.has(expected)).toBe(true);
        }
    });

    // ── Test 33: Event blocks have correct signal structure ─────────────

    it("event blocks have out/done signal outputs", () => {
        const eventTypes = ["SceneReadyEvent", "SceneTickEvent", "MeshPickEvent"];
        for (const type of eventTypes) {
            const info = FlowGraphBlockRegistry[type];
            expect(info).toBeDefined();
            expect(info.category).toBe("Event");
            const outNames = info.signalOutputs.map((o) => o.name);
            expect(outNames).toContain("out");
            expect(outNames).toContain("done");
        }
    });

    // ── Test 34: Branch block structure ──────────────────────────────────

    it("Branch block has correct signal and data structure", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");

        const branchId = getBlockId(mgr.addBlock("g", "Branch"));
        const graph = mgr.getGraph("g")!;
        const branch = graph.blocks.find((b) => b.id === branchId)!;

        // Signal: in, onTrue, onFalse
        const sigInNames = branch.serialized.signalInputs.map((i) => i.name);
        expect(sigInNames).toContain("in");

        const sigOutNames = branch.serialized.signalOutputs.map((o) => o.name);
        expect(sigOutNames).toContain("onTrue");
        expect(sigOutNames).toContain("onFalse");

        // Data: condition input
        const dataInNames = branch.serialized.dataInputs.map((i) => i.name);
        expect(dataInNames).toContain("condition");
    });

    // ── Test 35: Data connection has rich type metadata ──────────────────

    it("data connections have rich type metadata", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");

        const addId = getBlockId(mgr.addBlock("g", "Add"));
        const graph = mgr.getGraph("g")!;
        const add = graph.blocks.find((b) => b.id === addId)!;

        const inputA = add.serialized.dataInputs.find((i) => i.name === "a")!;
        expect(inputA.richType).toBeDefined();
        expect(inputA.richType!.typeName).toBeDefined();
        expect(inputA.className).toBe("FlowGraphDataConnection");
    });

    // ── Test 36: Connection error handling ───────────────────────────────

    it("returns errors for invalid connections", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");

        const eventId = getBlockId(mgr.addBlock("g", "SceneReadyEvent"));
        const logId = getBlockId(mgr.addBlock("g", "ConsoleLog"));

        // Non-existent output
        expect(mgr.connectSignal("g", eventId, "nonexistent", logId, "in")).toContain("not found");
        // Non-existent input
        expect(mgr.connectSignal("g", eventId, "out", logId, "nonexistent")).toContain("not found");
        // Non-existent block
        expect(mgr.connectSignal("g", 999, "out", logId, "in")).toContain("not found");

        // Data connection errors
        expect(mgr.connectData("g", eventId, "nonexistent", logId, "message")).toContain("not found");
    });

    // ── Test 37: Disconnect error handling ───────────────────────────────

    it("returns errors for invalid disconnect operations", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");

        expect(mgr.disconnectSignal("g", 999, "out")).toContain("not found");
        expect(mgr.disconnectData("g", 999, "in")).toContain("not found");

        const logId = getBlockId(mgr.addBlock("g", "ConsoleLog"));
        expect(mgr.disconnectSignal("g", logId, "nonexistent")).toContain("not found");
        expect(mgr.disconnectData("g", logId, "nonexistent")).toContain("not found");
    });

    // ── Test 38: Complex flow (Branch + ConsoleLog) ─────────────────────

    it("builds a complete branching flow", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");

        const eventId = getBlockId(mgr.addBlock("g", "SceneReadyEvent", "start"));
        const branchId = getBlockId(mgr.addBlock("g", "Branch", "check"));
        const trueLogId = getBlockId(mgr.addBlock("g", "ConsoleLog", "trueLog", { message: "True!" }));
        const falseLogId = getBlockId(mgr.addBlock("g", "ConsoleLog", "falseLog", { message: "False!" }));

        mgr.connectSignal("g", eventId, "out", branchId, "in");
        mgr.connectSignal("g", branchId, "onTrue", trueLogId, "in");
        mgr.connectSignal("g", branchId, "onFalse", falseLogId, "in");

        const json = mgr.exportJSON("g")!;
        const parsed = validateCoordinatorJSON(json, "branch flow");
        expect(parsed._flowGraphs[0].allBlocks.length).toBe(4);

        const issues = mgr.validateGraph("g");
        // Should only warn about unconnected "condition" data input
        expect(issues.every((i) => !i.startsWith("ERROR"))).toBe(true);
    });

    // ── Test 39: ForLoop block structure ─────────────────────────────────

    it("ForLoop block has correct signal/data structure", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");

        const loopId = getBlockId(mgr.addBlock("g", "ForLoop"));
        const graph = mgr.getGraph("g")!;
        const loop = graph.blocks.find((b) => b.id === loopId)!;

        const sigInNames = loop.serialized.signalInputs.map((i) => i.name);
        expect(sigInNames).toContain("in");

        const sigOutNames = loop.serialized.signalOutputs.map((o) => o.name);
        expect(sigOutNames).toContain("executionFlow");
        expect(sigOutNames).toContain("completed");

        // Data inputs for loop bounds
        const dataInNames = loop.serialized.dataInputs.map((i) => i.name);
        expect(dataInNames).toContain("startIndex");
        expect(dataInNames).toContain("endIndex");
        expect(dataInNames).toContain("step");

        // Data output for index
        const dataOutNames = loop.serialized.dataOutputs.map((o) => o.name);
        expect(dataOutNames).toContain("index");
    });

    // ── Test 40: Idempotent signal connections ──────────────────────────

    it("does not duplicate signal connections on repeated connect", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");

        const eventId = getBlockId(mgr.addBlock("g", "SceneReadyEvent"));
        const logId = getBlockId(mgr.addBlock("g", "ConsoleLog"));

        // SceneReadyEvent auto-remaps "out" to "done"
        mgr.connectSignal("g", eventId, "out", logId, "in");
        mgr.connectSignal("g", eventId, "out", logId, "in"); // duplicate

        const graph = mgr.getGraph("g")!;
        const event = graph.blocks[0];
        const doneSignal = event.serialized.signalOutputs.find((o) => o.name === "done")!;
        expect(doneSignal.connectedPointIds.length).toBe(1);
    });

    // ── Test 41: Block resolution by className ──────────────────────────

    it("resolves blocks by registry key or className", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");

        // By registry key
        getBlockId(mgr.addBlock("g", "ConsoleLog"));
        // By className
        getBlockId(mgr.addBlock("g", "FlowGraphConsoleLogBlock"));

        const graph = mgr.getGraph("g")!;
        expect(graph.blocks[0].serialized.className).toBe("FlowGraphConsoleLogBlock");
        expect(graph.blocks[1].serialized.className).toBe("FlowGraphConsoleLogBlock");
    });

    // ── Test 42: Import invalid JSON ────────────────────────────────────

    it("rejects invalid JSON on import", () => {
        const mgr = new FlowGraphManager();

        expect(mgr.importJSON("g", "not json")).toContain("Failed to parse");
        expect(mgr.importJSON("g", '{"random":"data"}')).toContain("Invalid Flow Graph JSON");
        expect(mgr.importJSON("g", '{"_flowGraphs":[]}')).toContain("Invalid Flow Graph JSON");
        expect(mgr.importJSON("g", '{"_flowGraphs":[{"name":"bad"}]}')).toContain("Invalid Flow Graph JSON");
    });

    // ── Test 43: SetBlockConfig on missing block ────────────────────────

    it("setBlockConfig returns error on missing block", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");

        expect(mgr.setBlockConfig("g", 999, { test: true })).toContain("not found");
    });

    // ── Test 44: SetVariable on missing graph ───────────────────────────

    it("setVariable returns error on missing graph", () => {
        const mgr = new FlowGraphManager();

        expect(mgr.setVariable("nope", "x", 1)).toContain("not found");
    });

    // ── Test 45: Math blocks have correct structure ─────────────────────

    it("math blocks have expected inputs and outputs", () => {
        // Test unary: Abs
        const absInfo = FlowGraphBlockRegistry["Abs"];
        expect(absInfo).toBeDefined();
        expect(absInfo.dataInputs.length).toBe(1);
        expect(absInfo.dataOutputs.length).toBeGreaterThanOrEqual(1);

        // Test binary: Add
        const addInfo = FlowGraphBlockRegistry["Add"];
        expect(addInfo).toBeDefined();
        expect(addInfo.dataInputs.length).toBe(2);
        expect(addInfo.dataOutputs.length).toBeGreaterThanOrEqual(1);

        // Test ternary: Clamp
        const clampInfo = FlowGraphBlockRegistry["Clamp"];
        expect(clampInfo).toBeDefined();
        expect(clampInfo.dataInputs.length).toBe(3);
        expect(clampInfo.dataOutputs.length).toBeGreaterThanOrEqual(1);
    });

    // ── Test 46: Export includes context variables ──────────────────────

    it("export includes context variables", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");

        mgr.setVariable("g", "health", 100);
        mgr.setVariable("g", "name", "Player1");

        const json = mgr.exportJSON("g")!;
        const parsed = JSON.parse(json);

        const ctx = parsed._flowGraphs[0].executionContexts[0];
        expect(ctx._userVariables.health).toBe(100);
        expect(ctx._userVariables.name).toBe("Player1");
    });

    // ── Test 47: Animation blocks have correct structure ────────────────

    it("PlayAnimation block has correct signal/data structure", () => {
        const info = FlowGraphBlockRegistry["PlayAnimation"];
        expect(info).toBeDefined();
        expect(info.category).toBe("Animation");
        const sigInNames = info.signalInputs.map((i) => i.name);
        expect(sigInNames).toContain("in");
        const sigOutNames = info.signalOutputs.map((o) => o.name);
        expect(sigOutNames).toContain("out");
        expect(sigOutNames).toContain("done");
    });

    // ── Test 48: Connection type values ─────────────────────────────────

    it("connections have correct _connectionType values (0=Input, 1=Output)", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("g");

        getBlockId(mgr.addBlock("g", "ConsoleLog"));
        const graph = mgr.getGraph("g")!;
        const log = graph.blocks[0];

        for (const si of log.serialized.signalInputs) {
            expect(si._connectionType).toBe(0);
        }
        for (const so of log.serialized.signalOutputs) {
            expect(so._connectionType).toBe(1);
        }
        for (const di of log.serialized.dataInputs) {
            expect(di._connectionType).toBe(0);
        }
        for (const dout of log.serialized.dataOutputs) {
            expect(dout._connectionType).toBe(1);
        }
    });

    // ── Test 49: Conversion blocks ──────────────────────────────────────

    it("conversion blocks exist and have correct types", () => {
        const conversions = ["BooleanToFloat", "BooleanToInt", "FloatToBoolean", "IntToBoolean", "IntToFloat", "FloatToInt"];
        for (const name of conversions) {
            const info = FlowGraphBlockRegistry[name];
            expect(info).toBeDefined();
            expect(info.category).toBe("Conversion");
            expect(info.dataInputs.length).toBeGreaterThanOrEqual(1);
            expect(info.dataOutputs.length).toBeGreaterThanOrEqual(1);
        }
    });

    // ── Test 50: Combine/Extract blocks ─────────────────────────────────

    it("Combine/Extract blocks exist for Vector2/3/4 and Matrix", () => {
        for (const dim of ["Vector2", "Vector3", "Vector4", "Matrix"]) {
            const combine = FlowGraphBlockRegistry[`Combine${dim}`];
            const extract = FlowGraphBlockRegistry[`Extract${dim}`];
            expect(combine).toBeDefined();
            expect(extract).toBeDefined();
            expect(combine.category).toBe("Combine");
            expect(extract.category).toBe("Extract");
        }
    });

    // ── clearAll ────────────────────────────────────────────────────────

    it("clearAll removes all graphs and resets state", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("a");
        mgr.createGraph("b");
        expect(mgr.listGraphs().length).toBe(2);

        mgr.clearAll();
        expect(mgr.listGraphs()).toEqual([]);
        expect(mgr.getGraph("a")).toBeUndefined();
        expect(mgr.getGraph("b")).toBeUndefined();

        // Can create new graphs after clear
        mgr.createGraph("c");
        expect(mgr.listGraphs()).toEqual(["c"]);
    });

    it("clearAll on empty manager is a no-op", () => {
        const mgr = new FlowGraphManager();
        mgr.clearAll();
        expect(mgr.listGraphs()).toEqual([]);
    });
});
