import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FreeCamera } from "core/Cameras/freeCamera";
import { NullEngine } from "core/Engines/nullEngine";
import { FrameGraph } from "core/FrameGraph/frameGraph";
import { FrameGraphObjectRendererTask } from "core/FrameGraph/Tasks/Rendering/objectRendererTask";
import { Vector3 } from "core/Maths/math.vector";
import { Scene } from "core/scene";
import { SpriteManager } from "core/Sprites/spriteManager";
import "core/Engines/Extensions/engine.multiRender";
import "core/Shaders/sprites.vertex";
import "core/Shaders/sprites.fragment";

describe("FrameGraphObjectRendererTask sprite manager selection", () => {
    let engine: NullEngine;
    let scene: Scene;
    let frameGraph: FrameGraph;
    let task: FrameGraphObjectRendererTask;
    let spriteManager: SpriteManager;

    beforeEach(() => {
        engine = new NullEngine();
        vi.spyOn(engine, "buildTextureLayout").mockImplementation((enabled) => enabled.map((value, index) => (value ? index + 1 : 0)));
        scene = new Scene(engine);
        frameGraph = new FrameGraph(scene);
        task = new FrameGraphObjectRendererTask("renderer", frameGraph, scene);
        task.camera = new FreeCamera("camera", Vector3.Zero(), scene);
        spriteManager = new SpriteManager("sprite manager", "", 1, 1, scene);
        vi.spyOn(task.objectRenderer, "isReadyForRendering").mockReturnValue(true);
    });

    afterEach(() => {
        task.dispose();
        frameGraph.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("uses scene sprite managers when the selection is omitted", () => {
        task.objectList = {
            meshes: [],
            particleSystems: [],
        };

        expect(task.isReady()).toBe(true);
        expect(task.objectRenderer.spriteManagerList).toBeNull();
    });

    it("uses scene sprite managers when the selection is null", () => {
        task.objectList = {
            meshes: [],
            particleSystems: [],
            spriteManagers: null,
        };

        expect(task.isReady()).toBe(true);
        expect(task.objectRenderer.spriteManagerList).toBeNull();
    });

    it("forwards a sprite manager subset", () => {
        const spriteManagers = [spriteManager];
        task.objectList = {
            meshes: [],
            particleSystems: [],
            spriteManagers,
        };

        expect(task.isReady()).toBe(true);
        expect(task.objectRenderer.spriteManagerList).toBe(spriteManagers);
    });

    it("forwards an empty sprite manager selection", () => {
        const spriteManagers: SpriteManager[] = [];
        task.objectList = {
            meshes: [],
            particleSystems: [],
            spriteManagers,
        };

        expect(task.isReady()).toBe(true);
        expect(task.objectRenderer.spriteManagerList).toBe(spriteManagers);
    });
});
