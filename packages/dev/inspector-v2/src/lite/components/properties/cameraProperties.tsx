import { type ArcRotateCamera, type Camera, type FreeCamera, type Vec3 } from "@babylonjs/lite";
import { type FunctionComponent } from "react";

import { NumberInputPropertyLine, TextInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";

import { BoundProperty, DerivedProperty } from "../../../components/properties/boundProperty";
import { useAngleConverters } from "../../../hooks/settingsHooks";
import { SetVector3Value } from "../../sceneEntityUtils";
import { Vector3PropertyLine } from "shared-ui-components/lite/fluent/hoc/propertyLines/vectorPropertyLine";

function GetPosition(camera: FreeCamera): readonly [number, number, number] {
    return [camera.position.x, camera.position.y, camera.position.z];
}

function GetTarget(camera: ArcRotateCamera | FreeCamera): readonly [number, number, number] {
    return [camera.target.x, camera.target.y, camera.target.z];
}

function SetFreeCameraPosition(camera: FreeCamera, value: Vec3 | readonly [number, number, number]): void {
    SetVector3Value(camera.position, value);
}

function SetCameraTarget(camera: ArcRotateCamera | FreeCamera, value: Vec3 | readonly [number, number, number]): void {
    SetVector3Value(camera.target, value);
}

export const CameraGeneralProperties: FunctionComponent<{ camera: Camera }> = (props) => {
    const { camera } = props;
    const [toDisplayAngle, fromDisplayAngle, useDegrees] = useAngleConverters();

    return (
        <>
            <BoundProperty component={TextInputPropertyLine} label="Name" target={camera} propertyKey="name" ignoreNullable defaultValue="" />
            <BoundProperty component={NumberInputPropertyLine} label="Near Plane" target={camera} propertyKey="nearPlane" />
            <BoundProperty component={NumberInputPropertyLine} label="Far Plane" target={camera} propertyKey="farPlane" />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="FOV"
                target={camera}
                propertyKey="fov"
                min={toDisplayAngle(0.1)}
                max={toDisplayAngle(Math.PI)}
                step={toDisplayAngle(0.01)}
                unit={useDegrees ? "°" : "rad"}
                convertTo={toDisplayAngle}
                convertFrom={fromDisplayAngle}
            />
        </>
    );
};

export const FreeCameraTransformProperties: FunctionComponent<{ camera: FreeCamera }> = (props) => {
    const { camera } = props;

    return (
        <>
            <DerivedProperty component={Vector3PropertyLine} label="Position" target={camera} getValue={GetPosition} setValue={SetFreeCameraPosition} />
            <DerivedProperty component={Vector3PropertyLine} label="Target" target={camera} getValue={GetTarget} setValue={SetCameraTarget} />
            <BoundProperty component={NumberInputPropertyLine} label="Speed" target={camera} propertyKey="speed" />
            <BoundProperty component={NumberInputPropertyLine} label="Inertia" target={camera} propertyKey="inertia" min={0} max={1} />
        </>
    );
};

export const ArcRotateCameraTransformProperties: FunctionComponent<{ camera: ArcRotateCamera }> = (props) => {
    const { camera } = props;
    const [toDisplayAngle, fromDisplayAngle, useDegrees] = useAngleConverters();

    return (
        <>
            <DerivedProperty component={Vector3PropertyLine} label="Target" target={camera} getValue={GetTarget} setValue={SetCameraTarget} />
            <BoundProperty
                component={NumberInputPropertyLine}
                label="Alpha"
                target={camera}
                propertyKey="alpha"
                unit={useDegrees ? "°" : "rad"}
                convertTo={toDisplayAngle}
                convertFrom={fromDisplayAngle}
            />
            <BoundProperty
                component={NumberInputPropertyLine}
                label="Beta"
                target={camera}
                propertyKey="beta"
                unit={useDegrees ? "°" : "rad"}
                convertTo={toDisplayAngle}
                convertFrom={fromDisplayAngle}
            />
            <BoundProperty component={NumberInputPropertyLine} label="Radius" target={camera} propertyKey="radius" min={0} />
            <BoundProperty component={NumberInputPropertyLine} label="Inertia" target={camera} propertyKey="inertia" min={0} max={1} />
        </>
    );
};
