import { NullEngine } from "core/Engines/nullEngine";
import { Engine } from "core/Engines/engine";
import { Scene } from "core/scene";
import { Animation } from "core/Animations/animation";
import { AnimationGroup } from "core/Animations/animationGroup";
import { AnimationPropertiesOverride } from "core/Animations/animationPropertiesOverride";
import { FreeCamera } from "core/Cameras/freeCamera";
import { TransformNode } from "core/Meshes/transformNode";
import { MorphTarget } from "core/Morph/morphTarget";
import { Vector3 } from "core/Maths/math.vector";
import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("Babylon RuntimeAnimation", function () {
    let engine: Engine;

    beforeEach(function () {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
    });

    afterEach(function () {
        Animation.InheritOriginalValueFromActiveAnimations = false;
        engine.dispose();
    });

    describe("_originalValue with overlapping animations", () => {
        it("should inherit the original value from an already-running animation when InheritOriginalValueFromActiveAnimations is true", () => {
            Animation.InheritOriginalValueFromActiveAnimations = true;

            const scene = new Scene(engine);
            scene.useConstantAnimationDeltaTime = true;
            new FreeCamera("camera", Vector3.Zero(), scene);

            const morphTarget = { influence: 0 };

            // Animation A: drives influence from 0 to 1 over 60 frames
            const animA = new Animation("animA", "influence", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
            animA.setKeys([
                { frame: 0, value: 0 },
                { frame: 60, value: 1 },
            ]);
            const groupA = new AnimationGroup("groupA", scene);
            groupA.addTargetedAnimation(animA, morphTarget);

            // Animation B: overrides influence to 0
            const animB = new Animation("animB", "influence", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
            animB.setKeys([
                { frame: 0, value: 0 },
                { frame: 60, value: 0 },
            ]);
            const groupB = new AnimationGroup("groupB", scene);
            groupB.addTargetedAnimation(animB, morphTarget);

            // Start A, advance ~30 frames so influence is mid-animation
            groupA.start(false, 1.0, 0, 60);
            for (let i = 0; i < 30; i++) {
                scene.render();
            }
            const midAnimValue = morphTarget.influence;
            expect(midAnimValue).toBeGreaterThan(0.3);
            expect(midAnimValue).toBeLessThan(0.7);

            // Start B while A is still playing — B should capture the TRUE original (0)
            groupB.start(false, 1.0, 0, 60);

            const bRuntimeAnims = groupB.animatables[0].getAnimations();
            const bOriginalValue = (bRuntimeAnims[0] as any)._originalValue[0];
            expect(bOriginalValue).toBe(0);
        });

        it("should snapshot the live value when InheritOriginalValueFromActiveAnimations is false (default)", () => {
            const scene = new Scene(engine);
            scene.useConstantAnimationDeltaTime = true;
            new FreeCamera("camera", Vector3.Zero(), scene);

            const morphTarget = { influence: 0 };

            const animA = new Animation("animA", "influence", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
            animA.setKeys([
                { frame: 0, value: 0 },
                { frame: 60, value: 1 },
            ]);
            const groupA = new AnimationGroup("groupA", scene);
            groupA.addTargetedAnimation(animA, morphTarget);

            const animB = new Animation("animB", "influence", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
            animB.setKeys([
                { frame: 0, value: 0 },
                { frame: 60, value: 0 },
            ]);
            const groupB = new AnimationGroup("groupB", scene);
            groupB.addTargetedAnimation(animB, morphTarget);

            groupA.start(false, 1.0, 0, 60);
            for (let i = 0; i < 30; i++) {
                scene.render();
            }

            // With the flag off, B should snapshot the current (mid-animation) value
            groupB.start(false, 1.0, 0, 60);

            const bRuntimeAnims = groupB.animatables[0].getAnimations();
            const bOriginalValue = (bRuntimeAnims[0] as any)._originalValue[0];
            expect(bOriginalValue).toBeGreaterThan(0.3);
        });

        it("should use the live value when no other animation is running on the same target+property", () => {
            Animation.InheritOriginalValueFromActiveAnimations = true;

            const scene = new Scene(engine);

            const target = { value: 42 };

            const anim = new Animation("anim", "value", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
            anim.setKeys([
                { frame: 0, value: 0 },
                { frame: 60, value: 100 },
            ]);

            const group = new AnimationGroup("group", scene);
            group.addTargetedAnimation(anim, target);
            group.start(false, 1.0, 0, 60);

            const runtimeAnims = group.animatables[0].getAnimations();
            const originalValue = (runtimeAnims[0] as any)._originalValue[0];
            expect(originalValue).toBe(42);
        });

        it("should correctly chain original values through multiple overlapping animations", () => {
            Animation.InheritOriginalValueFromActiveAnimations = true;

            const scene = new Scene(engine);
            scene.useConstantAnimationDeltaTime = true;
            new FreeCamera("camera", Vector3.Zero(), scene);

            const target = { influence: 0 };

            const animA = new Animation("animA", "influence", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
            animA.setKeys([
                { frame: 0, value: 0 },
                { frame: 60, value: 1 },
            ]);
            const groupA = new AnimationGroup("groupA", scene);
            groupA.addTargetedAnimation(animA, target);

            const animB = new Animation("animB", "influence", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
            animB.setKeys([
                { frame: 0, value: 0.5 },
                { frame: 60, value: 0 },
            ]);
            const groupB = new AnimationGroup("groupB", scene);
            groupB.addTargetedAnimation(animB, target);

            const animC = new Animation("animC", "influence", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
            animC.setKeys([
                { frame: 0, value: 0.2 },
                { frame: 60, value: 0.8 },
            ]);
            const groupC = new AnimationGroup("groupC", scene);
            groupC.addTargetedAnimation(animC, target);

            // Start A
            groupA.start(false, 1.0, 0, 60);
            for (let i = 0; i < 15; i++) {
                scene.render();
            }

            // Start B while A is running — should inherit A's original (0)
            groupB.start(false, 1.0, 0, 60);
            expect((groupB.animatables[0].getAnimations()[0] as any)._originalValue[0]).toBe(0);

            for (let i = 0; i < 10; i++) {
                scene.render();
            }

            // Start C while both A and B are running — should still inherit the original (0)
            groupC.start(false, 1.0, 0, 60);
            expect((groupC.animatables[0].getAnimations()[0] as any)._originalValue[0]).toBe(0);
        });
    });

    describe("loop mode inheritance for morph targets", () => {
        // Builds an influence animation whose own loop mode is CYCLE and whose last keyframe does not return
        // to the first value, so the RELATIVE offset (last - first) is non-zero and would accumulate if applied.
        const createMorphInfluenceAnimation = () => {
            const anim = new Animation("morphAnim", "influence", 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
            anim.setKeys([
                { frame: 0, value: 0 },
                { frame: 15, value: 0.3 },
                { frame: 30, value: 0.05 },
            ]);
            return anim;
        };

        const getRuntimeLoopMode = (group: AnimationGroup) => (group.animatables[0].getAnimations()[0] as any)._animationState.loopMode as number;

        it("does not inherit a scene-level RELATIVE loop mode for morph target influence", () => {
            const scene = new Scene(engine);
            scene.useConstantAnimationDeltaTime = true;
            new FreeCamera("camera", Vector3.Zero(), scene);

            // Scene-level override (typically set for transform/bone blending) using RELATIVE loop mode.
            scene.animationPropertiesOverride = new AnimationPropertiesOverride();
            scene.animationPropertiesOverride.loopMode = Animation.ANIMATIONLOOPMODE_RELATIVE;

            const morphTarget = new MorphTarget("BrowsUp", 0, scene);
            const group = new AnimationGroup("TestMorphAnim", scene);
            group.addTargetedAnimation(createMorphInfluenceAnimation(), morphTarget);
            group.start(true, 1.0, 0, 30);

            // The inherited scene loop mode must not leak into the morph influence animation.
            expect(getRuntimeLoopMode(group)).toBe(Animation.ANIMATIONLOOPMODE_CYCLE);

            // Run several loops: the influence must keep cycling instead of drifting upward.
            let maxInfluence = 0;
            for (let i = 0; i < 400; i++) {
                scene.render();
                maxInfluence = Math.max(maxInfluence, morphTarget.influence);
            }

            // The maximum keyframe value is 0.3; allow a small epsilon for interpolation/blending.
            expect(maxInfluence).toBeLessThan(0.4);
        });

        it("respects a RELATIVE override set explicitly on the morph target", () => {
            const scene = new Scene(engine);
            scene.useConstantAnimationDeltaTime = true;
            new FreeCamera("camera", Vector3.Zero(), scene);

            const morphTarget = new MorphTarget("BrowsUp", 0, scene);
            morphTarget.animationPropertiesOverride = new AnimationPropertiesOverride();
            morphTarget.animationPropertiesOverride.loopMode = Animation.ANIMATIONLOOPMODE_RELATIVE;

            const group = new AnimationGroup("TestMorphAnim", scene);
            group.addTargetedAnimation(createMorphInfluenceAnimation(), morphTarget);
            group.start(true, 1.0, 0, 30);

            // An override set on the morph target itself must still be honored.
            expect(getRuntimeLoopMode(group)).toBe(Animation.ANIMATIONLOOPMODE_RELATIVE);

            let maxInfluence = 0;
            for (let i = 0; i < 400; i++) {
                scene.render();
                maxInfluence = Math.max(maxInfluence, morphTarget.influence);
            }

            // With RELATIVE accumulation the influence drifts well past the keyframe maximum.
            expect(maxInfluence).toBeGreaterThan(0.4);
        });

        it("still inherits a scene-level RELATIVE loop mode for non-morph targets", () => {
            const scene = new Scene(engine);
            new FreeCamera("camera", Vector3.Zero(), scene);

            scene.animationPropertiesOverride = new AnimationPropertiesOverride();
            scene.animationPropertiesOverride.loopMode = Animation.ANIMATIONLOOPMODE_RELATIVE;

            const node = new TransformNode("node", scene);
            const anim = new Animation("posAnim", "position.x", 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
            anim.setKeys([
                { frame: 0, value: 0 },
                { frame: 30, value: 1 },
            ]);
            const group = new AnimationGroup("TestNodeAnim", scene);
            group.addTargetedAnimation(anim, node);
            group.start(true, 1.0, 0, 30);

            // Transform nodes keep inheriting the scene loop mode (behavior is unchanged by the morph-target fix).
            expect(getRuntimeLoopMode(group)).toBe(Animation.ANIMATIONLOOPMODE_RELATIVE);
        });
    });
});
