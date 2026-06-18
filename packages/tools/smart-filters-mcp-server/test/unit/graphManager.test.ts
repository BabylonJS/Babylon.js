/**
 * Smart Filters MCP Server – Graph Manager Tests
 *
 * Creates Smart Filter graphs via SmartFiltersGraphManager, exports them to JSON,
 * validates the JSON structure, and exercises core operations.
 */

import { SmartFiltersGraphManager } from "../../src/smartFiltersGraph";
import { BlockRegistry } from "../../src/blockRegistry";

// ─── Test Helpers ─────────────────────────────────────────────────────────

function validateSmartFilterJSON(json: string, label: string): any {
    let parsed: any;
    try {
        parsed = JSON.parse(json);
    } catch {
        throw new Error(`${label}: invalid JSON`);
    }

    expect(parsed.format).toBe("smartFilter");
    expect(parsed.formatVersion).toBe(1);
    expect(Array.isArray(parsed.blocks)).toBe(true);
    expect(Array.isArray(parsed.connections)).toBe(true);

    const allIds = new Set(parsed.blocks.map((b: any) => b.uniqueId));
    for (const block of parsed.blocks) {
        expect(typeof block.blockType).toBe("string");
        expect(typeof block.uniqueId).toBe("number");
        expect(typeof block.name).toBe("string");
    }

    // Validate connections reference existing block IDs
    for (const conn of parsed.connections) {
        expect(allIds.has(conn.outputBlock)).toBe(true);
        expect(allIds.has(conn.inputBlock)).toBe(true);
        expect(typeof conn.outputConnectionPoint).toBe("string");
        expect(typeof conn.inputConnectionPoint).toBe("string");
    }

    return parsed;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Tests
// ═══════════════════════════════════════════════════════════════════════════

describe("Smart Filters MCP Server – Graph Manager", () => {
    // ── Test 1: Simple filter graph ─────────────────────────────────────

    it("creates and exports a simple black-and-white filter with valid JSON", () => {
        const mgr = new SmartFiltersGraphManager();
        mgr.createGraph("bw");

        const texture = mgr.addBlock("bw", "Texture", "source");
        expect(typeof texture).not.toBe("string");
        const textureBlock = (texture as any).block;

        const bw = mgr.addBlock("bw", "BlackAndWhiteBlock", "bwEffect");
        expect(typeof bw).not.toBe("string");
        const bwBlock = (bw as any).block;

        // Connect: source.output → bwEffect.input
        const conn1 = mgr.connectBlocks("bw", textureBlock.uniqueId, "output", bwBlock.uniqueId, "input");
        expect(conn1).toBe("OK");

        // Connect: bwEffect.output → OutputBlock.input (OutputBlock is uniqueId=1)
        const conn2 = mgr.connectBlocks("bw", bwBlock.uniqueId, "output", 1, "input");
        expect(conn2).toBe("OK");

        const json = mgr.exportJSON("bw");
        expect(json).toBeDefined();
        const parsed = validateSmartFilterJSON(json!, "bw");

        // OutputBlock + Texture + BlackAndWhiteBlock = 3 blocks
        expect(parsed.blocks.length).toBe(3);
        expect(parsed.connections.length).toBe(2);

        // Should have an OutputBlock
        const outputBlocks = parsed.blocks.filter((b: any) => b.blockType === "OutputBlock");
        expect(outputBlocks.length).toBe(1);
    });

    // ── Test 2: Lifecycle operations ────────────────────────────────────

    it("supports create, list, delete, clone lifecycle", () => {
        const mgr = new SmartFiltersGraphManager();
        mgr.createGraph("a");
        mgr.createGraph("b");

        const list = mgr.listGraphs();
        expect(list).toContain("a");
        expect(list).toContain("b");

        expect(mgr.deleteGraph("a")).toBe(true);
        expect(mgr.listGraphs()).not.toContain("a");
        expect(mgr.deleteGraph("nonexistent")).toBe(false);

        // Clone
        mgr.addBlock("b", "Texture", "src");
        const cloneResult = mgr.cloneGraph("b", "c");
        expect(typeof cloneResult).not.toBe("string");

        const cGraph = mgr.getGraph("c");
        expect(cGraph).toBeDefined();
        // 2 blocks: OutputBlock + Texture
        expect(cGraph!.blocks.length).toBe(2);
    });

    // ── Test 3: clearAll ────────────────────────────────────────────────

    it("clearAll removes all graphs", () => {
        const mgr = new SmartFiltersGraphManager();
        mgr.createGraph("x");
        mgr.createGraph("y");
        mgr.clearAll();
        expect(mgr.listGraphs()).toEqual([]);
    });

    // ── Test 4: Block add/remove ────────────────────────────────────────

    it("adds and removes blocks correctly", () => {
        const mgr = new SmartFiltersGraphManager();
        mgr.createGraph("test");

        const result = mgr.addBlock("test", "BlurBlock", "blur1", { blurSize: 4 });
        expect(typeof result).not.toBe("string");
        const block = (result as any).block;
        expect(block.blockType).toBe("BlurBlock");
        expect(block.data.blurSize).toBe(4);

        // Remove it
        const rmResult = mgr.removeBlock("test", block.uniqueId);
        expect(rmResult).toBe("OK");

        // Should only have OutputBlock
        const graph = mgr.getGraph("test")!;
        expect(graph.blocks.length).toBe(1);
        expect(graph.blocks[0].blockType).toBe("OutputBlock");
    });

    // ── Test 5: Cannot remove OutputBlock ───────────────────────────────

    it("prevents removing OutputBlock", () => {
        const mgr = new SmartFiltersGraphManager();
        mgr.createGraph("test");
        const result = mgr.removeBlock("test", 1);
        expect(result).toContain("Cannot remove the OutputBlock");
    });

    // ── Test 6: Cannot add second OutputBlock ───────────────────────────

    it("prevents adding a second OutputBlock", () => {
        const mgr = new SmartFiltersGraphManager();
        mgr.createGraph("test");
        const result = mgr.addBlock("test", "OutputBlock", "out2");
        expect(typeof result).toBe("string");
        expect(result).toContain("automatically created");
    });

    // ── Test 7: Connection validation ───────────────────────────────────

    it("validates connections: type mismatch", () => {
        const mgr = new SmartFiltersGraphManager();
        mgr.createGraph("test");

        const floatInput = mgr.addBlock("test", "Float", "myFloat");
        expect(typeof floatInput).not.toBe("string");
        const floatBlock = (floatInput as any).block;

        const bw = mgr.addBlock("test", "BlackAndWhiteBlock", "bw");
        expect(typeof bw).not.toBe("string");
        const bwBlock = (bw as any).block;

        // Float output → Texture input should fail (type mismatch)
        const result = mgr.connectBlocks("test", floatBlock.uniqueId, "output", bwBlock.uniqueId, "input");
        expect(result).toContain("Type mismatch");
    });

    // ── Test 8: Connection validation: cycle detection ──────────────────

    it("detects cycles in connections", () => {
        const mgr = new SmartFiltersGraphManager();
        mgr.createGraph("test");

        const tex = mgr.addBlock("test", "Texture", "src");
        const bw = mgr.addBlock("test", "BlackAndWhiteBlock", "bw");
        const contrast = mgr.addBlock("test", "ContrastBlock", "contrast");
        const intensityInput = mgr.addBlock("test", "Float", "intensity");

        const texBlock = (tex as any).block;
        const bwBlock = (bw as any).block;
        const contrastBlock = (contrast as any).block;
        const intBlock = (intensityInput as any).block;

        // tex → bw → contrast → OutputBlock
        expect(mgr.connectBlocks("test", texBlock.uniqueId, "output", bwBlock.uniqueId, "input")).toBe("OK");
        expect(mgr.connectBlocks("test", bwBlock.uniqueId, "output", contrastBlock.uniqueId, "input")).toBe("OK");
        expect(mgr.connectBlocks("test", intBlock.uniqueId, "output", contrastBlock.uniqueId, "intensity")).toBe("OK");

        // Now try to create a cycle: contrast.output → bw.input (bw already feeds contrast)
        const cycleResult = mgr.connectBlocks("test", contrastBlock.uniqueId, "output", bwBlock.uniqueId, "input");
        expect(cycleResult).toContain("cycle");
    });

    // ── Test 9: Connection validation: invalid port names ───────────────

    it("rejects invalid port names", () => {
        const mgr = new SmartFiltersGraphManager();
        mgr.createGraph("test");

        const tex = mgr.addBlock("test", "Texture", "src");
        const bw = mgr.addBlock("test", "BlackAndWhiteBlock", "bw");
        const texBlock = (tex as any).block;
        const bwBlock = (bw as any).block;

        const result1 = mgr.connectBlocks("test", texBlock.uniqueId, "nonexistent", bwBlock.uniqueId, "input");
        expect(result1).toContain("not found");

        const result2 = mgr.connectBlocks("test", texBlock.uniqueId, "output", bwBlock.uniqueId, "nonexistent");
        expect(result2).toContain("not found");
    });

    // ── Test 10: Property setting ───────────────────────────────────────

    it("sets block properties correctly", () => {
        const mgr = new SmartFiltersGraphManager();
        mgr.createGraph("test");

        const result = mgr.addBlock("test", "Float", "intensity");
        expect(typeof result).not.toBe("string");
        const block = (result as any).block;

        const setResult = mgr.setBlockProperties("test", block.uniqueId, { value: 0.75 });
        expect(setResult).toBe("OK");

        const props = mgr.getBlockProperties("test", block.uniqueId);
        expect(typeof props).not.toBe("string");
        expect((props as any).value).toBe(0.75);
    });

    // ── Test 11: Validation – missing OutputBlock connection ────────────

    it("validation reports unconnected OutputBlock", () => {
        const mgr = new SmartFiltersGraphManager();
        mgr.createGraph("test");

        // Just the auto-created OutputBlock with nothing connected
        const issues = mgr.validateGraph("test");
        expect(issues.some((i) => i.includes("OutputBlock input is not connected"))).toBe(true);
    });

    // ── Test 12: Validation – valid graph passes ────────────────────────

    it("valid graph passes validation", () => {
        const mgr = new SmartFiltersGraphManager();
        mgr.createGraph("test");

        const tex = mgr.addBlock("test", "Texture", "src");
        const bw = mgr.addBlock("test", "BlackAndWhiteBlock", "bw");
        const texBlock = (tex as any).block;
        const bwBlock = (bw as any).block;

        mgr.connectBlocks("test", texBlock.uniqueId, "output", bwBlock.uniqueId, "input");
        mgr.connectBlocks("test", bwBlock.uniqueId, "output", 1, "input");

        const issues = mgr.validateGraph("test");
        expect(issues).toEqual(["No issues found — graph looks valid."]);
    });

    // ── Test 13: Validation – orphan blocks ─────────────────────────────

    it("validation reports orphan blocks", () => {
        const mgr = new SmartFiltersGraphManager();
        mgr.createGraph("test");

        const tex = mgr.addBlock("test", "Texture", "src");
        const bw = mgr.addBlock("test", "BlackAndWhiteBlock", "bw");
        mgr.addBlock("test", "BlurBlock", "orphan");
        const texBlock = (tex as any).block;
        const bwBlock = (bw as any).block;

        mgr.connectBlocks("test", texBlock.uniqueId, "output", bwBlock.uniqueId, "input");
        mgr.connectBlocks("test", bwBlock.uniqueId, "output", 1, "input");

        const issues = mgr.validateGraph("test");
        expect(issues.some((i) => i.includes("orphan"))).toBe(true);
    });

    // ── Test 14: Import/export round-trip ───────────────────────────────

    it("supports import/export round-trip", () => {
        const mgr = new SmartFiltersGraphManager();
        mgr.createGraph("original");

        const tex = mgr.addBlock("original", "Texture", "src");
        const bw = mgr.addBlock("original", "BlackAndWhiteBlock", "bw");
        const texBlock = (tex as any).block;
        const bwBlock = (bw as any).block;

        mgr.connectBlocks("original", texBlock.uniqueId, "output", bwBlock.uniqueId, "input");
        mgr.connectBlocks("original", bwBlock.uniqueId, "output", 1, "input");

        const json = mgr.exportJSON("original");
        expect(json).toBeDefined();

        // Import into a new graph
        const importResult = mgr.importJSON("imported", json!);
        expect(importResult).toBe("OK");

        // Re-export and compare structure
        const json2 = mgr.exportJSON("imported");
        expect(json2).toBeDefined();
        const parsed1 = JSON.parse(json!);
        const parsed2 = JSON.parse(json2!);

        expect(parsed2.blocks.length).toBe(parsed1.blocks.length);
        expect(parsed2.connections.length).toBe(parsed1.connections.length);
        expect(parsed2.format).toBe("smartFilter");
        expect(parsed2.formatVersion).toBe(1);
    });

    // ── Test 15: Import validation ──────────────────────────────────────

    it("rejects invalid import JSON", () => {
        const mgr = new SmartFiltersGraphManager();

        const result1 = mgr.importJSON("bad", "not json");
        expect(result1).toContain("Failed to parse");

        const result2 = mgr.importJSON("bad", JSON.stringify({ format: "wrong", formatVersion: 1, blocks: [], connections: [] }));
        expect(result2).toContain("Invalid format");

        const result3 = mgr.importJSON("bad", JSON.stringify({ format: "smartFilter", formatVersion: 2, blocks: [], connections: [] }));
        expect(result3).toContain("Invalid format");
    });

    // ── Test 16: Disconnect ─────────────────────────────────────────────

    it("disconnects inputs correctly", () => {
        const mgr = new SmartFiltersGraphManager();
        mgr.createGraph("test");

        const tex = mgr.addBlock("test", "Texture", "src");
        const bw = mgr.addBlock("test", "BlackAndWhiteBlock", "bw");
        const texBlock = (tex as any).block;
        const bwBlock = (bw as any).block;

        mgr.connectBlocks("test", texBlock.uniqueId, "output", bwBlock.uniqueId, "input");

        const graph = mgr.getGraph("test")!;
        expect(graph.connections.length).toBe(1);

        const discResult = mgr.disconnectInput("test", bwBlock.uniqueId, "input");
        expect(discResult).toBe("OK");
        expect(graph.connections.length).toBe(0);
    });

    // ── Test 17: Describe graph ─────────────────────────────────────────

    it("describes graph with useful info", () => {
        const mgr = new SmartFiltersGraphManager();
        mgr.createGraph("test", "A test filter");

        mgr.addBlock("test", "Texture", "src");

        const desc = mgr.describeGraph("test");
        expect(desc).toContain("Smart Filter: test");
        expect(desc).toContain("A test filter");
        expect(desc).toContain("OutputBlock");
        expect(desc).toContain("src");
    });

    // ── Test 18: Describe block ─────────────────────────────────────────

    it("describes block with ports and properties", () => {
        const mgr = new SmartFiltersGraphManager();
        mgr.createGraph("test");

        const result = mgr.addBlock("test", "BlurBlock", "blur1", { blurSize: 3 });
        const block = (result as any).block;

        const desc = mgr.describeBlock("test", block.uniqueId);
        expect(desc).toContain("blur1");
        expect(desc).toContain("BlurBlock");
        expect(desc).toContain("input");
        expect(desc).toContain("output");
        expect(desc).toContain("blurSize");
    });

    // ── Test 19: Find blocks ────────────────────────────────────────────

    it("finds blocks by name/type/namespace substring", () => {
        const mgr = new SmartFiltersGraphManager();
        mgr.createGraph("test");

        mgr.addBlock("test", "Texture", "videoSource");
        mgr.addBlock("test", "BlackAndWhiteBlock", "bwEffect");
        mgr.addBlock("test", "BlurBlock", "blurEffect");

        const result1 = mgr.findBlocks("test", "effect");
        expect(result1).toContain("bwEffect");
        expect(result1).toContain("blurEffect");

        const result2 = mgr.findBlocks("test", "Texture");
        expect(result2).toContain("videoSource");

        const result3 = mgr.findBlocks("test", "nonexistent");
        expect(result3).toContain("No blocks matching");
    });

    // ── Test 20: List connections ────────────────────────────────────────

    it("lists connections", () => {
        const mgr = new SmartFiltersGraphManager();
        mgr.createGraph("test");

        const tex = mgr.addBlock("test", "Texture", "src");
        const bw = mgr.addBlock("test", "BlackAndWhiteBlock", "bw");
        const texBlock = (tex as any).block;
        const bwBlock = (bw as any).block;

        mgr.connectBlocks("test", texBlock.uniqueId, "output", bwBlock.uniqueId, "input");

        const conns = mgr.listConnections("test");
        expect(conns).toContain("src.output");
        expect(conns).toContain("bw.input");
    });

    // ── Test 21: Complex multi-block filter ─────────────────────────────

    it("builds a complex multi-block filter chain", () => {
        const mgr = new SmartFiltersGraphManager();
        mgr.createGraph("complex");

        // Texture → Desaturate → Blur → Contrast → OutputBlock
        const tex = mgr.addBlock("complex", "Texture", "source");
        const desatAmount = mgr.addBlock("complex", "Float", "desatIntensity", { value: 0.6 });
        const desat = mgr.addBlock("complex", "DesaturateBlock", "desaturate");
        const blur = mgr.addBlock("complex", "BlurBlock", "blur", { blurSize: 3 });
        const contrastAmount = mgr.addBlock("complex", "Float", "contrastIntensity", { value: 0.8 });
        const contrast = mgr.addBlock("complex", "ContrastBlock", "contrast");

        const texId = (tex as any).block.uniqueId;
        const desatAmountId = (desatAmount as any).block.uniqueId;
        const desatId = (desat as any).block.uniqueId;
        const blurId = (blur as any).block.uniqueId;
        const contrastAmountId = (contrastAmount as any).block.uniqueId;
        const contrastId = (contrast as any).block.uniqueId;

        expect(mgr.connectBlocks("complex", texId, "output", desatId, "input")).toBe("OK");
        expect(mgr.connectBlocks("complex", desatAmountId, "output", desatId, "intensity")).toBe("OK");
        expect(mgr.connectBlocks("complex", desatId, "output", blurId, "input")).toBe("OK");
        expect(mgr.connectBlocks("complex", blurId, "output", contrastId, "input")).toBe("OK");
        expect(mgr.connectBlocks("complex", contrastAmountId, "output", contrastId, "intensity")).toBe("OK");
        expect(mgr.connectBlocks("complex", contrastId, "output", 1, "input")).toBe("OK");

        // Validate
        const issues = mgr.validateGraph("complex");
        expect(issues).toEqual(["No issues found — graph looks valid."]);

        // Export
        const json = mgr.exportJSON("complex");
        expect(json).toBeDefined();
        const parsed = validateSmartFilterJSON(json!, "complex");

        // 1 OutputBlock + 1 Texture + 2 Float + 3 effects = 7
        expect(parsed.blocks.length).toBe(7);
        expect(parsed.connections.length).toBe(6);
    });

    // ── Test 22: Block registry completeness ────────────────────────────

    it("block registry has expected blocks", () => {
        expect(BlockRegistry.BlackAndWhiteBlock).toBeDefined();
        expect(BlockRegistry.BlurBlock).toBeDefined();
        expect(BlockRegistry.ContrastBlock).toBeDefined();
        expect(BlockRegistry.DesaturateBlock).toBeDefined();
        expect(BlockRegistry.ExposureBlock).toBeDefined();
        expect(BlockRegistry.GreenScreenBlock).toBeDefined();
        expect(BlockRegistry.KaleidoscopeBlock).toBeDefined();
        expect(BlockRegistry.MaskBlock).toBeDefined();
        expect(BlockRegistry.PixelateBlock).toBeDefined();
        expect(BlockRegistry.PosterizeBlock).toBeDefined();
        expect(BlockRegistry.SpritesheetBlock).toBeDefined();
        expect(BlockRegistry.CompositionBlock).toBeDefined();
        expect(BlockRegistry.TintBlock).toBeDefined();
        expect(BlockRegistry.WipeBlock).toBeDefined();
        expect(BlockRegistry.PremultiplyAlphaBlock).toBeDefined();
        expect(BlockRegistry.DirectionalBlurBlock).toBeDefined();
        expect(BlockRegistry.Float).toBeDefined();
        expect(BlockRegistry.Color3).toBeDefined();
        expect(BlockRegistry.Color4).toBeDefined();
        expect(BlockRegistry.Texture).toBeDefined();
        expect(BlockRegistry.Vector2).toBeDefined();
        expect(BlockRegistry.Boolean).toBeDefined();
        expect(BlockRegistry.OutputBlock).toBeDefined();
    });

    // ── Test 23: Overwrite connection ───────────────────────────────────

    it("overwrites existing connection to same input", () => {
        const mgr = new SmartFiltersGraphManager();
        mgr.createGraph("test");

        const tex1 = mgr.addBlock("test", "Texture", "source1");
        const tex2 = mgr.addBlock("test", "Texture", "source2");
        const bw = mgr.addBlock("test", "BlackAndWhiteBlock", "bw");

        const tex1Id = (tex1 as any).block.uniqueId;
        const tex2Id = (tex2 as any).block.uniqueId;
        const bwId = (bw as any).block.uniqueId;

        // Connect source1 → bw
        expect(mgr.connectBlocks("test", tex1Id, "output", bwId, "input")).toBe("OK");
        let graph = mgr.getGraph("test")!;
        expect(graph.connections.length).toBe(1);
        expect(graph.connections[0].outputBlock).toBe(tex1Id);

        // Overwrite with source2 → bw
        expect(mgr.connectBlocks("test", tex2Id, "output", bwId, "input")).toBe("OK");
        graph = mgr.getGraph("test")!;
        expect(graph.connections.length).toBe(1);
        expect(graph.connections[0].outputBlock).toBe(tex2Id);
    });

    // ── Test 24: Self-loop detection ────────────────────────────────────

    it("prevents self-loop connections", () => {
        const mgr = new SmartFiltersGraphManager();
        mgr.createGraph("test");

        const bw = mgr.addBlock("test", "BlackAndWhiteBlock", "bw");
        const bwId = (bw as any).block.uniqueId;

        const result = mgr.connectBlocks("test", bwId, "output", bwId, "input");
        expect(result).toContain("cycle");
    });

    // ── Test 25: Remove block cleans connections ────────────────────────

    it("removing a block cleans up its connections", () => {
        const mgr = new SmartFiltersGraphManager();
        mgr.createGraph("test");

        const tex = mgr.addBlock("test", "Texture", "src");
        const bw = mgr.addBlock("test", "BlackAndWhiteBlock", "bw");
        const texId = (tex as any).block.uniqueId;
        const bwId = (bw as any).block.uniqueId;

        mgr.connectBlocks("test", texId, "output", bwId, "input");
        mgr.connectBlocks("test", bwId, "output", 1, "input");

        const graph = mgr.getGraph("test")!;
        expect(graph.connections.length).toBe(2);

        mgr.removeBlock("test", bwId);
        expect(graph.connections.length).toBe(0);
    });
});
