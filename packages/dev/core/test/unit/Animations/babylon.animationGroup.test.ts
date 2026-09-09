import { AnimationGroup } from "core/Animations";
import { Engine, NullEngine } from "core/Engines";
import { Vector3 } from "core/Maths";
import { TransformNode } from "core/Meshes";
import { Scene } from "core/scene";
import { Animation } from "core/Animations/animation";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { FlowGraphStopAnimationBlock } from "core/FlowGraph/Blocks/Execution/Animation/flowGraphStopAnimationBlock";

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

        it.each([
            [0, 60, 60],
            [60, 0, 0],
        ])("snaps natural completion from %i to the exact %i endpoint", (from, to, expected) => {
            const scene = new Scene(subject);
            const node = new TransformNode("node0", scene);
            const animation = new Animation("animation", "position.x", 60, Animation.ANIMATIONTYPE_FLOAT);
            animation.setKeys([
                { frame: 0, value: 0 },
                { frame: 60, value: 1 },
            ]);
            const animationGroup = new AnimationGroup("animationGroup0", scene);
            animationGroup.addTargetedAnimation(animation, node);
            animationGroup.start(false, 1, from, to);
            scene._animationTime = 1250;

            animationGroup.animatables[0].onAnimationEnd?.();

            expect(animationGroup.getVirtualCurrentFrame()).toBe(expected);
            expect(animationGroup.getRetainedCurrentFrame()).toBe(expected);
            expect(animationGroup.getCurrentFrame()).toBe(0);
        });

        it.each([
            [0, Infinity, 120, 60],
            [60, -Infinity, -60, 0],
        ])("stops a looping virtual timeline from %s toward %s exactly at %s", (from, to, stopAt, effectiveStop) => {
            const scene = new Scene(subject);
            const node = new TransformNode("node0", scene);
            const animation = new Animation("animation", "position.x", 60, Animation.ANIMATIONTYPE_FLOAT);
            animation.setKeys([
                { frame: 0, value: 0 },
                { frame: 60, value: 1 },
            ]);
            const animationGroup = new AnimationGroup("animationGroup0", scene);
            animationGroup.addTargetedAnimation(animation, node);
            animationGroup.start(true, 1, from, to);
            scene._animationTime = 2500;

            const coordinator = new FlowGraphCoordinator({ scene });
            const context = coordinator.createGraph().createContext();
            context._setGlobalContextVariable("currentlyRunningAnimationGroups", [animationGroup.uniqueId]);
            const stopBlock = new FlowGraphStopAnimationBlock();
            stopBlock.animationGroup.setValue(animationGroup, context);
            stopBlock.stopAtFrame.setValue(stopAt, context);
            const activationOrder: string[] = [];
            vi.spyOn(stopBlock.out, "_activateSignal").mockImplementation(() => activationOrder.push("out"));
            vi.spyOn(stopBlock.done, "_activateSignal").mockImplementation(() => activationOrder.push("done"));
            stopBlock._execute(context);

            expect(animationGroup.isPlaying).toBe(false);
            expect(animationGroup.getVirtualCurrentFrame()).toBe(stopAt);
            expect(animationGroup.getRetainedCurrentFrame()).toBe(effectiveStop);
            expect(animationGroup.getCurrentFrame()).toBe(0);
            expect(activationOrder).toEqual(["out", "done"]);
        });

        it("replaces a previously scheduled virtual stop", () => {
            const scene = new Scene(subject);
            const node = new TransformNode("node0", scene);
            const animation = new Animation("animation", "position.x", 60, Animation.ANIMATIONTYPE_FLOAT);
            animation.setKeys([
                { frame: 0, value: 0 },
                { frame: 60, value: 1 },
            ]);
            const animationGroup = new AnimationGroup("animationGroup0", scene);
            animationGroup.addTargetedAnimation(animation, node);
            animationGroup.start(true, 1, 0, Infinity);

            const coordinator = new FlowGraphCoordinator({ scene });
            const context = coordinator.createGraph().createContext();
            context._setGlobalContextVariable("currentlyRunningAnimationGroups", [animationGroup.uniqueId]);
            const firstStop = new FlowGraphStopAnimationBlock();
            firstStop.animationGroup.setValue(animationGroup, context);
            firstStop.stopAtFrame.setValue(120, context);
            firstStop._execute(context);
            const replacementStop = new FlowGraphStopAnimationBlock();
            replacementStop.animationGroup.setValue(animationGroup, context);
            replacementStop.stopAtFrame.setValue(180, context);
            replacementStop._execute(context);

            scene._animationTime = 3500;
            replacementStop._executeOnTick(context);

            expect(animationGroup.getVirtualCurrentFrame()).toBe(180);
            expect(animationGroup.isPlaying).toBe(false);
        });

        it("maps every virtual frame to zero for a zero-duration animation", () => {
            const scene = new Scene(subject);
            const node = new TransformNode("node0", scene);
            const animation = new Animation("animation", "position.x", 60, Animation.ANIMATIONTYPE_FLOAT);
            animation.setKeys([{ frame: 0, value: 0 }]);
            const animationGroup = new AnimationGroup("animationGroup0", scene);
            animationGroup.addTargetedAnimation(animation, node);
            animationGroup.start(true, 1, 0, Infinity);

            animationGroup.setVirtualCurrentFrame(5);

            expect(animationGroup.getVirtualCurrentFrame()).toBe(5);
            expect(animationGroup.getRetainedCurrentFrame()).toBe(0);
        });

        it("retains the effective frame when stopped without end notifications", () => {
            const scene = new Scene(subject);
            const node = new TransformNode("node0", scene);
            const animation = new Animation("animation", "position.x", 60, Animation.ANIMATIONTYPE_FLOAT);
            animation.setKeys([
                { frame: 0, value: 0 },
                { frame: 60, value: 1 },
            ]);
            const animationGroup = new AnimationGroup("animationGroup0", scene);
            animationGroup.addTargetedAnimation(animation, node);
            animationGroup.start();
            animationGroup.animatables[0].goToFrame(30);

            animationGroup.stop(true);

            expect(animationGroup.getRetainedCurrentFrame()).toBe(30);
            expect(animationGroup.getCurrentFrame()).toBe(0);
        });
    });
});
