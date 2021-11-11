import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../sharedUiComponents/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import { LockObject } from "../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { Line } from "babylonjs-gui/2D/controls/line";
import { FloatLineComponent } from "../../../../sharedUiComponents/lines/floatLineComponent";
import { TextInputLineComponent } from "../../../../sharedUiComponents/lines/textInputLineComponent";
import { TextLineComponent } from "../../../../sharedUiComponents/lines/textLineComponent";

const positionIcon: string = require("../../../../sharedUiComponents/imgs/positionIcon.svg");

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
                <hr/>
                <TextLineComponent label="LINE" value=" " color="grey"></TextLineComponent>
                    <div className="ge-divider">
                    <TextInputLineComponent iconLabel={"Position 1"} icon={positionIcon} lockObject={this.props.lockObject} label="X" target={line} propertyName="x1" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Y" target={line} propertyName="y1" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    </div>
                    <div className="ge-divider">
                    <TextInputLineComponent iconLabel={"Position 2"} icon={positionIcon} lockObject={this.props.lockObject} label="X" target={line} propertyName="x2" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Y" target={line} propertyName="y2" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    </div>
                    <FloatLineComponent iconLabel={"Line width"} icon={positionIcon} lockObject={this.props.lockObject} label="" target={line} propertyName="lineWidth" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent iconLabel={"Dash pattern"} icon={positionIcon}  lockObject={this.props.lockObject} label="" target={line} value={line.dash.join(",")} onChange={newValue => this.onDashChange(newValue)} />
            </div>
        );
    }
}