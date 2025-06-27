import type { DirectionalLight } from "core/index";
import type { FunctionComponent } from "react";

import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/colorPropertyLine";
import { FloatInputPropertyLine } from "shared-ui-components/fluent/hoc/inputPropertyLine";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/vectorPropertyLine";

import { useColor3Property, useVector3Property } from "../../../hooks/compoundPropertyHooks";
import { BoundProperty } from "../boundProperty";

export const DirectionalLightSetupProperties: FunctionComponent<{ context: DirectionalLight }> = ({ context: directionalLight }) => {
    const position = useVector3Property(directionalLight, "position");
    const direction = useVector3Property(directionalLight, "direction");
    const diffuseColor = useColor3Property(directionalLight, "diffuse");
    const specularColor = useColor3Property(directionalLight, "specular");

    return (
        <>
            <Vector3PropertyLine label="Position" value={position} onChange={(val) => (directionalLight.position = val)} />
            <Vector3PropertyLine label="Direction" value={direction} onChange={(val) => (directionalLight.direction = val)} />
            <Color3PropertyLine label="Diffuse" value={diffuseColor} onChange={(val) => (directionalLight.diffuse = val)} />
            <Color3PropertyLine label="Specular" value={specularColor} onChange={(val) => (directionalLight.specular = val)} />
            <BoundProperty component={FloatInputPropertyLine} label="Intensity" target={directionalLight} propertyKey="intensity" />
        </>
    );
};
