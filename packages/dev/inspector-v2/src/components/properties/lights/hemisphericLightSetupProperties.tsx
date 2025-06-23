// eslint-disable-next-line import/no-internal-modules
import type { HemisphericLight } from "core/index";
import type { FunctionComponent } from "react";

import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/vectorPropertyLine";
import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/colorPropertyLine";
import { FloatInputPropertyLine } from "shared-ui-components/fluent/hoc/inputPropertyLine";

import { useInterceptObservable } from "../../../hooks/instrumentationHooks";
import { useObservableState } from "../../../hooks/observableHooks";
import { useVector3Property, useColor3Property } from "../shadered";

export const HemisphericLightSetupProperties: FunctionComponent<{ context: HemisphericLight }> = ({ context: hemisphericLight }) => {
    const direction = useVector3Property(hemisphericLight, "direction");
    const diffuseColor = useColor3Property(hemisphericLight, "diffuse");
    const groundColor = useColor3Property(hemisphericLight, "groundColor");
    const intensity = useObservableState(() => hemisphericLight.intensity, useInterceptObservable("property", hemisphericLight, "intensity"));

    return (
        <>
            <Vector3PropertyLine key="LightDirection" label="Direction" value={direction} onChange={(val) => (hemisphericLight.direction = val)} />
            <Color3PropertyLine key="LightColor" label="Diffuse" value={diffuseColor} onChange={(val) => (hemisphericLight.diffuse = val)} />
            <Color3PropertyLine key="LightGroundColor" label="Ground" value={groundColor} onChange={(val) => (hemisphericLight.groundColor = val)} />
            <FloatInputPropertyLine label="Intensity" value={intensity} onChange={(value) => (hemisphericLight.intensity = value)} />
        </>
    );
};
