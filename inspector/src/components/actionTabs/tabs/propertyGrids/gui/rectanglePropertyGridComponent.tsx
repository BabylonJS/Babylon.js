import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "./commonControlPropertyGridComponent";
import { LockObject } from "../lockObject";
import { Rectangle } from "babylonjs-gui/2D/controls/rectangle";
import { LineContainerComponent } from "../../../lineContainerComponent";
import { FloatLineComponent } from "../../../lines/floatLineComponent";
import { CheckBoxLineComponent } from "../../../lines/checkBoxLineComponent";
import { GlobalState } from '../../../../globalState';

interface IRectanglePropertyGridComponentProps {
    globalState: GlobalState;
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
                <CommonControlPropertyGridComponent globalState={this.props.globalState} lockObject={this.props.lockObject} control={rectangle} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <LineContainerComponent globalState={this.props.globalState} title="RECTANGLE">
                    <CheckBoxLineComponent label="Clip children" target={rectangle} propertyName="clipChildren" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Thickness" target={rectangle} propertyName="thickness" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Corner radius" target={rectangle} propertyName="cornerRadius" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
            </div>
        );
    }
}