import * as React from "react";

import type { Observable } from "core/Misc/observable";
import type { SkyMaterial } from "materials/sky/skyMaterial";

import type { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import { CommonMaterialPropertyGridComponent } from "./commonMaterialPropertyGridComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { GlobalState } from "../../../../globalState";
import { Vector3LineComponent } from "shared-ui-components/lines/vector3LineComponent";

interface ISkyMaterialPropertyGridComponentProps {
    globalState: GlobalState;
    material: SkyMaterial;
    lockObject: LockObject;
    onSelectionChangedObservable?: Observable<any>;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

/**
 * Property grid component for the SkyMaterial
 */
export class SkyMaterialPropertyGridComponent extends React.Component<ISkyMaterialPropertyGridComponentProps> {
    constructor(props: ISkyMaterialPropertyGridComponentProps) {
        super(props);
    }

    renderSky() {
        const material = this.props.material;

        const sliderProps = [
            {
                label: "Azimuth",
                property: "azimuth",
                minimum: 0,
                maximum: Math.PI * 2,
                step: 0.001,
            },
            {
                label: "Inclination",
                property: "inclination",
                minimum: 0,
                maximum: Math.PI / 2,
                step: 0.001,
            },
            {
                label: "Turbidity",
                property: "turbidity",
                minimum: 0,
                maximum: 100,
                step: 0.1,
            },
            {
                label: "Luminance",
                property: "luminance",
                minimum: 0,
                maximum: 1,
                step: 0.001,
            },
            {
                label: "Rayleigh",
                property: "rayleigh",
                minimum: 0,
                maximum: 4,
                step: 0.001,
            },
            {
                label: "mieDirectionalG",
                property: "mieDirectionalG",
                minimum: 0,
                maximum: 1,
                step: 0.001,
            },
            {
                label: "mieCoefficient",
                property: "mieCoefficient",
                minimum: 0,
                maximum: 1,
                step: 0.001,
            },
            {
                label: "Distance",
                property: "distance",
                minimum: 0,
                maximum: 1000,
                step: 0.1,
            },
        ];

        const vector3Props = [
            {
                label: "Sun pos",
                property: "sunPosition",
            },
            {
                label: "Camera offset",
                property: "cameraOffset",
            },
        ];

        return (
            <LineContainerComponent title="SKY" selection={this.props.globalState}>
                {sliderProps.map((prop) => (
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label={prop.label}
                        target={material}
                        propertyName={prop.property}
                        minimum={prop.minimum}
                        maximum={prop.maximum}
                        step={prop.step}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                ))}
                <CheckBoxLineComponent label="Use sun pos" target={material} propertyName="useSunPosition" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                {vector3Props.map((prop) => (
                    <Vector3LineComponent
                        lockObject={this.props.lockObject}
                        label={prop.label}
                        target={material}
                        propertyName={prop.property}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                ))}
            </LineContainerComponent>
        );
    }

    override render() {
        const material = this.props.material;

        return (
            <>
                <CommonMaterialPropertyGridComponent
                    globalState={this.props.globalState}
                    lockObject={this.props.lockObject}
                    material={material}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                {this.renderSky()}
            </>
        );
    }
}
