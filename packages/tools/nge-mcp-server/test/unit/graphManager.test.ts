/**
 * Node Geometry MCP Server – Graph Manager Validation Tests
 *
 * Creates geometry graphs via GeometryGraphManager, exports them to JSON,
 * validates the JSON structure, and exercises core operations.
 */

import { GeometryGraphManager } from "../../src/geometryGraph";
import { BlockRegistry } from "../../src/blockRegistry";

// ─── Test Helpers ─────────────────────────────────────────────────────────

function validateGeometryJSON(json: string, label: string): any {
    let parsed: any;
    try {
        parsed = JSON.parse(json);
    } catch {
        throw new Error(`${label}: invalid JSON`);
    }

    expect(parsed.customType).toBe("BABYLON.NodeGeometry");
    expect(typeof parsed.outputNodeId).toBe("number");
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

    // Output node references a valid block
    if (parsed.outputNodeId >= 0) {
        expect(allIds.has(parsed.outputNodeId)).toBe(true);
    }

    return parsed;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Tests
// ═══════════════════════════════════════════════════════════════════════════

describe("Node Geometry MCP Server – Graph Manager Validation", () => {
    // ── Test 1: Simple box geometry ─────────────────────────────────────

    it("creates and exports a simple box geometry with valid JSON", () => {
        const mgr = new GeometryGraphManager();
        mgr.createGeometry("simpleBox");

        const box = mgr.addBlock("simpleBox", "BoxBlock", "box");
        expect(typeof box).not.toBe("string");
        const boxBlock = (box as any).block;

        const output = mgr.addBlock("simpleBox", "GeometryOutputBlock", "output");
        expect(typeof output).not.toBe("string");
        const outputBlock = (output as any).block;

        const connResult = mgr.connectBlocks("simpleBox", boxBlock.id, "geometry", outputBlock.id, "geometry");
        expect(connResult).toBe("OK");

        const json = mgr.exportJSON("simpleBox");
        expect(json).toBeDefined();
        const parsed = validateGeometryJSON(json!, "simpleBox");
        expect(parsed.blocks.length).toBe(2);
        expect(parsed.outputNodeId).toBe(outputBlock.id);
    });

    // ── Test 2: Lifecycle operations ────────────────────────────────────

    it("supports create, list, delete lifecycle", () => {
        const mgr = new GeometryGraphManager();
        mgr.createGeometry("a");
        mgr.createGeometry("b");

        const list = mgr.listGeometries();
        expect(list).toContain("a");
        expect(list).toContain("b");

        expect(mgr.deleteGeometry("a")).toBe(true);
        expect(mgr.listGeometries()).not.toContain("a");
        expect(mgr.deleteGeometry("nonexistent")).toBe(false);
    });

    // ── Test 3: GeometryInputBlock with contextual source ───────────────

    it("correctly sets contextual source and auto-derives type", () => {
        const mgr = new GeometryGraphManager();
        mgr.createGeometry("ctx");

        const result = mgr.addBlock("ctx", "GeometryInputBlock", "positions", {
            contextualValue: "Positions",
        });
        expect(typeof result).not.toBe("string");
        const block = (result as any).block;

        // contextualValue should be numeric 1 (Positions)
        expect(block.contextualValue).toBe(1);
        // type should be auto-derived to Vector3 (0x0008)
        expect(block.type).toBe(0x0008);
    });

    // ── Test 4: GeometryInputBlock with constant value ──────────────────

    it("correctly normalises constant input values", () => {
        const mgr = new GeometryGraphManager();
        mgr.createGeometry("const");

        // Float constant
        const floatRes = mgr.addBlock("const", "GeometryInputBlock", "myFloat", {
            type: "Float",
            value: 3.14,
        });
        expect(typeof floatRes).not.toBe("string");
        const floatBlock = (floatRes as any).block;
        expect(floatBlock.type).toBe(0x0002); // Float
        expect(floatBlock.value).toBe(3.14);
        expect(floatBlock.valueType).toBe("number");

        // Vector3 constant via object
        const vec3Res = mgr.addBlock("const", "GeometryInputBlock", "myVec3", {
            type: "Vector3",
            value: { x: 1, y: 2, z: 3 },
        });
        expect(typeof vec3Res).not.toBe("string");
        const vec3Block = (vec3Res as any).block;
        expect(vec3Block.type).toBe(0x0008); // Vector3
        expect(vec3Block.value).toEqual([1, 2, 3]);
        expect(vec3Block.valueType).toBe("BABYLON.Vector3");
    });

    // ── Test 5: Enum conversion for block properties ────────────────────

    it("converts string enum values to numbers for all block types", () => {
        const mgr = new GeometryGraphManager();
        mgr.createGeometry("enums");

        // MathBlock with string operation
        const math = mgr.addBlock("enums", "MathBlock", "add", { operation: "Multiply" });
        expect(typeof math).not.toBe("string");
        expect((math as any).block.operation).toBe(2); // Multiply = 2

        // GeometryTrigonometryBlock
        const trig = mgr.addBlock("enums", "GeometryTrigonometryBlock", "sin", { operation: "Sin" });
        expect(typeof trig).not.toBe("string");
        expect((trig as any).block.operation).toBe(1); // Sin = 1

        // ConditionBlock
        const cond = mgr.addBlock("enums", "ConditionBlock", "cmp", { test: "GreaterThan" });
        expect(typeof cond).not.toBe("string");
        expect((cond as any).block.test).toBe(3); // GreaterThan = 3

        // BooleanGeometryBlock
        const bool = mgr.addBlock("enums", "BooleanGeometryBlock", "csg", { operation: "Union" });
        expect(typeof bool).not.toBe("string");
        expect((bool as any).block.operation).toBe(2); // Union = 2

        // MappingBlock
        const map = mgr.addBlock("enums", "MappingBlock", "uvMap", { mapping: "Cylindrical" });
        expect(typeof map).not.toBe("string");
        expect((map as any).block.mapping).toBe(1); // Cylindrical = 1

        // GeometryEaseBlock
        const ease = mgr.addBlock("enums", "GeometryEaseBlock", "ease", { type: "EaseInBack" });
        expect(typeof ease).not.toBe("string");
        expect((ease as any).block.type).toBe(21); // EaseInBack = 21

        // GeometryCurveBlock
        const curve = mgr.addBlock("enums", "GeometryCurveBlock", "curve", { curveType: "EaseOutElastic" });
        expect(typeof curve).not.toBe("string");
        expect((curve as any).block.curveType).toBe(25); // EaseOutElastic = 25
    });

    // ── Test 6: setBlockProperties also converts enums ──────────────────

    it("converts string enums via setBlockProperties", () => {
        const mgr = new GeometryGraphManager();
        mgr.createGeometry("setProp");

        const math = mgr.addBlock("setProp", "MathBlock", "m");
        expect(typeof math).not.toBe("string");
        const block = (math as any).block;
        expect(block.operation).toBe(0); // Default: Add

        const result = mgr.setBlockProperties("setProp", block.id, { operation: "Divide" });
        expect(result).toBe("OK");
        expect(block.operation).toBe(3); // Divide = 3
    });

    // ── Test 7: exportJSON safety net converts remaining string enums ───

    it("exportJSON converts any remaining string enum values", () => {
        const mgr = new GeometryGraphManager();
        mgr.createGeometry("export");

        const math = mgr.addBlock("export", "MathBlock", "m");
        const block = (math as any).block;
        // Force a string value past the normal conversion (simulating edge case)
        block.operation = "Max";

        mgr.addBlock("export", "GeometryOutputBlock", "out");
        const json = mgr.exportJSON("export");
        expect(json).toBeDefined();
        const parsed = JSON.parse(json!);
        const mathBlock = parsed.blocks.find((b: any) => b.name === "m");
        expect(mathBlock.operation).toBe(4); // Max = 4
    });

    // ── Test 8: Connection validation ───────────────────────────────────

    it("rejects invalid connections", () => {
        const mgr = new GeometryGraphManager();
        mgr.createGeometry("conn");

        const box = mgr.addBlock("conn", "BoxBlock", "box");
        const boxId = (box as any).block.id;

        // Wrong output name
        expect(mgr.connectBlocks("conn", boxId, "nonexistent", boxId, "geometry")).toContain("not found");

        // Non-existent block
        expect(mgr.connectBlocks("conn", 999, "geometry", boxId, "geometry")).toContain("not found");

        // Non-existent geometry
        expect(mgr.connectBlocks("nope", boxId, "geometry", boxId, "geometry")).toContain("not found");
    });

    // ── Test 9: Disconnect input ────────────────────────────────────────

    it("disconnects inputs correctly", () => {
        const mgr = new GeometryGraphManager();
        mgr.createGeometry("disc");

        const box = mgr.addBlock("disc", "BoxBlock", "box");
        const out = mgr.addBlock("disc", "GeometryOutputBlock", "out");
        const boxId = (box as any).block.id;
        const outId = (out as any).block.id;

        mgr.connectBlocks("disc", boxId, "geometry", outId, "geometry");
        expect(mgr.disconnectInput("disc", outId, "geometry")).toBe("OK");

        const desc = mgr.describeGeometry("disc");
        expect(desc).not.toContain("connected to");
    });

    // ── Test 10: Remove block cleans up connections ─────────────────────

    it("removeBlock cleans up dangling connections", () => {
        const mgr = new GeometryGraphManager();
        mgr.createGeometry("rm");

        const input = mgr.addBlock("rm", "GeometryInputBlock", "val", {
            type: "Float",
            value: 5,
        });
        const box = mgr.addBlock("rm", "BoxBlock", "box");
        const out = mgr.addBlock("rm", "GeometryOutputBlock", "out");

        const inputId = (input as any).block.id;
        const boxId = (box as any).block.id;
        const outId = (out as any).block.id;

        mgr.connectBlocks("rm", inputId, "output", boxId, "size");
        mgr.connectBlocks("rm", boxId, "geometry", outId, "geometry");

        // Remove input block
        expect(mgr.removeBlock("rm", inputId)).toBe("OK");

        // Box's size input should be disconnected
        const issues = mgr.validateGeometry("rm");
        expect(issues.every((i) => !i.includes(`block ${inputId}`))).toBe(true);
    });

    // ── Test 11: Validation catches issues ──────────────────────────────

    it("validation detects missing output block and orphans", () => {
        const mgr = new GeometryGraphManager();
        mgr.createGeometry("val");

        mgr.addBlock("val", "BoxBlock", "orphanBox");
        // No output block

        const issues = mgr.validateGeometry("val");
        expect(issues.some((i) => i.includes("Missing GeometryOutputBlock"))).toBe(true);
        expect(issues.some((i) => i.includes("orphan"))).toBe(true);
    });

    // ── Test 12: Registry completeness ──────────────────────────────────

    it("block registry has all expected block types", () => {
        const expectedBlocks = [
            "GeometryInputBlock",
            "GeometryOutputBlock",
            "BoxBlock",
            "SphereBlock",
            "CylinderBlock",
            "PlaneBlock",
            "TorusBlock",
            "DiscBlock",
            "CapsuleBlock",
            "IcoSphereBlock",
            "GridBlock",
            "NullBlock",
            "MeshBlock",
            "PointListBlock",
            "GeometryTransformBlock",
            "MergeGeometryBlock",
            "BooleanGeometryBlock",
            "ComputeNormalsBlock",
            "CleanGeometryBlock",
            "SubdivideBlock",
            "GeometryOptimizeBlock",
            "BoundingBlock",
            "GeometryInfoBlock",
            "GeometryCollectionBlock",
            "SetPositionsBlock",
            "SetNormalsBlock",
            "SetColorsBlock",
            "SetUVsBlock",
            "SetTangentsBlock",
            "SetMaterialIDBlock",
            "AggregatorBlock",
            "LatticeBlock",
            "InstantiateBlock",
            "InstantiateLinearBlock",
            "InstantiateRadialBlock",
            "InstantiateOnFacesBlock",
            "InstantiateOnVerticesBlock",
            "InstantiateOnVolumeBlock",
            "TranslationBlock",
            "ScalingBlock",
            "RotationXBlock",
            "RotationYBlock",
            "RotationZBlock",
            "AlignBlock",
            "MatrixComposeBlock",
            "MathBlock",
            "GeometryTrigonometryBlock",
            "ConditionBlock",
            "RandomBlock",
            "NoiseBlock",
            "GeometryClampBlock",
            "GeometryLerpBlock",
            "GeometryNLerpBlock",
            "GeometrySmoothStepBlock",
            "GeometryStepBlock",
            "GeometryDotBlock",
            "GeometryCrossBlock",
            "GeometryLengthBlock",
            "GeometryDistanceBlock",
            "NormalizeVectorBlock",
            "GeometryModBlock",
            "GeometryPowBlock",
            "GeometryArcTan2Block",
            "GeometryReplaceColorBlock",
            "GeometryPosterizeBlock",
            "GeometryDesaturateBlock",
            "MappingBlock",
            "MapRangeBlock",
            "GeometryRotate2dBlock",
            "GeometryEaseBlock",
            "GeometryCurveBlock",
            "VectorConverterBlock",
            "IntFloatConverterBlock",
            "DebugBlock",
            "GeometryElbowBlock",
            "GeometryInterceptorBlock",
            "TeleportInBlock",
            "TeleportOutBlock",
            "GeometryTextureBlock",
            "GeometryTextureFetchBlock",
        ];

        for (const blockType of expectedBlocks) {
            expect(BlockRegistry[blockType]).toBeDefined();
            expect(BlockRegistry[blockType].className).toBe(blockType);
        }
    });

    // ── Test 13: Import/export round-trip ───────────────────────────────

    it("round-trips through import and export", () => {
        const mgr = new GeometryGraphManager();
        mgr.createGeometry("original");

        mgr.addBlock("original", "BoxBlock", "box");
        mgr.addBlock("original", "GeometryOutputBlock", "out");
        mgr.connectBlocks("original", 1, "geometry", 2, "geometry");

        const json1 = mgr.exportJSON("original")!;
        const parsed1 = JSON.parse(json1);

        // Import into a new name
        expect(mgr.importJSON("copy", json1)).toBe("OK");
        const json2 = mgr.exportJSON("copy")!;
        const parsed2 = JSON.parse(json2);

        // Same block count and connections
        expect(parsed2.blocks.length).toBe(parsed1.blocks.length);
        expect(parsed2.outputNodeId).toBe(parsed1.outputNodeId);
    });

    it("rejects invalid geometry JSON on import", () => {
        const mgr = new GeometryGraphManager();

        expect(mgr.importJSON("bad", '{"customType":"WRONG","blocks":[]}')).toContain("Invalid NGE JSON");
        expect(mgr.importJSON("bad", "not json")).toContain("Invalid NGE JSON: parse error.");
    });

    // ── Test 14: Default serialized properties ──────────────────────────

    it("applies defaultSerializedProperties from registry", () => {
        const mgr = new GeometryGraphManager();
        mgr.createGeometry("defaults");

        const box = mgr.addBlock("defaults", "BoxBlock", "box");
        expect((box as any).block.evaluateContext).toBe(false);

        const setPos = mgr.addBlock("defaults", "SetPositionsBlock", "sp");
        expect((setPos as any).block.evaluateContext).toBe(true);

        const cond = mgr.addBlock("defaults", "ConditionBlock", "c");
        expect((cond as any).block.test).toBe(0);
        expect((cond as any).block.epsilon).toBe(0);
    });

    // ── Test 15: Editor layout is generated ─────────────────────────────

    it("generates editor layout data on export", () => {
        const mgr = new GeometryGraphManager();
        mgr.createGeometry("layout");

        mgr.addBlock("layout", "BoxBlock", "box");
        mgr.addBlock("layout", "GeometryOutputBlock", "out");
        mgr.connectBlocks("layout", 1, "geometry", 2, "geometry");

        const json = mgr.exportJSON("layout")!;
        const parsed = JSON.parse(json);

        expect(parsed.editorData).toBeDefined();
        expect(Array.isArray(parsed.editorData.locations)).toBe(true);
        expect(parsed.editorData.locations.length).toBe(2);
    });

    // ── clearAll ────────────────────────────────────────────────────────

    it("clearAll removes all geometries and resets state", () => {
        const mgr = new GeometryGraphManager();
        mgr.createGeometry("a");
        mgr.createGeometry("b");
        expect(mgr.listGeometries().length).toBe(2);

        mgr.clearAll();
        expect(mgr.listGeometries()).toEqual([]);
        expect(mgr.getGeometry("a")).toBeUndefined();
        expect(mgr.getGeometry("b")).toBeUndefined();

        // Can create new geometries after clear
        mgr.createGeometry("c");
        expect(mgr.listGeometries()).toEqual(["c"]);
    });

    it("clearAll on empty manager is a no-op", () => {
        const mgr = new GeometryGraphManager();
        mgr.clearAll();
        expect(mgr.listGeometries()).toEqual([]);
    });
});
