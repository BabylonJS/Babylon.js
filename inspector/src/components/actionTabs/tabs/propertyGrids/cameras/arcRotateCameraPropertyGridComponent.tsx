import * as React from "react";

import { ArcRotateCamera } from "babylonjs/Cameras/arcRotateCamera";
import { Observable } from "babylonjs/Misc/observable";

import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { CommonCameraPropertyGridComponent } from "./commonCameraPropertyGridComponent";
import { LineContainerComponent } from "../../../lineContainerComponent";
import { CheckBoxLineComponent } from "../../../lines/checkBoxLineComponent";
import { FloatLineComponent } from "../../../lines/floatLineComponent";
import { SliderLineComponent } from "../../../lines/sliderLineComponent";
import { Vector3LineComponent } from "../../../lines/vector3LineComponent";
import { LockObject } from "../lockObject";
import { GlobalState } from '../../../../globalState';

interface IArcRotateCameraPropertyGridComponentProps {
    globalState: GlobalState;
    camera: ArcRotateCamera;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class ArcRotateCameraPropertyGridComponent extends React.Component<IArcRotateCameraPropertyGridComponentProps> {
    constructor(props: IArcRotateCameraPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const camera = this.props.camera;

        return (
            <div className="pane">
                <CommonCameraPropertyGridComponent globalState={this.props.globalState} lockObject={this.props.lockObject} camera={camera} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <LineContainerComponent globalState={this.props.globalState} title="TRANSFORMS">
                    <Vector3LineComponent label="Target" target={camera} propertyName="target" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Alpha" useEuler={this.props.globalState.onlyUseEulers} target={camera} propertyName="alpha" minimum={camera.lowerAlphaLimit || 0} maximum={camera.upperAlphaLimit || 2 * Math.PI} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Beta" useEuler={this.props.globalState.onlyUseEulers} target={camera} propertyName="beta" minimum={camera.lowerAlphaLimit || 0} maximum={camera.upperBetaLimit || 2 * Math.PI} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Radius" target={camera} propertyName="radius" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="CONTROLS" closed={true}>
                    <FloatLineComponent lockObject={this.props.lockObject} label="Angular sensitivity X" target={camera} propertyName="angularSensibilityX" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Angular sensitivity Y" target={camera} propertyName="angularSensibilityY" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Panning sensitivity" target={camera} propertyName="panningSensibility" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Pinch delta percentage" target={camera} propertyName="pinchDeltaPercentage" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Wheel delta percentage" target={camera} propertyName="wheelDeltaPercentage" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Speed" target={camera} propertyName="speed" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="COLLISIONS" closed={true}>
                    <CheckBoxLineComponent label="Check collisions" target={camera} propertyName="checkCollisions" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <Vector3LineComponent label="Collision radius" target={camera} propertyName="collisionRadius" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="LIMITS" closed={true}>
                    <FloatLineComponent lockObject={this.props.lockObject} label="Lower alpha limit" target={camera} propertyName="lowerAlphaLimit" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Upper alpha limit" target={camera} propertyName="upperAlphaLimit" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Lower beta limit" target={camera} propertyName="lowerBetaLimit" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Upper beta limit" target={camera} propertyName="upperBetaLimit" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Lower radius limit" target={camera} propertyName="lowerRadiusLimit" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Upper radius limit" target={camera} propertyName="upperRadiusLimit" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="BEHAVIORS" closed={true}>
                    <CheckBoxLineComponent label="Auto rotation" target={camera} propertyName="useAutoRotationBehavior" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Bouncing" target={camera} propertyName="useBouncingBehavior" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Framing" target={camera} propertyName="useFramingBehavior" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
            </div>
        );
    }
}