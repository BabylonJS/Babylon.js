import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../sharedUiComponents/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import { LockObject } from "../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { Ellipse } from "babylonjs-gui/2D/controls/ellipse";
import { LineContainerComponent } from "../../../../sharedUiComponents/lines/lineContainerComponent";
import { FloatLineComponent } from "../../../../sharedUiComponents/lines/floatLineComponent";
import { CheckBoxLineComponent } from "../../../../sharedUiComponents/lines/checkBoxLineComponent";

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
                <CommonControlPropertyGridComponent  lockObject={this.props.lockObject} control={ellipse} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <LineContainerComponent title="ELLIPSE">
                    <CheckBoxLineComponent label="Clip children" target={ellipse} propertyName="clipChildren" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Thickness" target={ellipse} propertyName="thickness" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
            </div>
        );
    }
}