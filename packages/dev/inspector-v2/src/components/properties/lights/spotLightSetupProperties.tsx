// eslint-disable-next-line import/no-internal-modules
import { type SpotLight, Tools } from "core/index";
import type { FunctionComponent } from "react";

import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/vectorPropertyLine";
import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/colorPropertyLine";
import { SyncedSliderLine } from "shared-ui-components/fluent/hoc/syncedSliderLine";
import { FloatInputPropertyLine } from "shared-ui-components/fluent/hoc/inputPropertyLine";
import { useVector3Property, useColor3Property } from "../observableUtils";

import { useInterceptObservable } from "../../../hooks/instrumentationHooks";
import { useObservableState } from "../../../hooks/observableHooks";

export const SpotLightSetupProperties: FunctionComponent<{ context: SpotLight }> = ({ context: spotLight }) => {
    const position = useVector3Property(spotLight, "position");
    const direction = useVector3Property(spotLight, "direction");
    const diffuseColor = useColor3Property(spotLight, "diffuse");
    const groundColor = useColor3Property(spotLight, "specular");
    const angle = useObservableState(() => spotLight.angle, useInterceptObservable("property", spotLight, "angle"));
    const innerAngle = useObservableState(() => spotLight.innerAngle, useInterceptObservable("property", spotLight, "innerAngle"));
    const exponent = useObservableState(() => spotLight.exponent, useInterceptObservable("property", spotLight, "exponent"));

    return (
        <>
            <Color3PropertyLine key="LightColor" label="Diffuse" value={diffuseColor} onChange={(val) => (spotLight.diffuse = val)} />
            <Color3PropertyLine key="LightSpecularColor" label="Specular" value={groundColor} onChange={(val) => (spotLight.specular = val)} />
            <Vector3PropertyLine key="LightDirection" label="Direction" value={direction} onChange={(val) => (spotLight.direction = val)} />
            <Vector3PropertyLine key="LightPosition" label="Position" value={position} onChange={(val) => (spotLight.position = val)} />
            <SyncedSliderLine label="Angle" value={Tools.ToDegrees(angle)} min={0} max={90} step={0.1} onChange={(value) => (spotLight.angle = Tools.ToRadians(value))} />
            <SyncedSliderLine
                label="Inner Angle"
                value={Tools.ToDegrees(innerAngle)}
                min={0}
                max={90}
                step={0.1}
                onChange={(value) => (spotLight.innerAngle = Tools.ToRadians(value))}
            />
            <FloatInputPropertyLine label="Exponent" value={exponent} onChange={(value) => (spotLight.exponent = value)} />
        </>
    );
};
