import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../sharedUiComponents/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import { LockObject } from "../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { TextLineComponent } from "../../../../sharedUiComponents/lines/textLineComponent";
import { DisplayGrid } from "babylonjs-gui/2D/controls/displayGrid";
import { TextInputLineComponent } from "../../../../sharedUiComponents/lines/textInputLineComponent";
import { FloatLineComponent } from "../../../../sharedUiComponents/lines/floatLineComponent";

const fillColorIcon: string = require("../../../../sharedUiComponents/imgs/fillColorIcon.svg");

interface IDisplayGridPropertyGridComponentProps {
    displayGrid: DisplayGrid,
    lockObject: LockObject,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
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
                <FloatLineComponent iconLabel={"Cell Size"} icon={fillColorIcon} min={1} isInteger={true} lockObject={this.props.lockObject} label="W" target={displayGrid} propertyName="cellWidth" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <FloatLineComponent min={1} isInteger={true} lockObject={this.props.lockObject} label="H" target={displayGrid} propertyName="cellHeight" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </div>
                <FloatLineComponent iconLabel={"Minor Line Tickness"} icon={fillColorIcon} min={1} isInteger={true} lockObject={this.props.lockObject} label="" target={displayGrid} propertyName="minorLineTickness" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <TextInputLineComponent iconLabel={"Minor Line Color"} icon={fillColorIcon} lockObject={this.props.lockObject} label="" target={displayGrid} propertyName="minorLineColor" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <FloatLineComponent iconLabel={"Major Line Tickness"} icon={fillColorIcon} min={1} isInteger={true} lockObject={this.props.lockObject} label="" target={displayGrid} propertyName="majorLineTickness" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <TextInputLineComponent  iconLabel={"Major Line Color"} icon={fillColorIcon}lockObject={this.props.lockObject} label="" target={displayGrid} propertyName="majorLineColor" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <FloatLineComponent  iconLabel={"Major Line Frequency"} icon={fillColorIcon} min={1} isInteger={true}  lockObject={this.props.lockObject} label="" target={displayGrid} propertyName="majorLineFrequency" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                
            </div>
        );
    }
}