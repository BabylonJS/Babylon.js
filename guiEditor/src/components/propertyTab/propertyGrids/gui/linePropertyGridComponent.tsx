import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../sharedUiComponents/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import { LockObject } from "../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { Line } from "babylonjs-gui/2D/controls/line";
import { FloatLineComponent } from "../../../../sharedUiComponents/lines/floatLineComponent";
import { TextInputLineComponent } from "../../../../sharedUiComponents/lines/textInputLineComponent";
import { TextLineComponent } from "../../../../sharedUiComponents/lines/textLineComponent";
import { makeTargetsProxy } from "../../../../sharedUiComponents/lines/targetsProxy";

const positionIcon: string = require("../../../../sharedUiComponents/imgs/positionIcon.svg");

interface ILinePropertyGridComponentProps {
    lines: Line[];
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class LinePropertyGridComponent extends React.Component<ILinePropertyGridComponentProps> {
    constructor(props: ILinePropertyGridComponentProps) {
        super(props);
    }

    onDashChange(value: string) {
        const split = value.split(",");
        for (const line of this.props.lines) {
            line.dash = [];

            split.forEach((v) => {
                const int = parseInt(v);

                if (isNaN(int)) {
                    return;
                }

                line.dash.push(int);
            });
        }
        this.forceUpdate();
    }

    render() {
        const lines = this.props.lines;
        let dashes = lines[0].dash;
        console.log(dashes);
        console.log(lines);
        for(const line of lines) {
            if (dashes.length === 0) break;
            if (line.dash.length !== dashes.length) {
                dashes = [];
            }
            dashes.forEach((dash, index) => {
                if (line.dash[index] !== dash) {
                    dashes = [];
                }
            })
        }
        const dashString = dashes.join(",")

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent lockObject={this.props.lockObject} controls={lines} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <hr />
                <TextLineComponent label="LINE" value=" " color="grey"></TextLineComponent>
                <div className="ge-divider">
                    <TextInputLineComponent
                        iconLabel={"Position 1"}
                        icon={positionIcon}
                        lockObject={this.props.lockObject}
                        label="X"
                        target={makeTargetsProxy(lines, this.props.onPropertyChangedObservable)}
                        propertyName="x1"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Y"
                        target={makeTargetsProxy(lines, this.props.onPropertyChangedObservable)}
                        propertyName="y1"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </div>
                <div className="ge-divider">
                    <TextInputLineComponent
                        iconLabel={"Position 2"}
                        icon={positionIcon}
                        lockObject={this.props.lockObject}
                        label="X"
                        target={makeTargetsProxy(lines, this.props.onPropertyChangedObservable)}
                        propertyName="x2"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Y"
                        target={makeTargetsProxy(lines, this.props.onPropertyChangedObservable)}
                        propertyName="y2"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </div>
                <FloatLineComponent
                    iconLabel={"Line width"}
                    icon={positionIcon}
                    lockObject={this.props.lockObject}
                    label=""
                    target={makeTargetsProxy(lines, this.props.onPropertyChangedObservable)}
                    propertyName="lineWidth"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <TextInputLineComponent
                    iconLabel={"Dash pattern"}
                    icon={positionIcon}
                    lockObject={this.props.lockObject}
                    label=""
                    target={makeTargetsProxy(lines, this.props.onPropertyChangedObservable)}
                    value={dashString}
                    onChange={(newValue) => this.onDashChange(newValue)}
                />
            </div>
        );
    }
}
