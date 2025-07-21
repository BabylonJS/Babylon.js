import type { RectAreaLight } from "core/index";
import type { FunctionComponent } from "react";

import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";

import { useColor3Property, useVector3Property } from "../../../hooks/compoundPropertyHooks";
import { BoundProperty } from "../boundProperty";

export const AreaLightSetupProperties: FunctionComponent<{ context: RectAreaLight }> = ({ context: areaLight }) => {
    const position = useVector3Property(areaLight, "position");
    const diffuseColor = useColor3Property(areaLight, "diffuse");
    const specularColor = useColor3Property(areaLight, "specular");

    return (
        <>
            <Color3PropertyLine label="Diffuse" value={diffuseColor} onChange={(val) => (areaLight.diffuse = val)} />
            <Color3PropertyLine label="Specular" value={specularColor} onChange={(val) => (areaLight.specular = val)} />
            <Vector3PropertyLine label="Position" value={position} onChange={(val) => (areaLight.position = val)} />
            <BoundProperty component={NumberInputPropertyLine} label="Width" target={areaLight} propertyKey="width" />
            <BoundProperty component={NumberInputPropertyLine} label="Height" target={areaLight} propertyKey="height" />
            <BoundProperty component={NumberInputPropertyLine} label="Intensity" target={areaLight} propertyKey="intensity" />
        </>
    );
};
