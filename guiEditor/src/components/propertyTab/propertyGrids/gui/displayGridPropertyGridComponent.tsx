import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../sharedUiComponents/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import { LockObject } from "../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { TextLineComponent } from "../../../../sharedUiComponents/lines/textLineComponent";
import { DisplayGrid } from "babylonjs-gui/2D/controls/displayGrid";
import { FloatLineComponent } from "../../../../sharedUiComponents/lines/floatLineComponent";
import { Color3LineComponent } from "../../../../sharedUiComponents/lines/color3LineComponent";

const sizeIcon: string = require("../../../../sharedUiComponents/imgs/sizeIcon.svg");
const colorIcon: string = require("../../../../sharedUiComponents/imgs/colorIcon.svg");
const conerRadiusIcon: string = require("../../../../sharedUiComponents/imgs/conerRadiusIcon.svg");
const strokeWeightIcon: string = require("../../../../sharedUiComponents/imgs/strokeWeightIcon.svg");

interface IDisplayGridPropertyGridComponentProps {
    displayGrid: DisplayGrid;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class DisplayGridPropertyGridComponent extends React.Component<IDisplayGridPropertyGridComponentProps> {
    constructor(props: IDisplayGridPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const displayGrid = this.props.displayGrid;

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent lockObject={this.props.lockObject} control={displayGrid} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <hr />
                <TextLineComponent label="DISPLAY GRID" value=" " color="grey"></TextLineComponent>
                <div className="ge-divider">
                    <FloatLineComponent
                        iconLabel={"Cell Size"}
                        icon={sizeIcon}
                        min={1}
                        isInteger={true}
                        lockObject={this.props.lockObject}
                        label="W"
                        target={displayGrid}
                        propertyName="cellWidth"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        min={1}
                        isInteger={true}
                        lockObject={this.props.lockObject}
                        label="H"
                        target={displayGrid}
                        propertyName="cellHeight"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </div>
                <FloatLineComponent
                    iconLabel={"Minor Line Tickness"}
                    icon={strokeWeightIcon}
                    min={1}
                    isInteger={true}
                    lockObject={this.props.lockObject}
                    label=""
                    target={displayGrid}
                    propertyName="minorLineTickness"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <Color3LineComponent
                    iconLabel={"Minor Line Color"}
                    icon={colorIcon}
                    lockObject={this.props.lockObject}
                    label=""
                    target={displayGrid}
                    propertyName="minorLineColor"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <FloatLineComponent
                    iconLabel={"Major Line Tickness"}
                    icon={strokeWeightIcon}
                    min={1}
                    isInteger={true}
                    lockObject={this.props.lockObject}
                    label=""
                    target={displayGrid}
                    propertyName="majorLineTickness"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <Color3LineComponent
                    iconLabel={"Major Line Color"}
                    icon={colorIcon}
                    lockObject={this.props.lockObject}
                    label=""
                    target={displayGrid}
                    propertyName="majorLineColor"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <FloatLineComponent
                    iconLabel={"Major Line Frequency"}
                    icon={conerRadiusIcon}
                    min={1}
                    isInteger={true}
                    lockObject={this.props.lockObject}
                    label=""
                    target={displayGrid}
                    propertyName="majorLineFrequency"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
            </div>
        );
    }
}
