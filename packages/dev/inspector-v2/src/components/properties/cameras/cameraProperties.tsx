import type { FunctionComponent } from "react";

import type { DropdownOption } from "shared-ui-components/fluent/primitives/dropdown";

import { Camera } from "core/Cameras/camera";
import { Collapse } from "shared-ui-components/fluent/primitives/collapse";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { BoundProperty } from "../boundProperty";
import { NumberDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { useAngleConverters } from "../../../hooks/settingsHooks";
import { HexPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/hexPropertyLine";

const CameraModes = [
    { label: "Perspective", value: Camera.PERSPECTIVE_CAMERA },
    { label: "Orthographic", value: Camera.ORTHOGRAPHIC_CAMERA },
] as const satisfies DropdownOption<number>[];

/**
 * The general properties component for a camera.
 * @param props - The component props containing the camera and settings context.
 * @returns JSX.Element
 */
export const CameraGeneralProperties: FunctionComponent<{ camera: Camera }> = (props) => {
    const { camera } = props;

    const [toDisplayAngle, fromDisplayAngle, useDegrees] = useAngleConverters();

    const mode = useProperty(camera, "mode");

    return (
        <>
            <BoundProperty component={NumberInputPropertyLine} label="Near Plane" description="Anything closer than this will not be drawn." target={camera} propertyKey="minZ" />
            <BoundProperty component={NumberInputPropertyLine} label="Far Plane" description="Anything further than this will not be drawn." target={camera} propertyKey="maxZ" />
            <BoundProperty component={SyncedSliderPropertyLine} label="Inertia" target={camera} propertyKey="inertia" min={0} max={1} step={0.01} />
            <BoundProperty component={HexPropertyLine} label="Layer Mask" target={camera} propertyKey="layerMask" />
            <BoundProperty component={NumberDropdownPropertyLine} label="Mode" options={CameraModes} target={camera} propertyKey="mode" />
            <Collapse visible={mode === Camera.PERSPECTIVE_CAMERA}>
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="FOV"
                    description={`Field of view in ${useDegrees ? "degrees" : "radians"}`}
                    target={camera}
                    propertyKey="fov"
                    min={toDisplayAngle(0.1)}
                    max={toDisplayAngle(Math.PI)}
                    step={toDisplayAngle(0.01)}
                    unit={useDegrees ? "°" : "rad"}
                    convertTo={toDisplayAngle}
                    convertFrom={fromDisplayAngle}
                />
            </Collapse>
            <Collapse visible={mode === Camera.ORTHOGRAPHIC_CAMERA}>
                <div>
                    <BoundProperty component={NumberInputPropertyLine} label="Left" target={camera} step={0.1} propertyKey="orthoLeft" nullable defaultValue={0} />
                    <BoundProperty component={NumberInputPropertyLine} label="Right" target={camera} step={0.1} propertyKey="orthoRight" nullable defaultValue={0} />
                    <BoundProperty component={NumberInputPropertyLine} label="Top" target={camera} step={0.1} propertyKey="orthoTop" nullable defaultValue={0} />
                    <BoundProperty component={NumberInputPropertyLine} label="Bottom" target={camera} step={0.1} propertyKey="orthoBottom" nullable defaultValue={0} />
                </div>
            </Collapse>
        </>
    );
};
