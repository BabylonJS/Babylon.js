// eslint-disable-next-line import/no-internal-modules
import type { RectAreaLight } from "core/index";
import type { FunctionComponent } from "react";

import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/colorPropertyLine";
import { FloatInputPropertyLine } from "shared-ui-components/fluent/hoc/inputPropertyLine";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/vectorPropertyLine";

import { useColor3Property, useProperty, useVector3Property } from "../../../hooks/compoundPropertyHooks";

export const AreaLightSetupProperties: FunctionComponent<{ context: RectAreaLight }> = ({ context: areaLight }) => {
    const position = useVector3Property(areaLight, "position");
    const diffuseColor = useColor3Property(areaLight, "diffuse");
    const specularColor = useColor3Property(areaLight, "specular");
    const width = useProperty(areaLight, "width");
    const height = useProperty(areaLight, "height");
    const intensity = useProperty(areaLight, "intensity");

    return (
        <>
            <Color3PropertyLine key="LightColor" label="Diffuse" value={diffuseColor} onChange={(val) => (areaLight.diffuse = val)} />
            <Color3PropertyLine key="LightSpecularColor" label="Specular" value={specularColor} onChange={(val) => (areaLight.specular = val)} />
            <Vector3PropertyLine key="LightPosition" label="Position" value={position} onChange={(val) => (areaLight.position = val)} />
            <FloatInputPropertyLine label="Width" value={width} onChange={(value) => (areaLight.width = value)} />
            <FloatInputPropertyLine label="Height" value={height} onChange={(value) => (areaLight.height = value)} />
            <FloatInputPropertyLine label="Intensity" value={intensity} onChange={(value) => (areaLight.intensity = value)} />
        </>
    );
};
