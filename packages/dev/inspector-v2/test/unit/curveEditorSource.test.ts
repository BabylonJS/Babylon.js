import { Animation } from "core/Animations/animation";
import { QuadraticEase } from "core/Animations/easing";
import { Vector3 } from "core/Maths/math.vector";
import { describe, expect, it } from "vitest";

import { CurveData } from "../../src/components/curveEditor/canvas/curveData";
import { CreateBabylonCurveEditorAnimation, CreateBabylonCurveEditorAnimations } from "../../src/components/curveEditor/curveEditorSource";

describe("Babylon curve editor adapter", () => {
    it("preserves callable values when another key is edited and replaces a changed callable value", () => {
        const callback = () => 1;
        const animation = new Animation("test", "value", 30, Animation.ANIMATIONTYPE_FLOAT);
        animation.setKeys([
            { frame: 0, value: callback },
            { frame: 10, value: 2 },
        ]);
        const other = new Animation("other", "value", 30, Animation.ANIMATIONTYPE_FLOAT);
        other.setKeys([{ frame: 0, value: 3 }]);
        const [editor, otherEditor] = CreateBabylonCurveEditorAnimations([animation, other]);
        expect(otherEditor.getKeys()[0].value).toEqual([3]);
        const keys = editor.getKeys();
        expect(keys[0].value).toEqual([1]);
        keys[1].value = [3];
        editor.setKeys(keys);
        expect(animation.getKeys()[0].value).toBe(callback);
        const edited = editor.getKeys();
        edited[0].value = [4];
        editor.setKeys(edited);
        expect(animation.getKeys()[0].value).toBe(4);
    });

    it("initializes and synchronizes all vector component tangents", () => {
        const animation = new Animation("test", "position", 30, Animation.ANIMATIONTYPE_VECTOR3);
        animation.setKeys([
            { frame: 0, value: new Vector3(0, 0, 0) },
            { frame: 10, value: new Vector3(10, 20, 30) },
        ]);
        const editor = CreateBabylonCurveEditorAnimation(animation)!;
        const curves = [0, 1, 2].map((component) => {
            const curve = new CurveData("#fff", editor, component);
            curve.keys = editor.getKeys().map((key) => ({ frame: key.frame, value: key.value[component], lockedTangent: key.lockedTangent }));
            return curve;
        });
        curves.forEach((curve) => (curve.siblings = curves));
        curves[0].updateOutTangentFromControlPoint(0, 0);
        expect(animation.getKeys()[0].outTangent).toEqual(new Vector3(0, 2, 3));
        expect(animation.getKeys()[1].inTangent).toEqual(new Vector3(1, 2, 3));
        expect(curves[1].keys[0].outTangent).toBe(2);
        expect(curves[2].keys[1].inTangent).toBe(3);
    });

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
