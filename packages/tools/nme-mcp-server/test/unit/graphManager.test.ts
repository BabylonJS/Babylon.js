/**
 * Node Material MCP Server – Output Validation Tests
 *
 * Creates materials via MaterialGraphManager, exports them to JSON, validates
 * the JSON structure, and round-trips sample materials.
 *
 * Run with: npx jest --testPathPattern nme-mcp-server
 *   (or just run all unit tests)
 */

import { MaterialGraphManager } from "../../src/materialGraph";
import { BlockRegistry } from "../../src/blockRegistry";
import * as fs from "fs";
import * as path from "path";

const SAMPLE_DIR = path.resolve(__dirname, "../..");

// ─── Test Helpers ─────────────────────────────────────────────────────────

function validateMaterialJSON(json: string, label: string): object | null {
    let parsed: any;
    try {
        parsed = JSON.parse(json);
    } catch {
        throw new Error(`${label}: invalid JSON`);
    }

    // Required top-level fields
    expect(typeof parsed.ignoreAlpha).toBe("boolean");
    expect(typeof parsed.maxSimultaneousLights).toBe("number");
    expect(typeof parsed.mode).toBe("number");
    expect(typeof parsed.forceAlphaBlending).toBe("boolean");
    expect(Array.isArray(parsed.blocks)).toBe(true);
    expect(Array.isArray(parsed.outputNodes)).toBe(true);

    if (!Array.isArray(parsed.blocks)) return null;

    // Each block must have required fields
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

        // InputBlock-specific validations
        if (block.customType === "BABYLON.InputBlock") {
            expect(block.type).toBeDefined();
            expect(typeof block.mode).toBe("number");
        }
    }

    // Output nodes reference valid blocks
    for (const outId of parsed.outputNodes) {
        expect(allIds.has(outId)).toBe(true);
    }

    return parsed;
}

// ─── Test 1: Create a simple color material ───────────────────────────────

describe("Node Material MCP Server – Graph Manager Validation", () => {
    it("creates and exports a simple color material with valid JSON", () => {
        const mgr = new MaterialGraphManager();
        mgr.createMaterial("simpleColor");

        // Add blocks
        const pos = mgr.addBlock("simpleColor", "InputBlock", "position", { type: "Vector3", mode: "Attribute", attributeName: "position" });
        expect(typeof pos).not.toBe("string");

        const wvp = mgr.addBlock("simpleColor", "InputBlock", "worldViewProjection", { type: "Matrix", systemValue: "WorldViewProjection" });
        expect(typeof wvp).not.toBe("string");

        const vtx = mgr.addBlock("simpleColor", "TransformBlock", "worldPos");
        expect(typeof vtx).not.toBe("string");

        const vertOut = mgr.addBlock("simpleColor", "VertexOutputBlock", "vertexOutput");
        expect(typeof vertOut).not.toBe("string");

        const color = mgr.addBlock("simpleColor", "InputBlock", "color", { type: "Color3", value: [1, 0, 0] });
        expect(typeof color).not.toBe("string");

        const fragOut = mgr.addBlock("simpleColor", "FragmentOutputBlock", "fragmentOutput");
        expect(typeof fragOut).not.toBe("string");

        // Get block IDs
        const getId = (r: any) => (typeof r !== "string" ? r.block.id : -1);

        // Connect: position → TransformBlock.vector, wvp → TransformBlock.transform
        let result = mgr.connectBlocks("simpleColor", getId(pos), "output", getId(vtx), "vector");
        expect(result).toBe("OK");

        result = mgr.connectBlocks("simpleColor", getId(wvp), "output", getId(vtx), "transform");
        expect(result).toBe("OK");

        // Connect: TransformBlock.output → VertexOutputBlock.vector
        result = mgr.connectBlocks("simpleColor", getId(vtx), "output", getId(vertOut), "vector");
        expect(result).toBe("OK");

        // Connect: color → FragmentOutputBlock.rgb
        result = mgr.connectBlocks("simpleColor", getId(color), "output", getId(fragOut), "rgb");
        expect(result).toBe("OK");

        // Export and validate
        const json = mgr.exportJSON("simpleColor");
        expect(json).toBeDefined();
        if (json) {
            validateMaterialJSON(json, "simpleColor");

            // Write to fixture for the Babylon.js parse test
            const outDir = path.resolve(__dirname, "fixtures");
            fs.mkdirSync(outDir, { recursive: true });
            fs.writeFileSync(path.join(outDir, "simpleColor.json"), json);
        }
    });

    // ─── Test 2: Create a PBR material ─────────────────────────────────────

    it("creates and exports a PBR material with valid JSON", () => {
        const mgr = new MaterialGraphManager();
        mgr.createMaterial("pbrTest");

        // Required vertex setup
        const pos = mgr.addBlock("pbrTest", "InputBlock", "position", { type: "Vector3", mode: "Attribute", attributeName: "position" });
        const normal = mgr.addBlock("pbrTest", "InputBlock", "normal", { type: "Vector3", mode: "Attribute", attributeName: "normal" });
        const wvp = mgr.addBlock("pbrTest", "InputBlock", "worldViewProjection", { type: "Matrix", systemValue: "WorldViewProjection" });
        const world = mgr.addBlock("pbrTest", "InputBlock", "world", { type: "Matrix", systemValue: "World" });
        const view = mgr.addBlock("pbrTest", "InputBlock", "view", { type: "Matrix", systemValue: "View" });
        const cameraPos = mgr.addBlock("pbrTest", "InputBlock", "cameraPosition", { type: "Vector3", systemValue: "CameraPosition" });

        const vtx = mgr.addBlock("pbrTest", "TransformBlock", "worldPos");
        const vertOut = mgr.addBlock("pbrTest", "VertexOutputBlock", "vertexOutput");
        const pbr = mgr.addBlock("pbrTest", "PBRMetallicRoughnessBlock", "PBR");
        const fragOut = mgr.addBlock("pbrTest", "FragmentOutputBlock", "fragOutput");

        // Colors
        const baseColor = mgr.addBlock("pbrTest", "InputBlock", "baseColor", { type: "Color3", value: [0.8, 0.2, 0.1] });
        const metallic = mgr.addBlock("pbrTest", "InputBlock", "metallic", { type: "Float", value: 0.0 });
        const roughness = mgr.addBlock("pbrTest", "InputBlock", "roughness", { type: "Float", value: 0.5 });

        // Validate all blocks created
        for (const result of [pos, normal, wvp, world, view, cameraPos, vtx, vertOut, pbr, fragOut, baseColor, metallic, roughness]) {
            expect(typeof result).not.toBe("string");
        }

        const getId = (r: any) => (typeof r !== "string" ? r.block.id : -1);

        // Vertex connections
        mgr.connectBlocks("pbrTest", getId(pos), "output", getId(vtx), "vector");
        mgr.connectBlocks("pbrTest", getId(wvp), "output", getId(vtx), "transform");
        mgr.connectBlocks("pbrTest", getId(vtx), "output", getId(vertOut), "vector");

        // PBR connections
        mgr.connectBlocks("pbrTest", getId(vtx), "output", getId(pbr), "worldPosition");
        mgr.connectBlocks("pbrTest", getId(normal), "output", getId(pbr), "worldNormal");
        mgr.connectBlocks("pbrTest", getId(view), "output", getId(pbr), "view");
        mgr.connectBlocks("pbrTest", getId(cameraPos), "output", getId(pbr), "cameraPosition");
        mgr.connectBlocks("pbrTest", getId(baseColor), "output", getId(pbr), "baseColor");
        mgr.connectBlocks("pbrTest", getId(metallic), "output", getId(pbr), "metallic");
        mgr.connectBlocks("pbrTest", getId(roughness), "output", getId(pbr), "roughness");

        // PBR → fragment output
        const connectResult = mgr.connectBlocks("pbrTest", getId(pbr), "lighting", getId(fragOut), "rgb");
        expect(connectResult).toBe("OK");

        const json = mgr.exportJSON("pbrTest");
        expect(json).toBeDefined();
        if (json) {
            validateMaterialJSON(json, "pbrTest");
            const outDir = path.resolve(__dirname, "fixtures");
            fs.mkdirSync(outDir, { recursive: true });
            fs.writeFileSync(path.join(outDir, "pbrMaterial.json"), json);
        }
    });

    // ─── Test 3: Round-trip sample materials ──────────────────────────────

    const sampleFiles = ["bricks.json", "grass.json", "psychedelic.json", "purple-fire.json", "purple-fire-bricks.json"];

    for (const file of sampleFiles) {
        it(`round-trips sample material: ${file}`, () => {
            const filePath = path.join(SAMPLE_DIR, file);
            if (!fs.existsSync(filePath)) {
                return; // skip if missing
            }

            const rawJson = fs.readFileSync(filePath, "utf-8");
            const mgr = new MaterialGraphManager();
            const materialName = path.basename(file, ".json");

            // Import
            const result = mgr.importJSON(materialName, rawJson);
            expect(result).not.toMatch(/^Error/);

            // Export
            const exported = mgr.exportJSON(materialName);
            expect(exported).toBeDefined();

            if (exported) {
                // Validate structure
                const parsed = validateMaterialJSON(exported, `roundtrip(${file})`);
                if (parsed) {
                    const original = JSON.parse(rawJson);
                    // Block count should be preserved
                    expect((parsed as any).blocks.length).toBe(original.blocks.length);
                    // Output nodes preserved
                    expect((parsed as any).outputNodes.length).toBe(original.outputNodes.length);
                }

                // Write for the Babylon.js parse test
                const outDir = path.resolve(__dirname, "fixtures");
                fs.mkdirSync(outDir, { recursive: true });
                fs.writeFileSync(path.join(outDir, `roundtrip-${file}`), exported);
            }
        });
    }

    it("rejects invalid material JSON on import", () => {
        const mgr = new MaterialGraphManager();

        expect(mgr.importJSON("bad", '{"blocks":[],"outputNodes":[]}')).toContain("Invalid NME JSON");
        expect(mgr.importJSON("bad", "not json")).toContain("Invalid NME JSON: parse error.");
    });

    // ─── Test 4: Block registry coverage ──────────────────────────────────

    it("every block type can be instantiated with correct customType and port counts", () => {
        const mgr = new MaterialGraphManager();

        let blockTypesTested = 0;

        for (const [key, info] of Object.entries(BlockRegistry)) {
            // Skip output blocks (they need special handling) and InputBlock
            if (key === "VertexOutputBlock" || key === "FragmentOutputBlock" || key === "InputBlock") {
                continue;
            }

            mgr.createMaterial(`test_${key}`);
            const result = mgr.addBlock(`test_${key}`, key, `testBlock`);

            expect(typeof result).not.toBe("string");
            if (typeof result !== "string") {
                expect(result.block.customType).toBe(`BABYLON.${info.className}`);
                expect(result.block.inputs.length).toBe(info.inputs.length);
                expect(result.block.outputs.length).toBe(info.outputs.length);
                blockTypesTested++;
            }
        }

        // Ensure we tested a meaningful number of blocks
        expect(blockTypesTested).toBeGreaterThan(100);
    });

    // ─── Test 5: Validate material ──────────────────────────────────────

    it("validate_material catches missing output blocks and passes for connected materials", () => {
        const mgr = new MaterialGraphManager();
        mgr.createMaterial("validateTest");

        // Empty material should have warnings about missing output blocks
        const emptyResult = mgr.validateMaterial("validateTest");
        expect(emptyResult.length).toBeGreaterThan(0);

        // Build a valid minimal material
        mgr.addBlock("validateTest", "InputBlock", "position", { type: "Vector3", mode: "Attribute", attributeName: "position" });
        mgr.addBlock("validateTest", "InputBlock", "wvp", { type: "Matrix", systemValue: "WorldViewProjection" });
        mgr.addBlock("validateTest", "TransformBlock", "transform");
        mgr.addBlock("validateTest", "VertexOutputBlock", "vertOut");
        mgr.addBlock("validateTest", "InputBlock", "color", { type: "Color3", value: [1, 0, 0] });
        mgr.addBlock("validateTest", "FragmentOutputBlock", "fragOut");

        mgr.connectBlocks("validateTest", 1, "output", 3, "vector");
        mgr.connectBlocks("validateTest", 2, "output", 3, "transform");
        mgr.connectBlocks("validateTest", 3, "output", 4, "vector");
        mgr.connectBlocks("validateTest", 5, "output", 6, "rgb");

        const validResult = mgr.validateMaterial("validateTest");
        // Should have no 'Missing' critical warnings
        const criticalWarnings = validResult.filter((w) => w.includes("Missing"));
        expect(criticalWarnings.length).toBe(0);
    });

    it("converts enum string properties to numeric values", () => {
        const mgr = new MaterialGraphManager();
        mgr.createMaterial("enumTest");

        // TrigonometryBlock with string "Sin" should become numeric 1
        const trig = mgr.addBlock("enumTest", "TrigonometryBlock", "sinBlock");
        expect(typeof trig).not.toBe("string");
        const trigId = (trig as any).block.id;
        const result = mgr.setBlockProperties("enumTest", trigId, { operation: "Sin" });
        expect(result).toBe("OK");

        // Export and check the operation is numeric
        // (need enough blocks for valid export — just add output blocks too)
        mgr.addBlock("enumTest", "InputBlock", "pos", { type: "Vector3", mode: "Attribute", attributeName: "position" });
        mgr.addBlock("enumTest", "InputBlock", "wvp", { type: "Matrix", systemValue: "WorldViewProjection" });
        mgr.addBlock("enumTest", "TransformBlock", "transform");
        mgr.addBlock("enumTest", "VertexOutputBlock", "vertOut");
        mgr.addBlock("enumTest", "FragmentOutputBlock", "fragOut");
        mgr.addBlock("enumTest", "InputBlock", "color", { type: "Color3", value: [1, 0, 0] });
        mgr.connectBlocks("enumTest", 2, "output", 4, "vector");
        mgr.connectBlocks("enumTest", 3, "output", 4, "transform");
        mgr.connectBlocks("enumTest", 4, "output", 5, "vector");
        mgr.connectBlocks("enumTest", 7, "output", 6, "rgb");

        const json = mgr.exportJSON("enumTest");
        expect(json).toBeDefined();
        const parsed = JSON.parse(json!);
        const trigBlock = parsed.blocks.find((b: any) => b.name === "sinBlock");
        expect(trigBlock).toBeDefined();
        expect(trigBlock.operation).toBe(1); // Sin = 1

        // Also verify ConditionalBlock
        const mgr2 = new MaterialGraphManager();
        mgr2.createMaterial("condTest");
        const cond = mgr2.addBlock("condTest", "ConditionalBlock", "condBlock");
        const condId = (cond as any).block.id;
        mgr2.setBlockProperties("condTest", condId, { condition: "GreaterThan" });
        // Quick export to trigger normalization
        mgr2.addBlock("condTest", "InputBlock", "pos", { type: "Vector3", mode: "Attribute", attributeName: "position" });
        mgr2.addBlock("condTest", "InputBlock", "wvp", { type: "Matrix", systemValue: "WorldViewProjection" });
        mgr2.addBlock("condTest", "TransformBlock", "transform");
        mgr2.addBlock("condTest", "VertexOutputBlock", "vertOut");
        mgr2.addBlock("condTest", "FragmentOutputBlock", "fragOut");
        mgr2.addBlock("condTest", "InputBlock", "color", { type: "Color3", value: [1, 0, 0] });
        mgr2.connectBlocks("condTest", 2, "output", 4, "vector");
        mgr2.connectBlocks("condTest", 3, "output", 4, "transform");
        mgr2.connectBlocks("condTest", 4, "output", 5, "vector");
        mgr2.connectBlocks("condTest", 7, "output", 6, "rgb");

        const json2 = mgr2.exportJSON("condTest");
        const parsed2 = JSON.parse(json2!);
        const condBlock = parsed2.blocks.find((b: any) => b.name === "condBlock");
        expect(condBlock).toBeDefined();
        expect(condBlock.condition).toBe(3); // GreaterThan = 3
    });

    // ── clearAll ────────────────────────────────────────────────────────

    it("clearAll removes all materials and resets state", () => {
        const mgr = new MaterialGraphManager();
        mgr.createMaterial("a");
        mgr.createMaterial("b");
        expect(mgr.listMaterials().length).toBe(2);

        mgr.clearAll();
        expect(mgr.listMaterials()).toEqual([]);
        expect(mgr.getMaterial("a")).toBeUndefined();
        expect(mgr.getMaterial("b")).toBeUndefined();

        // Can create new materials after clear
        mgr.createMaterial("c");
        expect(mgr.listMaterials()).toEqual(["c"]);
    });

    it("clearAll on empty manager is a no-op", () => {
        const mgr = new MaterialGraphManager();
        mgr.clearAll();
        expect(mgr.listMaterials()).toEqual([]);
    });
});
