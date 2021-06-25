import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../sharedUiComponents/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import { LockObject } from "../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { Rectangle } from "babylonjs-gui/2D/controls/rectangle";
import { LineContainerComponent } from "../../../../sharedUiComponents/lines/lineContainerComponent";
import { FloatLineComponent } from "../../../../sharedUiComponents/lines/floatLineComponent";
import { CheckBoxLineComponent } from "../../../../sharedUiComponents/lines/checkBoxLineComponent";

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
                <CommonControlPropertyGridComponent  lockObject={this.props.lockObject} control={rectangle} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <LineContainerComponent title="RECTANGLE">
                    <CheckBoxLineComponent label="Clip children" target={rectangle} propertyName="clipChildren" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Thickness" target={rectangle} propertyName="thickness" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Corner radius" target={rectangle} propertyName="cornerRadius" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
            </div>
        );
    }
}