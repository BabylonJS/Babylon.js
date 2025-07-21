import type { FunctionComponent } from "react";

import type { DropdownOption } from "shared-ui-components/fluent/primitives/dropdown";
import type { ISettingsContext } from "../../../services/settingsContext";

import { Collapse } from "@fluentui/react-motion-components-preview";

import { Camera } from "core/Cameras/camera";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { BoundProperty } from "../boundProperty";
// import { HexPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/hexPropertyLine";
import { NumberDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { PlaceholderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { useAngleConverters } from "../../../hooks/settingsHooks";

const CameraModes = [
    { label: "Perspective", value: Camera.PERSPECTIVE_CAMERA },
    { label: "Orthographic", value: Camera.ORTHOGRAPHIC_CAMERA },
] as const satisfies DropdownOption[];

export const CameraGeneralProperties: FunctionComponent<{ camera: Camera; settings: ISettingsContext }> = (props) => {
    const { camera, settings } = props;

    const [toDisplayAngle, fromDisplayAngle, useDegrees] = useAngleConverters(settings);

    const mode = useProperty(camera, "mode");
    const orthoLeft = useProperty(camera, "orthoLeft") ?? 0;
    const orthoRight = useProperty(camera, "orthoRight") ?? 0;
    const orthoTop = useProperty(camera, "orthoTop") ?? 0;
    const orthoBottom = useProperty(camera, "orthoBottom") ?? 0;

    return (
        <>
            <BoundProperty component={NumberInputPropertyLine} label="Near Plane" description="Anything closer than this will not be drawn." target={camera} propertyKey="minZ" />
            <BoundProperty component={NumberInputPropertyLine} label="Far Plane" description="Anything further than this will not be drawn." target={camera} propertyKey="maxZ" />
            <BoundProperty component={SyncedSliderPropertyLine} label="Inertia" target={camera} propertyKey="inertia" min={0} max={1} step={0.01} />
            {/* TODO: Make HexPropertyLine work in the case of simply editing a hex value */}
            {/* <BoundProperty component={HexPropertyLine} label="Layer Mask" target={camera} propertyKey="layerMask" /> */}
            <PlaceholderPropertyLine label="Layer Mask" value={camera.layerMask} onChange={() => {}} />
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
                    convertTo={toDisplayAngle}
                    convertFrom={fromDisplayAngle}
                />
            </Collapse>
            <Collapse visible={mode === Camera.ORTHOGRAPHIC_CAMERA}>
                <div>
                    {/* TODO: Is it possible to fix the BoundProperty typing such that conversion functions can change the value type, in this case number <-> Nullable<number>? */}
                    {/* <BoundProperty component={NumberInputPropertyLine} label="Left" target={camera} propertyKey="orthoLeft" />
                    <BoundProperty component={NumberInputPropertyLine} label="Right" target={camera} propertyKey="orthoRight" />
                    <BoundProperty component={NumberInputPropertyLine} label="Top" target={camera} propertyKey="orthoTop" />
                    <BoundProperty component={NumberInputPropertyLine} label="Bottom" target={camera} propertyKey="orthoBottom" /> */}
                    <NumberInputPropertyLine
                        label="Left"
                        step={0.1}
                        value={orthoLeft}
                        onChange={(val) => {
                            camera.orthoLeft = val;
                        }}
                    />
                    <NumberInputPropertyLine
                        label="Right"
                        step={0.1}
                        value={orthoRight}
                        onChange={(val) => {
                            camera.orthoRight = val;
                        }}
                    />
                    <NumberInputPropertyLine
                        label="Top"
                        step={0.1}
                        value={orthoTop}
                        onChange={(val) => {
                            camera.orthoTop = val;
                        }}
                    />
                    <NumberInputPropertyLine
                        label="Bottom"
                        step={0.1}
                        value={orthoBottom}
                        onChange={(val) => {
                            camera.orthoBottom = val;
                        }}
                    />
                </div>
            </Collapse>
        </>
    );
};
