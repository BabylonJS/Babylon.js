import * as React from "react";
import { Observable, PointLight } from "babylonjs";
import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { CommonLightPropertyGridComponent } from "./commonLightPropertyGridComponent";
import { LineContainerComponent } from "../../../lineContainerComponent";
import { Color3LineComponent } from "../../../lines/color3LineComponent";
import { Vector3LineComponent } from "../../../lines/vector3LineComponent";
import { CommonShadowLightPropertyGridComponent } from "./commonShadowLightPropertyGridComponent";

interface IPointLightPropertyGridComponentProps {
    light: PointLight,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class PointLightPropertyGridComponent extends React.Component<IPointLightPropertyGridComponentProps> {
    constructor(props: IPointLightPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const light = this.props.light;

        return (
            <div className="pane">
                <CommonLightPropertyGridComponent light={light} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <LineContainerComponent title="SETUP">
                    <Color3LineComponent label="Diffuse" target={light} propertyName="diffuse" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <Color3LineComponent label="Specular" target={light} propertyName="specular" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <Vector3LineComponent label="Position" target={light} propertyName="position" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
                <CommonShadowLightPropertyGridComponent light={light} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
            </div>
        );
    }
}