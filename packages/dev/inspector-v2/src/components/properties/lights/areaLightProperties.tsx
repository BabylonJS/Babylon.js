import type { RectAreaLight } from "core/index";
import type { FunctionComponent } from "react";

import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";

import { BoundProperty } from "../boundProperty";

export const AreaLightSetupProperties: FunctionComponent<{ context: RectAreaLight }> = ({ context: areaLight }) => {
    return (
        <>
            <BoundProperty label="Diffuse" component={Color3PropertyLine} target={areaLight} propertyKey="diffuse" />
            <BoundProperty label="Specular" component={Color3PropertyLine} target={areaLight} propertyKey="specular" />
            <BoundProperty label="Position" component={Vector3PropertyLine} target={areaLight} propertyKey="position" />
            <BoundProperty label="Width" component={NumberInputPropertyLine} target={areaLight} propertyKey="width" />
            <BoundProperty label="Height" component={NumberInputPropertyLine} target={areaLight} propertyKey="height" />
            <BoundProperty label="Intensity" component={NumberInputPropertyLine} target={areaLight} propertyKey="intensity" />
        </>
    );
};
