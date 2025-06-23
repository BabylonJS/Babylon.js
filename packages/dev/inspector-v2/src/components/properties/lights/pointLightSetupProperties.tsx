// eslint-disable-next-line import/no-internal-modules
import type { PointLight } from "core/index";
import type { FunctionComponent } from "react";

import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/vectorPropertyLine";
import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/colorPropertyLine";
import { useVector3Property, useColor3Property } from "./shadered";

export const PointLightSetupProperties: FunctionComponent<{ context: PointLight }> = ({ context: pointLight }) => {
    const position = useVector3Property(pointLight, "position");
    const direction = useVector3Property(pointLight, "direction");
    const diffuseColor = useColor3Property(pointLight, "diffuse");
    const groundColor = useColor3Property(pointLight, "specular");

    return (
        <>
            <Color3PropertyLine key="LightColor" label="Diffuse" value={diffuseColor} onChange={(val) => (pointLight.diffuse = val)} />
            <Color3PropertyLine key="LightSpecularColor" label="Specular" value={groundColor} onChange={(val) => (pointLight.specular = val)} />
            <Vector3PropertyLine key="LightDirection" label="Direction" value={direction} onChange={(val) => (pointLight.direction = val)} />
            <Vector3PropertyLine key="LightPosition" label="Position" value={position} onChange={(val) => (pointLight.position = val)} />
        </>
    );
};
