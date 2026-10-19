/**
 * @vitest-environment jsdom
 */

import { type RenderTaskGpuTimings } from "@babylonjs/lite";
import { type LineChartProps } from "@fluentui/react-charts";
import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { Chart } = vi.hoisted(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    return { Chart: vi.fn<(props: LineChartProps) => null>(() => null) };
});

vi.mock("@fluentui/react-charts", () => ({
    LineChart: Chart,
    ResponsiveContainer: (props: { children: ReactNode }) => props.children,
}));

vi.mock("shared-ui-components/fluent/hoc/propertyLines/textPropertyLine", () => ({
    TextPropertyLine: (props: { value: string }) => props.value,
}));

import { GpuTimingChart } from "../../src/lite/components/gpuTimingChart";
import { type GpuTimingSample } from "../../src/lite/statistics";

describe("Lite GPU timing chart", () => {
    const unmounts: (() => void)[] = [];
    const frames = new Map<number, FrameRequestCallback>();
    let nextFrame = 0;

    beforeEach(() => {
        vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
        vi.stubGlobal(
            "requestAnimationFrame",
            vi.fn((callback: FrameRequestCallback) => {
                const id = ++nextFrame;
                frames.set(id, callback);
                return id;
            })
        );
        vi.stubGlobal(
            "cancelAnimationFrame",
            vi.fn((id: number) => frames.delete(id))
        );
    });

    afterEach(() => {
        act(() => unmounts.splice(0).forEach((unmount) => unmount()));
        document.body.replaceChildren();
        vi.clearAllMocks();
        vi.unstubAllGlobals();
        frames.clear();
    });

    function Render(samples: GpuTimingSample[], status: RenderTaskGpuTimings["status"] = "available", getElapsedMs = () => samples.at(-1)?.elapsedMs ?? 0) {
        const container = document.createElement("div");
        document.body.appendChild(container);
        const root = createRoot(container);
        act(() => root.render(<GpuTimingChart samples={samples} status={status} getElapsedMs={getElapsedMs} />));
        unmounts.push(() => root.unmount());
        return root;
    }

    function AdvanceFrame(timestamp: number) {
        const callbacks = [...frames.values()];
        frames.clear();
        act(() => callbacks.forEach((callback) => callback(timestamp)));
    }

    it("plots actual elapsed seconds and GPU spans without normalizing sample spacing", () => {
        Render([
            { elapsedMs: 250, frameIndex: 1, durationMs: 0, latestDrawCalls: 7 },
            { elapsedMs: 1250, frameIndex: 4, durationMs: 2.75, latestDrawCalls: 8 },
        ]);
        const props = Chart.mock.lastCall![0];
        expect(props.xAxisTitle).toBe("Relative time (s)");
        expect(props.yAxisTitle).toBe("GPU span (ms)");
        expect(props.xMinValue).toBe(-30);
        expect(props.xMaxValue).toBe(0);
        expect(props.yMinValue).toBe(0);
        expect(props.yMaxValue).toBe(3.25);
        expect(props.hideTooltip).toBe(true);
        expect(props.strokeWidth).toBe(2);
        expect(props.data.lineChartData?.[0].lineOptions?.curve).toBe("linear");
        expect(props.data.lineChartData?.[0].data).toEqual([
            { x: -1, y: 0 },
            { x: 0, y: 2.75 },
        ]);
    });

    it("keeps nondegenerate axes for a single zero-duration sample", () => {
        Render([{ elapsedMs: 250, frameIndex: 1, durationMs: 0, latestDrawCalls: 7 }]);
        expect(Chart.mock.lastCall![0]).toMatchObject({ xMinValue: -30, xMaxValue: 0, yMinValue: 0, yMaxValue: 0.5 });
    });

    it("refreshes the plotted data when the bounded history array is updated in place", () => {
        const samples = [{ elapsedMs: 250, frameIndex: 1, durationMs: 1, latestDrawCalls: 7 }];
        const root = Render(samples);
        samples.push({ elapsedMs: 750, frameIndex: 2, durationMs: 3, latestDrawCalls: 9 });
        act(() => root.render(<GpuTimingChart samples={samples} status="available" getElapsedMs={() => samples.at(-1)!.elapsedMs} />));
        expect(Chart.mock.lastCall![0].data.lineChartData?.[0].data).toHaveLength(2);
        expect(Chart.mock.lastCall![0]).toMatchObject({ yMinValue: 0.5, yMaxValue: 3.5 });
    });

    it.each([
        { durations: [40, 42], min: 39.5, max: 42.5 },
        { durations: [10, 20], min: 9, max: 21 },
        { durations: [40], min: 39.5, max: 40.5 },
        { durations: [40, 40], min: 39.5, max: 40.5 },
        { durations: [0, 0], min: 0, max: 0.5 },
        { durations: [0, 100], min: 0, max: 110 },
        { durations: [0.01, 0.02], min: 0, max: 0.52 },
    ])("fits both Y bounds to $durations with padding and no negative durations", ({ durations, min, max }) => {
        Render(durations.map((durationMs, index) => ({ elapsedMs: index * 250, frameIndex: index + 1, durationMs, latestDrawCalls: 7 })));
        const props = Chart.mock.lastCall![0];
        expect(props.yMinValue).toBeCloseTo(min);
        expect(props.yMaxValue).toBeCloseTo(max);
        expect(props.yMaxValue! - props.yMinValue!).toBeGreaterThan(0);
    });

    it("ignores expired low and high samples when fitting the Y-axis", () => {
        Render(
            [
                { elapsedMs: 0, frameIndex: 1, durationMs: 0, latestDrawCalls: 7 },
                { elapsedMs: 250, frameIndex: 2, durationMs: 1000, latestDrawCalls: 7 },
                { elapsedMs: 31000, frameIndex: 3, durationMs: 40, latestDrawCalls: 7 },
                { elapsedMs: 31250, frameIndex: 4, durationMs: 42, latestDrawCalls: 7 },
            ],
            "available",
            () => 31250
        );
        expect(Chart.mock.lastCall![0]).toMatchObject({ yMinValue: 39.5, yMaxValue: 42.5 });
    });

    it("moves between readbacks without changing the fixed time window and caps display updates at 30 Hz", () => {
        let elapsedMs = 1000;
        Render([{ elapsedMs: 1000, frameIndex: 1, durationMs: 1, latestDrawCalls: 7 }], "available", () => elapsedMs);
        elapsedMs = 1016;
        AdvanceFrame(16);
        expect(Chart.mock.lastCall![0].data.lineChartData?.[0].data[0].x).toBeCloseTo(-0.016);
        const renderCount = Chart.mock.calls.length;
        elapsedMs = 1032;
        AdvanceFrame(32);
        expect(Chart.mock.calls).toHaveLength(renderCount);
        elapsedMs = 1050;
        AdvanceFrame(50);
        expect(Chart.mock.lastCall![0].data.lineChartData?.[0].data[0].x).toBeCloseTo(-0.05);
        expect(Chart.mock.lastCall![0]).toMatchObject({ xMinValue: -30, xMaxValue: 0 });
    });

    it("drops samples outside the visible window without expanding the axis", () => {
        Render(
            [
                { elapsedMs: 250, frameIndex: 1, durationMs: 1, latestDrawCalls: 7 },
                { elapsedMs: 31000, frameIndex: 2, durationMs: 2, latestDrawCalls: 8 },
            ],
            "available",
            () => 31000
        );
        expect(Chart.mock.lastCall![0].data.lineChartData?.[0].data).toEqual([{ x: 0, y: 2 }]);
        expect(Chart.mock.lastCall![0]).toMatchObject({ xMinValue: -30, xMaxValue: 0 });
    });

    it("stops animation when profiling stops and cancels the pending frame on unmount", () => {
        const samples = [{ elapsedMs: 1000, frameIndex: 1, durationMs: 1, latestDrawCalls: 7 }];
        const getElapsedMs = () => 1000;
        const root = Render(samples, "available", getElapsedMs);
        expect(frames.size).toBe(1);
        act(() => root.render(<GpuTimingChart samples={samples} status="disabled" getElapsedMs={getElapsedMs} />));
        expect(frames.size).toBe(0);
        act(() => root.render(<GpuTimingChart samples={samples} status="available" getElapsedMs={getElapsedMs} />));
        expect(frames.size).toBe(1);
        act(() => unmounts.pop()!());
        expect(frames.size).toBe(0);
    });

    it("preserves a stopped history when remounted after its wall-clock window has passed", () => {
        Render([{ elapsedMs: 1000, frameIndex: 1, durationMs: 1, latestDrawCalls: 7 }], "disabled", () => 65000);
        expect(Chart.mock.lastCall![0].data.lineChartData?.[0].data).toEqual([{ x: 0, y: 1 }]);
        expect(frames.size).toBe(0);
    });

    it("explains a stale history instead of rendering an empty Fluent chart", () => {
        Render([{ elapsedMs: 1000, frameIndex: 1, durationMs: 1, latestDrawCalls: 7 }], "available", () => 65000);
        expect(document.body.textContent).toBe("No GPU readbacks in the last 30 seconds.");
        expect(Chart).not.toHaveBeenCalled();
    });

    it("uses the reset profiling clock when a new session begins", () => {
        let elapsedMs = 65000;
        const samples = [{ elapsedMs, frameIndex: 10, durationMs: 1, latestDrawCalls: 7 }];
        const getElapsedMs = () => elapsedMs;
        const root = Render(samples, "available", getElapsedMs);
        samples.length = 0;
        elapsedMs = 0;
        act(() => root.render(<GpuTimingChart samples={samples} status="pending" getElapsedMs={getElapsedMs} />));
        samples.push({ elapsedMs: 250, frameIndex: 1, durationMs: 2, latestDrawCalls: 8 });
        elapsedMs = 250;
        act(() => root.render(<GpuTimingChart samples={samples} status="available" getElapsedMs={getElapsedMs} />));
        expect(Chart.mock.lastCall![0].data.lineChartData?.[0].data).toEqual([{ x: 0, y: 2 }]);
    });

    it.each([
        ["disabled", 'Enable "Profile GPU Tasks" to display GPU history.'],
        ["pending", "Waiting for a completed GPU timing readback."],
        ["unsupported", "GPU history is unavailable: timestamp queries are unsupported."],
        ["error", "GPU history is unavailable while GPU timing has an error."],
    ] as const)("explains the empty history when profiling is %s", (status, message) => {
        Render([], status);
        expect(document.body.textContent).toBe(message);
        expect(Chart).not.toHaveBeenCalled();
        expect(frames.size).toBe(0);
    });
});
