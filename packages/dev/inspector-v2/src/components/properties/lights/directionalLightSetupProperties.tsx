// eslint-disable-next-line import/no-internal-modules
import type { DirectionalLight } from "core/index";
import type { FunctionComponent } from "react";

import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/colorPropertyLine";
import { FloatInputPropertyLine } from "shared-ui-components/fluent/hoc/inputPropertyLine";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/vectorPropertyLine";

import { useColor3Property, useProperty, useVector3Property } from "../../../hooks/compoundPropertyHooks";

export const DirectionalLightSetupProperties: FunctionComponent<{ context: DirectionalLight }> = ({ context: directionalLight }) => {
    const position = useVector3Property(directionalLight, "position");
    const direction = useVector3Property(directionalLight, "direction");
    const diffuseColor = useColor3Property(directionalLight, "diffuse");
    const specularColor = useColor3Property(directionalLight, "specular");
    const intensity = useProperty(directionalLight, "intensity");

    return (
        <>
            <Vector3PropertyLine key="LightPosition" label="Position" value={position} onChange={(val) => (directionalLight.position = val)} />
            <Vector3PropertyLine key="LightDirection" label="Direction" value={direction} onChange={(val) => (directionalLight.direction = val)} />
            <Color3PropertyLine key="LightColor" label="Diffuse" value={diffuseColor} onChange={(val) => (directionalLight.diffuse = val)} />
            <Color3PropertyLine key="LightSpecularColor" label="Specular" value={specularColor} onChange={(val) => (directionalLight.specular = val)} />
            <FloatInputPropertyLine label="Intensity" value={intensity} onChange={(value) => (directionalLight.intensity = value)} />
        </>
    );
};
