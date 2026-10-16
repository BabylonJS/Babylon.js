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
import { Animation } from "core/Animations/animation.pure";
import { AnimationGroup } from "core/Animations/animationGroup.pure";
import { FlowGraphInterpolationBlock } from "core/FlowGraph/Blocks/Execution/Animation/flowGraphInterpolationBlock.pure";
import { FlowGraphJsonPointerParserBlock } from "core/FlowGraph/Blocks/Data/Transformers/flowGraphJsonPointerParserBlock.pure";

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

    it("retains zero-valued interpolation keys", () => {
        const block = new FlowGraphInterpolationBlock<number>({ propertyName: "value", duration: 1 });
        block.initialValue.setValue(0.2, context);
        block.endValue.setValue(0, context);
        block._updateOutputs(context);
        const animations = block.animation.getValue(context);
        expect(Array.isArray(animations)).toBe(true);
        if (!Array.isArray(animations)) {
            throw new Error("Expected interpolation animations.");
        }
        expect(animations[0].getKeys()).toEqual([
            { frame: 0, value: 0.2 },
            { frame: 60, value: 0 },
        ]);
    });

    it.each([false, true])("fully cleans up repeated property cancellations (synchronous=%s)", (synchronous) => {
        const target = { value: 0.2 };
        const play = new FlowGraphPlayAnimationBlock();
        const write = new FlowGraphSetPropertyBlock({ target, propertyName: "value", stopOnError: true });
        const animation = new Animation("value", "value", 60, Animation.ANIMATIONTYPE_FLOAT);
        animation.setKeys([
            { frame: 0, value: 0.2 },
            { frame: 60, value: 0.8 },
        ]);
        play.animation.setValue(animation, context);
        play.object.setValue(target, context);
        write.value.setValue(0.9, context);
        const done = vi.spyOn(play.done, "_activateSignal");
        const tick = vi.spyOn(play, "_executeOnTick");
        if (synchronous) {
            vi.spyOn(play.out, "_activateSignal").mockImplementation(() => write._execute(context, write.in));
        }
        for (let iteration = 0; iteration < 10; iteration++) {
            play._execute(context);
            if (!synchronous) {
                expect(context.hasPendingBlocks).toBe(true);
                write._execute(context, write.in);
            }
            expect(target.value).toBe(0.9);
            expect(scene.animationGroups).toHaveLength(0);
            expect(context.hasPendingBlocks).toBe(false);
            expect(context._getExecutionVariable(play, "_initialized", false)).toBe(false);
            expect(context._getGlobalContextVariable("animationGroupObserverSets", new Map()).size).toBe(0);
            expect(context._getGlobalContextVariable("currentlyRunningAnimationGroups", [])).toEqual([]);
            context._notifyOnTick({ timeSinceStart: iteration, deltaTime: 0.1 });
        }
        expect(tick).not.toHaveBeenCalled();
        expect(done).not.toHaveBeenCalled();
    });

    it("plays each animation on its matching target without reading the single-target input", () => {
        const targets = [
            { value: 0, animations: [] },
            { value: 0, animations: [] },
        ];
        const animations = targets.map((_, index) => {
            const animation = new Animation(`value-${index}`, "value", 60, Animation.ANIMATIONTYPE_FLOAT);
            animation.setKeys([
                { frame: 0, value: 0 },
                { frame: 60, value: index + 1 },
            ]);
            return animation;
        });
        const play = new FlowGraphPlayAnimationBlock();
        play.animation.setValue(animations, context);
        play.animationTargets.setValue(targets, context);
        vi.spyOn(play.object, "getValue").mockImplementation(() => {
            throw new Error("Single target must not be read.");
        });
        play._execute(context);
        const group = play.currentAnimationGroup.getValue(context);
        expect(group.targetedAnimations.map((targeted) => targeted.target)).toEqual(targets);
        group.goToFrame(30);
        expect(targets.map((target) => target.value)).toEqual([0.5, 1]);
        group.goToFrame(60);
        expect(targets.map((target) => target.value)).toEqual([1, 2]);
    });

    it("rejects animation target arrays of the wrong length", () => {
        const animation = new Animation("value", "value", 60, Animation.ANIMATIONTYPE_FLOAT);
        animation.setKeys([
            { frame: 0, value: 0 },
            { frame: 60, value: 1 },
        ]);
        const play = new FlowGraphPlayAnimationBlock();
        play.animation.setValue([animation, animation.clone()], context);
        const target = { value: 0, animations: [] };
        play.animationTargets.setValue([target], context);
        const error = vi.spyOn(play.error, "_activateSignal");
        const out = vi.spyOn(play.out, "_activateSignal");
        play._execute(context);
        expect(error).toHaveBeenCalledOnce();
        expect(out).not.toHaveBeenCalled();
        expect(scene.animationGroups).toHaveLength(0);
        expect(context.hasPendingBlocks).toBe(false);
    });

    it("keeps animation-group targets without reading either target input", () => {
        const target = { value: 0, animations: [] };
        const animation = new Animation("value", "value", 60, Animation.ANIMATIONTYPE_FLOAT);
        animation.setKeys([
            { frame: 0, value: 0 },
            { frame: 60, value: 1 },
        ]);
        const group = new AnimationGroup("provided", scene);
        group.addTargetedAnimation(animation, target);
        const play = new FlowGraphPlayAnimationBlock();
        play.animationGroup.setValue(group, context);
        for (const input of [play.animationTargets, play.object]) {
            vi.spyOn(input, "getValue").mockImplementation(() => {
                throw new Error("Target inputs must not be read for an animation group.");
            });
        }
        play._execute(context);
        expect(play.currentAnimationGroup.getValue(context)).toBe(group);
        group.goToFrame(30);
        expect(target.value).toBe(0.5);
    });

    it("replaces a targeted interpolation when only a non-default target overlaps", () => {
        const targets = [
            { value: 0, animations: [] },
            { value: 0, animations: [] },
        ];
        const firstAnimations = targets.map((_, index) => {
            const animation = new Animation(`first-${index}`, "value", 60, Animation.ANIMATIONTYPE_FLOAT);
            animation.setKeys([
                { frame: 0, value: 0 },
                { frame: 60, value: 1 },
            ]);
            return animation;
        });
        context._setGlobalContextVariable(
            "interpolationAnimations",
            firstAnimations.map((animation) => animation.uniqueId)
        );
        const first = new FlowGraphPlayAnimationBlock();
        first.animation.setValue(firstAnimations, context);
        first.animationTargets.setValue(targets, context);
        const done = vi.spyOn(first.done, "_activateSignal");
        first._execute(context);
        const firstGroup = first.currentAnimationGroup.getValue(context);
        const secondAnimation = firstAnimations[1].clone();
        context._getGlobalContextVariable("interpolationAnimations", []).push(secondAnimation.uniqueId);
        const second = new FlowGraphPlayAnimationBlock();
        second.animation.setValue(secondAnimation, context);
        second.animationTargets.setValue([targets[1]], context);
        second._execute(context);
        expect(scene.animationGroups).not.toContain(firstGroup);
        expect(context._getExecutionVariable(first, "_initialized", false)).toBe(false);
        expect(done).not.toHaveBeenCalled();
        expect(context._getGlobalContextVariable("animationGroupObserverSets", new Map()).size).toBe(1);
        expect(context._getGlobalContextVariable("currentlyRunningAnimationGroups", [])).toEqual([second.currentAnimationGroup.getValue(context).uniqueId]);
    });

    it("applies same-type interpolation metadata conversions with the accessor target", () => {
        const target = { value: 0.2 };
        const getValue = vi.fn((_target, source, offset) => source[offset] * 2);
        const parser = new FlowGraphJsonPointerParserBlock({
            jsonPointer: "/value",
            pathConverter: {
                convert: () => ({
                    object: target,
                    info: {
                        type: "number",
                        get: () => target.value,
                        getTarget: () => target,
                        interpolation: [
                            {
                                type: Animation.ANIMATIONTYPE_FLOAT,
                                name: "value",
                                getValue,
                                getStride: () => 1,
                                buildAnimations: (_target, name, fps, keys) => {
                                    const animation = new Animation(name, "value", fps, Animation.ANIMATIONTYPE_FLOAT);
                                    animation.setKeys(keys);
                                    return [{ babylonAnimatable: target, babylonAnimation: animation }];
                                },
                            },
                        ],
                    },
                }),
            },
        });
        const block = new FlowGraphInterpolationBlock<number>({ duration: 1 });
        block.initialValue.setValue(0.2, context);
        block.endValue.setValue(0.4, context);
        block.customBuildAnimation.connectTo(parser.generateAnimationsFunction);
        block._updateOutputs(context);
        const animations = block.animation.getValue(context);
        if (!Array.isArray(animations)) {
            throw new Error("Expected interpolation animations.");
        }
        expect(animations[0].getKeys()).toEqual([
            { frame: 0, value: 0.4 },
            { frame: 60, value: 0.8 },
        ]);
        expect(getValue).toHaveBeenNthCalledWith(1, target, [0.2], 0, 1);
        expect(getValue).toHaveBeenNthCalledWith(2, target, [0.4], 0, 1);
        expect(parser.propertyName.getValue(context)).toBe("value");
        expect(parser.animationTargets.getValue(context)).toEqual([target]);
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

    it.each([
        [2, 5, [2, 3, 4, 5]],
        [5, 2, [5]],
        [3, 3, [3]],
    ] as const)("notifies the opted-in loop index exactly once per assignment (%s..%s)", (start, end, expected) => {
        const block = new FlowGraphForLoopBlock({ incrementIndexWhenLoopDone: true });
        const notifications: number[] = [];
        block.index.onValueChangedObservable.add((value) => notifications.push(value.value));
        block.startIndex.setValue(start, context);
        block.endIndex.setValue(end, context);
        block._execute(context);
        expect(notifications).toEqual(expected);
        expect(block.index.getValue(context).value).toBe(expected[expected.length - 1]);
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
