import { isRenderTaskGpuTimingSupported, VERSION, type EngineContext } from "@babylonjs/lite";
import { makeStyles, tokens } from "@fluentui/react-components";
import { ArrowDownloadRegular } from "@fluentui/react-icons";
import { type ComponentProps, type FunctionComponent, useCallback } from "react";

import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { BooleanBadgePropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/booleanBadgePropertyLine";
import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { MakeLazyComponent } from "shared-ui-components/fluent/primitives/lazyComponent";
import { MessageBar } from "shared-ui-components/fluent/primitives/messageBar";
import { ErrorBoundary } from "shared-ui-components/modularTool/components/errorBoundary";
import { ExtensibleAccordion } from "shared-ui-components/modularTool/components/extensibleAccordion";
import { SidePaneContainer } from "shared-ui-components/modularTool/components/pane";
import { useObservableState } from "shared-ui-components/modularTool/hooks/observableHooks";

import { usePollingObservable } from "../../hooks/pollingHooks";
import { GetLiteCounts, type LiteStatistics } from "../statistics";

const useStyles = makeStyles({
    header: {
        flex: "0 1 auto",
        paddingBottom: tokens.spacingVerticalM,
    },
});

const GpuTimingChart = MakeLazyComponent(async () => (await import("./gpuTimingChart")).GpuTimingChart, {
    spinnerLabel: "Loading GPU timing chart",
});

type EngineStatsProps = {
    /** Engine whose registered rendering contexts are being inspected. */
    context: EngineContext;
};

type PerformanceStatsProps = {
    /** Statistics session shared by the performance and frame-step sections. */
    statistics: LiteStatistics;
};

type LiteStatsPaneProps = ComponentProps<typeof ExtensibleAccordion<EngineContext>>;

/**
 * Lite statistics header and extensible section layout.
 * @param props The engine and extensible accordion configuration.
 * @returns The statistics pane.
 * @internal
 */
export const LiteStatsPane: FunctionComponent<LiteStatsPaneProps> = (props) => {
    const { context: engine } = props;
    const classes = useStyles();
    const polling = usePollingObservable(250);
    const draws = useObservableState(() => engine.drawCallCount, polling);
    return (
        <>
            <SidePaneContainer className={classes.header}>
                <TextPropertyLine label="Version" value={VERSION} description="The Babylon Lite runtime version." />
                <StringifiedPropertyLine label="Draw Calls" value={draws} description="Draw calls in the latest rendered frame, across its selected surfaces." />
            </SidePaneContainer>
            <ExtensibleAccordion {...props} />
        </>
    );
};

/**
 * Counts of registered entities across the inspected engine.
 * @param props The inspected engine.
 * @returns The count property lines.
 * @internal
 */
export const LiteCountStats: FunctionComponent<EngineStatsProps> = (props) => {
    const { context: engine } = props;
    const polling = usePollingObservable(1000);
    const counts = useObservableState(
        useCallback(() => GetLiteCounts(engine), [engine]),
        polling
    );
    return (
        <>
            <StringifiedPropertyLine label="Surfaces" value={counts.surfaces} />
            <StringifiedPropertyLine label="Rendering Contexts" value={counts.contexts} />
            <StringifiedPropertyLine label="Scenes" value={counts.scenes} />
            <StringifiedPropertyLine label="Total Meshes" value={counts.meshes} />
            <StringifiedPropertyLine label="Total Lights" value={counts.lights} />
            <StringifiedPropertyLine label="Scene Materials" value={counts.materials} description="Distinct source materials reachable from registered scenes' meshes." />
            <StringifiedPropertyLine
                label="Scene Textures"
                value={counts.textures}
                description="Distinct texture wrappers reachable from those source materials and material views."
            />
            <StringifiedPropertyLine label="Animation Groups" value={counts.animationGroups} />
            <StringifiedPropertyLine label="Shadow Generators" value={counts.shadowGenerators} />
            <StringifiedPropertyLine label="Text Layers" value={counts.textLayers} />
            <StringifiedPropertyLine label="Sprite Layers" value={counts.spriteLayers} />
        </>
    );
};

/**
 * Opt-in GPU profiling controls and bounded readback history.
 * @param props The statistics session.
 * @returns The performance section.
 * @internal
 */
export const LitePerformanceStats: FunctionComponent<PerformanceStatsProps> = (props) => {
    const { statistics } = props;
    const getElapsedMs = useCallback(() => statistics.elapsedMs, [statistics]);
    const { timing, busy, error } = useObservableState(
        useCallback(() => ({ timing: statistics.timing, busy: statistics.busy, error: statistics.error }), [statistics]),
        statistics.onChanged
    );
    const { samples, applicationOwnsTiming } = statistics;
    const average = samples.length ? samples.reduce((sum, sample) => sum + sample.durationMs, 0) / samples.length : undefined;
    const exportSamples = () => {
        const url = URL.createObjectURL(new Blob([statistics.toCsv()], { type: "text/csv;charset=utf-8" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = "babylon-lite-gpu-samples.csv";
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 0);
    };

    return (
        <>
            <SwitchPropertyLine
                label="Profile GPU Tasks"
                value={timing.enabled}
                disabled={!timing.supported || applicationOwnsTiming || busy}
                onChange={(enabled) => void statistics.setEnabledAsync(enabled)}
                description="Opt in to WebGPU timestamp queries. Inspector stops only profiling it enabled itself."
            />
            <TextPropertyLine label="GPU Timing Status" value={busy ? "Starting / stopping" : timing.status} />
            {applicationOwnsTiming && <MessageBar intent="info" message="GPU task timing is managed by the application; Inspector will not change it." />}
            {timing.status === "unsupported" && <MessageBar intent="info" message="This WebGPU device does not support timestamp queries." />}
            {(error || timing.error) && <MessageBar intent="error" message={error ?? timing.error!} />}
            {timing.status === "available" ? (
                <StringifiedPropertyLine
                    label="GPU Task Span"
                    value={timing.totalDurationMs}
                    precision={2}
                    units="ms"
                    description="Earliest measured task start to latest task end. Overlapping task intervals must not be added together."
                />
            ) : (
                <TextPropertyLine label="GPU Task Span" value="Not available" />
            )}
            {average !== undefined ? (
                <StringifiedPropertyLine
                    label="Sampled GPU Average"
                    value={average}
                    precision={2}
                    units="ms"
                    description="Mean of the retained GPU readbacks, sampled at most four times per second."
                />
            ) : (
                <TextPropertyLine label="Sampled GPU Average" value="Not available" />
            )}
            <StringifiedPropertyLine
                label="Retained Samples"
                value={samples.length}
                description="Latest 120 distinct GPU readbacks. This is not a trace of every rendered frame."
            />
            <ErrorBoundary name="GPU timing chart">
                <GpuTimingChart samples={samples} status={timing.status} getElapsedMs={getElapsedMs} />
            </ErrorBoundary>
            <ButtonLine label="Export GPU Samples to CSV" icon={ArrowDownloadRegular} disabled={!samples.length} onClick={exportSamples} />
            <MessageBar
                intent="info"
                message="Lite does not expose engine FPS or CPU frame-step durations. GPU readbacks lag rendering; draw counts are the latest CPU-side frame count."
            />
        </>
    );
};

/**
 * The latest public per-task GPU durations, in execution order.
 * @param props The statistics session.
 * @returns The GPU task property lines.
 * @internal
 */
export const LiteFrameStepStats: FunctionComponent<PerformanceStatsProps> = (props) => {
    const { statistics } = props;
    const timing = useObservableState(() => statistics.timing, statistics.onChanged);
    return (
        <>
            <TextPropertyLine label="Frame Steps" value="GPU task durations" />
            <StringifiedPropertyLine label="GPU Frame Index" value={timing.frameIndex} />
            <StringifiedPropertyLine label="Dropped Tasks" value={timing.droppedTaskCount} description="Tasks omitted because timestamp query capacity was exceeded." />
            {timing.status === "available" ? (
                timing.tasks.map((task) => (
                    <StringifiedPropertyLine
                        key={task.index}
                        uniqueId={`GpuTask-${task.index}`}
                        label={`${task.index + 1}. ${task.name}`}
                        value={task.durationMs}
                        precision={2}
                        units="ms"
                    />
                ))
            ) : (
                <TextPropertyLine label="GPU Tasks" value="Enable GPU profiling and render a frame to collect timings." />
            )}
        </>
    );
};

/**
 * Public engine and surface information, without accessing private GPU state.
 * @param props The inspected engine.
 * @returns The system information property lines.
 * @internal
 */
export const LiteSystemStats: FunctionComponent<EngineStatsProps> = (props) => {
    const { context: engine } = props;
    const polling = usePollingObservable(1000);
    const surfaces = useObservableState(
        useCallback(
            () => engine.surfaces.map((surface) => ({ width: surface.canvas.width, height: surface.canvas.height, format: surface.format, samples: surface.msaaSamples })),
            [engine]
        ),
        polling
    );
    return (
        <>
            <TextPropertyLine label="Engine" value="Babylon Lite (WebGPU)" />
            <BooleanBadgePropertyLine label="Timestamp Queries" value={isRenderTaskGpuTimingSupported(engine)} />
            <BooleanBadgePropertyLine label="High Precision Matrices" value={engine.useHighPrecisionMatrix} />
            <BooleanBadgePropertyLine label="Floating Origin" value={engine.useFloatingOrigin} />
            {surfaces.map((surface, index) => (
                <TextPropertyLine
                    key={index}
                    uniqueId={`Surface-${index}`}
                    label={index === 0 ? "Primary Surface" : `Surface ${index + 1}`}
                    value={`${surface.width} x ${surface.height}, ${surface.format}, ${surface.samples}x MSAA`}
                />
            ))}
            <MessageBar intent="info" message="This Lite runtime does not expose device limits, other enabled GPU features, or driver information through public APIs." />
        </>
    );
};
