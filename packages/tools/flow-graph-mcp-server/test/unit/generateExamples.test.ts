/**
 * Flow Graph MCP Server – Example Flow Graph Generation Tests
 *
 * Builds 5 complete flow graphs via FlowGraphManager, exports them,
 * and validates the coordinator-level JSON structure.
 */

import { FlowGraphManager, resetUniqueIdCounter } from "../../src/flowGraphManager";

// ─── helpers ──────────────────────────────────────────────────────────────

function getBlockId(result: ReturnType<FlowGraphManager["addBlock"]>): number {
    if (typeof result === "string") throw new Error(result);
    return result.id;
}

function ok(result: string): void {
    expect(result).toBe("OK");
}

function validateCoordinator(json: string): any {
    const parsed = JSON.parse(json);
    expect(parsed._flowGraphs).toBeDefined();
    expect(parsed._flowGraphs.length).toBe(1);
    const fg = parsed._flowGraphs[0];
    expect(Array.isArray(fg.allBlocks)).toBe(true);
    expect(Array.isArray(fg.executionContexts)).toBe(true);
    return parsed;
}

// ═══════════════════════════════════════════════════════════════════════════

describe("Flow Graph MCP Server – Example Flow Graphs", () => {
    beforeEach(() => {
        resetUniqueIdCounter();
    });

    // ── Example 1: Click → Console Log ───────────────────────────────────
    // Scenario: When a mesh is picked, log "Clicked!" to the console.

    it("Example 1 – Click Logger", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("ClickLogger");

        const pickId = getBlockId(mgr.addBlock("ClickLogger", "MeshPickEvent", "onPick", { targetMesh: "clickTarget" }));
        const logId = getBlockId(mgr.addBlock("ClickLogger", "ConsoleLog", "logger", { message: "Clicked!" }));

        ok(mgr.connectSignal("ClickLogger", pickId, "out", logId, "in"));

        const json = mgr.exportJSON("ClickLogger")!;
        const parsed = validateCoordinator(json);

        expect(parsed._flowGraphs[0].allBlocks.length).toBe(2);
        expect(mgr.validateGraph("ClickLogger").some((i) => i.includes("No issues"))).toBe(true);

        // Write example
        const fs = require("fs");
        const path = require("path");
        const dir = path.resolve(__dirname, "..", "..", "examples");
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, "ClickLogger.flowgraph.json"), json, "utf-8");
    });

    // ── Example 2: Toggle Visibility ─────────────────────────────────────
    // Scenario: On mesh pick, branch on a boolean variable. If true, set
    //           visibility to 0; if false, set visibility to 1. Toggle var.

    it("Example 2 – Toggle Visibility", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("ToggleVisibility");

        mgr.setVariable("ToggleVisibility", "isVisible", true);

        const pickId = getBlockId(mgr.addBlock("ToggleVisibility", "MeshPickEvent", "onPick", { targetMesh: "box" }));
        const getVarId = getBlockId(mgr.addBlock("ToggleVisibility", "GetVariable", "getIsVisible", { variable: "isVisible" }));
        const branchId = getBlockId(mgr.addBlock("ToggleVisibility", "Branch", "check"));
        const hideId = getBlockId(mgr.addBlock("ToggleVisibility", "SetProperty", "hide", { propertyPath: "box.visibility" }));
        const showId = getBlockId(mgr.addBlock("ToggleVisibility", "SetProperty", "show", { propertyPath: "box.visibility" }));
        const setFalseId = getBlockId(mgr.addBlock("ToggleVisibility", "SetVariable", "setFalse", { variable: "isVisible" }));
        const setTrueId = getBlockId(mgr.addBlock("ToggleVisibility", "SetVariable", "setTrue", { variable: "isVisible" }));

        // Signal flow
        ok(mgr.connectSignal("ToggleVisibility", pickId, "out", branchId, "in"));
        ok(mgr.connectSignal("ToggleVisibility", branchId, "onTrue", hideId, "in"));
        ok(mgr.connectSignal("ToggleVisibility", branchId, "onFalse", showId, "in"));
        ok(mgr.connectSignal("ToggleVisibility", hideId, "out", setFalseId, "in"));
        ok(mgr.connectSignal("ToggleVisibility", showId, "out", setTrueId, "in"));

        // Data flow
        ok(mgr.connectData("ToggleVisibility", getVarId, "output", branchId, "condition"));

        const json = mgr.exportJSON("ToggleVisibility")!;
        const parsed = validateCoordinator(json);
        expect(parsed._flowGraphs[0].allBlocks.length).toBe(7);

        const fs = require("fs");
        const path = require("path");
        const dir = path.resolve(__dirname, "..", "..", "examples");
        fs.writeFileSync(path.join(dir, "ToggleVisibility.flowgraph.json"), json, "utf-8");
    });

    // ── Example 3: Animate on Scene Ready ────────────────────────────────
    // Scenario: When scene loads, play animation on a mesh.

    it("Example 3 – Animate on Ready", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("AnimateOnReady");

        const readyId = getBlockId(mgr.addBlock("AnimateOnReady", "SceneReadyEvent", "onReady"));
        const playId = getBlockId(mgr.addBlock("AnimateOnReady", "PlayAnimation", "playAnim", { targetMesh: "hero" }));

        ok(mgr.connectSignal("AnimateOnReady", readyId, "out", playId, "in"));

        const json = mgr.exportJSON("AnimateOnReady")!;
        const parsed = validateCoordinator(json);
        expect(parsed._flowGraphs[0].allBlocks.length).toBe(2);

        const fs = require("fs");
        const path = require("path");
        const dir = path.resolve(__dirname, "..", "..", "examples");
        fs.writeFileSync(path.join(dir, "AnimateOnReady.flowgraph.json"), json, "utf-8");
    });

    // ── Example 4: Counter with Logging ──────────────────────────────────
    // Scenario: Each scene tick, increment a counter variable, then log its value.

    it("Example 4 – Tick Counter", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("TickCounter");

        mgr.setVariable("TickCounter", "counter", 0);

        const tickId = getBlockId(mgr.addBlock("TickCounter", "SceneTickEvent", "onTick"));
        const getVarId = getBlockId(mgr.addBlock("TickCounter", "GetVariable", "getCounter", { variable: "counter" }));
        const constOneId = getBlockId(mgr.addBlock("TickCounter", "Constant", "one", { value: 1, type: "number" }));
        const addId = getBlockId(mgr.addBlock("TickCounter", "Add", "add"));
        const setVarId = getBlockId(mgr.addBlock("TickCounter", "SetVariable", "setCounter", { variable: "counter" }));
        const logId = getBlockId(mgr.addBlock("TickCounter", "ConsoleLog", "logCounter"));

        // Signal flow
        ok(mgr.connectSignal("TickCounter", tickId, "out", setVarId, "in"));
        ok(mgr.connectSignal("TickCounter", setVarId, "out", logId, "in"));

        // Data flow: getCounter + 1 → setCounter.value, also pipe to log
        ok(mgr.connectData("TickCounter", getVarId, "output", addId, "a"));
        ok(mgr.connectData("TickCounter", constOneId, "output", addId, "b"));
        ok(mgr.connectData("TickCounter", addId, "output", setVarId, "value"));
        ok(mgr.connectData("TickCounter", addId, "output", logId, "message"));

        const json = mgr.exportJSON("TickCounter")!;
        const parsed = validateCoordinator(json);
        expect(parsed._flowGraphs[0].allBlocks.length).toBe(6);

        const issues = mgr.validateGraph("TickCounter");
        // No error-level issues
        expect(issues.every((i) => !i.startsWith("ERROR"))).toBe(true);

        const fs = require("fs");
        const path = require("path");
        const dir = path.resolve(__dirname, "..", "..", "examples");
        fs.writeFileSync(path.join(dir, "TickCounter.flowgraph.json"), json, "utf-8");
    });

    // ── Example 5: Sequence → Multiple SetProperty ──────────────────────
    // Scenario: When scene is ready, run a sequence that sets 3 different
    //           mesh properties in order.

    it("Example 5 – Sequential Property Setup", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("SequentialSetup");

        const readyId = getBlockId(mgr.addBlock("SequentialSetup", "SceneReadyEvent", "onReady"));
        const seqId = getBlockId(mgr.addBlock("SequentialSetup", "Sequence", "seq", { outputSignalCount: 3 }));
        const set1Id = getBlockId(mgr.addBlock("SequentialSetup", "SetProperty", "setPosX", { propertyPath: "box.position.x" }));
        const set2Id = getBlockId(mgr.addBlock("SequentialSetup", "SetProperty", "setPosY", { propertyPath: "box.position.y" }));
        const set3Id = getBlockId(mgr.addBlock("SequentialSetup", "SetProperty", "setPosZ", { propertyPath: "box.position.z" }));

        // Constants for values
        const c1Id = getBlockId(mgr.addBlock("SequentialSetup", "Constant", "v1", { value: 1, type: "number" }));
        const c2Id = getBlockId(mgr.addBlock("SequentialSetup", "Constant", "v2", { value: 2, type: "number" }));
        const c3Id = getBlockId(mgr.addBlock("SequentialSetup", "Constant", "v3", { value: 3, type: "number" }));

        // Signal flow
        ok(mgr.connectSignal("SequentialSetup", readyId, "out", seqId, "in"));
        ok(mgr.connectSignal("SequentialSetup", seqId, "out_0", set1Id, "in"));
        ok(mgr.connectSignal("SequentialSetup", seqId, "out_1", set2Id, "in"));
        ok(mgr.connectSignal("SequentialSetup", seqId, "out_2", set3Id, "in"));

        // Data flow
        ok(mgr.connectData("SequentialSetup", c1Id, "output", set1Id, "value"));
        ok(mgr.connectData("SequentialSetup", c2Id, "output", set2Id, "value"));
        ok(mgr.connectData("SequentialSetup", c3Id, "output", set3Id, "value"));

        const json = mgr.exportJSON("SequentialSetup")!;
        const parsed = validateCoordinator(json);
        expect(parsed._flowGraphs[0].allBlocks.length).toBe(8);

        const issues = mgr.validateGraph("SequentialSetup");
        expect(issues.every((i) => !i.startsWith("ERROR"))).toBe(true);

        const fs = require("fs");
        const path = require("path");
        const dir = path.resolve(__dirname, "..", "..", "examples");
        fs.writeFileSync(path.join(dir, "SequentialSetup.flowgraph.json"), json, "utf-8");
    });

    // ══════════════════════════════════════════════════════════════════════
    //  DEFAULT-SCENE DEMOS
    //  These target the meshes created by the Flow Graph Editor's built-in
    //  default scene (box, sphere, cylinder, ground). Load them straight after
    //  the editor opens — click the named mesh to see them run, no assets needed.
    //
    //  Every Get/Set Property block gets its "object" input WIRED from the
    //  MeshPickEvent's "pickedMesh" output, so the graph acts on the actual
    //  clicked mesh (a bare config reference leaves the object input empty and
    //  the block does nothing).
    // ══════════════════════════════════════════════════════════════════════

    // ── Default Scene 1: Click the box to make it hop up ─────────────────
    // MeshPick(box) → GetProperty(pickedMesh, position.y) + 1 → SetProperty(pickedMesh, position.y)

    it("Default Scene – Click Box To Jump", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("DefaultScene_ClickBoxJump");

        const pickId = getBlockId(mgr.addBlock("DefaultScene_ClickBoxJump", "MeshPickEvent", "onPickBox", { targetMesh: { className: "Mesh", name: "box" } }));
        const getPosId = getBlockId(mgr.addBlock("DefaultScene_ClickBoxJump", "GetProperty", "getBoxPositionY", { propertyName: "position.y" }));
        const stepId = getBlockId(mgr.addBlock("DefaultScene_ClickBoxJump", "Constant", "jumpStep", { value: 1 }));
        const addId = getBlockId(mgr.addBlock("DefaultScene_ClickBoxJump", "Add", "add"));
        const setPosId = getBlockId(mgr.addBlock("DefaultScene_ClickBoxJump", "SetProperty", "setBoxPositionY", { propertyName: "position.y" }));

        // Signal: on each click, raise the box
        ok(mgr.connectSignal("DefaultScene_ClickBoxJump", pickId, "done", setPosId, "in"));
        // Data: wire the clicked mesh into both property blocks
        ok(mgr.connectData("DefaultScene_ClickBoxJump", pickId, "pickedMesh", getPosId, "object"));
        ok(mgr.connectData("DefaultScene_ClickBoxJump", pickId, "pickedMesh", setPosId, "object"));
        // Data: current Y + 1 → new Y
        ok(mgr.connectData("DefaultScene_ClickBoxJump", getPosId, "value", addId, "a"));
        ok(mgr.connectData("DefaultScene_ClickBoxJump", stepId, "output", addId, "b"));
        ok(mgr.connectData("DefaultScene_ClickBoxJump", addId, "value", setPosId, "value"));

        const json = mgr.exportJSON("DefaultScene_ClickBoxJump")!;
        validateCoordinator(json);
        expect(mgr.validateGraph("DefaultScene_ClickBoxJump").every((i) => !i.startsWith("ERROR"))).toBe(true);

        const fs = require("fs");
        const path = require("path");
        const dir = path.resolve(__dirname, "..", "..", "examples");
        fs.writeFileSync(path.join(dir, "DefaultScene_ClickBoxJump.flowgraph.json"), json, "utf-8");
    });

    // ── Default Scene 2: Click the cylinder to toggle its visibility ─────
    // MeshPick(cylinder) → FlipFlop → onOn: visibility 0 / onOff: visibility 1

    it("Default Scene – Click Cylinder To Toggle", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("DefaultScene_ClickCylinderToggle");

        const pickId = getBlockId(
            mgr.addBlock("DefaultScene_ClickCylinderToggle", "MeshPickEvent", "onPickCylinder", {
                targetMesh: { className: "Mesh", name: "cylinder" },
            })
        );
        const flipId = getBlockId(mgr.addBlock("DefaultScene_ClickCylinderToggle", "FlipFlop", "toggle"));
        const hiddenId = getBlockId(mgr.addBlock("DefaultScene_ClickCylinderToggle", "Constant", "hidden", { value: 0 }));
        const shownId = getBlockId(mgr.addBlock("DefaultScene_ClickCylinderToggle", "Constant", "shown", { value: 1 }));
        const hideId = getBlockId(mgr.addBlock("DefaultScene_ClickCylinderToggle", "SetProperty", "hideCylinder", { propertyName: "visibility" }));
        const showId = getBlockId(mgr.addBlock("DefaultScene_ClickCylinderToggle", "SetProperty", "showCylinder", { propertyName: "visibility" }));

        // Signal: each click flips between onOn (hide) and onOff (show)
        ok(mgr.connectSignal("DefaultScene_ClickCylinderToggle", pickId, "done", flipId, "in"));
        ok(mgr.connectSignal("DefaultScene_ClickCylinderToggle", flipId, "onOn", hideId, "in"));
        ok(mgr.connectSignal("DefaultScene_ClickCylinderToggle", flipId, "onOff", showId, "in"));
        // Data: wire the clicked mesh into both setters
        ok(mgr.connectData("DefaultScene_ClickCylinderToggle", pickId, "pickedMesh", hideId, "object"));
        ok(mgr.connectData("DefaultScene_ClickCylinderToggle", pickId, "pickedMesh", showId, "object"));
        // Data: constants drive the visibility value
        ok(mgr.connectData("DefaultScene_ClickCylinderToggle", hiddenId, "output", hideId, "value"));
        ok(mgr.connectData("DefaultScene_ClickCylinderToggle", shownId, "output", showId, "value"));

        const json = mgr.exportJSON("DefaultScene_ClickCylinderToggle")!;
        validateCoordinator(json);
        expect(mgr.validateGraph("DefaultScene_ClickCylinderToggle").every((i) => !i.startsWith("ERROR"))).toBe(true);

        const fs = require("fs");
        const path = require("path");
        const dir = path.resolve(__dirname, "..", "..", "examples");
        fs.writeFileSync(path.join(dir, "DefaultScene_ClickCylinderToggle.flowgraph.json"), json, "utf-8");
    });

    // ── Default Scene 3: Click the sphere to toggle its color ────────────
    // MeshPick(sphere) → GetProperty(pickedMesh, material) → FlipFlop →
    //   onOn: SetProperty(material, diffuseColor = red) / onOff: (= green)
    // Shows property traversal (mesh → material → color) plus a FlipFlop toggle.

    it("Default Scene – Click Sphere To Change Color", () => {
        const mgr = new FlowGraphManager();
        mgr.createGraph("DefaultScene_ClickSphereColor");

        const pickId = getBlockId(
            mgr.addBlock("DefaultScene_ClickSphereColor", "MeshPickEvent", "onPickSphere", {
                targetMesh: { className: "Mesh", name: "sphere" },
            })
        );
        const getMatId = getBlockId(mgr.addBlock("DefaultScene_ClickSphereColor", "GetProperty", "getMaterial", { propertyName: "material" }));
        const flipId = getBlockId(mgr.addBlock("DefaultScene_ClickSphereColor", "FlipFlop", "toggle"));
        const redId = getBlockId(mgr.addBlock("DefaultScene_ClickSphereColor", "Constant", "red", { value: { value: [1, 0.25, 0.2], className: "Color3" } }));
        const greenId = getBlockId(mgr.addBlock("DefaultScene_ClickSphereColor", "Constant", "green", { value: { value: [0.2, 0.8, 0.35], className: "Color3" } }));
        const setRedId = getBlockId(mgr.addBlock("DefaultScene_ClickSphereColor", "SetProperty", "setRed", { propertyName: "diffuseColor" }));
        const setGreenId = getBlockId(mgr.addBlock("DefaultScene_ClickSphereColor", "SetProperty", "setGreen", { propertyName: "diffuseColor" }));

        // Signal: each click flips between the two colors
        ok(mgr.connectSignal("DefaultScene_ClickSphereColor", pickId, "done", flipId, "in"));
        ok(mgr.connectSignal("DefaultScene_ClickSphereColor", flipId, "onOn", setRedId, "in"));
        ok(mgr.connectSignal("DefaultScene_ClickSphereColor", flipId, "onOff", setGreenId, "in"));
        // Data: clicked mesh → GetProperty(material); material → both setters' object input
        ok(mgr.connectData("DefaultScene_ClickSphereColor", pickId, "pickedMesh", getMatId, "object"));
        ok(mgr.connectData("DefaultScene_ClickSphereColor", getMatId, "value", setRedId, "object"));
        ok(mgr.connectData("DefaultScene_ClickSphereColor", getMatId, "value", setGreenId, "object"));
        // Data: color constants → setter values
        ok(mgr.connectData("DefaultScene_ClickSphereColor", redId, "output", setRedId, "value"));
        ok(mgr.connectData("DefaultScene_ClickSphereColor", greenId, "output", setGreenId, "value"));

        const json = mgr.exportJSON("DefaultScene_ClickSphereColor")!;
        validateCoordinator(json);
        expect(mgr.validateGraph("DefaultScene_ClickSphereColor").every((i) => !i.startsWith("ERROR"))).toBe(true);

        const fs = require("fs");
        const path = require("path");
        const dir = path.resolve(__dirname, "..", "..", "examples");
        fs.writeFileSync(path.join(dir, "DefaultScene_ClickSphereColor.flowgraph.json"), json, "utf-8");
    });
});
