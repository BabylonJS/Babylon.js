import type { SpotLight } from "core/index";
import type { FunctionComponent } from "react";

import { Tools } from "core/Misc/tools";
import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";

import { BoundProperty } from "../boundProperty";

export const SpotLightSetupProperties: FunctionComponent<{ context: SpotLight }> = ({ context: spotLight }) => {
    return (
        <>
            <BoundProperty label="Diffuse" component={Color3PropertyLine} target={spotLight} propertyKey="diffuse" />
            <BoundProperty label="Specular" component={Color3PropertyLine} target={spotLight} propertyKey="specular" />
            <BoundProperty label="Direction" component={Vector3PropertyLine} target={spotLight} propertyKey="direction" />
            <BoundProperty label="Position" component={Vector3PropertyLine} target={spotLight} propertyKey="position" />
            <BoundProperty
                label="Angle"
                component={SyncedSliderPropertyLine}
                target={spotLight}
                propertyKey="angle"
                convertTo={Tools.ToDegrees}
                convertFrom={Tools.ToRadians}
                min={0}
                max={90}
                step={0.1}
            />
            <BoundProperty
                label="InnerAngle"
                component={SyncedSliderPropertyLine}
                target={spotLight}
                propertyKey="innerAngle"
                convertTo={Tools.ToDegrees}
                convertFrom={Tools.ToRadians}
                min={0}
                max={90}
                step={0.1}
            />
            <BoundProperty label="Intensity" component={NumberInputPropertyLine} target={spotLight} propertyKey="intensity" />
            <BoundProperty label="Exponent" component={NumberInputPropertyLine} target={spotLight} propertyKey="exponent" />
        </>
    );
};
