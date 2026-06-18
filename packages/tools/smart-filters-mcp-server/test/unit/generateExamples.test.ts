/**
 * Smart Filters MCP Server – Example Smart Filter Generator
 *
 * Builds several reference Smart Filter graphs via the SmartFiltersGraphManager
 * API, validates them, and writes them to the examples/ directory.
 *
 * Run:  npx ts-node --esm test/unit/generateExamples.ts
 * Or simply include as a test file – Jest will run it and the examples are
 * written to disk as a side effect.
 */

import * as fs from "fs";
import * as path from "path";
import { SmartFiltersGraphManager } from "../../src/smartFiltersGraph";

const EXAMPLES_DIR = path.resolve(__dirname, "../../examples");

function writeExample(name: string, json: string): void {
    fs.mkdirSync(EXAMPLES_DIR, { recursive: true });
    const filePath = path.join(EXAMPLES_DIR, `${name}.json`);
    fs.writeFileSync(filePath, json, "utf-8");
}

function blockId(result: ReturnType<SmartFiltersGraphManager["addBlock"]>): number {
    if (typeof result === "string") {
        throw new Error(result);
    }
    return (result as any).block.uniqueId;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Example 1 – Black and White
//  The simplest filter: Texture → BlackAndWhiteBlock → OutputBlock
// ═══════════════════════════════════════════════════════════════════════════

function buildBlackAndWhite(): string {
    const mgr = new SmartFiltersGraphManager();
    mgr.createGraph("BlackAndWhite");

    const texId = blockId(mgr.addBlock("BlackAndWhite", "Texture", "source"));
    const bwId = blockId(mgr.addBlock("BlackAndWhite", "BlackAndWhiteBlock", "bwEffect"));

    expect(mgr.connectBlocks("BlackAndWhite", texId, "output", bwId, "input")).toBe("OK");
    expect(mgr.connectBlocks("BlackAndWhite", bwId, "output", 1, "input")).toBe("OK");

    const issues = mgr.validateGraph("BlackAndWhite");
    expect(issues).toEqual(["No issues found — graph looks valid."]);

    const json = mgr.exportJSON("BlackAndWhite");
    expect(json).toBeDefined();
    return json!;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Example 2 – Blur Chain
//  Texture → BlurBlock → OutputBlock with custom blur size.
// ═══════════════════════════════════════════════════════════════════════════

function buildBlurChain(): string {
    const mgr = new SmartFiltersGraphManager();
    mgr.createGraph("BlurChain");

    const texId = blockId(mgr.addBlock("BlurChain", "Texture", "source"));
    const blurId = blockId(mgr.addBlock("BlurChain", "BlurBlock", "blur", { blurSize: 8 }));

    expect(mgr.connectBlocks("BlurChain", texId, "output", blurId, "input")).toBe("OK");
    expect(mgr.connectBlocks("BlurChain", blurId, "output", 1, "input")).toBe("OK");

    const issues = mgr.validateGraph("BlurChain");
    expect(issues).toEqual(["No issues found — graph looks valid."]);

    const json = mgr.exportJSON("BlurChain");
    expect(json).toBeDefined();
    return json!;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Example 3 – Contrast with Intensity
//  Texture → ContrastBlock (with Float input for intensity) → OutputBlock
// ═══════════════════════════════════════════════════════════════════════════

function buildContrastFilter(): string {
    const mgr = new SmartFiltersGraphManager();
    mgr.createGraph("ContrastFilter");

    const texId = blockId(mgr.addBlock("ContrastFilter", "Texture", "source"));
    const intensityId = blockId(mgr.addBlock("ContrastFilter", "Float", "intensity"));
    mgr.setBlockProperties("ContrastFilter", intensityId, { value: 1.5 });

    const contrastId = blockId(mgr.addBlock("ContrastFilter", "ContrastBlock", "contrast"));

    expect(mgr.connectBlocks("ContrastFilter", texId, "output", contrastId, "input")).toBe("OK");
    expect(mgr.connectBlocks("ContrastFilter", intensityId, "output", contrastId, "intensity")).toBe("OK");
    expect(mgr.connectBlocks("ContrastFilter", contrastId, "output", 1, "input")).toBe("OK");

    const issues = mgr.validateGraph("ContrastFilter");
    expect(issues).toEqual(["No issues found — graph looks valid."]);

    const json = mgr.exportJSON("ContrastFilter");
    expect(json).toBeDefined();
    return json!;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Jest Test Wrapper
// ═══════════════════════════════════════════════════════════════════════════

describe("Smart Filters MCP Server – Example Generation", () => {
    it("generates BlackAndWhite example", () => {
        const json = buildBlackAndWhite();
        const parsed = JSON.parse(json);
        expect(parsed.format).toBe("smartFilter");
        expect(parsed.formatVersion).toBe(1);
        expect(parsed.blocks.length).toBe(3); // OutputBlock + Texture + BlackAndWhiteBlock
        expect(parsed.connections.length).toBe(2);
        writeExample("BlackAndWhite", json);
    });

    it("generates BlurChain example", () => {
        const json = buildBlurChain();
        const parsed = JSON.parse(json);
        expect(parsed.blocks.length).toBe(3);
        expect(parsed.connections.length).toBe(2);
        writeExample("BlurChain", json);
    });

    it("generates ContrastFilter example", () => {
        const json = buildContrastFilter();
        const parsed = JSON.parse(json);
        expect(parsed.blocks.length).toBe(4); // OutputBlock + Texture + Float + ContrastBlock
        expect(parsed.connections.length).toBe(3);
        writeExample("ContrastFilter", json);
    });
});
