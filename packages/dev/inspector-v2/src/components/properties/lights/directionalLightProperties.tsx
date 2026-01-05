import type { DirectionalLight } from "core/index";
import type { FunctionComponent } from "react";

import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";

import { BoundProperty } from "../boundProperty";

export const DirectionalLightSetupProperties: FunctionComponent<{ context: DirectionalLight }> = ({ context: directionalLight }) => {
    return (
        <>
            <BoundProperty label="Position" component={Vector3PropertyLine} target={directionalLight} propertyKey="position" />
            <BoundProperty label="Direction" component={Vector3PropertyLine} target={directionalLight} propertyKey="direction" />
            <BoundProperty label="Diffuse" component={Color3PropertyLine} target={directionalLight} propertyKey="diffuse" />
            <BoundProperty label="Specular" component={Color3PropertyLine} target={directionalLight} propertyKey="specular" />
            <BoundProperty label="Intensity" component={NumberInputPropertyLine} target={directionalLight} propertyKey="intensity" />
        </>
    );
};
