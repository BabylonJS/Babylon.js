// eslint-disable-next-line import/no-internal-modules
import type { PointLight } from "core/index";
import type { FunctionComponent } from "react";

import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/colorPropertyLine";
import { FloatInputPropertyLine } from "shared-ui-components/fluent/hoc/inputPropertyLine";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/vectorPropertyLine";

import { useColor3Property, useVector3Property } from "../../../hooks/compoundPropertyHooks";
import { BoundProperty } from "../boundProperty";

export const PointLightSetupProperties: FunctionComponent<{ context: PointLight }> = ({ context: pointLight }) => {
    const position = useVector3Property(pointLight, "position");
    const diffuseColor = useColor3Property(pointLight, "diffuse");
    const groundColor = useColor3Property(pointLight, "specular");

    return (
        <>
            <Color3PropertyLine label="Diffuse" value={diffuseColor} onChange={(val) => (pointLight.diffuse = val)} />
            <Color3PropertyLine label="Specular" value={groundColor} onChange={(val) => (pointLight.specular = val)} />
            <Vector3PropertyLine label="Position" value={position} onChange={(val) => (pointLight.position = val)} />
            <BoundProperty component={FloatInputPropertyLine} label="Intensity" target={pointLight} propertyKey="intensity" />
        </>
    );
};
