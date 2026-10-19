import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FreeCamera } from "core/Cameras/freeCamera";
import { NullEngine } from "core/Engines/nullEngine";
import { Vector3 } from "core/Maths/math.vector";
import { ObjectRenderer } from "core/Rendering/objectRenderer";
import { Scene } from "core/scene";
import { SpriteManager } from "core/Sprites/spriteManager";
import { ParticleSystem } from "core/Particles/particleSystem";
import "core/Shaders/sprites.vertex";
import "core/Shaders/sprites.fragment";
import "core/Shaders/particles.vertex";
import "core/Shaders/particles.fragment";

describe("ObjectRenderer sprite manager selection", () => {
    let engine: NullEngine;
    let scene: Scene;
    let renderer: ObjectRenderer;
    let firstManager: SpriteManager;
    let secondManager: SpriteManager;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        scene.activeCamera = new FreeCamera("camera", Vector3.Zero(), scene);

        firstManager = new SpriteManager("first", "", 1, 1, scene);
        secondManager = new SpriteManager("second", "", 1, 1, scene);

        renderer = new ObjectRenderer("renderer", scene);
        renderer.renderMeshes = false;
        renderer.renderParticles = false;
        renderer.renderSprites = true;
    });

    afterEach(() => {
        renderer.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("dispatches scene sprite managers by default", () => {
        const dispatchSprites = vi.spyOn(renderer.renderingManager, "dispatchSprites").mockImplementation(() => {});

        renderer.render();

        expect(dispatchSprites).toHaveBeenCalledTimes(2);
        expect(dispatchSprites).toHaveBeenNthCalledWith(1, firstManager);
        expect(dispatchSprites).toHaveBeenNthCalledWith(2, secondManager);
    });

    it("dispatches only the selected sprite managers", () => {
        const dispatchSprites = vi.spyOn(renderer.renderingManager, "dispatchSprites").mockImplementation(() => {});
        renderer.spriteManagerList = [secondManager];

        renderer.render();

        expect(dispatchSprites).toHaveBeenCalledExactlyOnceWith(secondManager);
    });

    it("dispatches no sprite managers for an empty selection", () => {
        const dispatchSprites = vi.spyOn(renderer.renderingManager, "dispatchSprites").mockImplementation(() => {});
        renderer.spriteManagerList = [];

        renderer.render();

        expect(dispatchSprites).not.toHaveBeenCalled();
    });

    it("waits for selected sprite managers without rendering them", () => {
        renderer.spriteManagerList = [firstManager];
        const ready = vi.spyOn(firstManager, "isReady").mockReturnValue(false);
        const excludedReady = vi.spyOn(secondManager, "isReady").mockReturnValue(false);
        const renderSprites = vi.spyOn(firstManager, "render");

        expect(renderer.isReadyForRendering(64, 64)).toBe(false);
        ready.mockReturnValue(true);
        expect(renderer.isReadyForRendering(64, 64)).toBe(true);
        expect(excludedReady).not.toHaveBeenCalled();
        expect(renderSprites).not.toHaveBeenCalled();

        ready.mockReturnValue(false);
        renderer.renderSprites = false;
        expect(renderer.isReadyForRendering(64, 64)).toBe(true);
    });

    it("checks sprite and particle effects in every render pass", () => {
        renderer.dispose();
        renderer = new ObjectRenderer("multiple passes", scene, { numPasses: 2 });
        renderer.renderMeshes = false;
        renderer.renderSprites = true;
        renderer.renderParticles = true;
        renderer.spriteManagerList = [firstManager];
        const particle = new ParticleSystem("particle", 1, scene);
        renderer.particleSystemList = [particle];
        const passIds: number[] = [];
        const spritePassIds: number[] = [];
        const particlePassIds: number[] = [];
        renderer.onBeforeRenderObservable.add(() => passIds.push(engine.currentRenderPassId));
        vi.spyOn(firstManager, "isReady").mockImplementation(() => {
            spritePassIds.push(engine.currentRenderPassId);
            return true;
        });
        vi.spyOn(particle, "isReady").mockImplementation(() => {
            particlePassIds.push(engine.currentRenderPassId);
            return true;
        });
        const previousPassId = engine.currentRenderPassId;

        expect(renderer.isReadyForRendering(64, 64)).toBe(true);
        expect(passIds).toHaveLength(2);
        expect(spritePassIds).toEqual(passIds);
        expect(particlePassIds).toEqual(passIds);
        expect(engine.currentRenderPassId).toBe(previousPassId);
    });
});
