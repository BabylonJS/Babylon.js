import { type FunctionComponent } from "react";

import { type DropdownOption } from "shared-ui-components/fluent/primitives/dropdown";

import { type GaussianSplattingMesh } from "core/index";

import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";
import { BooleanBadgePropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/booleanBadgePropertyLine";
import { NumberDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { BoundProperty } from "../boundProperty";

const ShDegreeOptions = [
    { label: "None (0)", value: 0 },
    { label: "Degree 1 (3 params)", value: 1 },
    { label: "Degree 2 (8 params)", value: 2 },
    { label: "Degree 3 (15 params)", value: 3 },
] as const satisfies DropdownOption<number>[];

export const GaussianSplattingDisplayProperties: FunctionComponent<{ mesh: GaussianSplattingMesh }> = (props) => {
    const { mesh } = props;

    return (
        <>
            <StringifiedPropertyLine label="Splat Count" value={mesh.splatCount ?? 0} />
            <BoundProperty component={NumberDropdownPropertyLine} label="SH Degree" options={ShDegreeOptions} target={mesh} propertyKey="shDegree" />
            <StringifiedPropertyLine label="Max SH Degree" value={mesh.maxShDegree} />
            <BooleanBadgePropertyLine label="Has Compensation" value={mesh.compensation} />
            <StringifiedPropertyLine label="Kernel Size" value={mesh.kernelSize} />
        </>
    );
};
