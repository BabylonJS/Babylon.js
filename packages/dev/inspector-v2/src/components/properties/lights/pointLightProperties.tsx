import type { PointLight } from "core/index";
import type { FunctionComponent } from "react";

import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";

import { BoundProperty } from "../boundProperty";

export const PointLightSetupProperties: FunctionComponent<{ context: PointLight }> = ({ context: pointLight }) => {
    return (
        <>
            <BoundProperty label="Diffuse" component={Color3PropertyLine} target={pointLight} propertyKey="diffuse" />
            <BoundProperty label="Specular" component={Color3PropertyLine} target={pointLight} propertyKey="specular" />
            <BoundProperty label="Position" component={Vector3PropertyLine} target={pointLight} propertyKey="position" />
            <BoundProperty label="Intensity" component={NumberInputPropertyLine} target={pointLight} propertyKey="intensity" />
        </>
    );
};
