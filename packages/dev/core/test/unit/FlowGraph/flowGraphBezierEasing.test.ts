import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { FlowGraphBezierCurveEasingBlock } from "core/FlowGraph/Blocks/Execution/Animation/flowGraphBezierCurveEasingBlock";
import { EasingFunction } from "core/Animations/easing";
import { Vector2 } from "core/Maths/math.vector";
import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";

/**
 * Coverage for the cubic Bézier easing produced by FlowGraphBezierCurveEasingBlock,
 * which backs KHR_interactivity `variable/interpolate` / `pointer/interpolate`.
 *
 * Per the KHR_interactivity spec the eased output progress is the cubic Bézier Y
 * coordinate (implicit endpoints P0=(0,0), P3=(1,1)) evaluated with the input
 * progress used directly as the curve parameter — NOT the CSS-style "solve for X"
 * easing. For control points P1=P2=(1,1) this yields q(0.5)=0.875 (the Khronos
 * `variable/interpolate` asset expects an interpolated value of 8.75 over a 0..10
 * range), whereas the CSS easing would yield q(0.5)=0.5.
 */
describe("FlowGraph BezierCurveEasing (KHR_interactivity parametric)", () => {
    let engine: NullEngine;
    let scene: Scene;
    let context: FlowGraphContext;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        const coordinator = new FlowGraphCoordinator({ scene });
        context = coordinator.createGraph().createContext();
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    function easeFor(p1: Vector2, p2: Vector2, mode: number = EasingFunction.EASINGMODE_EASEIN): EasingFunction {
        const block = new FlowGraphBezierCurveEasingBlock();
        block.mode.setValue(mode, context);
        block.controlPoint1.setValue(p1, context);
        block.controlPoint2.setValue(p2, context);
        block._updateOutputs(context);
        return block.easingFunction.getValue(context) as EasingFunction;
    }

    it("evaluates the cubic Bézier Y at parameter = t (P1=P2=(1,1) => q(0.5)=0.875)", () => {
        const easing = easeFor(new Vector2(1, 1), new Vector2(1, 1));
        expect(easing.ease(0)).toBeCloseTo(0, 6);
        expect(easing.ease(0.5)).toBeCloseTo(0.875, 6);
        expect(easing.ease(1)).toBeCloseTo(1, 6);
    });

    it("matches the closed-form 3(1-t)^2 t p1y + 3(1-t) t^2 p2y + t^3", () => {
        const p1y = 0.25;
        const p2y = 0.9;
        const easing = easeFor(new Vector2(0.3, p1y), new Vector2(0.7, p2y));
        for (const t of [0.1, 0.25, 0.5, 0.75, 0.9]) {
            const u = 1 - t;
            const expected = 3 * u * u * t * p1y + 3 * u * t * t * p2y + t * t * t;
            expect(easing.ease(t)).toBeCloseTo(expected, 6);
        }
    });

    it("uses only the Y components of the control points for the curve", () => {
        const a = easeFor(new Vector2(0.2, 1), new Vector2(0.8, 1));
        const b = easeFor(new Vector2(1, 1), new Vector2(0.0, 1));
        expect(a.ease(0.5)).toBeCloseTo(b.ease(0.5), 6);
    });

    it("retains x1/y1/x2/y2 components so downstream NaN validation still works", () => {
        const easing = easeFor(new Vector2(NaN, 1), new Vector2(1, 1)) as unknown as { x1: number; y1: number; x2: number; y2: number };
        expect("x1" in easing).toBe(true);
        expect(isNaN(easing.x1)).toBe(true);
        expect(easing.y1).toBe(1);
    });
});
