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
 * KHR_interactivity follows CSS cubic-bezier semantics: for input progress t,
 * solve Bx(u)=t and return By(u), using implicit endpoints P0=(0,0), P3=(1,1).
 */
describe("FlowGraph BezierCurveEasing (KHR_interactivity CSS semantics)", () => {
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

    it("solves X before reading Y (P1=P2=(1,1) => q(0.5)=0.5)", () => {
        const easing = easeFor(new Vector2(1, 1), new Vector2(1, 1));
        expect(easing.ease(0)).toBeCloseTo(0, 6);
        expect(easing.ease(0.5)).toBeCloseTo(0.5, 6);
        expect(easing.ease(1)).toBeCloseTo(1, 6);
    });

    it("matches the CSS ease-in curve at the midpoint", () => {
        const easing = easeFor(new Vector2(0.42, 0), new Vector2(1, 1));
        expect(easing.ease(0.5)).toBeCloseTo(0.315357, 5);
    });

    it("uses the X components to determine output progress", () => {
        const early = easeFor(new Vector2(0, 0), new Vector2(0, 1));
        const late = easeFor(new Vector2(1, 0), new Vector2(1, 1));
        expect(early.ease(0.5)).toBeGreaterThan(0.8);
        expect(late.ease(0.5)).toBeLessThan(0.2);
    });

    it("handles a valid stationary derivative without producing NaN", () => {
        const easing = easeFor(new Vector2(1, 1), new Vector2(0, 1));
        expect(easing.ease(0.5)).toBeCloseTo(0.875, 6);
        expect(easing.ease(1)).toBe(1);
    });

    it("retains x1/y1/x2/y2 components for downstream validation", () => {
        const easing = easeFor(new Vector2(NaN, 1), new Vector2(1, 1)) as unknown as { x1: number; y1: number; x2: number; y2: number };
        expect("x1" in easing).toBe(true);
        expect(isNaN(easing.x1)).toBe(true);
        expect(easing.y1).toBe(1);
    });
});
