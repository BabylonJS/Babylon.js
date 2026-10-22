import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { MirrorTexture } from "core/Materials/Textures/mirrorTexture";
import { Scene } from "core/scene";

/** Observable.remove() unregisters on the next macrotask, so wait for it before counting. */
async function FlushDeferredRemovalsAsync(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("MirrorTexture", () => {
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

    it("removes its image processing observer when disposed", async () => {
        const onUpdateParameters = scene.imageProcessingConfiguration.onUpdateParameters;
        await FlushDeferredRemovalsAsync();
        const baseline = onUpdateParameters.observers.length;

        const count = 5;
        const mirrors: MirrorTexture[] = [];
        for (let i = 0; i < count; i++) {
            mirrors.push(new MirrorTexture(`mirror${i}`, 64, scene));
        }
        expect(onUpdateParameters.observers.length).toBe(baseline + count);

        for (const mirror of mirrors) {
            mirror.dispose();
        }
        await FlushDeferredRemovalsAsync();

        expect(onUpdateParameters.observers.length).toBe(baseline);
    });
});
