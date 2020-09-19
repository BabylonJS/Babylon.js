import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { DirectionalLight } from "babylonjs/Lights/directionalLight";
import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { CommonLightPropertyGridComponent } from "./commonLightPropertyGridComponent";
import { LineContainerComponent } from "../../../lineContainerComponent";
import { Color3LineComponent } from "../../../lines/color3LineComponent";
import { Vector3LineComponent } from "../../../lines/vector3LineComponent";
import { CommonShadowLightPropertyGridComponent } from "./commonShadowLightPropertyGridComponent";
import { LockObject } from "../lockObject";
import { GlobalState } from '../../../../globalState';
import { CheckBoxLineComponent } from '../../../lines/checkBoxLineComponent';
import { ShadowGenerator } from 'babylonjs/Lights/Shadows/shadowGenerator';
import { CascadedShadowGenerator } from 'babylonjs/Lights/Shadows/cascadedShadowGenerator';

interface IDirectionalLightPropertyGridComponentProps {
    globalState: GlobalState,
    light: DirectionalLight,
    lockObject: LockObject,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class DirectionalLightPropertyGridComponent extends React.Component<IDirectionalLightPropertyGridComponentProps> {
    constructor(props: IDirectionalLightPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const light = this.props.light;

        const generator = light.getShadowGenerator() as (ShadowGenerator | CascadedShadowGenerator) || null;

        const hideAutoCalcShadowZBounds = generator instanceof CascadedShadowGenerator;

        return (
            <div className="pane">
                <CommonLightPropertyGridComponent globalState={this.props.globalState} lockObject={this.props.lockObject} light={light} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <LineContainerComponent globalState={this.props.globalState} title="SETUP">
                    <Color3LineComponent label="Diffuse" target={light} propertyName="diffuse" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <Color3LineComponent label="Specular" target={light} propertyName="specular" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <Vector3LineComponent label="Position" target={light} propertyName="position" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <Vector3LineComponent label="Direction" target={light} propertyName="direction" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    { !hideAutoCalcShadowZBounds &&
                        <CheckBoxLineComponent label="Auto Calc Shadow ZBounds" target={light} propertyName="autoCalcShadowZBounds" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    }
                </LineContainerComponent>
                <CommonShadowLightPropertyGridComponent globalState={this.props.globalState} lockObject={this.props.lockObject} light={light} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
            </div>
        );
    }
}