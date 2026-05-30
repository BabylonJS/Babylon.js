import { NullEngine } from "core/Engines/nullEngine";
import { describe, expect, it } from "vitest";

type RenderFrameCallback = (timestamp: number) => void;

describe("NullEngine", () => {
    describe("constructor", () => {
        it("returns a NullEngine", () => {
            const nullEngine = new NullEngine();
            expect(nullEngine).toBeInstanceOf(NullEngine);
        });
    });

    describe("Options", () => {
        it("returns a NullEngine with the correct options", () => {
            const nullEngine = new NullEngine({
                renderHeight: 128,
                renderWidth: 256,
                textureSize: 256,
                deterministicLockstep: false,
                lockstepMaxSteps: 1,
            });
            expect(nullEngine.getRenderHeight()).toBe(128);
            expect(nullEngine.getRenderWidth()).toBe(256);
            expect(nullEngine.isDeterministicLockStep()).toBe(false);
            expect(nullEngine.getLockstepMaxSteps()).toBe(1);
        });

        it("supports setting timeStep option", () => {
            const nullEngine = new NullEngine({
                renderHeight: 128,
                renderWidth: 256,
                textureSize: 256,
                deterministicLockstep: true,
                timeStep: 0.5,
                lockstepMaxSteps: 4,
            });
            expect(nullEngine.isDeterministicLockStep()).toBe(true);
            expect(nullEngine.getTimeStep()).toBe(500); // 0.5 seconds in ms
            expect(nullEngine.getLockstepMaxSteps()).toBe(4);
        });
    });

    describe("render loop", () => {
        it("notifies frame observables when driven by a custom animation frame requester", () => {
            const nullEngine = new NullEngine();
            const requestedCallbacks: RenderFrameCallback[] = [];
            const canceledRequestIds: Array<number | undefined> = [];
            let nextRequestId = 41;
            let beginFrameCount = 0;
            let endFrameCount = 0;
            let renderCount = 0;
            const renderLoop = () => {
                renderCount++;
            };

            nullEngine.customAnimationFrameRequester = {
                requestAnimationFrame: (callback: RenderFrameCallback) => {
                    requestedCallbacks.push(callback);
                    return nextRequestId++;
                },
                cancelAnimationFrame: (requestId?: number) => {
                    canceledRequestIds.push(requestId);
                },
            };
            nullEngine.onBeginFrameObservable.add(() => {
                beginFrameCount++;
            });
            nullEngine.onEndFrameObservable.add(() => {
                endFrameCount++;
            });

            try {
                nullEngine.runRenderLoop(renderLoop);

                expect(requestedCallbacks).toHaveLength(1);
                expect(nullEngine._frameHandler).toBe(41);
                expect(nullEngine.customAnimationFrameRequester.requestID).toBe(41);

                requestedCallbacks[0](1000);

                expect(beginFrameCount).toBe(1);
                expect(renderCount).toBe(1);
                expect(endFrameCount).toBe(1);
                expect(requestedCallbacks).toHaveLength(2);
                expect(nullEngine._frameHandler).toBe(42);
                expect(nullEngine.customAnimationFrameRequester.requestID).toBe(42);

                nullEngine.stopRenderLoop(renderLoop);

                expect(canceledRequestIds).toEqual([42]);
                expect(nullEngine._frameHandler).toBe(0);
                expect(nullEngine.customAnimationFrameRequester.requestID).toBeUndefined();
            } finally {
                nullEngine.dispose();
            }
        });
    });
});
