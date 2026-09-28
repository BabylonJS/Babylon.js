import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { type FrameGraphObjectList } from "core/FrameGraph/frameGraphObjectList";
import { NodeRenderGraphInputBlock } from "core/FrameGraph/Node/Blocks/inputBlock.pure";
import { type NodeRenderGraphOutputBlock } from "core/FrameGraph/Node/Blocks/outputBlock.pure";
import { NodeRenderGraphBlockConnectionPointTypes } from "core/FrameGraph/Node/Types/nodeRenderGraphTypes";
import { NodeRenderGraph } from "core/FrameGraph/Node/nodeRenderGraph";
import { Scene } from "core/scene";
import { type ISpriteManager } from "core/Sprites/spriteManager";
import "core/FrameGraph/Node/Blocks/inputBlock";

describe("NodeRenderGraph ObjectList input reconstruction", () => {
    let engine: NullEngine;
    let scene: Scene;
    let graphs: NodeRenderGraph[];

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        graphs = [];
    });

    afterEach(async () => {
        for (const graph of graphs) {
            await graph.frameGraph.buildAsync(false);
            graph.dispose();
        }
        scene.dispose();
        engine.dispose();
    });

    function createGraph(name: string, autoFillExternalInputs = true) {
        const graph = new NodeRenderGraph(name, scene, { autoFillExternalInputs });
        graphs.push(graph);
        return graph;
    }

    function getObjectListInput(graph: NodeRenderGraph) {
        return graph.getInputBlocks().find((input) => input.type === NodeRenderGraphBlockConnectionPointTypes.ObjectList)!;
    }

    function prepareForBuild(graph: NodeRenderGraph, input: NodeRenderGraphInputBlock) {
        vi.spyOn(input, "isAnAncestorOfType").mockReturnValue(true);
        graph.outputBlock = {
            name: "output",
            isInput: false,
            inputs: [],
            initialize: vi.fn(),
            build: vi.fn(),
            dispose: vi.fn(),
        } as unknown as NodeRenderGraphOutputBlock;
    }

    function expectDefaultObjectList(input: NodeRenderGraphInputBlock) {
        expect(input.isExternal).toBe(true);
        expect(input.value).toEqual({
            meshes: null,
            particleSystems: null,
            spriteManagers: null,
        });
    }

    it("defaults a new ObjectList input to all-scene selections", () => {
        const graph = createGraph("defaults");
        const input = new NodeRenderGraphInputBlock("objects", graph.frameGraph, scene, NodeRenderGraphBlockConnectionPointTypes.ObjectList);
        graph.attachedBlocks.push(input);

        expectDefaultObjectList(input);
    });

    function expectSceneObjectList(input: NodeRenderGraphInputBlock) {
        const value = input.getTypedValue<FrameGraphObjectList>();
        expect(value.meshes).toBe(scene.meshes);
        expect(value.particleSystems).toBe(scene.particleSystems);
        expect(value.spriteManagers).toBe(scene.spriteManagers);
    }

    it("reconstructs a parsed external value through default auto-fill", async () => {
        const source = createGraph("source");
        const input = new NodeRenderGraphInputBlock("objects", source.frameGraph, scene, NodeRenderGraphBlockConnectionPointTypes.ObjectList);
        input.value = { meshes: [], particleSystems: [], spriteManagers: [] };
        source.attachedBlocks.push(input);
        const serialization = source.serialize();
        const restored = createGraph("restored");

        expect(serialization.blocks[0]).not.toHaveProperty("value");
        restored.parseSerializedObject(serialization);
        const restoredInput = getObjectListInput(restored);
        expect(restoredInput.value).toBeNull();
        prepareForBuild(restored, restoredInput);

        await restored.buildAsync(true);

        expectSceneObjectList(restoredInput);
    });

    it("reconstructs a cloned external value through default auto-fill", async () => {
        const source = createGraph("source");
        const input = new NodeRenderGraphInputBlock("objects", source.frameGraph, scene, NodeRenderGraphBlockConnectionPointTypes.ObjectList);
        input.value = { meshes: [], particleSystems: [], spriteManagers: [] };
        source.attachedBlocks.push(input);

        const clone = source.clone("clone");
        graphs.push(clone);
        const clonedInput = getObjectListInput(clone);
        expect(clonedInput.value).toBeNull();
        prepareForBuild(clone, clonedInput);

        await clone.buildAsync(true);

        expectSceneObjectList(clonedInput);
    });

    it("auto-fills ObjectList inputs from the scene by default", async () => {
        const spriteManager = {} as ISpriteManager;
        scene.spriteManagers = [spriteManager];
        const graph = createGraph("autofill");
        const input = new NodeRenderGraphInputBlock("objects", graph.frameGraph, scene, NodeRenderGraphBlockConnectionPointTypes.ObjectList);
        graph.attachedBlocks.push(input);
        prepareForBuild(graph, input);

        await graph.buildAsync(true);

        expectSceneObjectList(input);
        expect(input.getTypedValue<FrameGraphObjectList>().spriteManagers).toContain(spriteManager);
    });

    it("leaves parsed external values unset when auto-fill is explicitly disabled", async () => {
        const source = createGraph("source");
        const input = new NodeRenderGraphInputBlock("objects", source.frameGraph, scene, NodeRenderGraphBlockConnectionPointTypes.ObjectList);
        input.value = { meshes: [], particleSystems: [], spriteManagers: [] };
        source.attachedBlocks.push(input);
        const restored = createGraph("no autofill", false);
        restored.parseSerializedObject(source.serialize());
        const restoredInput = getObjectListInput(restored);
        prepareForBuild(restored, restoredInput);

        await restored.buildAsync(true);

        expect(restoredInput.value).toBeNull();
    });
});
