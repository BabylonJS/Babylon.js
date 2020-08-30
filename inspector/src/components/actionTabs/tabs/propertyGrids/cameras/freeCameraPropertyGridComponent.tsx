import * as React from "react";
import { FreeCamera } from "babylonjs/Cameras/freeCamera";
import { Observable } from "babylonjs/Misc/observable";
import { CommonCameraPropertyGridComponent } from "./commonCameraPropertyGridComponent";
import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LineContainerComponent } from "../../../lineContainerComponent";
import { Vector3LineComponent } from "../../../lines/vector3LineComponent";
import { FloatLineComponent } from "../../../lines/floatLineComponent";
import { CheckBoxLineComponent } from "../../../lines/checkBoxLineComponent";
import { LockObject } from "../lockObject";
import { GlobalState } from '../../../../globalState';

interface IFreeCameraPropertyGridComponentProps {
    globalState: GlobalState;
    camera: FreeCamera;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class FreeCameraPropertyGridComponent extends React.Component<IFreeCameraPropertyGridComponentProps> {
    constructor(props: IFreeCameraPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const camera = this.props.camera;

        return (
            <div className="pane">
                <CommonCameraPropertyGridComponent globalState={this.props.globalState} lockObject={this.props.lockObject} camera={camera} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <LineContainerComponent globalState={this.props.globalState} title="TRANSFORMS">
                    <Vector3LineComponent label="Target" target={camera} propertyName="target" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <Vector3LineComponent label="Position" target={camera} propertyName="position" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <Vector3LineComponent label="Rotation" noSlider={true} useEuler={this.props.globalState.onlyUseEulers} target={camera} propertyName="rotation" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="CONTROLS" closed={true}>
                    <FloatLineComponent lockObject={this.props.lockObject} label="Angular sensitivity" target={camera} propertyName="angularSensibility" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Speed" target={camera} propertyName="speed" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="COLLISIONS" closed={true}>
                    <CheckBoxLineComponent label="Check collisions" target={camera} propertyName="checkCollisions" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Apply gravity" target={camera} propertyName="applyGravity" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <Vector3LineComponent label="Ellipsoid" target={camera} propertyName="ellipsoid" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <Vector3LineComponent label="Ellipsoid offset" target={camera} propertyName="ellipsoidOffset" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
            </div>
        );
    }
}