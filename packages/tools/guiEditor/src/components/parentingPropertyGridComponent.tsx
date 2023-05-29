import * as React from "react";
import type { Control } from "gui/2D/controls/control";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { PropertyChangedEvent } from "shared-ui-components/propertyChangedEvent";
import type { Observable } from "core/Misc/observable";
import type { Grid } from "gui/2D/controls/grid";
import { Tools } from "../tools";
import { Vector2 } from "core/Maths/math.vector";

interface IParentingPropertyGridComponentProps {
    control: Control;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
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
        const cellInfo = Tools.GetCellInfo(this.props.control.parent as Grid, this.props.control);
        this._rowNumber = cellInfo.x;
        this._columnNumber = cellInfo.y;
    }

    private _changeCell(grid: Grid, draggedControl: Control, newCell: Vector2) {
        const index = grid.children.indexOf(draggedControl);
        grid.removeControl(draggedControl);
        Tools.ReorderGrid(grid, index, draggedControl, newCell);
    }

    render() {
        this.getCellInfo();
        return (
            <div className="pane">
                <hr className="ge" />
                <TextLineComponent tooltip="" label="GRID PARENTING" value=" " color="grey"></TextLineComponent>
                <div className="ge-divider">
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label={"Row #"}
                        target={this}
                        propertyName={"_rowNumber"}
                        isInteger={true}
                        min={0}
                        onChange={() => {
                            this.updateGridPosition();
                        }}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label={"Column #"}
                        target={this}
                        propertyName={"_columnNumber"}
                        isInteger={true}
                        min={0}
                        onChange={() => {
                            this.updateGridPosition();
                        }}
                    />
                </div>
            </div>
        );
    }
}
