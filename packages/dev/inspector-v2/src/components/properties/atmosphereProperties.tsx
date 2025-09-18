import type { FunctionComponent } from "react";

import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { BoundProperty } from "./boundProperty";
import type { Atmosphere } from "addons/atmosphere/atmosphere";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";
import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";

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
            <PropertyLine
                label="Rayleigh Scattering"
                expandByDefault
                expandedContent={
                    <>
                        <BoundProperty
                            label="Scale"
                            component={SyncedSliderPropertyLine}
                            target={atmosphere.physicalProperties}
                            propertyKey="rayleighScatteringScale"
                            min={0.0}
                            max={5.0}
                            step={0.01}
                        />
                        <BoundProperty label="Peak (Mm)" component={Vector3PropertyLine} target={atmosphere.physicalProperties} propertyKey="peakRayleighScattering" />
                    </>
                }
            />
            <PropertyLine
                label="Mie Scattering"
                expandByDefault
                expandedContent={
                    <>
                        <BoundProperty
                            label="Scale"
                            component={SyncedSliderPropertyLine}
                            target={atmosphere.physicalProperties}
                            propertyKey="mieScatteringScale"
                            min={0.0}
                            max={5.0}
                            step={0.01}
                        />
                        <BoundProperty label="Scattering (Mm)" component={Vector3PropertyLine} target={atmosphere.physicalProperties} propertyKey="peakMieScattering" />
                    </>
                }
            />
            <PropertyLine
                label="Mie Absorption"
                expandByDefault
                expandedContent={
                    <>
                        <BoundProperty
                            label="Scale"
                            component={SyncedSliderPropertyLine}
                            target={atmosphere.physicalProperties}
                            propertyKey="mieAbsorptionScale"
                            min={0.0}
                            max={5.0}
                            step={0.01}
                        />
                        <BoundProperty label="Peak (Mm)" component={Vector3PropertyLine} target={atmosphere.physicalProperties} propertyKey="peakMieAbsorption" />
                    </>
                }
            />
            <PropertyLine
                label="Ozone Absorption"
                expandByDefault
                expandedContent={
                    <>
                        <BoundProperty
                            label="Scale"
                            component={SyncedSliderPropertyLine}
                            target={atmosphere.physicalProperties}
                            propertyKey="ozoneAbsorptionScale"
                            min={0.0}
                            max={5.0}
                            step={0.01}
                        />
                        <BoundProperty label="Peak (Mm)" component={Vector3PropertyLine} target={atmosphere.physicalProperties} propertyKey="peakOzoneAbsorption" />
                    </>
                }
            />
        </>
    );
};
export const MultipleScatteringProperties: FunctionComponent<{ entity: Atmosphere }> = (props) => {
    const { entity: atmosphere } = props;

    return (
        <>
            <BoundProperty label="Intensity" component={SyncedSliderPropertyLine} target={atmosphere} propertyKey="multiScatteringIntensity" min={0} max={5.0} step={0.1} />
            <BoundProperty
                label="Minimum Intensity"
                component={SyncedSliderPropertyLine}
                target={atmosphere}
                propertyKey="minimumMultiScatteringIntensity"
                min={0.0}
                max={0.1}
                step={0.0001}
            />
            <BoundProperty label="Minimum Color" component={Color3PropertyLine} target={atmosphere} propertyKey="minimumMultiScatteringColor" />
            <BoundProperty label="Ground Albedo" component={Color3PropertyLine} target={atmosphere} propertyKey="groundAlbedo" />
        </>
    );
};
export const AerialPerspectiveProperties: FunctionComponent<{ entity: Atmosphere }> = (props) => {
    const { entity: atmosphere } = props;

    return (
        <>
            <BoundProperty label="Intensity" component={SyncedSliderPropertyLine} target={atmosphere} propertyKey="aerialPerspectiveIntensity" min={0} max={5.0} step={0.1} />
            <BoundProperty
                label="Transmittance Scale"
                component={SyncedSliderPropertyLine}
                target={atmosphere}
                propertyKey="aerialPerspectiveTransmittanceScale"
                min={0}
                max={2.0}
                step={0.01}
            />
            <BoundProperty label="Saturation" component={SyncedSliderPropertyLine} target={atmosphere} propertyKey="aerialPerspectiveSaturation" min={0} max={2.0} step={0.01} />
        </>
    );
};
export const DiffuseIrradianceProperties: FunctionComponent<{ entity: Atmosphere }> = (props) => {
    const { entity: atmosphere } = props;

    return (
        <>
            <BoundProperty label="Intensity" component={SyncedSliderPropertyLine} target={atmosphere} propertyKey="diffuseSkyIrradianceIntensity" min={0} max={5.0} step={0.001} />
            <BoundProperty
                label="Desaturation"
                component={SyncedSliderPropertyLine}
                target={atmosphere}
                propertyKey="diffuseSkyIrradianceDesaturationFactor"
                min={0}
                max={1.0}
                step={0.01}
            />
            <BoundProperty
                label="Additional Intensity"
                component={SyncedSliderPropertyLine}
                target={atmosphere}
                propertyKey="additionalDiffuseSkyIrradianceIntensity"
                min={0}
                max={100000.0}
                step={1}
            />
            <BoundProperty label="Additional Color" component={Color3PropertyLine} target={atmosphere} propertyKey="additionalDiffuseSkyIrradianceColor" />
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
