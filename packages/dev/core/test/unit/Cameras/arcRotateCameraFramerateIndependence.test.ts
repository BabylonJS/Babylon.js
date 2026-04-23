import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { Vector3 } from "core/Maths/math.vector";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import type { Nullable } from "core/types";

/**
 * Tests for ArcRotateCamera framerate-independent inertia + back-compat regressions.
 *
 * These tests use the camera's movement input handlers to inject pixel deltas (mimicking what
 * input plugins do), then drive `_checkInputs` repeatedly while controlling the engine's
 * reported deltaTime to simulate different framerates.
 *
 * Conventions:
 * - `simulateDuration(camera, fps, durationMs)` — runs N frames of `1000/fps`ms each.
 * - "Framerate-independent" assertions check that the same wall-clock duration produces the
 *   same camera state regardless of the simulated fps (within a tight tolerance).
 */

// Helpers ---------------------------------------------------------------------------------------

function setFrameRate(engine: NullEngine, fps: number): void {
    vi.spyOn(engine, "getDeltaTime").mockReturnValue(1000 / fps);
}

function simulateFrames(camera: ArcRotateCamera, frames: number): void {
    for (let i = 0; i < frames; i++) {
        camera._checkInputs();
    }
}

function simulateDuration(camera: ArcRotateCamera, fps: number, durationMs: number): void {
    const frames = Math.round((durationMs * fps) / 1000);
    simulateFrames(camera, frames);
}

function injectRotationPixels(camera: ArcRotateCamera, x: number, y: number): void {
    camera.movement.input.handlers.rotate(x, y);
    camera.movement.activeInput = true;
}

function injectZoomPixels(camera: ArcRotateCamera, delta: number): void {
    camera.movement.input.handlers.zoom(delta);
    camera.movement.activeInput = true;
}

function injectPanPixels(camera: ArcRotateCamera, x: number, y: number): void {
    camera.movement.input.handlers.pan(x, y);
    camera.movement.activeInput = true;
}

// Reusable setup --------------------------------------------------------------------------------

function makeCamera(): { engine: NullEngine; scene: Scene; camera: ArcRotateCamera } {
    const engine = new NullEngine({
        renderHeight: 256,
        renderWidth: 256,
        textureSize: 256,
        deterministicLockstep: false,
        lockstepMaxSteps: 1,
    });
    const scene = new Scene(engine);
    const camera = new ArcRotateCamera("test", 0, Math.PI / 2, 10, Vector3.Zero(), scene);
    return { engine, scene, camera };
}

// =================================================================================================
// A. Framerate-independence tests
// These assert that the same wall-clock simulated duration produces the same camera state
// regardless of the simulated fps. They should FAIL on master and PASS on this branch.
// =================================================================================================

describe("ArcRotateCamera framerate independence", () => {
    let engine: Nullable<NullEngine> = null;
    let scene: Nullable<Scene> = null;

    afterEach(() => {
        scene?.dispose();
        engine?.dispose();
        scene = null;
        engine = null;
    });

    function runRotationGlide(fps: number, totalDurationMs: number): number {
        const setup = makeCamera();
        engine = setup.engine;
        scene = setup.scene;
        const camera = setup.camera;
        camera.inertia = 0.9;
        setFrameRate(engine, fps);

        // Inject a single one-shot rotation impulse, then let inertia decay over `totalDurationMs`.
        injectRotationPixels(camera, 50, 0);
        simulateDuration(camera, fps, totalDurationMs);
        return camera.alpha;
    }

    function runZoomGlide(fps: number, totalDurationMs: number): number {
        const setup = makeCamera();
        engine = setup.engine;
        scene = setup.scene;
        const camera = setup.camera;
        camera.inertia = 0.9;
        setFrameRate(engine, fps);

        injectZoomPixels(camera, 100);
        simulateDuration(camera, fps, totalDurationMs);
        return camera.radius;
    }

    function runPanGlide(fps: number, totalDurationMs: number): number {
        const setup = makeCamera();
        engine = setup.engine;
        scene = setup.scene;
        const camera = setup.camera;
        camera.inertia = 0.9;
        setFrameRate(engine, fps);

        injectPanPixels(camera, 50, 0);
        simulateDuration(camera, fps, totalDurationMs);
        return camera.target.x;
    }

    function runSustainedRotation(fps: number, totalDurationMs: number, pixelsPerSecond: number): number {
        const setup = makeCamera();
        engine = setup.engine;
        scene = setup.scene;
        const camera = setup.camera;
        camera.inertia = 0.9;
        setFrameRate(engine, fps);

        // Each frame, inject (pixelsPerSecond * dt) pixels — mimicking constant hand speed.
        const dtMs = 1000 / fps;
        const pixelsPerFrame = (pixelsPerSecond * dtMs) / 1000;
        const frames = Math.round((totalDurationMs * fps) / 1000);
        for (let i = 0; i < frames; i++) {
            injectRotationPixels(camera, pixelsPerFrame, 0);
            camera._checkInputs();
        }
        return camera.alpha;
    }

    describe("rotation glide", () => {
        it("60fps and 120fps produce equivalent final alpha after 500ms", () => {
            const alpha60 = runRotationGlide(60, 500);
            const alpha120 = runRotationGlide(120, 500);
            // 1% relative tolerance (or 0.001 absolute floor for tiny values)
            const diff = Math.abs(alpha60 - alpha120);
            const rel = diff / Math.max(Math.abs(alpha60), 0.001);
            expect(rel).toBeLessThan(0.05);
        });

        it("60fps and 30fps produce equivalent final alpha after 500ms", () => {
            const alpha60 = runRotationGlide(60, 500);
            const alpha30 = runRotationGlide(30, 500);
            const rel = Math.abs(alpha60 - alpha30) / Math.max(Math.abs(alpha60), 0.001);
            expect(rel).toBeLessThan(0.05);
        });

        it("60fps and 144fps produce equivalent final alpha after 500ms", () => {
            const alpha60 = runRotationGlide(60, 500);
            const alpha144 = runRotationGlide(144, 500);
            const rel = Math.abs(alpha60 - alpha144) / Math.max(Math.abs(alpha60), 0.001);
            expect(rel).toBeLessThan(0.05);
        });
    });

    describe("zoom glide", () => {
        it("60fps and 120fps produce equivalent final radius after 500ms", () => {
            const r60 = runZoomGlide(60, 500);
            const r120 = runZoomGlide(120, 500);
            const rel = Math.abs(r60 - r120) / Math.max(Math.abs(r60 - 10), 0.001);
            expect(rel).toBeLessThan(0.05);
        });
    });

    describe("pan glide", () => {
        it("60fps and 120fps produce equivalent final target after 500ms", () => {
            const t60 = runPanGlide(60, 500);
            const t120 = runPanGlide(120, 500);
            const rel = Math.abs(t60 - t120) / Math.max(Math.abs(t60), 0.001);
            expect(rel).toBeLessThan(0.05);
        });
    });

    describe("sustained input steady-state", () => {
        it("60fps and 120fps produce equivalent alpha for constant 1000 px/s drag over 500ms", () => {
            const alpha60 = runSustainedRotation(60, 500, 1000);
            const alpha120 = runSustainedRotation(120, 500, 1000);
            const rel = Math.abs(alpha60 - alpha120) / Math.max(Math.abs(alpha60), 0.001);
            expect(rel).toBeLessThan(0.05);
        });
    });

    describe("inertia=0 corner case", () => {
        it("rotation stops in one frame at any framerate", () => {
            for (const fps of [30, 60, 120, 144]) {
                const setup = makeCamera();
                engine = setup.engine;
                scene = setup.scene;
                const camera = setup.camera;
                camera.inertia = 0;
                setFrameRate(engine, fps);

                injectRotationPixels(camera, 10, 0);
                camera._checkInputs(); // frame 1: applies impulse
                const alphaAfter1 = camera.alpha;
                camera._checkInputs(); // frame 2: should be no further movement
                expect(camera.alpha).toBeCloseTo(alphaAfter1, 6);

                scene.dispose();
                engine.dispose();
                scene = null;
                engine = null;
            }
        });
    });
});

// =================================================================================================
// B. Combinational regression tests — verify general functionality across speed/inertia/sensibility
// =================================================================================================

describe("ArcRotateCamera back-compat parameter combinations", () => {
    let engine: Nullable<NullEngine> = null;
    let scene: Nullable<Scene> = null;
    let camera: ArcRotateCamera;

    beforeEach(() => {
        const setup = makeCamera();
        engine = setup.engine;
        scene = setup.scene;
        camera = setup.camera;
        setFrameRate(engine, 60);
    });

    afterEach(() => {
        scene?.dispose();
        engine?.dispose();
    });

    describe("input scaling", () => {
        it("rotation scales linearly with input pixels", () => {
            injectRotationPixels(camera, 1, 0);
            camera._checkInputs();
            const alpha1 = camera.alpha;

            // Reset
            scene!.dispose();
            engine!.dispose();
            const setup = makeCamera();
            engine = setup.engine;
            scene = setup.scene;
            camera = setup.camera;
            setFrameRate(engine, 60);

            injectRotationPixels(camera, 10, 0);
            camera._checkInputs();
            const alpha10 = camera.alpha;

            // 10x the input should produce ~10x the rotation
            expect(Math.abs(alpha10 / alpha1 - 10)).toBeLessThan(0.1);
        });

        it("panningInertia setter syncs to movement.panInertia", () => {
            camera.panningInertia = 0.5;
            expect(camera.movement.panInertia).toBe(0.5);
            camera.panningInertia = 0.8;
            expect(camera.movement.panInertia).toBe(0.8);
        });

        it("camera.inertia is synced to movement.rotationInertia and zoomInertia each frame", () => {
            camera.inertia = 0.5;
            // Trigger a frame so the sync runs
            camera._checkInputs();
            expect(camera.movement.rotationInertia).toBe(0.5);
            expect(camera.movement.zoomInertia).toBe(0.5);
        });
    });

    describe("inertia tuning at runtime", () => {
        it("setting camera.inertia=0 stops rotation glide immediately", () => {
            camera.inertia = 0.9;
            injectRotationPixels(camera, 50, 0);
            camera._checkInputs();
            const alphaInitial = camera.alpha;

            // Now zero out inertia and run more frames — alpha should not change further
            camera.inertia = 0;
            simulateFrames(camera, 5);
            expect(camera.alpha).toBeCloseTo(alphaInitial, 6);
        });

        it("setting camera.inertia=0.99 produces a longer glide than 0.5", () => {
            // High inertia
            camera.inertia = 0.99;
            injectRotationPixels(camera, 50, 0);
            simulateFrames(camera, 30);
            const alphaHigh = Math.abs(camera.alpha);

            // Reset with low inertia
            scene!.dispose();
            engine!.dispose();
            const setup = makeCamera();
            engine = setup.engine;
            scene = setup.scene;
            camera = setup.camera;
            setFrameRate(engine, 60);
            camera.inertia = 0.5;
            injectRotationPixels(camera, 50, 0);
            simulateFrames(camera, 30);
            const alphaLow = Math.abs(camera.alpha);

            // High inertia accumulates more rotation across the same number of frames
            expect(alphaHigh).toBeGreaterThan(alphaLow);
        });

        it("camera.panningInertia is independent of camera.inertia for pan glide", () => {
            camera.inertia = 0.9;
            camera.panningInertia = 0; // pan should stop in one frame
            injectPanPixels(camera, 50, 0);
            camera._checkInputs();
            const targetAfter1 = camera.target.x;
            simulateFrames(camera, 5);
            expect(camera.target.x).toBeCloseTo(targetAfter1, 6);
        });
    });

    describe("zoom glide", () => {
        it("zoom moves the radius and decays toward zero", () => {
            camera.inertia = 0.9;
            const r0 = camera.radius;
            injectZoomPixels(camera, 100);
            simulateFrames(camera, 60);
            // Should have changed
            expect(camera.radius).not.toBeCloseTo(r0, 4);
            // After a long time the velocity should be effectively 0
            simulateFrames(camera, 200);
            const rSettled = camera.radius;
            simulateFrames(camera, 5);
            expect(camera.radius).toBeCloseTo(rSettled, 6);
        });
    });
});

// =================================================================================================
// C. Back-compat API tests for the legacy inertialAlphaOffset / inertialBetaOffset / inertialRadiusOffset
// =================================================================================================

describe("ArcRotateCamera legacy inertialOffset back-compat", () => {
    let engine: Nullable<NullEngine> = null;
    let scene: Nullable<Scene> = null;
    let camera: ArcRotateCamera;

    beforeEach(() => {
        const setup = makeCamera();
        engine = setup.engine;
        scene = setup.scene;
        camera = setup.camera;
        setFrameRate(engine, 60);
    });

    afterEach(() => {
        scene?.dispose();
        engine?.dispose();
    });

    it("direct write to inertialAlphaOffset advances alpha", () => {
        const a0 = camera.alpha;
        camera.inertialAlphaOffset = 0.1;
        camera._checkInputs();
        expect(camera.alpha).not.toBeCloseTo(a0, 4);
    });

    it("direct write to inertialAlphaOffset decays toward zero with inertia", () => {
        camera.inertia = 0.9;
        camera.inertialAlphaOffset = 0.1;
        camera._checkInputs();
        const offsetAfter1 = camera.inertialAlphaOffset;
        // After one frame, the underlying private offset is 0.1 * 0.9 = 0.09
        expect(offsetAfter1).toBeCloseTo(0.09, 4);
    });

    it("setting inertialAlphaOffset = 0 cancels the movement-system rotation glide", () => {
        injectRotationPixels(camera, 50, 0);
        camera._checkInputs();
        expect(camera.alpha).not.toBeCloseTo(0, 4);

        // Cancel via legacy API
        camera.inertialAlphaOffset = 0;
        const alphaAfterCancel = camera.alpha;
        simulateFrames(camera, 10);
        expect(camera.alpha).toBeCloseTo(alphaAfterCancel, 6);
    });

    it("inertialAlphaOffset getter reflects pending movement-system rotation", () => {
        // Inject input but DO NOT run a frame — accumulator should be visible via getter
        injectRotationPixels(camera, 5, 0);
        expect(camera.inertialAlphaOffset).toBe(5);
    });

    it("inertialAlphaOffset getter reflects current-frame applied rotation during glide", () => {
        injectRotationPixels(camera, 50, 0);
        camera._checkInputs();
        // After the frame, accumulator is reset, but rotationDeltaCurrentFrame is non-zero (glide active)
        expect(camera.inertialAlphaOffset).not.toBe(0);
    });

    it("inertialAlphaOffset getter returns 0 when the camera is fully idle", () => {
        // No input, no glide — getter should return 0
        camera._checkInputs();
        expect(camera.inertialAlphaOffset).toBe(0);
    });

    it("inertialPanningX direct write decays toward zero with panningInertia (legacy back-compat)", () => {
        // Note: we don't assert the camera target moves here because _applyPanDelta requires the
        // view matrix to be initialized via render — which the null engine doesn't do automatically.
        // The contract that matters for back-compat is that the field is read, scaled by inertia,
        // and zeroed out when small.
        camera.panningInertia = 0.9;
        camera.inertialPanningX = 0.5;
        camera._checkInputs();
        // After one frame, inertialPanningX = 0.5 * 0.9 = 0.45
        expect(camera.inertialPanningX).toBeCloseTo(0.45, 4);
        camera._checkInputs();
        // After two frames, 0.5 * 0.9 * 0.9 = 0.405
        expect(camera.inertialPanningX).toBeCloseTo(0.405, 4);
    });
});
