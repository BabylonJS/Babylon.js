import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { type Engine } from "core/Engines/engine";
import { Scene } from "core/scene";
import { ObjectRenderer } from "core/Rendering/objectRenderer";

describe("ObjectRenderer.shouldRender", () => {
    let engine: Engine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it("should respect refreshRate when snapshot rendering is not active", () => {
        const renderer = new ObjectRenderer("test", scene);
        renderer.refreshRate = 3;

        // First call always returns true (initial render, _currentRefreshId === -1)
        expect(renderer.shouldRender()).toBe(true);

        // refreshRate=3: counter starts at 1, increments each call, returns true when it reaches 3
        expect(renderer.shouldRender()).toBe(false); // counter = 2
        expect(renderer.shouldRender()).toBe(false); // counter = 3
        expect(renderer.shouldRender()).toBe(true); // counter reaches 3, resets to 1

        renderer.dispose();
    });

    it("should always return true when snapshot rendering is active", () => {
        const renderer = new ObjectRenderer("test", scene);
        renderer.refreshRate = 60;

        // Simulate snapshot rendering being active
        // NullEngine's snapshotRendering getter returns false by default.
        // We override it to simulate the WebGPU snapshot rendering scenario.
        Object.defineProperty(engine, "snapshotRendering", {
            get: () => true,
            configurable: true,
        });

        // Every call should return true regardless of refreshRate
        for (let i = 0; i < 100; i++) {
            expect(renderer.shouldRender()).toBe(true);
        }

        renderer.dispose();
    });

    it("should not advance the refresh counter while snapshot rendering is active", () => {
        const renderer = new ObjectRenderer("test", scene);
        renderer.refreshRate = 3;

        // First call: returns true (initial render), counter goes to 1
        expect(renderer.shouldRender()).toBe(true);

        // Enable snapshot rendering
        Object.defineProperty(engine, "snapshotRendering", {
            get: () => true,
            configurable: true,
        });

        // Call many times during snapshot — always returns true, counter frozen
        for (let i = 0; i < 50; i++) {
            expect(renderer.shouldRender()).toBe(true);
        }

        // Disable snapshot rendering
        Object.defineProperty(engine, "snapshotRendering", {
            get: () => false,
            configurable: true,
        });

        // Counter should resume from where it was (1), so next calls follow normal pattern
        // counter was 1 before snapshot, so now: id=1 (false->2), id=2 (false->3), id=3 (true->1)
        expect(renderer.shouldRender()).toBe(false);
        expect(renderer.shouldRender()).toBe(false);
        expect(renderer.shouldRender()).toBe(true);

        renderer.dispose();
    });
});
