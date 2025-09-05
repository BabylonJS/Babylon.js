// Copyright (c) Microsoft Corporation.
// MIT License

import * as React from "react";
import type { Atmosphere } from "addons/atmosphere/atmosphere";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import { Color3LineComponent } from "shared-ui-components/lines/color3LineComponent";
import type { GlobalState } from "../../../globalState";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { Observable } from "core/Misc/observable";
import type { PropertyChangedEvent } from "../../../propertyChangedEvent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import { Vector3LineComponent } from "shared-ui-components/lines/vector3LineComponent";

interface IAtmospherePropertyGridComponentProps {
    globalState: GlobalState;
    atmosphere: Atmosphere;
    lockObject: LockObject;
    onSelectionChangedObservable?: Observable<any>;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

/**
 * Property grid component for the Atmosphere.
 */
export class AtmospherePropertyGridComponent extends React.Component<IAtmospherePropertyGridComponentProps> {
    /** @override */
    override render() {
        const atmosphere = this.props.atmosphere;

        const groups = [
            {
                title: "General Settings",
                properties: [
                    { type: "slider", label: "Planet Radius (km)", property: "_planetRadius", minimum: 1000.0, maximum: 10000.0, step: 1 },
                    { type: "slider", label: "Atmosphere Thickness (km)", property: "_atmosphereThickness", minimum: 1.0, maximum: 200.0, step: 1 },
                ],
            },
            {
                title: "Scattering & Absorption",
                properties: [
                    { type: "slider", label: "Rayleigh Scattering Scale", property: "_rayleighScatteringScale", minimum: 0.0, maximum: 5.0, step: 0.01 },
                    { type: "vector", label: "Peak Rayleigh Scattering (Mm)", property: "_peakRayleighScatteringMm" },
                    { type: "slider", label: "Mie Scattering Scale", property: "_mieScatteringScale", minimum: 0.0, maximum: 5.0, step: 0.01 },
                    { type: "vector", label: "Peak Mie Scattering (Mm)", property: "_peakMieScatteringMm" },
                    { type: "slider", label: "Mie Absorption Scale", property: "_mieAbsorptionScale", minimum: 0.0, maximum: 5.0, step: 0.01 },
                    { type: "vector", label: "Peak Mie Absorption (Mm)", property: "_peakMieAbsorptionMm" },
                    { type: "slider", label: "Ozone Absorption Scale", property: "_ozoneAbsorptionScale", minimum: 0.0, maximum: 5.0, step: 0.01 },
                    { type: "vector", label: "Peak Ozone Absorption (Mm)", property: "_peakOzoneAbsorptionMm" },
                ],
            },
            {
                title: "Multiple Scattering",
                properties: [
                    { type: "slider", label: "Multiple Scattering Intensity", property: "multiScatteringIntensity", minimum: 0, maximum: 5.0, step: 0.1 },
                    { type: "slider", label: "Min Multiple Scattering Intensity", property: "minimumMultiScatteringIntensity", minimum: 0.0, maximum: 0.1, step: 0.0001 },
                    { type: "color3", label: "Min Multiple Scattering Color", property: "minimumMultiScatteringColor" },
                    { type: "color3", label: "Ground Albedo", property: "groundAlbedo" },
                ],
            },
            {
                title: "Aerial Perspective",
                properties: [
                    { type: "slider", label: "Aerial Perspective Intensity", property: "aerialPerspectiveIntensity", minimum: 0, maximum: 5.0, step: 0.1 },
                    { type: "slider", label: "Aerial Perspective Transmittance Scale", property: "aerialPerspectiveTransmittanceScale", minimum: 0, maximum: 2.0, step: 0.01 },
                    { type: "slider", label: "Aerial Perspective Saturation", property: "aerialPerspectiveSaturation", minimum: 0, maximum: 2.0, step: 0.01 },
                ],
            },
            {
                title: "Diffuse Irradiance",
                properties: [
                    { type: "slider", label: "Diffuse Intensity", property: "diffuseIrradianceIntensity", minimum: 0, maximum: 5.0, step: 0.001 },
                    { type: "slider", label: "Diffuse Desaturation", property: "diffuseIrradianceDesaturationFactor", minimum: 0, maximum: 1.0, step: 0.01 },
                    {
                        type: "slider",
                        label: "Additional Diffuse Irradiance Intensity",
                        property: "additionalDiffuseIrradianceIntensity",
                        minimum: 0,
                        maximum: 100000.0,
                        step: 1,
                    },
                    { type: "color3", label: "Additional Diffuse Irradiance Color", property: "additionalDiffuseIrradianceColor" },
                ],
            },
            {
                title: "Rendering Options",
                properties: [
                    { type: "checkbox", label: "Linear Space Output", property: "isLinearSpaceComposition" },
                    { type: "checkbox", label: "Linear Space Light", property: "isLinearSpaceLight" },
                    { type: "checkbox", label: "Use LUT for Sky (Optimization)", property: "isSkyViewLutEnabled" },
                    { type: "checkbox", label: "Use LUT for Aerial Perspective (Optimization)", property: "isAerialPerspectiveLutEnabled" },
                ],
            },
        ];

        return (
            <>
                {groups.map((group) => (
                    <LineContainerComponent key={group.title} title={group.title} selection={this.props.globalState}>
                        {group.properties.map((prop) => {
                            switch (prop.type) {
                                case "color3":
                                    return (
                                        <Color3LineComponent
                                            key={prop.property}
                                            lockObject={this.props.lockObject}
                                            label={prop.label}
                                            target={atmosphere}
                                            propertyName={prop.property}
                                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                                        />
                                    );
                                case "slider":
                                    return (
                                        <SliderLineComponent
                                            key={prop.property}
                                            lockObject={this.props.lockObject}
                                            label={prop.label}
                                            target={atmosphere}
                                            propertyName={prop.property}
                                            minimum={prop.minimum as number}
                                            maximum={prop.maximum as number}
                                            step={prop.step as number}
                                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                                        />
                                    );
                                case "checkbox":
                                    return (
                                        <CheckBoxLineComponent
                                            key={prop.property}
                                            label={prop.label}
                                            target={atmosphere}
                                            propertyName={prop.property}
                                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                                        />
                                    );
                                case "vector":
                                    return (
                                        <Vector3LineComponent
                                            key={prop.property}
                                            lockObject={this.props.lockObject}
                                            label={prop.label}
                                            target={atmosphere}
                                            propertyName={prop.property}
                                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                                        />
                                    );
                                default:
                                    return null;
                            }
                        })}
                    </LineContainerComponent>
                ))}
            </>
        );
    }
}
