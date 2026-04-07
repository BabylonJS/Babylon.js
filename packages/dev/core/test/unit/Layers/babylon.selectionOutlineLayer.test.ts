import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { type Engine } from "core/Engines/engine";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { SelectionOutlineLayer } from "core/Layers/selectionOutlineLayer";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { Vector3 } from "core/Maths/math.vector";

import "core/Layers/effectLayerSceneComponent";

describe("SelectionOutlineLayer", () => {
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
        new ArcRotateCamera("camera", 0, 0, 10, Vector3.Zero(), scene);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it("should not create a depth renderer when no meshes are selected", () => {
        new SelectionOutlineLayer("outline", scene);

        // The depth renderer should not be created eagerly
        expect(scene._depthRenderer).toBeUndefined();
    });

    it("should enable rendering only after a selection is added", () => {
        const layer = new SelectionOutlineLayer("outline", scene);
        const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 1 }, scene);

        // Before adding any selection, no depth renderer and shouldRender is false
        expect(scene._depthRenderer).toBeUndefined();
        expect(layer.shouldRender()).toBe(false);

        // After adding a selection, shouldRender flips to true
        layer.addSelection(sphere);
        expect(layer.shouldRender()).toBe(true);
    });
});
