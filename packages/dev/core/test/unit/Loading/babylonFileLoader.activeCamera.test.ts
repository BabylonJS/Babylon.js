import { describe, expect, it } from "vitest";

import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { LoadAssetContainer } from "core/Loading/Plugins/babylonFileLoader";

// Import the camera classes a tree-shaken app would use (registering their
// constructors) but deliberately NOT "core/Cameras/camera", whose wrapper is what
// installs Camera.Parse. The loader registration must supply Camera.Parse itself.
import "core/Cameras/universalCamera";
import "core/Cameras/freeCamera";

/**
 * Regression coverage for the 9.15 tree-shaking split where appending a .babylon
 * scene left `scene.activeCamera` null (so the scene never rendered and consumer
 * code doing `scene.activeCamera.attachControl(...)` null-dereferenced).
 *
 * The .babylon loader parses cameras through the `Camera.Parse` static, which is
 * only installed by the camera registration (non-pure `camera` wrapper). Because
 * the loader imports `camera.pure` (side-effect free), a tree-shaken build that
 * imports only the loader would throw "Camera.Parse is not a function" mid-load.
 * Since cameras are parsed after meshes/materials/lights, geometry loaded but no
 * camera was created. The loader registration must pull in the camera registration.
 */

function makeBabylonScene(camera: Record<string, unknown>, activeCameraID?: string | null): string {
    const parsed: Record<string, unknown> = {
        producer: { name: "Babylon.js", version: "1.0", exporter_version: "1.0" },
        cameras: [camera],
        meshes: [],
        lights: [],
        materials: [],
    };
    if (activeCameraID !== null) {
        parsed.activeCameraID = activeCameraID ?? "camId";
    }
    return JSON.stringify(parsed);
}

describe("Babylon file loader active camera", () => {
    // Importing only the .babylon loader (as a tree-shaken consumer might) must be
    // enough to parse cameras; the loader owns the Camera.Parse dependency.
    it("parses cameras without importing the camera side-effect wrapper", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);

        const container = LoadAssetContainer(scene, makeBabylonScene({ name: "cam", id: "camId", uniqueId: 1, type: "FreeCamera", position: [0, 0, -10] }), "", (message) => {
            throw new Error(message);
        });

        expect(container.cameras.length).toBe(1);
        engine.dispose();
    });

    // A camera with no explicit type must still parse (falls back to a default
    // camera) and the scene must end up with a valid active camera.
    it("resolves an active camera for a type-less camera", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);

        LoadAssetContainer(scene, makeBabylonScene({ name: "cam", id: "camId", uniqueId: 1, position: [0, 0, -10] }), "", undefined, true);

        expect(scene.cameras.length).toBe(1);
        expect(scene.activeCamera).not.toBeNull();
        engine.dispose();
    });
});
