import type { FunctionComponent } from "react";

import type { GaussianSplattingMesh } from "core/index";

import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";
import { BooleanBadgePropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/booleanBadgePropertyLine";

export const GaussianSplattingDisplayProperties: FunctionComponent<{ mesh: GaussianSplattingMesh }> = (props) => {
    const { mesh } = props;

    return (
        <>
            <StringifiedPropertyLine label="Splat Count" value={mesh.splatCount ?? 0} />
            <StringifiedPropertyLine label="SH Parameter Count" value={(mesh.shDegree + 1) * (mesh.shDegree + 1) - 1} />
            <BooleanBadgePropertyLine label="Has Compensation" value={mesh.compensation} />
            <StringifiedPropertyLine label="Kernel Size" value={mesh.kernelSize} />
        </>
    );
};
