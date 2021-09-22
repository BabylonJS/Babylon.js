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
            this._reorderGrid(grid, this.props.control, new Vector2(this._columnNumber, this._rowNumber));
        }
    }

    getCellInfo() {
        const cellInfo = Tools.getCellInfo(this.props.control.parent as Grid, this.props.control);
        this._columnNumber = cellInfo.x;
        this._rowNumber = cellInfo.y;
    }

    private _reorderGrid(grid: Grid, draggedControl: Control, newCell : Vector2) {
        let index = grid.children.indexOf(draggedControl);
        grid.removeControl(draggedControl);
        let tags: Vector2[] = [];
        let controls: Control[] = [];
        let length = grid.children.length;
        for (let i = index; i < length; ++i) {
            const control = grid.children[index];
            controls.push(control);
            tags.push(Tools.getCellInfo(grid, control));
            grid.removeControl(control);
        }
        grid.addControl(draggedControl, newCell.x, newCell.y);
        for (let i = 0; i < controls.length; ++i) {
            grid.addControl(controls[i], tags[i].x, tags[i].y);
        }
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
