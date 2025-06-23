// eslint-disable-next-line import/no-internal-modules
import type { RectAreaLight } from "core/index";
import type { FunctionComponent } from "react";

import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/vectorPropertyLine";
import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/colorPropertyLine";
import { FloatInputPropertyLine } from "shared-ui-components/fluent/hoc/inputPropertyLine";
import { useVector3Property, useColor3Property } from "../shadered";

import { useInterceptObservable } from "../../../hooks/instrumentationHooks";
import { useObservableState } from "../../../hooks/observableHooks";

export const AreaLightSetupProperties: FunctionComponent<{ context: RectAreaLight }> = ({ context: areaLight }) => {
    const position = useVector3Property(areaLight, "position");
    const diffuseColor = useColor3Property(areaLight, "diffuse");
    const specularColor = useColor3Property(areaLight, "specular");
    const width = useObservableState(() => areaLight.width, useInterceptObservable("property", areaLight, "width"));
    const height = useObservableState(() => areaLight.height, useInterceptObservable("property", areaLight, "height"));
    const intensity = useObservableState(() => areaLight.intensity, useInterceptObservable("property", areaLight, "intensity"));
    return (
        <>
            <Color3PropertyLine key="LightColor" label="Diffuse" value={diffuseColor} onChange={(val) => (areaLight.diffuse = val)} />
            <Color3PropertyLine key="LightSpecularColor" label="Specular" value={specularColor} onChange={(val) => (areaLight.specular = val)} />
            <Vector3PropertyLine key="LightPosition" label="Position" value={position} onChange={(val) => (areaLight.position = val)} />
            <FloatInputPropertyLine label="Width" value={width} onChange={(value) => (areaLight.width = value)} />
            <FloatInputPropertyLine label="Height" value={height} onChange={(value) => (areaLight.height = value)} />
            <FloatInputPropertyLine label="Intensity" value={intensity} onChange={(value) => (areaLight.intensity = value)} />
        </>
    );
};
