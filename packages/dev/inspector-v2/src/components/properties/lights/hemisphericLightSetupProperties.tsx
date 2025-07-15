import type { HemisphericLight } from "core/index";
import type { FunctionComponent } from "react";

import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";

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
            <BoundProperty component={NumberInputPropertyLine} label="Intensity" target={hemisphericLight} propertyKey="intensity" />
        </>
    );
};
