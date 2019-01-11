import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { IShadowLight } from "babylonjs/Lights/shadowLight";
import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LineContainerComponent } from "../../../lineContainerComponent";
import { CheckBoxLineComponent } from "../../../lines/checkBoxLineComponent";
import { FloatLineComponent } from "../../../lines/floatLineComponent";
import { LockObject } from "../lockObject";

interface ICommonShadowLightPropertyGridComponentProps {
    light: IShadowLight,
    lockObject: LockObject,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class CommonShadowLightPropertyGridComponent extends React.Component<ICommonShadowLightPropertyGridComponentProps> {
    constructor(props: ICommonShadowLightPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const light = this.props.light;

        return (
            <LineContainerComponent title="SHADOWS">
                <CheckBoxLineComponent label="Shadows enabled" target={light} propertyName="shadowEnabled" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <FloatLineComponent lockObject={this.props.lockObject} label="Shadows near plane" target={light} propertyName="shadowMinZ" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <FloatLineComponent lockObject={this.props.lockObject} label="Shadows far plane" target={light} propertyName="shadowMaxZ" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
            </LineContainerComponent>
        );
    }
}