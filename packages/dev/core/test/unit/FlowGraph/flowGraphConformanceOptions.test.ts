import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { type FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import { FlowGraphSceneTickEventBlock } from "core/FlowGraph/Blocks/Event/flowGraphSceneTickEventBlock.pure";
import { FlowGraphSceneReadyEventBlock } from "core/FlowGraph/Blocks/Event/flowGraphSceneReadyEventBlock.pure";
import { FlowGraphPlayAnimationBlock } from "core/FlowGraph/Blocks/Execution/Animation/flowGraphPlayAnimationBlock.pure";
import { FlowGraphForLoopBlock } from "core/FlowGraph/Blocks/Execution/ControlFlow/flowGraphForLoopBlock.pure";
import { FlowGraphThrottleBlock } from "core/FlowGraph/Blocks/Execution/ControlFlow/flowGraphThrottleBlock.pure";
import { FlowGraphCancelDelayBlock } from "core/FlowGraph/Blocks/Execution/ControlFlow/flowGraphCancelDelayBlock.pure";
import { FlowGraphSetPropertyBlock } from "core/FlowGraph/Blocks/Execution/flowGraphSetPropertyBlock.pure";
import { FlowGraphInteger } from "core/FlowGraph/CustomTypes/flowGraphInteger.pure";

describe("FlowGraph optional execution semantics", () => {
    let engine: NullEngine;
    let scene: Scene;
    let context: FlowGraphContext;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        context = new FlowGraphCoordinator({ scene }).createGraph().createContext();
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
        vi.restoreAllMocks();
    });

    it("starts an opted-in clock on the first tick and shares its values across blocks", () => {
        const first = new FlowGraphSceneTickEventBlock({ useFirstTickAsStart: true });
        const second = new FlowGraphSceneTickEventBlock({ useFirstTickAsStart: true });
        const generic = new FlowGraphSceneTickEventBlock();
        expect(first.timeSinceStart.getValue(context)).toBeNaN();
        expect(first.deltaTime.getValue(context)).toBeNaN();
        const payload = { timeSinceStart: 3, deltaTime: 0.02 };
        first._executeEvent(context, payload);
        second._executeEvent(context, payload);
        generic._executeEvent(context, payload);
        context._notifyOnTick(payload);
        expect(first.timeSinceStart.getValue(context)).toBe(0);
        expect(second.timeSinceStart.getValue(context)).toBe(0);
        expect(first.deltaTime.getValue(context)).toBeNaN();
        expect(second.deltaTime.getValue(context)).toBeNaN();
        expect(generic.timeSinceStart.getValue(context)).toBe(3);
        expect(generic.deltaTime.getValue(context)).toBe(0.02);

        const next = { timeSinceStart: 3.02, deltaTime: 0.02 };
        first._executeEvent(context, next);
        second._executeEvent(context, next);
        context._notifyOnTick(next);
        expect(first.timeSinceStart.getValue(context)).toBeCloseTo(0.02);
        expect(second.timeSinceStart.getValue(context)).toBeCloseTo(0.02);
        expect(first.deltaTime.getValue(context)).toBe(0.02);
        const sameTime = { timeSinceStart: 3.04, deltaTime: 0 };
        first._executeEvent(context, sameTime);
        context._notifyOnTick(sameTime);
        expect(first.deltaTime.getValue(context)).toBe(0);
        expect(first.timeSinceStart.getValue(context)).toBeCloseTo(0.02);
    });

    it("measures nonuniform scene intervals after the first tick without changing the generic clock", () => {
        const graph = context.configuration.coordinator.flowGraphs[0];
        const first = new FlowGraphSceneTickEventBlock({ useFirstTickAsStart: true });
        const second = new FlowGraphSceneTickEventBlock({ useFirstTickAsStart: true });
        const generic = new FlowGraphSceneTickEventBlock();
        graph.addEventBlock(first);
        graph.addEventBlock(second);
        graph.addEventBlock(generic);
        graph.start(true);
        const deltas = [1000, 20, 40];
        const expectedElapsed = [0, 0.02, 0.06];
        const expectedGeneric = [0, 1, 1.02];
        vi.spyOn(engine, "getDeltaTime").mockReturnValueOnce(deltas[0]).mockReturnValueOnce(deltas[1]).mockReturnValueOnce(deltas[2]);
        for (let index = 0; index < deltas.length; index++) {
            scene.onBeforeRenderObservable.notifyObservers(scene);
            expect(first.timeSinceStart.getValue(context)).toBeCloseTo(expectedElapsed[index]);
            expect(second.timeSinceStart.getValue(context)).toBeCloseTo(expectedElapsed[index]);
            expect(generic.timeSinceStart.getValue(context)).toBeCloseTo(expectedGeneric[index]);
            expect(generic.deltaTime.getValue(context)).toBe(deltas[index] / 1000);
            if (index === 0) {
                expect(first.deltaTime.getValue(context)).toBeNaN();
                expect(second.deltaTime.getValue(context)).toBeNaN();
            } else {
                expect(first.deltaTime.getValue(context)).toBe(deltas[index] / 1000);
                expect(second.deltaTime.getValue(context)).toBe(deltas[index] / 1000);
            }
        }
    });

    it.each([false, true])("opts into immediate startup without changing readiness-based startup (%s)", (skipSceneReadyCheck) => {
        const graph = new FlowGraphCoordinator({ scene }).createGraph();
        const ready = new FlowGraphSceneReadyEventBlock();
        const tick = new FlowGraphSceneTickEventBlock();
        const activations: string[] = [];
        vi.spyOn(scene, "isReady").mockReturnValue(false);
        vi.spyOn(scene, "executeWhenReady").mockImplementation(() => {});
        vi.spyOn(ready.done, "_activateSignal").mockImplementation(() => {
            activations.push("ready");
        });
        vi.spyOn(tick.done, "_activateSignal").mockImplementation(() => {
            activations.push("tick");
        });
        graph.addEventBlock(ready);
        graph.addEventBlock(tick);
        graph.start(skipSceneReadyCheck);
        scene.onBeforeRenderObservable.notifyObservers(scene);
        expect(activations).toEqual(skipSceneReadyCheck ? ["ready", "tick"] : ["tick"]);
    });

    it("reports an empty interpolation animation array instead of throwing", () => {
        const block = new FlowGraphPlayAnimationBlock();
        const out = vi.spyOn(block.out, "_activateSignal");
        const error = vi.spyOn(block.error, "_activateSignal");
        block.animation.setValue([], context);
        expect(() => block._execute(context, block.in)).not.toThrow();
        expect(out).not.toHaveBeenCalled();
        expect(error).toHaveBeenCalledOnce();
    });

    it.each([false, true])("preserves empty-loop compatibility unless final-index behavior is enabled (%s)", (incrementIndexWhenLoopDone) => {
        const block = new FlowGraphForLoopBlock({ initialIndex: 7, incrementIndexWhenLoopDone });
        const body = vi.spyOn(block.executionFlow, "_activateSignal");
        const completed = vi.spyOn(block.completed, "_activateSignal");
        block.startIndex.setValue(5, context);
        block.endIndex.setValue(2, context);
        block._execute(context);
        expect(block.index.getValue(context).value).toBe(incrementIndexWhenLoopDone ? 5 : 7);
        expect(body).not.toHaveBeenCalled();
        expect(completed).toHaveBeenCalledOnce();
        block.startIndex.setValue(8, context);
        block._execute(context);
        expect(block.index.getValue(context).value).toBe(incrementIndexWhenLoopDone ? 8 : 7);
    });

    it("keeps the incremented index on a nonempty opted-in loop", () => {
        const block = new FlowGraphForLoopBlock({ incrementIndexWhenLoopDone: true });
        block.startIndex.setValue(5, context);
        block.endIndex.setValue(7, context);
        block._execute(context);
        expect(block.index.getValue(context).value).toBe(7);
    });

    it.each([false, true])("opts into zero-duration throttling without changing the default (%s)", (allowZeroDuration) => {
        const block = new FlowGraphThrottleBlock({ allowZeroDuration });
        const out = vi.spyOn(block.out, "_activateSignal");
        const error = vi.spyOn(block.error, "_activateSignal");
        block.duration.setValue(0, context);
        block._execute(context, block.in);
        block._execute(context, block.in);
        expect(out).toHaveBeenCalledTimes(allowZeroDuration ? 2 : 0);
        expect(error).toHaveBeenCalledTimes(allowZeroDuration ? 0 : 2);
    });

    it.each([-1, NaN, Infinity, -Infinity])("rejects invalid throttle durations even when zero is allowed (%s)", (duration) => {
        const block = new FlowGraphThrottleBlock({ allowZeroDuration: true });
        const out = vi.spyOn(block.out, "_activateSignal");
        const error = vi.spyOn(block.error, "_activateSignal");
        block.duration.setValue(duration, context);
        block._execute(context, block.in);
        expect(out).not.toHaveBeenCalled();
        expect(error).toHaveBeenCalledOnce();
    });

    it.each([false, true])("opts into ignoring an invalid delay without changing default error behavior (%s)", (ignoreInvalidDelay) => {
        const block = new FlowGraphCancelDelayBlock({ ignoreInvalidDelay });
        const out = vi.spyOn(block.out, "_activateSignal");
        const error = vi.spyOn(block.error, "_activateSignal");
        block.delayIndex.setValue(new FlowGraphInteger(-1), context);
        block._execute(context, block.in);
        expect(out).toHaveBeenCalledTimes(ignoreInvalidDelay ? 1 : 0);
        expect(error).toHaveBeenCalledTimes(ignoreInvalidDelay ? 0 : 1);
    });

    it.each([false, true])("opts into error-only property writes without changing the default (%s)", (stopOnError) => {
        const block = new FlowGraphSetPropertyBlock({ stopOnError });
        block.customSetFunction.setValue(() => {
            throw new Error("Cannot write");
        }, context);
        const out = vi.spyOn(block.out, "_activateSignal");
        const error = vi.spyOn(block.error, "_activateSignal");
        block._execute(context, block.in);
        expect(out).toHaveBeenCalledTimes(stopOnError ? 0 : 1);
        expect(error).toHaveBeenCalledOnce();
    });
});
