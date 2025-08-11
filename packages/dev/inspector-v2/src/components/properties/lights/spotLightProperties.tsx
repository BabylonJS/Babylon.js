import type { SpotLight } from "core/index";
import type { FunctionComponent } from "react";

import { Tools } from "core/Misc/tools";
import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";

import { useColor3Property, useProperty, useVector3Property } from "../../../hooks/compoundPropertyHooks";

export const SpotLightSetupProperties: FunctionComponent<{ context: SpotLight }> = ({ context: spotLight }) => {
    const position = useVector3Property(spotLight, "position");
    const direction = useVector3Property(spotLight, "direction");
    const diffuseColor = useColor3Property(spotLight, "diffuse");
    const groundColor = useColor3Property(spotLight, "specular");
    const angle = useProperty(spotLight, "angle");
    const innerAngle = useProperty(spotLight, "innerAngle");
    const exponent = useProperty(spotLight, "exponent");

    return (
        <>
            <Color3PropertyLine label="Diffuse" value={diffuseColor} onChange={(val) => (spotLight.diffuse = val)} />
            <Color3PropertyLine label="Specular" value={groundColor} onChange={(val) => (spotLight.specular = val)} />
            <Vector3PropertyLine label="Direction" value={direction} onChange={(val) => (spotLight.direction = val)} />
            <Vector3PropertyLine label="Position" value={position} onChange={(val) => (spotLight.position = val)} />
            <SyncedSliderPropertyLine label="Angle" value={Tools.ToDegrees(angle)} min={0} max={90} step={0.1} onChange={(value) => (spotLight.angle = Tools.ToRadians(value))} />
            <SyncedSliderPropertyLine
                label="Inner Angle"
                value={Tools.ToDegrees(innerAngle)}
                min={0}
                max={90}
                step={0.1}
                onChange={(value) => (spotLight.innerAngle = Tools.ToRadians(value))}
            />
            <NumberInputPropertyLine label="Exponent" value={exponent} onChange={(value) => (spotLight.exponent = value)} />
        </>
    );
};
