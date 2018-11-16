import * as React from "react";
import { Observable } from "babylonjs";
import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "./commonControlPropertyGridComponent";
import { LockObject } from "../lockObject";
import { Rectangle } from "babylonjs-gui";
import { LineContainerComponent } from "../../../lineContainerComponent";
import { FloatLineComponent } from "../../../lines/floatLineComponent";

interface IRectanglePropertyGridComponentProps {
    rectangle: Rectangle,
    lockObject: LockObject,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class RectanglePropertyGridComponent extends React.Component<IRectanglePropertyGridComponentProps> {
    constructor(props: IRectanglePropertyGridComponentProps) {
        super(props);
    }

    render() {
        const rectangle = this.props.rectangle;

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent lockObject={this.props.lockObject} control={rectangle} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <LineContainerComponent title="RECTANGLE">
                    <FloatLineComponent lockObject={this.props.lockObject} label="Thickness" target={rectangle} propertyName="thickness" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Corner radius" target={rectangle} propertyName="cornerRadius" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
            </div>
        );
    }
}