import { describe, expect, it } from "vitest";
import { AnimationKeyInterpolation } from "core/Animations/animationKey";
import { NullEngine } from "core/Engines/nullEngine";
import { Vector3 } from "core/Maths/math.vector.pure";
import { TransformNode } from "core/Meshes/transformNode.pure";
import { Scene } from "core/scene";
import { BuildAnimationGroup, CreateAnimationsForPrim } from "loaders/USD/adapter/animationAdapter";
import { type IResolvedAnimation } from "loaders/USD/resolution/resolvedStage";

const Fps = 24;
const Epsilon = 1e-6;

describe("USD animation adapter", () => {
    it("creates linear Vector3 translation keys in Babylon frames", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);

        try {
            const node = new TransformNode("AnimatedPrim", scene);
            const animation: IResolvedAnimation = {
                tracks: [
                    {
                        target: "translation",
                        times: new Float32Array([0, 1, 2]),
                        values: new Float32Array([0, 0, 0, 10, 0, 0, 20, 0, 0]),
                        interpolation: "linear",
                    },
                ],
            };

            const animations = CreateAnimationsForPrim(animation, node, Fps);

            expect(animations).toHaveLength(1);
            const keys = animations[0].getKeys();
            expect(keys.map((key) => key.frame)).toEqual([0, 24, 48]);
            expect((keys[0].value as Vector3).equalsWithEpsilon(new Vector3(0, 0, 0), Epsilon)).toBe(true);
            expect((keys[1].value as Vector3).equalsWithEpsilon(new Vector3(10, 0, 0), Epsilon)).toBe(true);
            expect((keys[2].value as Vector3).equalsWithEpsilon(new Vector3(20, 0, 0), Epsilon)).toBe(true);
            expect((animations[0].evaluate(12) as Vector3).equalsWithEpsilon(new Vector3(5, 0, 0), Epsilon)).toBe(true);
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });

    it("creates step keys for held interpolation", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);

        try {
            const node = new TransformNode("HeldPrim", scene);
            const animation: IResolvedAnimation = {
                tracks: [
                    {
                        target: "translation",
                        times: new Float32Array([0, 1]),
                        values: new Float32Array([0, 0, 0, 10, 0, 0]),
                        interpolation: "held",
                    },
                ],
            };

            const animations = CreateAnimationsForPrim(animation, node, Fps);
            const keys = animations[0].getKeys();

            expect(keys[0].interpolation).toBe(AnimationKeyInterpolation.STEP);
            expect((animations[0].evaluate(12) as Vector3).equalsWithEpsilon(new Vector3(0, 0, 0), Epsilon)).toBe(true);
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });

    it("builds an animation group from targeted animation entries", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);

        try {
            const node = new TransformNode("GroupedPrim", scene);
            const animation: IResolvedAnimation = {
                tracks: [
                    {
                        target: "translation",
                        times: new Float32Array([0, 1]),
                        values: new Float32Array([0, 0, 0, 1, 0, 0]),
                        interpolation: "linear",
                    },
                    {
                        target: "scale",
                        times: new Float32Array([0, 1]),
                        values: new Float32Array([1, 1, 1, 2, 2, 2]),
                        interpolation: "linear",
                    },
                ],
            };
            const animations = CreateAnimationsForPrim(animation, node, Fps);

            const group = BuildAnimationGroup("UsdGroup", scene, [{ node, animations }]);

            expect(group.name).toBe("UsdGroup");
            expect(group.targetedAnimations).toHaveLength(2);
            expect(group.targetedAnimations.every((targetedAnimation) => targetedAnimation.target === node)).toBe(true);
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });
});
