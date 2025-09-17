import type { FunctionComponent } from "react";

import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { BoundProperty } from "./boundProperty";
import type { Atmosphere } from "addons/atmosphere/atmosphere";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";
import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";

export const GeneralAtmosphereProperties: FunctionComponent<{ entity: Atmosphere }> = (props) => {
    const { entity: atmosphere } = props;
    return (
        <>
            <BoundProperty
                label="Planet Radius (km)"
                component={SyncedSliderPropertyLine}
                target={atmosphere.physicalProperties}
                propertyKey="planetRadius"
                min={1000.0}
                max={10000.0}
                step={1}
            />
            <BoundProperty
                label="Atmosphere Thickness (km)"
                component={SyncedSliderPropertyLine}
                target={atmosphere.physicalProperties}
                propertyKey="atmosphereThickness"
                min={1.0}
                max={200.0}
                step={1}
            />
        </>
    );
};
export const ScatteringAndAbsorptionProperties: FunctionComponent<{ entity: Atmosphere }> = (props) => {
    const { entity: atmosphere } = props;
    return (
        <>
            <BoundProperty
                label="Rayleigh Scattering Scale"
                component={SyncedSliderPropertyLine}
                target={atmosphere.physicalProperties}
                propertyKey="rayleighScatteringScale"
                min={0.0}
                max={5.0}
                step={0.01}
            />
            <BoundProperty label="Peak Rayleigh Scattering (Mm)" component={Vector3PropertyLine} target={atmosphere.physicalProperties} propertyKey="peakRayleighScattering" />
            <BoundProperty
                label="Mie Scattering Scale"
                component={SyncedSliderPropertyLine}
                target={atmosphere.physicalProperties}
                propertyKey="mieScatteringScale"
                min={0.0}
                max={5.0}
                step={0.01}
            />
            <BoundProperty label="Peak Mie Scattering (Mm)" component={Vector3PropertyLine} target={atmosphere.physicalProperties} propertyKey="peakMieScattering" />
            <BoundProperty
                label="Mie Absorption Scale"
                component={SyncedSliderPropertyLine}
                target={atmosphere.physicalProperties}
                propertyKey="mieAbsorptionScale"
                min={0.0}
                max={5.0}
                step={0.01}
            />
            <BoundProperty label="Peak Mie Absorption (Mm)" component={Vector3PropertyLine} target={atmosphere.physicalProperties} propertyKey="peakMieAbsorption" />
            <BoundProperty
                label="Ozone Absorption Scale"
                component={SyncedSliderPropertyLine}
                target={atmosphere.physicalProperties}
                propertyKey="ozoneAbsorptionScale"
                min={0.0}
                max={5.0}
                step={0.01}
            />
            <BoundProperty label="Peak Ozone Absorption (Mm)" component={Vector3PropertyLine} target={atmosphere.physicalProperties} propertyKey="peakOzoneAbsorption" />
        </>
    );
};
export const MultipleScatteringProperties: FunctionComponent<{ entity: Atmosphere }> = (props) => {
    const { entity: atmosphere } = props;

    return (
        <>
            <BoundProperty
                label="Multiple Scattering Intensity"
                component={SyncedSliderPropertyLine}
                target={atmosphere}
                propertyKey="multiScatteringIntensity"
                min={0}
                max={5.0}
                step={0.1}
            />
            <BoundProperty
                label="Min Multiple Scattering Intensity"
                component={SyncedSliderPropertyLine}
                target={atmosphere}
                propertyKey="minimumMultiScatteringIntensity"
                min={0.0}
                max={0.1}
                step={0.0001}
            />
            <BoundProperty label="Min Multiple Scattering Color" component={Color3PropertyLine} target={atmosphere} propertyKey="minimumMultiScatteringColor" />
            <BoundProperty label="Ground Albedo" component={Color3PropertyLine} target={atmosphere} propertyKey="groundAlbedo" />
        </>
    );
};
export const AerialPerspectiveProperties: FunctionComponent<{ entity: Atmosphere }> = (props) => {
    const { entity: atmosphere } = props;

    return (
        <>
            <BoundProperty
                label="Aerial Perspective Intensity"
                component={SyncedSliderPropertyLine}
                target={atmosphere}
                propertyKey="aerialPerspectiveIntensity"
                min={0}
                max={5.0}
                step={0.1}
            />
            <BoundProperty
                label="Aerial Perspective Transmittance Scale"
                component={SyncedSliderPropertyLine}
                target={atmosphere}
                propertyKey="aerialPerspectiveTransmittanceScale"
                min={0}
                max={2.0}
                step={0.01}
            />
            <BoundProperty
                label="Aerial Perspective Saturation"
                component={SyncedSliderPropertyLine}
                target={atmosphere}
                propertyKey="aerialPerspectiveSaturation"
                min={0}
                max={2.0}
                step={0.01}
            />
        </>
    );
};
export const DiffuseIrradianceProperties: FunctionComponent<{ entity: Atmosphere }> = (props) => {
    const { entity: atmosphere } = props;

    return (
        <>
            <BoundProperty
                label="Diffuse Sky Intensity"
                component={SyncedSliderPropertyLine}
                target={atmosphere}
                propertyKey="diffuseSkyIrradianceIntensity"
                min={0}
                max={5.0}
                step={0.001}
            />
            <BoundProperty
                label="Diffuse Sky Desaturation"
                component={SyncedSliderPropertyLine}
                target={atmosphere}
                propertyKey="diffuseSkyIrradianceDesaturationFactor"
                min={0}
                max={1.0}
                step={0.01}
            />
            <BoundProperty
                label="Additional Diffuse Sky Irradiance Intensity"
                component={SyncedSliderPropertyLine}
                target={atmosphere}
                propertyKey="additionalDiffuseSkyIrradianceIntensity"
                min={0}
                max={100000.0}
                step={1}
            />
            <BoundProperty label="Additional Diffuse Sky Irradiance Color" component={Color3PropertyLine} target={atmosphere} propertyKey="additionalDiffuseSkyIrradianceColor" />
        </>
    );
};
export const RenderingOptionsProperties: FunctionComponent<{ entity: Atmosphere }> = (props) => {
    const { entity: atmosphere } = props;

    return (
        <>
            <BoundProperty label="Linear Space Output" component={SwitchPropertyLine} target={atmosphere} propertyKey="isLinearSpaceComposition" />
            <BoundProperty label="Linear Space Light" component={SwitchPropertyLine} target={atmosphere} propertyKey="isLinearSpaceLight" />
            <BoundProperty label="Use LUT for Sky (Optimization)" component={SwitchPropertyLine} target={atmosphere} propertyKey="isSkyViewLutEnabled" />
            <BoundProperty label="Use LUT for Aerial Perspective (Optimization)" component={SwitchPropertyLine} target={atmosphere} propertyKey="isAerialPerspectiveLutEnabled" />
        </>
    );
};
