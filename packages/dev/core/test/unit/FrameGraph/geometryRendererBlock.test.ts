import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { FrameGraph } from "core/FrameGraph/frameGraph";
import { NodeRenderGraphGeometryRendererBlock } from "core/FrameGraph/Node/Blocks/Rendering/geometryRendererBlock";
import { NodeRenderGraphObjectRendererBlock } from "core/FrameGraph/Node/Blocks/Rendering/objectRendererBlock";
import { type NodeRenderGraphBaseObjectRendererBlock } from "core/FrameGraph/Node/Blocks/Rendering/baseObjectRendererBlock";
import "core/Engines/Extensions/engine.multiRender";

describe("Node render graph renderer defaults", () => {
    let engine: NullEngine;
    let scene: Scene;
    let frameGraph: FrameGraph;
    let blocks: NodeRenderGraphBaseObjectRendererBlock[];

    beforeEach(() => {
        engine = new NullEngine();
        vi.spyOn(engine, "buildTextureLayout").mockImplementation((enabled) => enabled.map((value, index) => (value ? index + 1 : 0)));
        scene = new Scene(engine);
        frameGraph = new FrameGraph(scene);
        blocks = [];
    });

    afterEach(() => {
        for (const block of blocks) {
            block.dispose();
        }
        scene.dispose();
        engine.dispose();
    });

    it.each([
        { name: "geometry", constructor: NodeRenderGraphGeometryRendererBlock, enabled: false },
        { name: "object", constructor: NodeRenderGraphObjectRendererBlock, enabled: true },
    ])("preserves $name renderer defaults when legacy data omits auxiliary flags", ({ name, constructor, enabled }) => {
        const block = new constructor(name, frameGraph, scene);
        blocks.push(block);
        const data = block.serialize();
        delete data.renderParticles;
        delete data.renderSprites;
        delete data.enableBoundingBoxRendering;
        delete data.enableOutlineRendering;

        block._deserialize(data);

        expect(block.renderParticles).toBe(enabled);
        expect(block.renderSprites).toBe(enabled);
        expect(block.enableBoundingBoxRendering).toBe(enabled);
        expect(block.enableOutlineRendering).toBe(enabled);
    });

    it("round-trips explicitly enabled geometry renderer features", () => {
        const source = new NodeRenderGraphGeometryRendererBlock("source", frameGraph, scene);
        const restored = new NodeRenderGraphGeometryRendererBlock("restored", frameGraph, scene);
        blocks.push(source, restored);
        source.renderParticles = true;
        source.renderSprites = true;
        source.enableBoundingBoxRendering = true;
        source.enableOutlineRendering = true;

        restored._deserialize(source.serialize());

        expect(restored.renderParticles).toBe(true);
        expect(restored.renderSprites).toBe(true);
        expect(restored.enableBoundingBoxRendering).toBe(true);
        expect(restored.enableOutlineRendering).toBe(true);
    });
});
