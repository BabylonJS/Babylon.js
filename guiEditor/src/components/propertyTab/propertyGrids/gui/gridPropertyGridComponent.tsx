import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../sharedUiComponents/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import { LockObject } from "../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { Grid } from "babylonjs-gui/2D/controls/grid";
import { TextLineComponent } from "../../../../sharedUiComponents/lines/textLineComponent";
import { ButtonLineComponent } from "../../../../sharedUiComponents/lines/buttonLineComponent";
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
        return (
            this._rowDefinitions.map((rd, i) => {
                return (
                    <div className="divider">
                        <TextInputLineComponent lockObject={this.props.lockObject} key={`r${i}`} label={`Row ${i}`} value={rd} numbersOnly={true}
                            onChange={(newValue) => {
                                this._rowDefinitions[i] = newValue;
                                this._rowEditFlags[i] = true;
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
        for (var index = 0; index < grid.rowCount; index++) {
            const value = grid.getRowDefinition(index);
            if (value) {
                this._rowDefinitions.push(value.toString(grid._host, 2));
                this._rowEditFlags.push(false);
            }
        }
    }

    renderColumns() {
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
        let editCount = 0;
        let percentCount = 0;
        let rowValues: number[] = [];
        for (let i = 0; i < this._rowDefinitions.length; ++i) {
            let value = this._rowDefinitions[i];
            let percent = this.checkPercentage(value);
            if (this._rowEditFlags[i]) {
                value = this.checkValue(value, percent);
                if (percent) {
                    editCount++;
                }
            }

            if (percent) {
                percentCount++;
                let valueAsInt = parseInt(value.substring(0, value.length - 1));
                total += valueAsInt / 100;
                rowValues.push(valueAsInt / 100);
            }
            else {
                let valueAsInt = parseInt(value.substring(0, value.length - 2));
                rowValues.push(valueAsInt);
            }
        }

        let allEdited = editCount === percentCount;

        if (total > 1.0 || allEdited) {
            let difference = total - 1.0;
            let diff = Math.abs(difference);
            for (let i = 0; i < grid.rowCount; ++i) {
                if (this.checkPercentage(this._rowDefinitions[i])) {
                    let value = rowValues[i];
                    let weighted = diff * (value / total);
                    rowValues[i] = difference > 0 ? value - weighted : value + weighted;
                }
            }
        } else if (total < 1.0) {
            let difference = 1.0 - total;
            for (let i = 0; i < grid.rowCount; ++i) {
                if (this.checkPercentage(this._rowDefinitions[i]) && this._rowEditFlags[i]) {
                    let value = rowValues[i];
                    total -= value;
                }
            }
            for (let i = 0; i < grid.rowCount; ++i) {
                if (this.checkPercentage(this._rowDefinitions[i]) && !this._rowEditFlags[i]) {
                    let value = rowValues[i];
                    let weighted = difference * (value / total);
                    rowValues[i] = value + weighted;
                }
            }
        }

        for (let i = 0; i < this._rowDefinitions.length; ++i) {
            grid.setRowDefinition(i, rowValues[i], !this.checkPercentage(this._rowDefinitions[i]));
        }

        this.setValues();
        this.forceUpdate();
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
        let newValue = value.match(/([0-9.,]+)/g)?.[0];
        if (!newValue) {
            newValue = '0';
        }
        newValue += percent ? '%' : 'px';
        return newValue;
    }

    checkPercentage(value: string): boolean {
        const toSearch = 'px';
        return value.substring(value.length - toSearch.length, value.length) !== toSearch;
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
                        grid.addRowDefinition(total / count, false);
                        this.setValues();
                        this.resizeRow();
                        this.forceUpdate();
                    }}
                />  {(grid.rowCount > 1 && !this._removingRow) && <ButtonLineComponent
                    label="REMOVE ROW"
                    onClick={() => {
                        let hasChild = false;
                        for (let i = 0; i < grid.columnCount; ++i) {
                            const child = grid.cells[(grid.rowCount - 1) + ":" + i];
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
                            this.setValues();
                            this.resizeRow();
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
                                this.setValues();
                                this.resizeRow();
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
                <ButtonLineComponent
                    label="SAVE ROW CHANGES"
                    onClick={() => {
                        this.resizeRow();
                    }}
                />
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
                                const child = grid.cells[i + ":" + (grid.columnCount - 1)];
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
                                this.setValues();
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
                                this.setValues();
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