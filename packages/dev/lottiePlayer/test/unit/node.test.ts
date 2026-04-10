import { describe, it, expect } from "vitest";
import { Node } from "../../src/nodes/node";
import { ControlNode } from "../../src/nodes/controlNode";
import { BezierCurve } from "../../src/maths/bezier";
import { type Vector2Property, type ScalarProperty } from "../../src/parsing/parsedTypes";

function linearEase(): BezierCurve {
    return new BezierCurve(0, 0, 1, 1, 4);
}

function makePositionProperty(startX: number, startY: number, keyframes: { time: number; x: number; y: number }[]): Vector2Property {
    const ease = linearEase();
    return {
        startValue: { x: startX, y: startY },
        currentValue: { x: startX, y: startY },
        currentKeyframeIndex: 0,
        keyframes: keyframes.map((kf) => ({
            time: kf.time,
            value: { x: kf.x, y: kf.y },
            easeFunction1: ease,
            easeFunction2: ease,
        })),
    };
}

function makeScalarProperty(startValue: number, keyframes: { time: number; value: number }[]): ScalarProperty {
    const ease = linearEase();
    return {
        startValue,
        currentValue: startValue,
        currentKeyframeIndex: 0,
        keyframes: keyframes.map((kf) => ({
            time: kf.time,
            value: kf.value,
            easeFunction: ease,
        })),
    };
}

describe("Node keyframe boundary", () => {
    it("returns the final keyframe value at exactly the last keyframe time", () => {
        const position = makePositionProperty(0, 0, [
            { time: 0, x: 0, y: 0 },
            { time: 30, x: 100, y: 200 },
        ]);

        const node = new Node("test", position);
        node.isVisible = true;
        node.update(30);

        expect(node.positionCurrent.x).toBe(100);
        expect(node.positionCurrent.y).toBe(200);
    });

    it("clamps to the final keyframe value beyond the last keyframe time", () => {
        const position = makePositionProperty(0, 0, [
            { time: 0, x: 0, y: 0 },
            { time: 30, x: 100, y: 200 },
        ]);

        const node = new Node("test", position);
        node.isVisible = true;
        node.update(31);

        expect(node.positionCurrent.x).toBe(100);
        expect(node.positionCurrent.y).toBe(200);
    });

    it("interpolates correctly at mid-frame", () => {
        const position = makePositionProperty(0, 0, [
            { time: 0, x: 0, y: 0 },
            { time: 30, x: 100, y: 200 },
        ]);

        const node = new Node("test", position);
        node.isVisible = true;
        node.update(15);

        expect(node.positionCurrent.x).toBeCloseTo(50, 0);
        expect(node.positionCurrent.y).toBeCloseTo(100, 0);
    });

    it("returns the final scale value at exactly the last keyframe time", () => {
        const scale = makePositionProperty(1, 1, [
            { time: 0, x: 1, y: 1 },
            { time: 20, x: 2, y: 3 },
        ]);

        const node = new Node("test", undefined, undefined, scale);
        node.isVisible = true;
        node.update(20);

        expect(node.scaleCurrent.x).toBe(2);
        expect(node.scaleCurrent.y).toBe(3);
    });

    it("returns the final opacity value at exactly the last keyframe time", () => {
        const opacity = makeScalarProperty(0, [
            { time: 0, value: 0 },
            { time: 10, value: 1 },
        ]);

        const node = new Node("test", undefined, undefined, undefined, opacity);
        node.isVisible = true;
        node.update(10);

        expect(node.opacity).toBe(1);
    });

    it("applies correct sign for rotation at exactly the last keyframe time", () => {
        const rotation = makeScalarProperty(0, [
            { time: 0, value: 0 },
            { time: 30, value: Math.PI / 2 },
        ]);

        const node = new Node("test", undefined, rotation);
        node.isVisible = true;

        // At mid-frame, interpolation applies negation
        node.update(15);
        const midValue = node.rotationCurrent;
        expect(midValue).toBeLessThan(0);

        // At exact last keyframe, clamp should also apply negation
        node.update(30);
        expect(node.rotationCurrent).toBe(-Math.PI / 2);
    });
});

describe("Null layer opacity isolation", () => {
    it("child of null layer with opacity 0 returns its own opacity when no grandparent", () => {
        const parentOpacity = makeScalarProperty(0, []);
        const nullParent = new ControlNode("null-parent", 0, 100, undefined, undefined, undefined, parentOpacity, undefined, true);
        nullParent.update(0);

        const childOpacity: ScalarProperty = { startValue: 1, currentValue: 1, currentKeyframeIndex: 0 };
        const child = new Node("child", undefined, undefined, undefined, childOpacity, nullParent);
        child.isVisible = true;
        nullParent.isVisible = true;

        // Force update to propagate visibility
        nullParent.update(0);

        expect(child.opacity).toBe(1);
    });

    it("child of null layer still inherits grandparent opacity", () => {
        const grandparentOpacity: ScalarProperty = { startValue: 0.5, currentValue: 0.5, currentKeyframeIndex: 0 };
        const grandparent = new ControlNode("grandparent", 0, 100, undefined, undefined, undefined, grandparentOpacity);

        const nullOpacity = makeScalarProperty(0, []);
        const nullParent = new ControlNode("null-parent", 0, 100, undefined, undefined, undefined, nullOpacity, grandparent, true);

        const childOpacity: ScalarProperty = { startValue: 0.8, currentValue: 0.8, currentKeyframeIndex: 0 };
        const child = new Node("child", undefined, undefined, undefined, childOpacity, nullParent);

        grandparent.isVisible = true;
        grandparent.update(0);

        // Child should skip null layer's opacity (0) but still multiply by grandparent's opacity (0.5)
        expect(child.opacity).toBeCloseTo(0.4, 5);
    });

    it("child of nested null layers still inherits ancestor opacity", () => {
        // Mirror the real scene graph: ControlNode → anchor Node → ControlNode → anchor Node → ...
        const ancestorOpacity: ScalarProperty = { startValue: 0.5, currentValue: 0.5, currentKeyframeIndex: 0 };
        const ancestor = new ControlNode("ancestor", 0, 100, undefined, undefined, undefined, ancestorOpacity);
        const ancestorAnchor = new Node("ancestor-anchor", undefined, undefined, undefined, undefined, ancestor);

        const null1Opacity = makeScalarProperty(0, []);
        const null1 = new ControlNode("null1", 0, 100, undefined, undefined, undefined, null1Opacity, ancestorAnchor, true);
        const null1Anchor = new Node("null1-anchor", undefined, undefined, undefined, undefined, null1);

        const null2Opacity = makeScalarProperty(0, []);
        const null2 = new ControlNode("null2", 0, 100, undefined, undefined, undefined, null2Opacity, null1Anchor, true);
        const null2Anchor = new Node("null2-anchor", undefined, undefined, undefined, undefined, null2);

        const childOpacity: ScalarProperty = { startValue: 1, currentValue: 1, currentKeyframeIndex: 0 };
        const child = new Node("child", undefined, undefined, undefined, childOpacity, null2Anchor);

        ancestor.isVisible = true;
        ancestor.update(0);

        // Both null layers' opacities (0) should be skipped, but ancestor's 0.5 should be preserved
        expect(child.opacity).toBeCloseTo(0.5, 5);
    });

    it("child of regular layer still multiplies by parent opacity", () => {
        const parentOpacity: ScalarProperty = { startValue: 0.5, currentValue: 0.5, currentKeyframeIndex: 0 };
        const regularParent = new ControlNode("regular-parent", 0, 100, undefined, undefined, undefined, parentOpacity, undefined, false);

        const childOpacity: ScalarProperty = { startValue: 0.8, currentValue: 0.8, currentKeyframeIndex: 0 };
        const child = new Node("child", undefined, undefined, undefined, childOpacity, regularParent);
        child.isVisible = true;
        regularParent.isVisible = true;

        regularParent.update(0);

        expect(child.opacity).toBeCloseTo(0.4, 5);
    });

    it("transforms from null layer parent still apply to children", () => {
        const parentPosition = makePositionProperty(10, 20, []);
        const nullParent = new ControlNode("null-parent", 0, 100, parentPosition, undefined, undefined, undefined, undefined, true);

        const child = new Node("child", undefined, undefined, undefined, undefined, nullParent);
        child.isVisible = true;
        nullParent.isVisible = true;

        nullParent.update(0);

        // The child's world matrix should reflect the parent's position
        const scale = { x: 0, y: 0 };
        const translation = { x: 0, y: 0 };
        child.worldMatrix.decompose(scale, translation);

        expect(translation.x).toBeCloseTo(10, 5);
        expect(translation.y).toBeCloseTo(20, 5);
    });
});

describe("ControlNode out-frame exclusivity", () => {
    it("is visible at outFrame - 1", () => {
        const control = new ControlNode("test", 0, 30);
        control.update(29);

        expect(control.opacity).toBeGreaterThan(0);
    });

    it("is invisible at exactly outFrame", () => {
        const control = new ControlNode("test", 0, 30);
        control.update(30);

        expect(control.opacity).toBe(0);
    });

    it("is visible at inFrame", () => {
        const control = new ControlNode("test", 5, 30);
        control.update(5);

        expect(control.opacity).toBeGreaterThan(0);
    });

    it("is invisible before inFrame", () => {
        const control = new ControlNode("test", 5, 30);
        control.update(4);

        expect(control.opacity).toBe(0);
    });
});
