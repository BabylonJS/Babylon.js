import { ComputeShader } from "core/Compute/computeShader.pure";
import { afterEach, describe, expect, it, vi } from "vitest";

type TestComputeShader = {
    name: string;
    _effect: {
        getCompilationError: () => string;
        isReady: () => boolean;
    };
};

const createComputeShader = (dispatch: () => boolean, getCompilationError: () => string = () => "", isReady: () => boolean = () => false) => {
    const computeShader = Object.create(ComputeShader.prototype) as ComputeShader;
    const testComputeShader = computeShader as unknown as TestComputeShader;
    testComputeShader.name = "test";
    testComputeShader._effect = { getCompilationError, isReady };
    const dispatchSpy = vi.spyOn(computeShader, "dispatch").mockImplementation(dispatch);

    return { computeShader, dispatchSpy };
};

describe("ComputeShader.dispatchWhenReady", () => {
    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it("resolves after a successful first dispatch", async () => {
        const { computeShader, dispatchSpy } = createComputeShader(() => true);

        await expect(computeShader.dispatchWhenReady(1, 2, 3)).resolves.toBeUndefined();

        expect(dispatchSpy).toHaveBeenCalledExactlyOnceWith(1, 2, 3);
    });

    it("resolves after a successful retry and stops polling", async () => {
        vi.useFakeTimers();
        const { computeShader, dispatchSpy } = createComputeShader(vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true));

        const promise = computeShader.dispatchWhenReady(1, undefined, undefined, 10);
        await vi.advanceTimersByTimeAsync(10);

        await expect(promise).resolves.toBeUndefined();
        expect(dispatchSpy).toHaveBeenCalledTimes(2);
        expect(vi.getTimerCount()).toBe(0);
    });

    it("rejects a compilation error produced by the first dispatch without scheduling retries", async () => {
        vi.useFakeTimers();
        let compilationError = "";
        const { computeShader, dispatchSpy } = createComputeShader(
            () => {
                compilationError = "first compilation failed";
                return false;
            },
            () => compilationError
        );

        await expect(computeShader.dispatchWhenReady(1)).rejects.toThrow("Compute shader 'test' compilation failed: first compilation failed");

        expect(dispatchSpy).toHaveBeenCalledOnce();
        expect(vi.getTimerCount()).toBe(0);
    });

    it("waits for an unready resource when a previous valid pipeline survives a recompile failure", async () => {
        vi.useFakeTimers();
        const { computeShader, dispatchSpy } = createComputeShader(
            vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true),
            () => "existing compilation failed",
            () => true
        );

        const promise = computeShader.dispatchWhenReady(1, undefined, undefined, 10);
        await vi.advanceTimersByTimeAsync(10);

        await expect(promise).resolves.toBeUndefined();
        expect(dispatchSpy).toHaveBeenCalledTimes(2);
        expect(vi.getTimerCount()).toBe(0);
    });

    it("rejects a compilation error discovered while polling and stops polling", async () => {
        vi.useFakeTimers();
        let compilationError = "";
        let dispatchCount = 0;
        const { computeShader, dispatchSpy } = createComputeShader(
            () => {
                dispatchCount++;
                if (dispatchCount === 2) {
                    compilationError = "asynchronous compilation failed";
                }
                return false;
            },
            () => compilationError
        );

        const promise = computeShader.dispatchWhenReady(1, undefined, undefined, 10);
        await Promise.all([expect(promise).rejects.toThrow("Compute shader 'test' compilation failed: asynchronous compilation failed"), vi.advanceTimersByTimeAsync(10)]);
        expect(dispatchSpy).toHaveBeenCalledTimes(2);
        expect(vi.getTimerCount()).toBe(0);
    });

    it("rejects exceptions thrown by a retry and stops polling", async () => {
        vi.useFakeTimers();
        const retryError = new Error("retry failed");
        const { computeShader, dispatchSpy } = createComputeShader(
            vi
                .fn()
                .mockReturnValueOnce(false)
                .mockImplementationOnce(() => {
                    throw retryError;
                })
        );

        const promise = computeShader.dispatchWhenReady(1, undefined, undefined, 10);
        await Promise.all([expect(promise).rejects.toBe(retryError), vi.advanceTimersByTimeAsync(10)]);
        expect(dispatchSpy).toHaveBeenCalledTimes(2);
        expect(vi.getTimerCount()).toBe(0);
    });

    it("rejects when readiness times out and stops polling", async () => {
        vi.useFakeTimers();
        const { computeShader } = createComputeShader(() => false);
        const promise = computeShader.dispatchWhenReady(1, undefined, undefined, 1000);
        await Promise.all([expect(promise).rejects.toThrow("Operation timed out after maximum retries."), vi.advanceTimersByTimeAsync(31000)]);

        expect(vi.getTimerCount()).toBe(0);
    });
});
