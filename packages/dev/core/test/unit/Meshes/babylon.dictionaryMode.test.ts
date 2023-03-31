import { Engine, NullEngine } from "core/Engines";
import { MeshBuilder } from "core/Meshes";
import { Scene } from "core/scene";

/**
 * Describes the test suite.
 */
describe("Babylon Mesh", () => {
    let subject: Engine;

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
    });

    describe("#Mesh dictionary mode threshold", () => {
        it("No more than 128 own properties on a mesh", () => {
            const scene = new Scene(subject);
            const mesh = MeshBuilder.CreateGround("ground1", { width: 6, height: 6, subdivisions: 2 }, scene);

            let count = 0;
            for (const prop in mesh) {
                if (Object.prototype.hasOwnProperty.call(mesh, prop)) {
                    count++;
                }
            }

            expect(count).toBeLessThan(128);
        });
    });
});
