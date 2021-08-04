import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../sharedUiComponents/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import { LockObject } from "../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { Line } from "babylonjs-gui/2D/controls/line";
import { LineContainerComponent } from "../../../../sharedUiComponents/lines/lineContainerComponent";
import { FloatLineComponent } from "../../../../sharedUiComponents/lines/floatLineComponent";
import { TextInputLineComponent } from "../../../../sharedUiComponents/lines/textInputLineComponent";

interface ILinePropertyGridComponentProps {
    line: Line,
    lockObject: LockObject,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class LinePropertyGridComponent extends React.Component<ILinePropertyGridComponentProps> {
    constructor(props: ILinePropertyGridComponentProps) {
        super(props);
    }

    onDashChange(value: string) {
        const line = this.props.line;
        const split = value.split(",");
        line.dash = [];

        split.forEach(v => {
            const int = parseInt(v);

            if (isNaN(int)) {
                return;
            }

            line.dash.push(int);
        });
    }

    render() {
        const line = this.props.line;

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent  lockObject={this.props.lockObject} control={line} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <LineContainerComponent title="LINE">
                    <FloatLineComponent lockObject={this.props.lockObject} label="Line width" target={line} propertyName="lineWidth" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="X1" target={line} propertyName="x1" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Y1" target={line} propertyName="y1" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="X2" target={line} propertyName="x2" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Y2" target={line} propertyName="y2" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Dash pattern" target={line} value={line.dash.join(",")} onChange={newValue => this.onDashChange(newValue)} />
                </LineContainerComponent>
            </div>
        );
    }
}