import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../sharedUiComponents/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import { LockObject } from "../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { Grid } from "babylonjs-gui/2D/controls/grid";
import { TextLineComponent } from "../../../../sharedUiComponents/lines/textLineComponent";
import { ButtonLineComponent } from "../../../../sharedUiComponents/lines/buttonLineComponent";
import { FloatLineComponent } from "../../../../sharedUiComponents/lines/floatLineComponent";
import { CheckBoxLineComponent } from "../../../../sharedUiComponents/lines/checkBoxLineComponent";
import { ValueAndUnit } from "babylonjs-gui/2D/valueAndUnit";

interface IGridPropertyGridComponentProps {
    grid: Grid,
    lockObject: LockObject,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class GridPropertyGridComponent extends React.Component<IGridPropertyGridComponentProps> {
    constructor(props: IGridPropertyGridComponentProps) {
        super(props);
    }

    renderRows() {
        const grid = this.props.grid;
        const rows = [];

        for (var index = 0; index < grid.rowCount; index++) {
            rows.push(grid.getRowDefinition(index)!);
        }

        return (
            rows.map((rd, i) => {
                let newrd = new ValueAndUnit(rd.getValue(grid.host), rd.unit);
                return (
                    <div className="divider" key={`r${i}`}>
                        <FloatLineComponent lockObject={this.props.lockObject} label={`Row ${i}`} target={newrd} propertyName={"_value"} digits={rd.unit == 1 ? 0 : 2}
                            onChange={(newValue) => {
                                grid.setRowDefinition(i, newValue, newrd.unit == 1 ? true : false);
                            }} />
                        <CheckBoxLineComponent label="" target={newrd} propertyName={"unit"} onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            onValueChanged={() => {
                                grid.setRowDefinition(i, newrd.getValue(grid.host), newrd.unit == 1 ? true : false); 
                            }} />
                    </div>
                )
            })
        );
    }

    renderColumns() {
        const grid = this.props.grid;
        const cols = [];

        for (var index = 0; index < grid.columnCount; index++) {
            cols.push(grid.getColumnDefinition(index)!);
        }

        return (
            cols.map((cd, i) => {
                let newcd = new ValueAndUnit(cd.getValue(grid.host), cd.unit);
                return (
                    <div className="divider">
                        <FloatLineComponent key={`c${i}`} label={`Column ${i}`} target={newcd} propertyName={"_value"} digits={cd.unit == 1 ? 0 : 2}
                            onChange={(newValue) => {
                                grid.setColumnDefinition(i, newValue, newcd.unit == 1 ? true : false);
                                this.forceUpdate();
                            }} />
                        <CheckBoxLineComponent label="" target={newcd} propertyName={"unit"} onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            onValueChanged={() => {
                                grid.setColumnDefinition(i, newcd.getValue(grid.host), newcd.unit == 1 ? true : false );
                                this.forceUpdate();
                            }} />
                    </div>
                )
            })
        );
    }

    render() {
        const grid = this.props.grid;

        const cols = [];



        for (var index = 0; index < grid.rowCount; index++) {
            cols.push(grid.getColumnDefinition(index));
        }

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent lockObject={this.props.lockObject} control={grid} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <hr className="ge" />
                <TextLineComponent tooltip="" label="GRID" value=" " color="grey"></TextLineComponent>
                <ButtonLineComponent
                    label="ADD ROW"
                    onClick={() => {
                        grid.addRowDefinition(0.5);
                        this.forceUpdate();
                    }}
                />                <ButtonLineComponent
                    label="REMOVE ROW"
                    onClick={() => {
                        grid.removeRowDefinition(grid.rowCount - 1);
                        this.forceUpdate();
                    }}
                />

                {
                    this.renderRows()
                }
                <hr className="ge" />
                <ButtonLineComponent
                    label="ADD COLUMN"
                    onClick={() => {
                        grid.addColumnDefinition(0.5);
                        this.forceUpdate();
                    }}
                />
                <ButtonLineComponent
                    label="REMOVE COLUMN"
                    onClick={() => {
                        grid.removeColumnDefinition(grid.columnCount - 1);
                        this.forceUpdate();
                    }}
                />
                {
                    this.renderColumns()

                }
            </div>
        );
    }
}