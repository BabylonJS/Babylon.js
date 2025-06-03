import { Engine, NullEngine } from "core/Engines";
import { Texture, ThinTexture } from "core/Materials";
import { Scene } from "core/scene";

/**
 * Describes the test suite.
 */
describe("Babylon Thin Texture", function () {
    let subject: Engine;
    let scene: Scene;

    /**
     * Create a new engine subject before each test.
     */
    beforeEach(function () {
        subject = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(subject);
    });

    describe("ThinTexture", () => {
        it("should respect wrap U/V/R of InternalTexture", async () => {
            const texture = new Texture("albedoTexture.jpg", scene);
            const internalTexture = texture.getInternalTexture()!;
            internalTexture.wrapU = 2;
            internalTexture.wrapV = 2;
            internalTexture.wrapR = 2;

            const thinTexture = new ThinTexture(internalTexture);

            expect(thinTexture.wrapU).toEqual(internalTexture.wrapU);
            expect(thinTexture.wrapV).toEqual(internalTexture.wrapV);
            expect(thinTexture.wrapR).toEqual(internalTexture.wrapR);
        });
    });
});
