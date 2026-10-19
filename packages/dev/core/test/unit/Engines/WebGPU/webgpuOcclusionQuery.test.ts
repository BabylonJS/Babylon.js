import { WebGPUOcclusionQuery } from "core/Engines/WebGPU/webgpuOcclusionQuery";
import { afterEach, describe, expect, it, vi } from "vitest";

interface WebGPUOcclusionQueryInternals {
    _querySet: {
        dispose(): void;
    };
    _delayQuerySetDispose(): void;
}

describe("WebGPUOcclusionQuery", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it("disposes a replaced query set after the delay", () => {
        vi.useFakeTimers();

        const query = Object.create(WebGPUOcclusionQuery.prototype) as WebGPUOcclusionQueryInternals;
        const dispose = vi.fn();
        query._querySet = { dispose };

        query._delayQuerySetDispose();
        expect(dispose).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1000);
        expect(dispose).toHaveBeenCalledOnce();
    });
});
