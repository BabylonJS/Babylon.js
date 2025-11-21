import type { HemisphericLight } from "core/index";
import type { FunctionComponent } from "react";

import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";

import { BoundProperty } from "../boundProperty";

export const HemisphericLightSetupProperties: FunctionComponent<{ context: HemisphericLight }> = ({ context: hemisphericLight }) => {
    return (
        <>
            <BoundProperty label="Direction" component={Vector3PropertyLine} target={hemisphericLight} propertyKey="direction" />
            <BoundProperty label="Diffuse" component={Color3PropertyLine} target={hemisphericLight} propertyKey="diffuse" />
            <BoundProperty label="Ground" component={Color3PropertyLine} target={hemisphericLight} propertyKey="groundColor" />
            <BoundProperty label="Intensity" component={NumberInputPropertyLine} target={hemisphericLight} propertyKey="intensity" />
        </>
    );
};
