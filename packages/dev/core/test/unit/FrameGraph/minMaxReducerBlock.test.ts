import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "core/Shaders/copyTextureToTexture.fragment";
import { Constants } from "core/Engines/constants";
import { NullEngine } from "core/Engines/nullEngine";
import { FrameGraph } from "core/FrameGraph/frameGraph";
import { NodeRenderGraphInputBlock } from "core/FrameGraph/Node/Blocks/inputBlock";
import { NodeRenderGraphMinMaxReducerBlock } from "core/FrameGraph/Node/Blocks/Textures/minMaxReducerBlock";
import { NodeRenderGraphBuildState } from "core/FrameGraph/Node/nodeRenderGraphBuildState";
import { NodeRenderGraphBlockConnectionPointTypes } from "core/FrameGraph/Node/Types/nodeRenderGraphTypes";
import { DepthTextureType } from "core/Misc/thinMinMaxReducer";
import { GetClass } from "core/Misc/typeStore";
import { Scene } from "core/scene";

describe("NodeRenderGraphMinMaxReducerBlock", () => {
    let engine: NullEngine;
    let scene: Scene;
    let graph: FrameGraph;
    let block: NodeRenderGraphMinMaxReducerBlock;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        graph = new FrameGraph(scene);
        block = new NodeRenderGraphMinMaxReducerBlock("Min/max", graph, scene);
    });

    afterEach(async () => {
        await graph.buildAsync(false);
        block.dispose();
        graph.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("registers for deserialization and exposes a depth-compatible texture input", () => {
        expect(GetClass("BABYLON.NodeRenderGraphMinMaxReducerBlock")).toBe(NodeRenderGraphMinMaxReducerBlock);
        expect(block.inputs.map((point) => point.name)).toEqual(["source", "dependencies"]);
        expect(block.output.type).toBe(NodeRenderGraphBlockConnectionPointTypes.Texture);
        expect(block.source.excludedConnectionPointTypes).not.toContain(NodeRenderGraphBlockConnectionPointTypes.TextureNormalizedViewDepth);
        expect(block.source.excludedConnectionPointTypes).not.toContain(NodeRenderGraphBlockConnectionPointTypes.TextureAlbedo);
        expect(block.source.excludedConnectionPointTypes).not.toContain(NodeRenderGraphBlockConnectionPointTypes.TextureViewNormal);
        expect(block.source.excludedConnectionPointTypes).not.toContain(NodeRenderGraphBlockConnectionPointTypes.TextureVelocity);
        expect(block.source.excludedConnectionPointTypes).not.toContain(NodeRenderGraphBlockConnectionPointTypes.TextureWorldPosition);
        expect(block.source.excludedConnectionPointTypes).not.toContain(NodeRenderGraphBlockConnectionPointTypes.TextureDepthStencilAttachment);
        expect(block.source.excludedConnectionPointTypes).toContain(NodeRenderGraphBlockConnectionPointTypes.TextureMeshBlendTag);
        expect(block.source.excludedConnectionPointTypes).toContain(NodeRenderGraphBlockConnectionPointTypes.TextureBackBuffer);
        expect(block.source.excludedConnectionPointTypes).toContain(NodeRenderGraphBlockConnectionPointTypes.TextureBackBufferDepthStencilAttachment);
    });

    it("round-trips reducer properties without losing default values", () => {
        block.depthRedux = true;
        block.depthTextureType = DepthTextureType.ViewDepth;
        block.textureType = Constants.TEXTURETYPE_FLOAT;
        block.waitForReadback = true;
        const restored = new NodeRenderGraphMinMaxReducerBlock("Restored", graph, scene);
        try {
            restored._deserialize(block.serialize());
            expect(restored.depthRedux).toBe(true);
            expect(restored.depthTextureType).toBe(DepthTextureType.ViewDepth);
            expect(restored.textureType).toBe(Constants.TEXTURETYPE_FLOAT);
            expect(restored.waitForReadback).toBe(true);

            restored._deserialize({ ...block.serialize(), depthRedux: undefined, depthTextureType: undefined, textureType: undefined, waitForReadback: undefined });
            expect(restored.depthRedux).toBe(false);
            expect(restored.depthTextureType).toBe(DepthTextureType.NormalizedViewDepth);
            expect(restored.textureType).toBe(Constants.TEXTURETYPE_HALF_FLOAT);
            expect(restored.waitForReadback).toBe(false);
        } finally {
            restored.dispose();
        }
    });

    it("uses a connected depth color texture as the task source", async () => {
        const source = new NodeRenderGraphInputBlock("depth", graph, scene, NodeRenderGraphBlockConnectionPointTypes.TextureNormalizedViewDepth);
        try {
            source.isExternal = false;
            source.creationOptions = {
                size: { width: 8, height: 8 },
                sizeIsPercentage: false,
                options: { createMipMaps: false, samples: 1, types: [Constants.TEXTURETYPE_HALF_FLOAT], formats: [Constants.TEXTUREFORMAT_RED] },
            };
            source.output.connectTo(block.source);
            block.depthRedux = true;
            const state = new NodeRenderGraphBuildState();
            state.buildId = 1;

            block.build(state);

            expect(state._notConnectedNonOptionalInputs).toEqual([]);
            expect(block.task.sourceTexture).toBe(source.output.value);
            expect(block.task.depthRedux).toBe(true);
            expect(block.output.value).toBe(block.task.outputTexture);
            expect(graph.tasks).toContain(block.task);
            vi.spyOn(graph.textureManager, "_allocateTextures").mockImplementation(() => {});
            vi.spyOn(block.task, "_initializePasses").mockImplementation(() => {});
            await graph.buildAsync(false);
            expect(graph.textureManager.getTextureDescription(block.task.outputTexture).size).toEqual({ width: 1, height: 1 });
        } finally {
            source.dispose();
        }
    });
});
