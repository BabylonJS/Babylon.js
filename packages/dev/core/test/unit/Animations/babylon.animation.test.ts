import { NullEngine } from "core/Engines";
import { Engine } from "core/Engines/engine";
import { MeshBuilder } from "core/Meshes";
import { Scene } from "core/scene";
import { Animation } from "core/Animations/animation";
import "core/Helpers/sceneHelpers";

/**
 * Describes the test suite.
 */
describe("Babylon Animation", function () {
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

        // Avoid creating normals in PBR materials.
        subject.getCaps().standardDerivatives = true;
    });

    /**
     * Animation tests.
     */
    describe("#Animation", () => {
        it("one key", () => {
            const scene = new Scene(subject);
            const box = MeshBuilder.CreateBox("box", { size: 1 }, scene);
            scene.createDefaultCamera();
            const animation = new Animation("anim", "position.x", 1, Animation.ANIMATIONTYPE_FLOAT);
            animation.setKeys([{ frame: 0, value: 1 }]);
            box.animations.push(animation);
            scene.beginAnimation(box, 0, 0);
            scene.render();
            expect(box.position.x).toBe(1);
        });
    });
});
