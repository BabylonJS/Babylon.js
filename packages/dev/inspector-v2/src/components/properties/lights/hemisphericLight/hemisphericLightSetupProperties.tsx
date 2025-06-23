// eslint-disable-next-line import/no-internal-modules
import type { HemisphericLight, Vector3, Color3 } from "core/index";

import type { FunctionComponent } from "react";

import { useInterceptObservable } from "../../../../hooks/instrumentationHooks";
import { useObservableState } from "../../../../hooks/observableHooks";

import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/vectorPropertyLine";
import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/colorPropertyLine";

type Vector3Keys<T> = { [P in keyof T]: T[P] extends Vector3 ? P : never }[keyof T];
type Color3Keys<T> = { [P in keyof T]: T[P] extends Color3 ? P : never }[keyof T];

// This helper hook gets the value of a Vector3 property from a target object and causes the component
// to re-render when the property changes or when the x/y/z components of the Vector3 change.
// eslint-disable-next-line @typescript-eslint/naming-convention
function useVector3Property<T extends object, K extends Vector3Keys<T>>(target: T, propertyKey: K): Vector3 {
    const position = useObservableState(() => target[propertyKey] as Vector3, useInterceptObservable("property", target, propertyKey));
    useObservableState(() => position.x, useInterceptObservable("property", position, "x"));
    useObservableState(() => position.y, useInterceptObservable("property", position, "y"));
    useObservableState(() => position.z, useInterceptObservable("property", position, "z"));
    return position;
}

// This helper hook gets the value of a Vector3 property from a target object and causes the component
// to re-render when the property changes or when the x/y/z components of the Vector3 change.
// eslint-disable-next-line @typescript-eslint/naming-convention
function useColor3Property<T extends object, K extends Color3Keys<T>>(target: T, propertyKey: K): Color3 {
    const position = useObservableState(() => target[propertyKey] as Color3, useInterceptObservable("property", target, propertyKey));
    useObservableState(() => position.r, useInterceptObservable("property", position, "r"));
    useObservableState(() => position.g, useInterceptObservable("property", position, "g"));
    useObservableState(() => position.b, useInterceptObservable("property", position, "b"));
    return position;
}

export const HemisphericLightSetupProperties: FunctionComponent<{ context: HemisphericLight }> = ({ context: hemisphericLight }) => {
    const direction = useVector3Property(hemisphericLight, "direction");
    const diffuseColor = useColor3Property(hemisphericLight, "diffuse");
    const specularColor = useColor3Property(hemisphericLight, "specular");
    const groundColor = useColor3Property(hemisphericLight, "groundColor");

    return (
        <>
            <Vector3PropertyLine key="LightDirection" label="Direction" value={direction} onChange={(val) => (hemisphericLight.direction = val)} />
            <Color3PropertyLine key="LightColor" label="Diffuse" value={diffuseColor} onChange={(val) => (hemisphericLight.diffuse = val)} />
            <Color3PropertyLine key="LightGroundColor" label="Ground" value={groundColor} onChange={(val) => (hemisphericLight.groundColor = val)} />
            <Color3PropertyLine key="LightSpecularColor" label="Specular" value={specularColor} onChange={(val) => (hemisphericLight.specular = val)} />
        </>
    );
};
