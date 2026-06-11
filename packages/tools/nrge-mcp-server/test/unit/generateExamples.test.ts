/**
 * Node Render Graph MCP Server – Example Render Graph Generator
 *
 * Builds several reference Node Render Graph definitions via the
 * RenderGraphManager API, validates them, and writes them to the examples/
 * directory.
 *
 * Run:  npx ts-node --esm test/unit/generateExamples.ts
 * Or simply include as a test file – Jest will run it and the examples are
 * written to disk as a side effect.
 */

import * as fs from "fs";
import * as path from "path";
import { RenderGraphManager } from "../../src/renderGraph";

const EXAMPLES_DIR = path.resolve(__dirname, "../../examples");

function writeExample(name: string, json: string): void {
    fs.mkdirSync(EXAMPLES_DIR, { recursive: true });
    const filePath = path.join(EXAMPLES_DIR, `${name}.json`);
    fs.writeFileSync(filePath, json, "utf-8");
}

// ═══════════════════════════════════════════════════════════════════════════
//  Example 1 – Basic Forward Rendering
//  The simplest useful render graph: clear a back-buffer, render objects, output.
//  InputBlock(BackBuffer) → Clear → ObjectRenderer → OutputBlock
//  Also needs Camera and ObjectList inputs.
// ═══════════════════════════════════════════════════════════════════════════

function buildBasicForward(): string {
    const mgr = new RenderGraphManager();
    mgr.create("BasicForward", "Minimal forward rendering pipeline: clear, render, output.");

    // Input: back-buffer colour texture (TextureBackBuffer = 2)
    const colorInput = mgr.addBlock("BasicForward", "NodeRenderGraphInputBlock", "BackBuffer Color", [2]);
    mgr.setBlockProperties("BasicForward", colorInput.id, { isExternal: true });

    // Input: back-buffer depth (TextureBackBufferDepthStencilAttachment = 4)
    const depthInput = mgr.addBlock("BasicForward", "NodeRenderGraphInputBlock", "BackBuffer Depth", [4]);
    mgr.setBlockProperties("BasicForward", depthInput.id, { isExternal: true });

    // Input: camera (Camera = 0x01000000 = 16777216)
    const cameraInput = mgr.addBlock("BasicForward", "NodeRenderGraphInputBlock", "Camera", [16777216]);
    mgr.setBlockProperties("BasicForward", cameraInput.id, { isExternal: true });

    // Input: object list (ObjectList = 0x02000000 = 33554432)
    const objectsInput = mgr.addBlock("BasicForward", "NodeRenderGraphInputBlock", "Objects", [33554432]);
    mgr.setBlockProperties("BasicForward", objectsInput.id, { isExternal: true });

    // Clear block
    const clearBlock = mgr.addBlock("BasicForward", "NodeRenderGraphClearBlock", "Clear");
    mgr.setBlockProperties("BasicForward", clearBlock.id, {
        color: { r: 0.2, g: 0.2, b: 0.3, a: 1 },
        clearColor: true,
        clearDepth: true,
    });
    mgr.connect("BasicForward", colorInput.id, "output", clearBlock.id, "target");
    mgr.connect("BasicForward", depthInput.id, "output", clearBlock.id, "depth");

    // Object renderer
    const renderer = mgr.addBlock("BasicForward", "NodeRenderGraphObjectRendererBlock", "Renderer");
    mgr.connect("BasicForward", clearBlock.id, "output", renderer.id, "target");
    mgr.connect("BasicForward", clearBlock.id, "outputDepth", renderer.id, "depth");
    mgr.connect("BasicForward", cameraInput.id, "output", renderer.id, "camera");
    mgr.connect("BasicForward", objectsInput.id, "output", renderer.id, "objects");

    // Output
    const outputBlock = mgr.addBlock("BasicForward", "NodeRenderGraphOutputBlock", "Output");
    mgr.connect("BasicForward", renderer.id, "output", outputBlock.id, "texture");

    const { valid, messages } = mgr.validate("BasicForward");
    expect(valid).toBe(true);

    return mgr.exportJson("BasicForward");
}

// ═══════════════════════════════════════════════════════════════════════════
//  Example 2 – Bloom Post-Process
//  Forward rendering with a bloom post-process pass before output.
// ═══════════════════════════════════════════════════════════════════════════

function buildBloomPipeline(): string {
    const mgr = new RenderGraphManager();
    mgr.create("BloomPipeline", "Forward rendering with bloom post-process.");

    // Inputs
    const colorInput = mgr.addBlock("BloomPipeline", "NodeRenderGraphInputBlock", "BackBuffer Color", [2]);
    mgr.setBlockProperties("BloomPipeline", colorInput.id, { isExternal: true });

    const depthInput = mgr.addBlock("BloomPipeline", "NodeRenderGraphInputBlock", "BackBuffer Depth", [4]);
    mgr.setBlockProperties("BloomPipeline", depthInput.id, { isExternal: true });

    const cameraInput = mgr.addBlock("BloomPipeline", "NodeRenderGraphInputBlock", "Camera", [16777216]);
    mgr.setBlockProperties("BloomPipeline", cameraInput.id, { isExternal: true });

    const objectsInput = mgr.addBlock("BloomPipeline", "NodeRenderGraphInputBlock", "Objects", [33554432]);
    mgr.setBlockProperties("BloomPipeline", objectsInput.id, { isExternal: true });

    // Clear
    const clearBlock = mgr.addBlock("BloomPipeline", "NodeRenderGraphClearBlock", "Clear");
    mgr.setBlockProperties("BloomPipeline", clearBlock.id, {
        color: { r: 0.1, g: 0.1, b: 0.15, a: 1 },
        clearColor: true,
        clearDepth: true,
    });
    mgr.connect("BloomPipeline", colorInput.id, "output", clearBlock.id, "target");
    mgr.connect("BloomPipeline", depthInput.id, "output", clearBlock.id, "depth");

    // Render objects
    const renderer = mgr.addBlock("BloomPipeline", "NodeRenderGraphObjectRendererBlock", "Renderer");
    mgr.connect("BloomPipeline", clearBlock.id, "output", renderer.id, "target");
    mgr.connect("BloomPipeline", clearBlock.id, "outputDepth", renderer.id, "depth");
    mgr.connect("BloomPipeline", cameraInput.id, "output", renderer.id, "camera");
    mgr.connect("BloomPipeline", objectsInput.id, "output", renderer.id, "objects");

    // Bloom post-process
    const bloom = mgr.addBlock("BloomPipeline", "NodeRenderGraphBloomPostProcessBlock", "Bloom");
    mgr.setBlockProperties("BloomPipeline", bloom.id, {
        threshold: 0.8,
        weight: 0.6,
        kernel: 64,
        scale: 0.5,
    });
    mgr.connect("BloomPipeline", renderer.id, "output", bloom.id, "source");
    mgr.connect("BloomPipeline", renderer.id, "outputDepth", bloom.id, "target");

    // Output
    const outputBlock = mgr.addBlock("BloomPipeline", "NodeRenderGraphOutputBlock", "Output");
    mgr.connect("BloomPipeline", bloom.id, "output", outputBlock.id, "texture");

    const { valid, messages } = mgr.validate("BloomPipeline");
    expect(valid).toBe(true);

    return mgr.exportJson("BloomPipeline");
}

// ═══════════════════════════════════════════════════════════════════════════
//  Example 3 – Clear Only
//  The absolute minimum: clear a texture and output it. No object rendering.
//  Useful as a starting template.
// ═══════════════════════════════════════════════════════════════════════════

function buildClearOnly(): string {
    const mgr = new RenderGraphManager();
    mgr.create("ClearOnly", "Minimal pipeline: clear a back-buffer and output.");

    const colorInput = mgr.addBlock("ClearOnly", "NodeRenderGraphInputBlock", "BackBuffer Color", [2]);
    mgr.setBlockProperties("ClearOnly", colorInput.id, { isExternal: true });

    const clearBlock = mgr.addBlock("ClearOnly", "NodeRenderGraphClearBlock", "Clear");
    mgr.setBlockProperties("ClearOnly", clearBlock.id, {
        color: { r: 0.4, g: 0.6, b: 0.9, a: 1 },
        clearColor: true,
    });
    mgr.connect("ClearOnly", colorInput.id, "output", clearBlock.id, "target");

    const outputBlock = mgr.addBlock("ClearOnly", "NodeRenderGraphOutputBlock", "Output");
    mgr.connect("ClearOnly", clearBlock.id, "output", outputBlock.id, "texture");

    const { valid, messages } = mgr.validate("ClearOnly");
    expect(valid).toBe(true);

    return mgr.exportJson("ClearOnly");
}

// ═══════════════════════════════════════════════════════════════════════════
//  Jest Test Wrapper
// ═══════════════════════════════════════════════════════════════════════════

describe("Node Render Graph MCP Server – Example Generation", () => {
    it("generates BasicForward example", () => {
        const json = buildBasicForward();
        const parsed = JSON.parse(json);
        expect(parsed.customType).toBe("BABYLON.NodeRenderGraph");
        expect(parsed.blocks.length).toBe(7); // 4 inputs + clear + renderer + output
        expect(parsed.outputNodeId).toBeDefined();
        writeExample("BasicForward", json);
    });

    it("generates BloomPipeline example", () => {
        const json = buildBloomPipeline();
        const parsed = JSON.parse(json);
        expect(parsed.blocks.length).toBe(8); // 4 inputs + clear + renderer + bloom + output
        writeExample("BloomPipeline", json);
    });

    it("generates ClearOnly example", () => {
        const json = buildClearOnly();
        const parsed = JSON.parse(json);
        expect(parsed.blocks.length).toBe(3); // 1 input + clear + output
        writeExample("ClearOnly", json);
    });
});
