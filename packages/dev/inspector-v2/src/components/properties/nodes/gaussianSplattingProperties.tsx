import { type FunctionComponent, useCallback } from "react";

import { type DropdownOption } from "shared-ui-components/fluent/primitives/dropdown";
import { useObservableState } from "shared-ui-components/modularTool/hooks/observableHooks";

import { type GaussianSplattingMesh } from "core/index";

import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { BooleanBadgePropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/booleanBadgePropertyLine";
import { NumberDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { BoundProperty } from "../boundProperty";
import { usePollingObservable } from "../../../hooks/pollingHooks";

const ShDegreeOptions = [
    { label: "None (0)", value: 0 },
    { label: "Degree 1 (3 params)", value: 1 },
    { label: "Degree 2 (8 params)", value: 2 },
    { label: "Degree 3 (15 params)", value: 3 },
] as const satisfies DropdownOption<number>[];

const SplatCountDescription = "Number of padded splat indices currently used for instanced rendering. Updates when a completed depth sort is applied.";
const RenderedSplatCountDescription =
    "Number of source splats in the active LOD ranges selected for rendering. May temporarily differ from Splat Count while depth sorting completes.";
const Lod0SplatCountDescription = "Total number of splats in the stream's finest-detail (LOD 0) source data.";

// GaussianSplattingStream (from the loaders package) adds a real-time max-detail-LOD cap. Detected by class
// name and accessed structurally so the inspector keeps no dependency on the loaders package.
type GaussianSplattingStreamLike = GaussianSplattingMesh & {
    maxDetailLod: number;
    maxLodLevel: number;
    renderedSplatCount: number;
    residentSplatBudget: number;
    lod0SplatCount: { status: "pending" } | { status: "available"; count: number } | { status: "unavailable" };
};

const GaussianSplattingStreamDiagnostics: FunctionComponent<{ stream: GaussianSplattingStreamLike }> = (props) => {
    const { stream } = props;
    const tickObservable = usePollingObservable(100);
    const visibleSplatCount = useObservableState(
        useCallback(() => stream.renderedSplatCount, [stream]),
        tickObservable
    );
    const residentSplatBudget = useObservableState(
        useCallback(() => stream.residentSplatBudget, [stream]),
        tickObservable
    );
    const lod0SplatCount = useObservableState(
        useCallback(() => stream.lod0SplatCount, [stream]),
        tickObservable
    );

    return (
        <>
            <StringifiedPropertyLine label="Visible Splats" description={RenderedSplatCountDescription} value={visibleSplatCount} />
            {residentSplatBudget > 0 ? (
                <StringifiedPropertyLine label="Splat Budget" value={residentSplatBudget} />
            ) : (
                <TextPropertyLine label="Splat Budget" value="Disabled (unlimited)" />
            )}
            {lod0SplatCount.status === "available" ? (
                <StringifiedPropertyLine label="LOD 0 Splats" description={Lod0SplatCountDescription} value={lod0SplatCount.count} />
            ) : (
                <TextPropertyLine label="LOD 0 Splats" description={Lod0SplatCountDescription} value={lod0SplatCount.status === "pending" ? "Loading…" : "Unavailable"} />
            )}
        </>
    );
};

export const GaussianSplattingDisplayProperties: FunctionComponent<{ mesh: GaussianSplattingMesh }> = (props) => {
    const { mesh } = props;
    const tickObservable = usePollingObservable(100);
    const splatCount = useObservableState(
        useCallback(() => mesh.splatCount ?? 0, [mesh]),
        tickObservable
    );
    const stream = mesh.getClassName() === "GaussianSplattingStream" ? (mesh as GaussianSplattingStreamLike) : null;

    return (
        <>
            <StringifiedPropertyLine label="Splat Count" description={SplatCountDescription} value={splatCount} />
            <BoundProperty component={NumberDropdownPropertyLine} label="SH Degree" options={ShDegreeOptions} target={mesh} propertyKey="shDegree" />
            <StringifiedPropertyLine label="Max SH Degree" value={mesh.maxShDegree} />
            <BooleanBadgePropertyLine label="Has Compensation" value={mesh.compensation} />
            <StringifiedPropertyLine label="Kernel Size" value={mesh.kernelSize} />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Min Pixel Size"
                description="Discard splats projected smaller than this many pixels. 0 = disabled."
                target={mesh}
                propertyKey="minPixelSize"
                min={0}
                max={20}
                step={0.5}
            />
            {stream && (
                <>
                    <GaussianSplattingStreamDiagnostics stream={stream} />
                    <BoundProperty
                        component={SyncedSliderPropertyLine}
                        label="Max Detail LOD"
                        description="Finest LOD level any node may render. 0 = full detail; higher values force a coarser maximum detail."
                        target={stream}
                        propertyKey="maxDetailLod"
                        min={0}
                        max={stream.maxLodLevel}
                        step={1}
                    />
                </>
            )}
        </>
    );
};
