import { Animation } from "core/Animations/animation";
import { QuadraticEase } from "core/Animations/easing";
import { describe, expect, it } from "vitest";

import { CurveData } from "../../src/components/curveEditor/canvas/curveData";
import { CreateBabylonCurveEditorAnimation } from "../../src/components/curveEditor/curveEditorSource";

describe("Babylon curve editor adapter", () => {
    it("preserves per-key easing when keys are retimed, inserted, or deleted", () => {
        const easing = new QuadraticEase();
        const animation = new Animation("test", "value", 30, Animation.ANIMATIONTYPE_FLOAT);
        animation.setKeys([
            { frame: 0, value: 0 },
            { frame: 10, value: 1, easingFunction: easing },
            { frame: 20, value: 2 },
        ]);
        const editor = CreateBabylonCurveEditorAnimation(animation)!;
        const keys = editor.getKeys();
        keys[1].frame = 12;
        keys.splice(0, 1);
        keys.push({ frame: 30, value: [3], lockedTangent: true });
        editor.setKeys(keys);

        expect(animation.getKeys()[0]).toMatchObject({ frame: 12, easingFunction: easing });
        expect(animation.getKeys()[2].easingFunction).toBeUndefined();
    });

    it.each(["in", "out"] as const)("commits both tangents when editing the %s tangent of a linear segment", (direction) => {
        const animation = new Animation("test", "value", 30, Animation.ANIMATIONTYPE_FLOAT);
        animation.setKeys([
            { frame: 0, value: 0 },
            { frame: 10, value: 10 },
        ]);
        const editor = CreateBabylonCurveEditorAnimation(animation)!;
        const curve = new CurveData("#fff", editor);
        curve.keys = editor.getKeys().map((key) => ({ frame: key.frame, value: key.value[0], lockedTangent: key.lockedTangent }));

        if (direction === "in") {
            curve.updateInTangentFromControlPoint(1, 0);
        } else {
            curve.updateOutTangentFromControlPoint(0, 0);
        }

        expect(animation.getKeys()[0].outTangent).toBeDefined();
        expect(animation.getKeys()[1].inTangent).toBeDefined();
        expect(animation.evaluate(5)).not.toBe(5);
    });
});
