/**
 * Node Particle MCP Server – Graph Manager Validation Tests
 *
 * Creates particle system graphs via ParticleGraphManager, exports them to JSON,
 * validates the JSON structure, and exercises core operations.
 */

import { ParticleGraphManager } from "../../src/particleGraph";
import { BlockRegistry } from "../../src/blockRegistry";

// ─── Test Helpers ─────────────────────────────────────────────────────────

function validateParticleJSON(json: string, label: string): any {
    let parsed: any;
    try {
        parsed = JSON.parse(json);
    } catch {
        throw new Error(`${label}: invalid JSON`);
    }

    expect(parsed.customType).toBe("BABYLON.NodeParticleSystemSet");
    expect(Array.isArray(parsed.blocks)).toBe(true);

    const allIds = new Set(parsed.blocks.map((b: any) => b.id));
    for (const block of parsed.blocks) {
        expect(typeof block.customType).toBe("string");
        expect(block.customType.startsWith("BABYLON.")).toBe(true);
        expect(typeof block.id).toBe("number");
        expect(typeof block.name).toBe("string");
        expect(Array.isArray(block.inputs)).toBe(true);
        expect(Array.isArray(block.outputs)).toBe(true);

        // Validate connections reference existing block IDs
        for (const inp of block.inputs) {
            if (inp.targetBlockId !== undefined) {
                expect(allIds.has(inp.targetBlockId)).toBe(true);
                expect(typeof inp.targetConnectionName).toBe("string");
            }
        }
    }

    return parsed;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Tests
// ═══════════════════════════════════════════════════════════════════════════

describe("Node Particle MCP Server – Graph Manager Validation", () => {
    // ── Test 1: Simple particle system ──────────────────────────────────

    it("creates and exports a simple particle system with valid JSON", () => {
        const mgr = new ParticleGraphManager();
        mgr.createParticleSet("simple");

        const shape = mgr.addBlock("simple", "BoxShapeBlock", "shape");
        expect(typeof shape).not.toBe("string");
        const shapeBlock = (shape as any).block;

        const create = mgr.addBlock("simple", "CreateParticleBlock", "create");
        expect(typeof create).not.toBe("string");
        const createBlock = (create as any).block;

        const updateAge = mgr.addBlock("simple", "UpdateAgeBlock", "updateAge");
        expect(typeof updateAge).not.toBe("string");
        const updateAgeBlock = (updateAge as any).block;

        const ageInput = mgr.addBlock("simple", "ParticleInputBlock", "ageInput", {
            contextualValue: "Age",
        });
        expect(typeof ageInput).not.toBe("string");
        const ageInputBlock = (ageInput as any).block;

        const texture = mgr.addBlock("simple", "ParticleTextureSourceBlock", "texture", { url: "https://assets.babylonjs.com/textures/flare.png" });
        expect(typeof texture).not.toBe("string");
        const textureBlock = (texture as any).block;

        const system = mgr.addBlock("simple", "SystemBlock", "system");
        expect(typeof system).not.toBe("string");
        const systemBlock = (system as any).block;

        // Flow: Create.particle → Shape.particle → Shape.output → UpdateAge.particle → UpdateAge.output → System.particle
        const connCreateToShape = mgr.connectBlocks("simple", createBlock.id, "particle", shapeBlock.id, "particle");
        expect(connCreateToShape).toBe("OK");

        const connShapeToUpdate = mgr.connectBlocks("simple", shapeBlock.id, "output", updateAgeBlock.id, "particle");
        expect(connShapeToUpdate).toBe("OK");

        const connAgeInput = mgr.connectBlocks("simple", ageInputBlock.id, "output", updateAgeBlock.id, "age");
        expect(connAgeInput).toBe("OK");

        const connTexture = mgr.connectBlocks("simple", textureBlock.id, "texture", systemBlock.id, "texture");
        expect(connTexture).toBe("OK");

        const connUpdateToSystem = mgr.connectBlocks("simple", updateAgeBlock.id, "output", systemBlock.id, "particle");
        expect(connUpdateToSystem).toBe("OK");

        const json = mgr.exportJSON("simple");
        expect(json).toBeDefined();
        const parsed = validateParticleJSON(json!, "simple");
        expect(parsed.blocks.length).toBe(6);

        // Should have a SystemBlock
        const systemBlocks = parsed.blocks.filter((b: any) => b.customType === "BABYLON.SystemBlock");
        expect(systemBlocks.length).toBe(1);
    });

    // ── Test 2: Lifecycle operations ────────────────────────────────────

    it("supports create, list, delete lifecycle", () => {
        const mgr = new ParticleGraphManager();
        mgr.createParticleSet("a");
        mgr.createParticleSet("b");

        const list = mgr.listParticleSets();
        expect(list).toContain("a");
        expect(list).toContain("b");

        expect(mgr.deleteParticleSet("a")).toBe(true);
        expect(mgr.listParticleSets()).not.toContain("a");
        expect(mgr.deleteParticleSet("nonexistent")).toBe(false);
    });

    // ── Test 3: ParticleInputBlock with contextual source ───────────────

    it("correctly sets contextual source and auto-derives type", () => {
        const mgr = new ParticleGraphManager();
        mgr.createParticleSet("ctx");

        const result = mgr.addBlock("ctx", "ParticleInputBlock", "positions", {
            contextualValue: "Position",
        });
        expect(typeof result).not.toBe("string");
        const block = (result as any).block;

        // contextualValue should be numeric 0x0001 (Position)
        expect(block.contextualValue).toBe(0x0001);
        // type should be auto-derived to Vector3 (0x0008)
        expect(block.type).toBe(0x0008);
        // systemSource should be None
        expect(block.systemSource).toBe(0);
    });

    // ── Test 4: ParticleInputBlock with system source ───────────────────

    it("correctly sets system source and auto-derives type", () => {
        const mgr = new ParticleGraphManager();
        mgr.createParticleSet("sys");

        const result = mgr.addBlock("sys", "ParticleInputBlock", "time", {
            systemSource: "Time",
        });
        expect(typeof result).not.toBe("string");
        const block = (result as any).block;

        // systemSource should be numeric 1 (Time)
        expect(block.systemSource).toBe(1);
        // type should be auto-derived to Float (0x0002)
        expect(block.type).toBe(0x0002);
        // contextualValue should be None
        expect(block.contextualValue).toBe(0);
    });

    // ── Test 5: ParticleInputBlock with constant value ──────────────────

    it("correctly normalises constant input values", () => {
        const mgr = new ParticleGraphManager();
        mgr.createParticleSet("const");

        // Float constant
        const floatRes = mgr.addBlock("const", "ParticleInputBlock", "myFloat", {
            type: "Float",
            value: 3.14,
        });
        expect(typeof floatRes).not.toBe("string");
        const floatBlock = (floatRes as any).block;
        expect(floatBlock.type).toBe(0x0002); // Float
        expect(floatBlock.value).toBe(3.14);
        expect(floatBlock.valueType).toBe("number");

        // Vector3 constant via object
        const vec3Res = mgr.addBlock("const", "ParticleInputBlock", "myVec3", {
            type: "Vector3",
            value: { x: 1, y: 2, z: 3 },
        });
        expect(typeof vec3Res).not.toBe("string");
        const vec3Block = (vec3Res as any).block;
        expect(vec3Block.type).toBe(0x0008); // Vector3
        expect(vec3Block.value).toEqual([1, 2, 3]);
        expect(vec3Block.valueType).toBe("BABYLON.Vector3");

        // Color4 constant via object {r,g,b,a}
        const colorRes = mgr.addBlock("const", "ParticleInputBlock", "myColor", {
            type: "Color4",
            value: { r: 1, g: 0.5, b: 0.3, a: 1 },
        });
        expect(typeof colorRes).not.toBe("string");
        const colorBlock = (colorRes as any).block;
        expect(colorBlock.type).toBe(0x0080); // Color4
        expect(colorBlock.value).toEqual([1, 0.5, 0.3, 1]);
        expect(colorBlock.valueType).toBe("BABYLON.Color4");
    });

    // ── Test 6: Enum conversion for block properties ────────────────────

    it("converts string enum values to numbers for all block types", () => {
        const mgr = new ParticleGraphManager();
        mgr.createParticleSet("enums");

        // ParticleMathBlock with string operation
        const math = mgr.addBlock("enums", "ParticleMathBlock", "add", { operation: "Multiply" });
        expect(typeof math).not.toBe("string");
        expect((math as any).block.operation).toBe(2); // Multiply = 2

        // ParticleTrigonometryBlock
        const trig = mgr.addBlock("enums", "ParticleTrigonometryBlock", "sin", { operation: "Sin" });
        expect(typeof trig).not.toBe("string");
        expect((trig as any).block.operation).toBe(1); // Sin = 1

        // ParticleConditionBlock
        const cond = mgr.addBlock("enums", "ParticleConditionBlock", "cmp", { test: "GreaterThan" });
        expect(typeof cond).not.toBe("string");
        expect((cond as any).block.test).toBe(3); // GreaterThan = 3

        // ParticleNumberMathBlock
        const numMath = mgr.addBlock("enums", "ParticleNumberMathBlock", "pow", { operation: "Pow" });
        expect(typeof numMath).not.toBe("string");
        expect((numMath as any).block.operation).toBe(1); // Pow = 1

        // ParticleVectorMathBlock
        const vecMath = mgr.addBlock("enums", "ParticleVectorMathBlock", "dot", { operation: "Dot" });
        expect(typeof vecMath).not.toBe("string");
        expect((vecMath as any).block.operation).toBe(0); // Dot = 0

        // ParticleFloatToIntBlock
        const f2i = mgr.addBlock("enums", "ParticleFloatToIntBlock", "round", { operation: "Ceil" });
        expect(typeof f2i).not.toBe("string");
        expect((f2i as any).block.operation).toBe(1); // Ceil = 1

        // ParticleRandomBlock
        const rand = mgr.addBlock("enums", "ParticleRandomBlock", "rand", { lockMode: "PerParticle" });
        expect(typeof rand).not.toBe("string");
        expect((rand as any).block.lockMode).toBe(1); // PerParticle = 1

        // ParticleLocalVariableBlock
        const local = mgr.addBlock("enums", "ParticleLocalVariableBlock", "var", { scope: "Loop" });
        expect(typeof local).not.toBe("string");
        expect((local as any).block.scope).toBe(1); // Loop = 1
    });

    // ── Test 7: setBlockProperties also converts enums ──────────────────

    it("converts string enums via setBlockProperties", () => {
        const mgr = new ParticleGraphManager();
        mgr.createParticleSet("setProp");

        const math = mgr.addBlock("setProp", "ParticleMathBlock", "m");
        expect(typeof math).not.toBe("string");
        const block = (math as any).block;
        expect(block.operation).toBe(0); // Default: Add

        const result = mgr.setBlockProperties("setProp", block.id, { operation: "Divide" });
        expect(result).toBe("OK");
        expect(block.operation).toBe(3); // Divide = 3
    });

    // ── Test 8: exportJSON safety net converts remaining string enums ───

    it("exportJSON converts any remaining string enum values", () => {
        const mgr = new ParticleGraphManager();
        mgr.createParticleSet("export");

        const math = mgr.addBlock("export", "ParticleMathBlock", "m");
        const block = (math as any).block;
        // Force a string value past the normal conversion (simulating edge case)
        block.operation = "Max";

        mgr.addBlock("export", "SystemBlock", "out");
        const json = mgr.exportJSON("export");
        expect(json).toBeDefined();
        const parsed = JSON.parse(json!);
        const mathBlock = parsed.blocks.find((b: any) => b.name === "m");
        expect(mathBlock.operation).toBe(4); // Max = 4
    });

    // ── Test 9: Connection validation ───────────────────────────────────

    it("rejects invalid connections", () => {
        const mgr = new ParticleGraphManager();
        mgr.createParticleSet("conn");

        const box = mgr.addBlock("conn", "BoxShapeBlock", "box");
        const boxId = (box as any).block.id;

        // Wrong output name
        expect(mgr.connectBlocks("conn", boxId, "nonexistent", boxId, "shape")).toContain("not found");

        // Non-existent block
        expect(mgr.connectBlocks("conn", 999, "shape", boxId, "shape")).toContain("not found");

        // Non-existent particle set
        expect(mgr.connectBlocks("nope", boxId, "shape", boxId, "shape")).toContain("not found");
    });

    // ── Test 10: Disconnect input ───────────────────────────────────────

    it("disconnects inputs correctly", () => {
        const mgr = new ParticleGraphManager();
        mgr.createParticleSet("disc");

        const shape = mgr.addBlock("disc", "BoxShapeBlock", "shape");
        const create = mgr.addBlock("disc", "CreateParticleBlock", "create");
        const shapeId = (shape as any).block.id;
        const createId = (create as any).block.id;

        mgr.connectBlocks("disc", createId, "particle", shapeId, "particle");
        expect(mgr.disconnectInput("disc", shapeId, "particle")).toBe("OK");

        const desc = mgr.describeParticleSet("disc");
        expect(desc).not.toContain("connected to");
    });

    // ── Test 11: Remove block cleans up connections ─────────────────────

    it("removeBlock cleans up dangling connections", () => {
        const mgr = new ParticleGraphManager();
        mgr.createParticleSet("rm");

        const input = mgr.addBlock("rm", "ParticleInputBlock", "lifetime", {
            type: "Float",
            value: 5,
        });
        const create = mgr.addBlock("rm", "CreateParticleBlock", "create");
        const system = mgr.addBlock("rm", "SystemBlock", "system");

        const inputId = (input as any).block.id;
        const createId = (create as any).block.id;
        const systemId = (system as any).block.id;

        mgr.connectBlocks("rm", inputId, "output", createId, "lifeTime");
        mgr.connectBlocks("rm", createId, "particle", systemId, "particle");

        // Remove input block
        expect(mgr.removeBlock("rm", inputId)).toBe("OK");

        // Create's lifetime input should be disconnected
        const issues = mgr.validateParticleSet("rm");
        expect(issues.every((i) => !i.includes(`block ${inputId}`))).toBe(true);
    });

    // ── Test 12: Validation catches issues ──────────────────────────────

    it("validation detects missing SystemBlock and orphans", () => {
        const mgr = new ParticleGraphManager();
        mgr.createParticleSet("val");

        mgr.addBlock("val", "BoxShapeBlock", "orphanShape");
        // No SystemBlock

        const issues = mgr.validateParticleSet("val");
        expect(issues.some((i) => i.includes("Missing SystemBlock"))).toBe(true);
        expect(issues.some((i) => i.includes("orphan"))).toBe(true);
    });

    // ── Test 13: Registry completeness ──────────────────────────────────

    it("block registry has all expected block types", () => {
        const expectedBlocks = [
            "ParticleInputBlock",
            "SystemBlock",
            "ParticleTextureSourceBlock",
            "BoxShapeBlock",
            "SphereShapeBlock",
            "ConeShapeBlock",
            "CylinderShapeBlock",
            "PointShapeBlock",
            "CustomShapeBlock",
            "MeshShapeBlock",
            "CreateParticleBlock",
            "SetupSpriteSheetBlock",
            "UpdatePositionBlock",
            "UpdateDirectionBlock",
            "UpdateColorBlock",
            "UpdateScaleBlock",
            "UpdateSizeBlock",
            "UpdateAngleBlock",
            "UpdateAgeBlock",
            "BasicPositionUpdateBlock",
            "BasicColorUpdateBlock",
            "BasicSpriteUpdateBlock",
            "UpdateSpriteCellIndexBlock",
            "UpdateFlowMapBlock",
            "UpdateNoiseBlock",
            "UpdateAttractorBlock",
            "AlignAngleBlock",
            "ParticleTriggerBlock",
            "ParticleMathBlock",
            "ParticleNumberMathBlock",
            "ParticleVectorMathBlock",
            "ParticleTrigonometryBlock",
            "ParticleVectorLengthBlock",
            "ParticleFloatToIntBlock",
            "ParticleConditionBlock",
            "ParticleLerpBlock",
            "ParticleNLerpBlock",
            "ParticleSmoothStepBlock",
            "ParticleStepBlock",
            "ParticleClampBlock",
            "ParticleGradientBlock",
            "ParticleGradientValueBlock",
            "ParticleRandomBlock",
            "ParticleConverterBlock",
            "ParticleDebugBlock",
            "ParticleElbowBlock",
            "ParticleLocalVariableBlock",
            "ParticleTeleportInBlock",
            "ParticleTeleportOutBlock",
        ];

        for (const blockType of expectedBlocks) {
            expect(BlockRegistry[blockType]).toBeDefined();
            expect(BlockRegistry[blockType].className).toBe(blockType);
        }
    });

    // ── Test 14: Import/export round-trip ───────────────────────────────

    it("round-trips through import and export", () => {
        const mgr = new ParticleGraphManager();
        mgr.createParticleSet("original");

        mgr.addBlock("original", "BoxShapeBlock", "shape");
        mgr.addBlock("original", "CreateParticleBlock", "create");
        mgr.addBlock("original", "SystemBlock", "system");
        mgr.connectBlocks("original", 2, "particle", 1, "particle");
        mgr.connectBlocks("original", 1, "output", 3, "particle");

        const json1 = mgr.exportJSON("original")!;
        const parsed1 = JSON.parse(json1);

        // Import into a new name
        expect(mgr.importJSON("copy", json1)).toBe("OK");
        const json2 = mgr.exportJSON("copy")!;
        const parsed2 = JSON.parse(json2);

        // Same block count and connections
        expect(parsed2.blocks.length).toBe(parsed1.blocks.length);
    });

    // ── Test 15: Default serialized properties ──────────────────────────

    it("applies defaultSerializedProperties from registry", () => {
        const mgr = new ParticleGraphManager();
        mgr.createParticleSet("defaults");

        const math = mgr.addBlock("defaults", "ParticleMathBlock", "m");
        expect((math as any).block.operation).toBe(0);

        const cond = mgr.addBlock("defaults", "ParticleConditionBlock", "c");
        expect((cond as any).block.test).toBe(0);

        const trig = mgr.addBlock("defaults", "ParticleTrigonometryBlock", "t");
        expect((trig as any).block.operation).toBe(0);
    });

    // ── Test 16: Editor layout is generated ─────────────────────────────

    it("generates editor layout data on export", () => {
        const mgr = new ParticleGraphManager();
        mgr.createParticleSet("layout");

        mgr.addBlock("layout", "BoxShapeBlock", "shape");
        mgr.addBlock("layout", "CreateParticleBlock", "create");
        mgr.addBlock("layout", "SystemBlock", "system");
        mgr.connectBlocks("layout", 2, "particle", 1, "particle");
        mgr.connectBlocks("layout", 1, "output", 3, "particle");

        const json = mgr.exportJSON("layout")!;
        const parsed = JSON.parse(json);

        expect(parsed.editorData).toBeDefined();
        expect(Array.isArray(parsed.editorData.locations)).toBe(true);
        expect(parsed.editorData.locations.length).toBe(3);
    });

    // ── clearAll ────────────────────────────────────────────────────────

    it("clearAll removes all particle sets and resets state", () => {
        const mgr = new ParticleGraphManager();
        mgr.createParticleSet("a");
        mgr.createParticleSet("b");
        expect(mgr.listParticleSets().length).toBe(2);

        mgr.clearAll();
        expect(mgr.listParticleSets()).toEqual([]);
        expect(mgr.getParticleSet("a")).toBeUndefined();
        expect(mgr.getParticleSet("b")).toBeUndefined();

        // Can create new sets after clear
        mgr.createParticleSet("c");
        expect(mgr.listParticleSets()).toEqual(["c"]);
    });

    it("clearAll on empty manager is a no-op", () => {
        const mgr = new ParticleGraphManager();
        mgr.clearAll();
        expect(mgr.listParticleSets()).toEqual([]);
    });

    // ── Test: Multiple SystemBlocks ─────────────────────────────────────

    it("supports multiple SystemBlocks in a single set", () => {
        const mgr = new ParticleGraphManager();
        mgr.createParticleSet("multi");

        const shape1 = mgr.addBlock("multi", "BoxShapeBlock", "shape1");
        const create1 = mgr.addBlock("multi", "CreateParticleBlock", "create1");
        const system1 = mgr.addBlock("multi", "SystemBlock", "system1");

        const shape2 = mgr.addBlock("multi", "SphereShapeBlock", "shape2");
        const create2 = mgr.addBlock("multi", "CreateParticleBlock", "create2");
        const system2 = mgr.addBlock("multi", "SystemBlock", "system2");

        mgr.connectBlocks("multi", (create1 as any).block.id, "particle", (shape1 as any).block.id, "particle");
        mgr.connectBlocks("multi", (shape1 as any).block.id, "output", (system1 as any).block.id, "particle");

        mgr.connectBlocks("multi", (create2 as any).block.id, "particle", (shape2 as any).block.id, "particle");
        mgr.connectBlocks("multi", (shape2 as any).block.id, "output", (system2 as any).block.id, "particle");

        const json = mgr.exportJSON("multi")!;
        const parsed = JSON.parse(json);

        const systemBlocks = parsed.blocks.filter((b: any) => b.customType === "BABYLON.SystemBlock");
        expect(systemBlocks.length).toBe(2);
    });

    // ── Test: Describe block ────────────────────────────────────────────

    it("describeBlock shows inputs, outputs, and properties", () => {
        const mgr = new ParticleGraphManager();
        mgr.createParticleSet("desc");

        const math = mgr.addBlock("desc", "ParticleMathBlock", "adder", { operation: "Add" });
        const block = (math as any).block;

        const desc = mgr.describeBlock("desc", block.id);
        expect(desc).toContain("adder");
        expect(desc).toContain("ParticleMathBlock");
        expect(desc).toContain("Inputs:");
        expect(desc).toContain("Outputs:");
        expect(desc).toContain("operation");
    });

    // ── Test: contextualValue auto-derivation for various sources ───────

    it("auto-derives type for all contextual source families", () => {
        const mgr = new ParticleGraphManager();
        mgr.createParticleSet("derive");

        // Color → Color4 (0x0080)
        const colorRes = mgr.addBlock("derive", "ParticleInputBlock", "color", { contextualValue: "Color" });
        expect((colorRes as any).block.type).toBe(0x0080);

        // Age → Float (0x0002)
        const ageRes = mgr.addBlock("derive", "ParticleInputBlock", "age", { contextualValue: "Age" });
        expect((ageRes as any).block.type).toBe(0x0002);

        // Scale → Vector2 (0x0004)
        const scaleRes = mgr.addBlock("derive", "ParticleInputBlock", "scale", { contextualValue: "Scale" });
        expect((scaleRes as any).block.type).toBe(0x0004);

        // SpriteCellIndex → Int (0x0001)
        const spriteRes = mgr.addBlock("derive", "ParticleInputBlock", "sprite", { contextualValue: "SpriteCellIndex" });
        expect((spriteRes as any).block.type).toBe(0x0001);

        // system source: Emitter → Vector3 (0x0008)
        const emitterRes = mgr.addBlock("derive", "ParticleInputBlock", "emitter", { systemSource: "Emitter" });
        expect((emitterRes as any).block.type).toBe(0x0008);
    });

    // ── Test: ParticleInputBlock warning when no data ───────────────────

    it("warns when ParticleInputBlock has no contextualValue, systemSource, or value", () => {
        const mgr = new ParticleGraphManager();
        mgr.createParticleSet("warn");

        const result = mgr.addBlock("warn", "ParticleInputBlock", "empty");
        expect(typeof result).not.toBe("string");
        expect((result as any).warnings).toBeDefined();
        expect((result as any).warnings.length).toBeGreaterThan(0);
        expect((result as any).warnings[0]).toContain("no value");
    });
});
