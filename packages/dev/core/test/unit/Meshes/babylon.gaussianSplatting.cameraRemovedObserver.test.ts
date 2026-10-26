import { NullEngine } from "core/Engines/nullEngine";
import "core/Materials/GaussianSplatting/gaussianSplattingMaterial";
import { GaussianSplattingMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingMesh";
import { Scene } from "core/scene";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("GaussianSplattingMesh dispose", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it("does not keep an onCameraRemovedObservable observer on the scene after disposal", () => {
        // Observable.remove defers the actual removal, so hasObservers() is the reliable check.
        expect(scene.onCameraRemovedObservable.hasObservers()).toBe(false);

        const meshes = [new GaussianSplattingMesh("gs0", null, scene), new GaussianSplattingMesh("gs1", null, scene)];
        expect(scene.onCameraRemovedObservable.hasObservers()).toBe(true);

        for (const mesh of meshes) {
            mesh.dispose();
        }

        expect(scene.onCameraRemovedObservable.hasObservers()).toBe(false);
    });
});
