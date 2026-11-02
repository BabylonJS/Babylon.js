import { type RenderTaskGpuTimings } from "@babylonjs/lite";
import { LineChart, ResponsiveContainer, type ChartProps } from "@fluentui/react-charts";
import { makeStyles, tokens, useAccordionItemContext_unstable } from "@fluentui/react-components";
import { type FunctionComponent, useEffect, useState } from "react";

import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { type GpuTimingSample } from "../statistics";

type GpuTimingChartProps = {
    /** Retained GPU readbacks, with elapsed sample times and measured task spans. */
    samples: readonly GpuTimingSample[];
    /** Current profiler status, used to explain why no samples are available. */
    status: RenderTaskGpuTimings["status"];
    /** Reads the profiling clock without changing the GPU sampling cadence. */
    getElapsedMs: () => number;
};

const EmptyHistoryMessages: Record<RenderTaskGpuTimings["status"], string> = {
    disabled: 'Enable "Profile GPU Tasks" to display GPU history.',
    pending: "Waiting for a completed GPU timing readback.",
    available: "Waiting for the next GPU timing sample.",
    unsupported: "GPU history is unavailable: timestamp queries are unsupported.",
    error: "GPU history is unavailable while GPU timing has an error.",
};

const useStyles = makeStyles({
    chart: {
        // hideTooltip suppresses callouts, but Fluent still handles hover markers and guide lines.
        pointerEvents: "none",
        // ResponsiveContainer drops svgTooltip styles, so style the title backgrounds through the root.
        "& rect:has(+ text)": {
            fill: "transparent",
        },
    },
});

/**
 * Displays sampled GPU task spans in a smoothly scrolling 30-second window.
 * @param props The retained readbacks.
 * @returns A responsive Fluent chart, or an explicit empty state before samples arrive.
 * @internal
 */
export const GpuTimingChart: FunctionComponent<GpuTimingChartProps> = (props) => {
    const { samples, status, getElapsedMs } = props;
    const classes = useStyles();
    const { open } = useAccordionItemContext_unstable();
    const [elapsedMs, setElapsedMs] = useState(getElapsedMs);
    const profiling = (status === "available" || status === "pending") && samples.length > 0;
    const animate = open && profiling;
    useEffect(() => {
        if (!animate) {
            return;
        }
        let frame: number;
        let previousUpdate = -Infinity;
        const update = (timestamp: number) => {
            if (timestamp - previousUpdate >= 1000 / 30) {
                previousUpdate = timestamp;
                setElapsedMs(getElapsedMs());
            }
            frame = requestAnimationFrame(update);
        };
        frame = requestAnimationFrame(update);
        return () => cancelAnimationFrame(frame);
    }, [animate, getElapsedMs]);

    if (!samples.length) {
        return <TextPropertyLine label="GPU History" value={EmptyHistoryMessages[status]} />;
    }

    const lastSampleTime = samples[samples.length - 1].elapsedMs;
    // A new session resets the clock; stopped histories stay anchored to their last readback.
    const currentTime = (profiling ? Math.max(Math.min(elapsedMs, getElapsedMs()), lastSampleTime) : lastSampleTime) / 1000;
    const visibleSamples = samples.filter((sample) => sample.elapsedMs / 1000 >= currentTime - 30);
    if (!visibleSamples.length) {
        return <TextPropertyLine label="GPU History" value="No GPU readbacks in the last 30 seconds." />;
    }
    const durations = visibleSamples.map((sample) => sample.durationMs);
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);
    const padding = Math.max(0.5, (maxDuration - minDuration) * 0.1);
    const data: ChartProps = {
        lineChartData: [
            {
                legend: "GPU task span",
                color: tokens.colorBrandForeground1,
                lineOptions: { curve: "linear" },
                data: visibleSamples.map((sample) => ({
                    x: sample.elapsedMs / 1000 - currentTime,
                    y: sample.durationMs,
                })),
            },
        ],
    };
    return (
        <ResponsiveContainer width="100%" height={220}>
            <LineChart
                data={data}
                styles={{ root: classes.chart }}
                hideLegend
                hideTooltip
                strokeWidth={2}
                xAxisTitle="Relative time (s)"
                yAxisTitle="GPU span (ms)"
                xMinValue={-30}
                xMaxValue={0}
                yMinValue={Math.max(0, minDuration - padding)}
                yMaxValue={maxDuration + padding}
                xAxisTickCount={3}
                yAxisTickCount={3}
                tickValues={[-30, -20, -10, 0]}
                tickFormat=".0f"
                yAxisTickFormat=".1f"
                margins={{ top: 10, bottom: 55, left: 60, right: 20 }}
                // eslint-disable-next-line @typescript-eslint/naming-convention -- ARIA attribute names are hyphenated.
                svgProps={{ role: "img", "aria-label": "Sampled GPU task duration history" }}
            />
        </ResponsiveContainer>
    );
};
