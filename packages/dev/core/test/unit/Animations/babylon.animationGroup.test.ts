import { AnimationGroup } from "core/Animations";
import { Engine, NullEngine } from "core/Engines";
import { Vector3 } from "core/Maths";
import { TransformNode } from "core/Meshes";
import { Scene } from "core/scene";
import { Animation } from "core/Animations/animation";

/**
 * Describes the test suite.
 */
describe("Babylon Animation Group", function () {
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
     * Animation group tests.
     */
    describe("#AnimationGroup", () => {
        it("start and stop", () => {
            const scene = new Scene(subject);
            const node = new TransformNode("node0", scene);

            const animationGroup = new AnimationGroup("animationGroup0", scene);

            const length = 10;
            for (let i = 0; i < length; i++) {
                const animation = new Animation(`animation${i}`, "position", 1, Animation.ANIMATIONTYPE_VECTOR3);
                animation.setKeys([
                    {
                        frame: 0,
                        value: Vector3.Zero(),
                    },
                    {
                        frame: 1,
                        value: Vector3.Zero(),
                    },
                ]);

                animationGroup.addTargetedAnimation(animation, node);
            }

            animationGroup.start();
            expect(animationGroup.animatables).toHaveLength(length);
            expect(scene.animatables).toHaveLength(length);

            animationGroup.stop();
            expect(animationGroup.animatables).toHaveLength(0);
            expect(scene.animatables).toHaveLength(0);
        });

        it("tracks and retains the unbounded requested frame", () => {
            const scene = new Scene(subject);
            const node = new TransformNode("node0", scene);
            const animation = new Animation("animation", "position.x", 60, Animation.ANIMATIONTYPE_FLOAT);
            animation.setKeys([
                { frame: 0, value: 0 },
                { frame: 600, value: 1 },
            ]);
            const animationGroup = new AnimationGroup("animationGroup0", scene);
            animationGroup.addTargetedAnimation(animation, node);

            animationGroup.start(true, 2, 120, 600);
            scene._animationTime = 500;
            expect(animationGroup.getVirtualCurrentFrame()).toBe(180);

            animationGroup.pause();
            scene._animationTime = 1000;
            expect(animationGroup.getVirtualCurrentFrame()).toBe(180);

            animationGroup.restart();
            scene._animationTime = 1250;
            expect(animationGroup.getVirtualCurrentFrame()).toBe(210);

            animationGroup.stop();
            scene._animationTime = 2000;
            expect(animationGroup.getVirtualCurrentFrame()).toBe(210);
        });
    });
});
