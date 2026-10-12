import { type FunctionComponent, useEffect, useState } from "react";

import { type DropdownOption } from "shared-ui-components/fluent/primitives/dropdown";

import { type GaussianSplattingMesh } from "core/index";

import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { BooleanBadgePropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/booleanBadgePropertyLine";
import { NumberDropdownPropertyLine, StringDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { Collapse } from "shared-ui-components/fluent/primitives/collapse";
import { type GaussianSplattingDebugController, type GaussianSplattingDebugMode } from "../../../services/panes/properties/gaussianSplattingDebugController";
import { BoundProperty, ComputedProperty } from "../boundProperty";

const ShDegreeOptions = [
    { label: "None (0)", value: 0 },
    { label: "Degree 1 (3 params)", value: 1 },
    { label: "Degree 2 (8 params)", value: 2 },
    { label: "Degree 3 (15 params)", value: 3 },
] as const satisfies DropdownOption<number>[];

const SplatCountDescription = "Number of padded splat indices currently used for instanced rendering. Updates when a completed depth sort is applied.";
const RenderedSplatCountDescription =
    "Number of source splats in the active LOD ranges selected for rendering. May temporarily differ from Splat Count while depth sorting completes.";
const SplatBudgetDescription = "Resolved maximum number of splats kept resident in the streaming work buffer. Disabled means no residency cap is configured.";
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

const GetSplatCount = (mesh: GaussianSplattingMesh) => mesh.splatCount ?? 0;
const GetRenderedSplatCount = (stream: GaussianSplattingStreamLike) => stream.renderedSplatCount;
const GetResidentSplatBudget = (stream: GaussianSplattingStreamLike) => stream.residentSplatBudget;
const GetLod0SplatCount = (stream: GaussianSplattingStreamLike) => stream.lod0SplatCount;

const SplatBudgetPropertyLine: FunctionComponent<{ value: number }> = (props) => {
    const { value } = props;
    return value > 0 ? (
        <StringifiedPropertyLine label="Splat Budget" description={SplatBudgetDescription} value={value} />
    ) : (
        <TextPropertyLine label="Splat Budget" description={SplatBudgetDescription} value="Disabled (unlimited)" />
    );
};

const Lod0SplatCountPropertyLine: FunctionComponent<{ value: GaussianSplattingStreamLike["lod0SplatCount"] }> = (props) => {
    const { value } = props;
    return value.status === "available" ? (
        <StringifiedPropertyLine label="LOD 0 Splats" description={Lod0SplatCountDescription} value={value.count} />
    ) : (
        <TextPropertyLine label="LOD 0 Splats" description={Lod0SplatCountDescription} value={value.status === "pending" ? "Loading…" : "Unavailable"} />
    );
};

const GaussianSplattingStreamDiagnostics: FunctionComponent<{ stream: GaussianSplattingStreamLike }> = (props) => {
    const { stream } = props;

    return (
        <>
            <ComputedProperty
                component={StringifiedPropertyLine}
                label="Visible Splats"
                description={RenderedSplatCountDescription}
                target={stream}
                getValue={GetRenderedSplatCount}
            />
            <ComputedProperty component={SplatBudgetPropertyLine} target={stream} getValue={GetResidentSplatBudget} />
            <ComputedProperty component={Lod0SplatCountPropertyLine} target={stream} getValue={GetLod0SplatCount} />
        </>
    );
};

const DebugModeOptions: DropdownOption<GaussianSplattingDebugMode>[] = [
    { label: "Normal", value: "normal" },
    { label: "Projected size", value: "size" },
    { label: "Overdraw", value: "overdraw" },
];

type GaussianSplattingDisplayPropertiesProps = {
    /** The selected mesh. */
    mesh: GaussianSplattingMesh;
    /** Owns the temporary debug materials independently of this component. */
    debugController: GaussianSplattingDebugController;
};

/**
 * Displays Gaussian mesh diagnostics and per-mesh debug rendering controls.
 * @param props Selected mesh and Inspector-owned debug controller
 * @returns Gaussian splat property lines
 */
export const GaussianSplattingDisplayProperties: FunctionComponent<GaussianSplattingDisplayPropertiesProps> = (props) => {
    const { mesh, debugController } = props;
    const [mode, setMode] = useState<GaussianSplattingDebugMode>(() => debugController.getMode(mesh));
    useEffect(() => {
        const observer = debugController.onModeChangedObservable.add((changedMesh) => {
            if (changedMesh === mesh) {
                setMode(debugController.getMode(mesh));
            }
        });
        setMode(debugController.getMode(mesh));
        return () => {
            debugController.onModeChangedObservable.remove(observer);
        };
    }, [mesh, debugController]);
    const plugins = debugController.getPlugins(mesh);
    const stream = mesh.getClassName() === "GaussianSplattingStream" ? (mesh as GaussianSplattingStreamLike) : null;

    return (
        <>
            <StringDropdownPropertyLine
                label="Debug Rendering"
                description={
                    debugController.canDebug(mesh)
                        ? "Per-mesh visualization; Normal restores the original material unless it was disposed."
                        : "Unavailable: this mesh uses a non-Gaussian material."
                }
                options={DebugModeOptions}
                value={mode}
                disabled={!debugController.canDebug(mesh)}
                onChange={(value) => {
                    debugController.setMode(mesh, value as GaussianSplattingDebugMode);
                    setMode(debugController.getMode(mesh));
                }}
            />
            <Collapse visible={mode === "size" && !!plugins}>
                {plugins && (
                    <BoundProperty component={SyncedSliderPropertyLine} label="Size Scale (pixels)" target={plugins.size} propertyKey="sizeScale" min={0.5} max={128} step={0.5} />
                )}
            </Collapse>
            <Collapse visible={mode === "overdraw" && !!plugins}>
                {plugins && (
                    <BoundProperty
                        component={SyncedSliderPropertyLine}
                        label="Overdraw Intensity"
                        target={plugins.overdraw}
                        propertyKey="intensity"
                        min={0.001}
                        max={0.25}
                        step={0.001}
                    />
                )}
            </Collapse>
            <ComputedProperty component={StringifiedPropertyLine} label="Splat Count" description={SplatCountDescription} target={mesh} getValue={GetSplatCount} />
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
                convertFrom={(value) => {
                    debugController.setMinPixelSize(mesh, value);
                    return value;
                }}
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
