import * as React from "react";
import { Control } from "babylonjs-gui/2D/controls/control";
import { TextLineComponent } from "../sharedUiComponents/lines/textLineComponent";
import { FloatLineComponent } from "../sharedUiComponents/lines/floatLineComponent";
import { LockObject } from "../sharedUiComponents/tabs/propertyGrids/lockObject";
import { PropertyChangedEvent } from "../sharedUiComponents/propertyChangedEvent";
import { Observable } from "babylonjs/Misc/observable";
import { Grid } from "babylonjs-gui/2D/controls/grid";
import { Tools } from "../tools";
import { Vector2 } from "babylonjs/Maths/math.vector";

interface IParentingPropertyGridComponentProps {
    control: Control,
    lockObject: LockObject,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class ParentingPropertyGridComponent extends React.Component<IParentingPropertyGridComponentProps> {
    constructor(props: IParentingPropertyGridComponentProps) {
        super(props);
    }
    private _columnNumber: number;
    private _rowNumber: number;

    updateGridPosition() {
        const grid = this.props.control.parent as Grid;
        if (grid) {
            this._changeCell(grid, this.props.control, new Vector2(this._rowNumber, this._columnNumber));
        }
    }

    getCellInfo() {
        const cellInfo = Tools.getCellInfo(this.props.control.parent as Grid, this.props.control);
        this._columnNumber = cellInfo.x;
        this._rowNumber = cellInfo.y;
    }

    private _changeCell(grid: Grid, draggedControl: Control, newCell : Vector2) {
        let index = grid.children.indexOf(draggedControl);
        grid.removeControl(draggedControl);
        Tools.reorderGrid(grid, index, draggedControl,newCell);
    }

    render() {
        this.getCellInfo();
        return (
            <div className="pane">
                <hr className="ge" />
                <TextLineComponent tooltip="" label="GRID PARENTING" value=" " color="grey"></TextLineComponent>
                <div className="divider">
                    <FloatLineComponent label={"Row #"} target={this} propertyName={"_rowNumber"} isInteger={true} min={0} onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        onChange={(newValue) => {
                            this.updateGridPosition();
                        }} />
                    <FloatLineComponent label={"Column #"} target={this} propertyName={"_columnNumber"} isInteger={true} min={0} onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        onChange={(newValue) => {
                            this.updateGridPosition();
                        }} />
                </div>
            </div>
        );
    }
}
