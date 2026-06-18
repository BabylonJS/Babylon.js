import { type FunctionComponent } from "react";

import { type DropdownOption } from "shared-ui-components/fluent/primitives/dropdown";

import { type GaussianSplattingMesh } from "core/index";

import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";
import { BooleanBadgePropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/booleanBadgePropertyLine";
import { NumberDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { BoundProperty } from "../boundProperty";

const ShDegreeOptions = [
    { label: "None (0)", value: 0 },
    { label: "Degree 1 (3 params)", value: 1 },
    { label: "Degree 2 (8 params)", value: 2 },
    { label: "Degree 3 (15 params)", value: 3 },
] as const satisfies DropdownOption<number>[];

// GaussianSplattingStream (from the loaders package) adds a real-time max-detail-LOD cap. Detected by class
// name and accessed structurally so the inspector keeps no dependency on the loaders package.
type GaussianSplattingStreamLike = GaussianSplattingMesh & { maxDetailLod: number; maxLodLevel: number };

export const GaussianSplattingDisplayProperties: FunctionComponent<{ mesh: GaussianSplattingMesh }> = (props) => {
    const { mesh } = props;
    const stream = mesh.getClassName() === "GaussianSplattingStream" ? (mesh as GaussianSplattingStreamLike) : null;

    return (
        <>
            <StringifiedPropertyLine label="Splat Count" value={mesh.splatCount ?? 0} />
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
            )}
        </>
    );
};
