import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../sharedUiComponents/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import { LockObject } from "../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { Rectangle } from "babylonjs-gui/2D/controls/rectangle";
import { FloatLineComponent } from "../../../../sharedUiComponents/lines/floatLineComponent";
import { CheckBoxLineComponent } from "../../../../sharedUiComponents/lines/checkBoxLineComponent";
import { TextLineComponent } from "../../../../sharedUiComponents/lines/textLineComponent";

const conerRadiusIcon: string = require("../../../../sharedUiComponents/imgs/conerRadiusIcon.svg");
const clipContentsIcon: string = require("../../../../sharedUiComponents/imgs/clipContentsIcon.svg");
const strokeWeightIcon: string = require("../../../../sharedUiComponents/imgs/strokeWeightIcon.svg");

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
                <hr></hr>
                <TextLineComponent label="RECTANGLE" value=" " color="grey"></TextLineComponent>
                <CheckBoxLineComponent icon={clipContentsIcon} label=" " target={rectangle} propertyName="clipChildren" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <div className="divider">
                <FloatLineComponent icon={strokeWeightIcon} lockObject={this.props.lockObject} label="" target={rectangle} propertyName="thickness" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <FloatLineComponent icon={conerRadiusIcon} lockObject={this.props.lockObject} label=" " target={rectangle} propertyName="cornerRadius" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </div>
            </div>
        );
    }
}