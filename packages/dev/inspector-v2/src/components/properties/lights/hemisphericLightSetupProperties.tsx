import type { HemisphericLight } from "core/index";
import type { FunctionComponent } from "react";

import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/colorPropertyLine";
import { FloatInputPropertyLine } from "shared-ui-components/fluent/hoc/inputPropertyLine";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/vectorPropertyLine";

import { useColor3Property, useVector3Property } from "../../../hooks/compoundPropertyHooks";
import { BoundProperty } from "../boundProperty";

export const HemisphericLightSetupProperties: FunctionComponent<{ context: HemisphericLight }> = ({ context: hemisphericLight }) => {
    const direction = useVector3Property(hemisphericLight, "direction");
    const diffuseColor = useColor3Property(hemisphericLight, "diffuse");
    const groundColor = useColor3Property(hemisphericLight, "groundColor");

    return (
        <>
            <Vector3PropertyLine label="Direction" value={direction} onChange={(val) => (hemisphericLight.direction = val)} />
            <Color3PropertyLine label="Diffuse" value={diffuseColor} onChange={(val) => (hemisphericLight.diffuse = val)} />
            <Color3PropertyLine label="Ground" value={groundColor} onChange={(val) => (hemisphericLight.groundColor = val)} />
            <BoundProperty component={FloatInputPropertyLine} label="Intensity" target={hemisphericLight} propertyKey="intensity" />
        </>
    );
};
