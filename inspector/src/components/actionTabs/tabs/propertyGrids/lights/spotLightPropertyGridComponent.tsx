import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { SpotLight } from "babylonjs/Lights/spotLight";
import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { CommonLightPropertyGridComponent } from "./commonLightPropertyGridComponent";
import { LineContainerComponent } from "../../../../../sharedUiComponents/lines/lineContainerComponent";
import { Color3LineComponent } from "../../../../../sharedUiComponents/lines/color3LineComponent";
import { Vector3LineComponent } from "../../../../../sharedUiComponents/lines/vector3LineComponent";
import { FloatLineComponent } from "../../../../../sharedUiComponents/lines/floatLineComponent";
import { CommonShadowLightPropertyGridComponent } from "./commonShadowLightPropertyGridComponent";
import { LockObject } from "../../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { GlobalState } from '../../../../globalState';

interface ISpotLightPropertyGridComponentProps {
    globalState: GlobalState,
    light: SpotLight,
    lockObject: LockObject,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class SpotLightPropertyGridComponent extends React.Component<ISpotLightPropertyGridComponentProps> {
    constructor(props: ISpotLightPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const light = this.props.light;

        return (
            <div className="pane">
                <CommonLightPropertyGridComponent globalState={this.props.globalState} lockObject={this.props.lockObject} light={light} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <LineContainerComponent title="SETUP" selection={this.props.globalState}>
                    <Color3LineComponent label="Diffuse" target={light} propertyName="diffuse" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <Color3LineComponent label="Specular" target={light} propertyName="specular" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <Vector3LineComponent label="Position" target={light} propertyName="position" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <Vector3LineComponent label="Direction" target={light} propertyName="direction" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} useEuler={this.props.globalState.onlyUseEulers} label="Angle" target={light} propertyName="angle" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} useEuler={this.props.globalState.onlyUseEulers} label="Inner angle" target={light} propertyName="innerAngle" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Exponent" target={light} propertyName="exponent" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
                <CommonShadowLightPropertyGridComponent globalState={this.props.globalState} lockObject={this.props.lockObject} light={light} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
            </div>
        );
    }
}