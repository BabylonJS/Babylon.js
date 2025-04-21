import * as React from "react";
import type { Observable } from "core/Misc/observable";
import type { PropertyChangedEvent } from "../../../propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../../../tabs/propertyGrids/gui/commonControlPropertyGridComponent";
import type { LockObject } from "../../../tabs/propertyGrids/lockObject";
import type { Line } from "gui/2D/controls/line";
import { LineContainerComponent } from "../../../lines/lineContainerComponent";
import { FloatLineComponent } from "../../../lines/floatLineComponent";
import { TextInputLineComponent } from "../../../lines/textInputLineComponent";

interface ILinePropertyGridComponentProps {
    line: Line;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class LinePropertyGridComponent extends React.Component<ILinePropertyGridComponentProps> {
    constructor(props: ILinePropertyGridComponentProps) {
        super(props);
    }

    onDashChange(value: string) {
        const line = this.props.line;
        const split = value.split(",");
        line.dash = [];

        for (const v of split) {
            const int = parseInt(v);

            if (isNaN(int)) {
                return;
            }

            line.dash.push(int);
        }
    }

    override render() {
        const line = this.props.line;

        return (
            <>
                <CommonControlPropertyGridComponent lockObject={this.props.lockObject} control={line} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <LineContainerComponent title="LINE">
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Line width"
                        target={line}
                        propertyName="lineWidth"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="X1"
                        target={line}
                        propertyName="x1"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Y1"
                        target={line}
                        propertyName="y1"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="X2"
                        target={line}
                        propertyName="x2"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Y2"
                        target={line}
                        propertyName="y2"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Dash pattern"
                        target={line}
                        value={line.dash.join(",")}
                        onChange={(newValue) => this.onDashChange(newValue)}
                    />
                </LineContainerComponent>
            </>
        );
    }
}
