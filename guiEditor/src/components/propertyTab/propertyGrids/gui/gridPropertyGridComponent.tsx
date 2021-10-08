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
import { Nullable } from "babylonjs/types";
import { TextInputLineComponent } from "../../../../sharedUiComponents/lines/textInputLineComponent";

interface IGridPropertyGridComponentProps {
    grid: Grid,
    lockObject: LockObject,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class GridPropertyGridComponent extends React.Component<IGridPropertyGridComponentProps> {
    constructor(props: IGridPropertyGridComponentProps) {
        super(props);
    }
    private _removingColumn: boolean = false;
    private _removingRow: boolean = false;
    private _previousGrid: Nullable<Grid> = null;
    private _rowDefinitions: string[] = [];
    private _rowEditFlags: boolean[] = [];
    private _columnEditFlags: boolean[] = [];
    private _columnDefinitions: string[] = [];

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

    setValues() {
        const grid = this.props.grid;
        this._rowDefinitions = [];
        this._columnDefinitions = [];
        this._columnEditFlags = [];
        this._rowEditFlags = [];
        for (var index = 0; index < grid.columnCount; index++) {
            const value = grid.getColumnDefinition(index);
            if (value) {
                this._columnDefinitions.push(value.toString(grid._host, 2));
                this._columnEditFlags.push(false);
            }
        }
    }

    renderColumns() {
        const grid = this.props.grid;
        const cols = [];

        for (var index = 0; index < grid.columnCount; index++) {
            cols.push(grid.getColumnDefinition(index)!);
        }
        return (
            this._columnDefinitions.map((cd, i) => {
                return (
                    <div className="divider">
                        <TextInputLineComponent lockObject={this.props.lockObject} key={`c${i}`} label={`Column ${i}`} value={cd} numbersOnly={true}
                            onChange={(newValue) => {
                                this._columnDefinitions[i] = newValue;
                                this._columnEditFlags[i] = true;
                            }} />
                    </div>
                )
            })
        );
    }

    resizeRow() {
        const grid = this.props.grid;
        let total = 0;
        for (let i = 0; i < grid.rowCount; ++i) {
            let rd = grid.getRowDefinition(i);
            if (rd?.isPercentage) {
                total += rd?.getValue(grid.host);
            }
        }
        if (total != 1.0) {
            let difference = total - 1.0;
            let diff = Math.abs(difference);
            for (let i = 0; i < grid.rowCount; ++i) {
                let rd = grid.getRowDefinition(i);
                if (rd?.isPercentage) {
                    let value = rd?.getValue(grid.host);
                    let weighted = diff * (value / total);
                    grid.setRowDefinition(i, difference > 0 ? value - weighted : value + weighted);
                }
            }
        }
    }

    resizeColumn() {
        const grid = this.props.grid;
        let total = 0;
        let editCount = 0;
        let percentCount = 0;
        let columnValues: number[] = [];
        for (let i = 0; i < this._columnDefinitions.length; ++i) {
            let value = this._columnDefinitions[i];
            let percent = this.checkPercentage(value);
            if (this._columnEditFlags[i]) {
                value = this.checkValue(value, percent);
                if (percent) { 
                    editCount++; 
                }
            }

            if (percent) {
                percentCount++;
                let valueAsInt = parseInt(value.substring(0, value.length - 1));
                total += valueAsInt / 100;
                columnValues.push(valueAsInt / 100);
            }
            else {
                let valueAsInt = parseInt(value.substring(0, value.length - 2));
                columnValues.push(valueAsInt);
            }
        }

        let allEdited = editCount === percentCount;

        if (total > 1.0 || allEdited) {
            let difference = total - 1.0;
            let diff = Math.abs(difference);
            for (let i = 0; i < grid.columnCount; ++i) {
                if (this.checkPercentage(this._columnDefinitions[i])) {
                    let value = columnValues[i];
                    let weighted = diff * (value / total);
                    columnValues[i] = difference > 0 ? value - weighted : value + weighted;
                }
            }
        } else if (total < 1.0) {
            let difference = 1.0 - total;
            for (let i = 0; i < grid.columnCount; ++i) {
                if (this.checkPercentage(this._columnDefinitions[i]) && this._columnEditFlags[i]) {
                    let value = columnValues[i];
                    total -= value;
                }
            }
            for (let i = 0; i < grid.columnCount; ++i) {
                if (this.checkPercentage(this._columnDefinitions[i]) && !this._columnEditFlags[i]) {
                    let value = columnValues[i];
                    let weighted = difference * (value / total);
                    columnValues[i] = value + weighted;
                }
            }
        }

        for (let i = 0; i < this._columnDefinitions.length; ++i) {
            grid.setColumnDefinition(i, columnValues[i], !this.checkPercentage(this._columnDefinitions[i]));
        }

        this.setValues();
        this.forceUpdate();
    }

    checkValue(value: string, percent: boolean): string {
        let newValue = value.match(/([\d\.\,]+)/g)?.[0];
        if (!newValue) {
            newValue = '0';
        }
        newValue += percent ? '%' : 'px';
        return newValue;
    }

    checkPercentage(value: string): boolean {
        if (value.charAt(value.length - 1) === 'x' && value.charAt(value.length - 2) === 'p') {
            return false;
        }
        return true;
    }

    render() {
        const grid = this.props.grid;
        if (grid !== this._previousGrid) {
            this._removingColumn = false;
            this._removingRow = false;
            this._previousGrid = grid;
            this.setValues();
        }

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent lockObject={this.props.lockObject} control={grid} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <hr className="ge" />
                <TextLineComponent tooltip="" label="GRID" value=" " color="grey"></TextLineComponent>
                <ButtonLineComponent
                    label="ADD ROW"
                    onClick={() => {
                        let total = 0;
                        let count = 0;
                        for (let i = 0; i < grid.rowCount; ++i) {
                            let rd = grid.getRowDefinition(i);
                            if (rd?.isPercentage) {
                                total += rd?.getValue(grid.host);
                                count++;
                            }
                        }
                        grid.addRowDefinition(total / count);
                        this.resizeColumn();
                        this.forceUpdate();
                    }}
                />  {(grid.rowCount > 1 && !this._removingRow) && <ButtonLineComponent
                    label="REMOVE ROW"
                    onClick={() => {
                        let hasChild = false;
                        for (let i = 0; i < grid.columnCount; ++i) {
                            let child = grid.cells[(grid.rowCount - 1).toString() + ":" + i.toString()];
                            if (child?.children.length) {
                                hasChild = true;
                                break;
                            }
                        }

                        if (hasChild) {
                            this._removingRow = true;
                        }
                        else {
                            grid.removeRowDefinition(grid.rowCount - 1);
                            this.resizeColumn();
                        }
                        this.forceUpdate();
                    }}
                />}
                {this._removingRow &&
                    <>
                        <TextLineComponent tooltip="" label="Row contains child GUIs. Remove?" value=" " color="grey"></TextLineComponent>
                        <ButtonLineComponent
                            label="REMOVE"
                            onClick={() => {
                                grid.removeRowDefinition(grid.rowCount - 1);
                                this.resizeColumn();
                                this.forceUpdate();
                                this._removingRow = false;
                            }}
                        />
                        <ButtonLineComponent
                            label="CANCEL"
                            onClick={() => {
                                this._removingRow = false;
                                this.forceUpdate();
                            }}
                        /></>}
                {
                    this.renderRows()
                }
                <hr className="ge" />
                <ButtonLineComponent
                    label="ADD COLUMN"
                    onClick={() => {
                        let total = 0;
                        let count = 0;
                        for (let i = 0; i < grid.columnCount; ++i) {
                            let cd = grid.getColumnDefinition(i);
                            if (cd?.isPercentage) {
                                total += cd?.getValue(grid.host);
                                count++;
                            }
                        }
                        grid.addColumnDefinition(total / count, false);
                        this.setValues();
                        this.resizeColumn();
                        this.forceUpdate();
                    }}
                /> {(grid.columnCount > 1 && !this._removingColumn) &&
                    <ButtonLineComponent
                        label="REMOVE COLUMN"
                        onClick={() => {
                            let hasChild = false;
                            for (let i = 0; i < grid.rowCount; ++i) {
                                let child = grid.cells[i.toString() + ":" + (grid.columnCount - 1).toString()];
                                if (child?.children.length) {
                                    hasChild = true;
                                    break;
                                }
                            }

                            if (hasChild) {
                                this._removingColumn = true;
                            }
                            else {
                                grid.removeColumnDefinition(grid.columnCount - 1);
                                this.resizeColumn();
                            }
                            this.forceUpdate();
                        }}
                    />}
                {this._removingColumn &&
                    <>
                        <TextLineComponent tooltip="" label="Column contains child GUIs. Remove?" value=" " color="grey"></TextLineComponent>
                        <ButtonLineComponent
                            label="REMOVE"
                            onClick={() => {
                                grid.removeColumnDefinition(grid.columnCount - 1);
                                this.resizeColumn();
                                this.forceUpdate();
                                this._removingColumn = false;
                            }}
                        />
                        <ButtonLineComponent
                            label="CANCEL"
                            onClick={() => {
                                this._removingColumn = false;
                                this.forceUpdate();
                            }}
                        /></>}
                {
                    this.renderColumns()

                }
                <ButtonLineComponent
                    label="SAVE COLUMN CHANGES"
                    onClick={() => {
                        this.resizeColumn();
                    }}
                />
            </div>
        );
    }
}