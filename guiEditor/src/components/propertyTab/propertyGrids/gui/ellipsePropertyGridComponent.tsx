import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../sharedUiComponents/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import { LockObject } from "../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { Ellipse } from "babylonjs-gui/2D/controls/ellipse";
import { FloatLineComponent } from "../../../../sharedUiComponents/lines/floatLineComponent";
import { CheckBoxLineComponent } from "../../../../sharedUiComponents/lines/checkBoxLineComponent";
import { TextLineComponent } from "../../../../sharedUiComponents/lines/textLineComponent";

const clipContentsIcon: string = require("../../../../sharedUiComponents/imgs/clipContentsIcon.svg");
const strokeWeightIcon: string = require("../../../../sharedUiComponents/imgs/strokeWeightIcon.svg");

interface IEllipsePropertyGridComponentProps {
    ellipse: Ellipse,
    lockObject: LockObject,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class EllipsePropertyGridComponent extends React.Component<IEllipsePropertyGridComponentProps> {
    constructor(props: IEllipsePropertyGridComponentProps) {
        super(props);
    }

    render() {
        const ellipse = this.props.ellipse;

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent lockObject={this.props.lockObject} control={ellipse} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <hr/>
                <TextLineComponent label="ELLIPSE" value=" " color="grey"></TextLineComponent>
                <CheckBoxLineComponent icon={clipContentsIcon} label="" target={ellipse} propertyName="clipChildren" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <FloatLineComponent icon={strokeWeightIcon} lockObject={this.props.lockObject} label="" target={ellipse} propertyName="thickness" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
            </div>
        );
    }
}