import type { FunctionComponent } from "react";

import type { SkyMaterial } from "materials/sky/skyMaterial";

import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";
import { useAngleConverters } from "../../../hooks/settingsHooks";
import { BoundProperty } from "../boundProperty";

export const SkyMaterialProperties: FunctionComponent<{ material: SkyMaterial }> = (props) => {
    const { material } = props;
    const [toDisplayAngle, fromDisplayAngle, useDegrees] = useAngleConverters();

    return (
        <>
            <BoundProperty
                component={NumberInputPropertyLine}
                label="Azimuth"
                description={`Azimuth angle in ${useDegrees ? "degrees" : "radians"}`}
                target={material}
                propertyKey="azimuth"
                step={toDisplayAngle(0.001)}
                unit={useDegrees ? "°" : "rad"}
                convertTo={toDisplayAngle}
                convertFrom={fromDisplayAngle}
                docLink="https://doc.babylonjs.com/toolsAndResources/assetLibraries/materialsLibrary/skyMat/#configuring-the-sky-material"
            />
            <BoundProperty
                component={NumberInputPropertyLine}
                label="Inclination"
                description={`Inclination angle in ${useDegrees ? "degrees" : "radians"}`}
                target={material}
                propertyKey="inclination"
                min={toDisplayAngle(0)}
                max={toDisplayAngle(Math.PI / 2)}
                step={toDisplayAngle(0.001)}
                unit={useDegrees ? "°" : "rad"}
                convertTo={toDisplayAngle}
                convertFrom={fromDisplayAngle}
                docLink="https://doc.babylonjs.com/toolsAndResources/assetLibraries/materialsLibrary/skyMat/#configuring-the-sky-material"
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Turbidity"
                description="Atmospheric turbidity."
                target={material}
                propertyKey="turbidity"
                min={0}
                max={100}
                step={0.1}
                docLink="https://doc.babylonjs.com/toolsAndResources/assetLibraries/materialsLibrary/skyMat/#configuring-the-sky-material"
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Luminance"
                description="Brightness of the sky (0 to 1)."
                target={material}
                propertyKey="luminance"
                min={0}
                max={1}
                step={0.001}
                docLink="https://doc.babylonjs.com/toolsAndResources/assetLibraries/materialsLibrary/skyMat/#configuring-the-sky-material"
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Rayleigh"
                description="Rayleigh scattering coefficient (0 to 4)."
                target={material}
                propertyKey="rayleigh"
                min={0}
                max={4}
                step={0.001}
                docLink="https://doc.babylonjs.com/toolsAndResources/assetLibraries/materialsLibrary/skyMat/#configuring-the-sky-material"
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Mie Directional G"
                description="Mie directional scattering (0 to 1)."
                target={material}
                propertyKey="mieDirectionalG"
                min={0}
                max={1}
                step={0.001}
                docLink="https://doc.babylonjs.com/toolsAndResources/assetLibraries/materialsLibrary/skyMat/#configuring-the-sky-material"
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Mie Coefficient"
                description="Mie scattering coefficient (0 to 1)."
                target={material}
                propertyKey="mieCoefficient"
                min={0}
                max={1}
                step={0.001}
                docLink="https://doc.babylonjs.com/toolsAndResources/assetLibraries/materialsLibrary/skyMat/#configuring-the-sky-material"
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Distance"
                description="Distance to the sky dome (0 to 1000 units)."
                target={material}
                propertyKey="distance"
                min={0}
                max={1000}
                step={0.1}
                docLink="https://doc.babylonjs.com/toolsAndResources/assetLibraries/materialsLibrary/skyMat/#configuring-the-sky-material"
            />
            <BoundProperty
                component={SwitchPropertyLine}
                label="Use Sun Pos"
                description="Enable custom sun position."
                target={material}
                propertyKey="useSunPosition"
                docLink="https://doc.babylonjs.com/toolsAndResources/assetLibraries/materialsLibrary/skyMat/#configuring-the-sky-material"
            />
            <BoundProperty
                component={Vector3PropertyLine}
                label="Sun Position"
                description="Custom sun position (Vector3)."
                target={material}
                propertyKey="sunPosition"
                docLink="https://doc.babylonjs.com/toolsAndResources/assetLibraries/materialsLibrary/skyMat/#configuring-the-sky-material"
            />
            <BoundProperty
                component={Vector3PropertyLine}
                label="Camera Offset"
                description="Offset for the camera (Vector3)."
                target={material}
                propertyKey="cameraOffset"
                docLink="https://doc.babylonjs.com/toolsAndResources/assetLibraries/materialsLibrary/skyMat/#keeping-the-horizon-relative-to-the-camera-elevation"
            />
        </>
    );
};
