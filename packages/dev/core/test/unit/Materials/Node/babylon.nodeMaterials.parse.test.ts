import { NullEngine } from "core/Engines/nullEngine";
import { NodeMaterial } from "core/Materials/Node/nodeMaterial";
import { Scene } from "core/scene";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const _getActiveImageProcessingObserverCount = (scene: Scene): number => {
    return scene.imageProcessingConfiguration.onUpdateParameters.observers.filter((observer) => !observer._willBeUnregistered).length;
};

describe("Babylon NodeMaterial image processing observer lifecycle", () => {
    let engine: NullEngine;
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

    it("does not accumulate scene image processing observers when parsing serialized node materials", () => {
        const template = new NodeMaterial("template", scene);
        const serialized = template.serialize();
        template.dispose();

        const initialObserverCount = _getActiveImageProcessingObserverCount(scene);

        for (let i = 0; i < 25; i++) {
            const material = new NodeMaterial(`nodeMaterial_${i}`, scene);
            material.parseSerializedObject(serialized);
            material.dispose();
        }

        const finalObserverCount = _getActiveImageProcessingObserverCount(scene);

        expect(finalObserverCount).toBe(initialObserverCount);
    });

    it("does not accumulate observers when serialized image processing payload is omitted", () => {
        const template = new NodeMaterial("template", scene);
        const serialized = template.serialize();
        template.dispose();

        // This approximates the no-invocation behavior where image processing metadata
        // is not part of the serialized property store.
        expect(serialized._imageProcessingConfiguration).toBeDefined();
        delete serialized._imageProcessingConfiguration;

        const initialObserverCount = _getActiveImageProcessingObserverCount(scene);

        for (let i = 0; i < 25; i++) {
            const material = new NodeMaterial(`nodeMaterial_noIpc_${i}`, scene);
            material.parseSerializedObject(serialized);
            material.dispose();
        }

        const finalObserverCount = _getActiveImageProcessingObserverCount(scene);

        expect(finalObserverCount).toBe(initialObserverCount);
    });
});
