import * as React from "react";
import type { Observable } from "core/Misc/observable";
import type { PropertyChangedEvent } from "shared-ui-components/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { Grid } from "gui/2D/controls/grid";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import type { Nullable } from "core/types";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import { CommandButtonComponent } from "../../../commandButtonComponent";

import gridColumnIconDark from "shared-ui-components/imgs/gridColumnIconDark.svg";
import gridRowIconDark from "shared-ui-components/imgs/gridRowIconDark.svg";
import confirmGridElementDark from "shared-ui-components/imgs/confirmGridElementDark.svg";
import subtractGridElementDark from "shared-ui-components/imgs/subtractGridElementDark.svg";
import addGridElementDark from "shared-ui-components/imgs/addGridElementDark.svg";
import cancelGridElementDark from "shared-ui-components/imgs/cancelGridElementDark.svg";
import valueChangedGridDark from "shared-ui-components/imgs/valueChangedGridDark.svg";
import deleteGridElementDark from "shared-ui-components/imgs/deleteGridElementDark.svg";
import type { GlobalState } from "../../../../globalState";

interface IGridPropertyGridComponentProps {
    grids: Grid[];
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    onFontsParsedObservable?: Observable<void>;
    globalState?: GlobalState;
    onUpdateRequiredObservable?: Observable<void>;
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
    private _editedRow: boolean = false;
    private _editedColumn: boolean = false;
    private _rowChild: boolean = false;
    private _columnChild: boolean = false;

    renderRows() {
        return this._rowDefinitions.map((rd, i) => {
            return (
                <div key={`r${i}`} className={this._removingRow && i === this._rowEditFlags.length - 1 ? "ge-grid-remove" : this._rowEditFlags[i] ? "ge-grid-edit" : "ge-grid"}>
                    <div className="ge-grid-divider">
                        <TextInputLineComponent
                            lockObject={this.props.lockObject}
                            key={`rText${i}`}
                            label=""
                            icon={gridColumnIconDark}
                            iconLabel={`Row ${i}`}
                            value={rd}
                            numbersOnly={true}
                            onChange={(newValue) => {
                                this._rowDefinitions[i] = newValue;
                                this._rowEditFlags[i] = true;
                                this._editedRow = true;
                                this._removingRow = false;
                                this._rowChild = false;
                                this.forceUpdate();
                            }}
                        />
                        <TextLineComponent tooltip="" label={`[${i}]`} value="" color="grey"></TextLineComponent>
                        {this._removingRow && i === this._rowEditFlags.length - 1 && (
                            <TextLineComponent icon={deleteGridElementDark} label=" " value=" " color="grey"></TextLineComponent>
                        )}
                        {this._rowEditFlags[i] && <TextLineComponent icon={valueChangedGridDark} label=" " value=" " color="grey"></TextLineComponent>}
                    </div>
                </div>
            );
        });
    }

    setRowValues() {
        const grid = this.props.grids[0];
        this._rowDefinitions = [];
        this._rowEditFlags = [];
        this._editedRow = false;
        for (let index = 0; index < grid.rowCount; index++) {
            const value = grid.getRowDefinition(index);
            if (value) {
                this._rowDefinitions.push(value.toString(grid._host, 2));
                this._rowEditFlags.push(false);
            }
        }
    }

    setColumnValues() {
        const grid = this.props.grids[0];
        this._columnDefinitions = [];
        this._columnEditFlags = [];
        this._editedColumn = false;
        for (let index = 0; index < grid.columnCount; index++) {
            const value = grid.getColumnDefinition(index);
            if (value) {
                this._columnDefinitions.push(value.toString(grid._host, 2));
                this._columnEditFlags.push(false);
            }
        }
    }

    renderColumns() {
        return this._columnDefinitions.map((cd, i) => {
            return (
                <div
                    key={`c${i}`}
                    className={this._removingColumn && i === this._columnEditFlags.length - 1 ? "ge-grid-remove" : this._columnEditFlags[i] ? "ge-grid-edit" : "ge-grid"}
                >
                    <div className="ge-grid-divider">
                        <TextInputLineComponent
                            lockObject={this.props.lockObject}
                            key={`ctext${i}`}
                            label=""
                            icon={gridRowIconDark}
                            iconLabel={`Column ${i}`}
                            value={cd}
                            numbersOnly={true}
                            onChange={(newValue) => {
                                this._columnDefinitions[i] = newValue;
                                this._columnEditFlags[i] = true;
                                this._editedColumn = true;
                                this._removingColumn = false;
                                this._columnChild = false;
                                this.forceUpdate();
                            }}
                        />
                        <TextLineComponent tooltip="" label={`[${i}]`} value="" color="grey"></TextLineComponent>
                        {this._removingColumn && i === this._columnEditFlags.length - 1 && (
                            <TextLineComponent icon={deleteGridElementDark} label=" " value=" " color="grey"></TextLineComponent>
                        )}
                        {this._columnEditFlags[i] && <TextLineComponent icon={valueChangedGridDark} label=" " value=" " color="grey"></TextLineComponent>}
                    </div>
                </div>
            );
        });
    }

    resizeRow() {
        const grid = this.props.grids[0];
        let total = 0;
        let editCount = 0;
        let percentCount = 0;
        const rowValues: number[] = [];
        for (let i = 0; i < this._rowDefinitions.length; ++i) {
            let value = this._rowDefinitions[i];
            const percent = this.checkPercentage(value);
            if (this._rowEditFlags[i]) {
                value = this.checkValue(value, percent);
                if (percent) {
                    editCount++;
                }
            }

            if (percent) {
                percentCount++;
                const valueAsInt = parseInt(value.substring(0, value.length - 1));
                total += valueAsInt / 100;
                rowValues.push(valueAsInt / 100);
            } else {
                const valueAsInt = parseInt(value.substring(0, value.length - 2));
                rowValues.push(valueAsInt);
            }
        }

        const allEdited = editCount === percentCount;

        if (total > 1.0 || allEdited) {
            const difference = total - 1.0;
            const diff = Math.abs(difference);
            for (let i = 0; i < grid.rowCount; ++i) {
                if (this.checkPercentage(this._rowDefinitions[i])) {
                    const value = rowValues[i];
                    const weighted = diff * (value / total);
                    rowValues[i] = difference > 0 ? value - weighted : value + weighted;
                }
            }
        } else if (total < 1.0) {
            const difference = 1.0 - total;
            for (let i = 0; i < grid.rowCount; ++i) {
                if (this.checkPercentage(this._rowDefinitions[i]) && this._rowEditFlags[i]) {
                    const value = rowValues[i];
                    total -= value;
                }
            }
            for (let i = 0; i < grid.rowCount; ++i) {
                if (this.checkPercentage(this._rowDefinitions[i]) && !this._rowEditFlags[i]) {
                    const value = rowValues[i];
                    const weighted = difference * (value / total);
                    rowValues[i] = value + weighted;
                }
            }
        }

        for (let i = 0; i < this._rowDefinitions.length; ++i) {
            grid.setRowDefinition(i, rowValues[i], !this.checkPercentage(this._rowDefinitions[i]));
        }

        this.setRowValues();
    }

    resizeColumn() {
        const grid = this.props.grids[0];
        let total = 0;
        let editCount = 0;
        let percentCount = 0;
        const columnValues: number[] = [];
        for (let i = 0; i < this._columnDefinitions.length; ++i) {
            let value = this._columnDefinitions[i];
            const percent = this.checkPercentage(value);
            if (this._columnEditFlags[i]) {
                value = this.checkValue(value, percent);
                if (percent) {
                    editCount++;
                }
            }

            if (percent) {
                percentCount++;
                const valueAsInt = parseInt(value.substring(0, value.length - 1));
                total += valueAsInt / 100;
                columnValues.push(valueAsInt / 100);
            } else {
                const valueAsInt = parseInt(value.substring(0, value.length - 2));
                columnValues.push(valueAsInt);
            }
        }

        const allEdited = editCount === percentCount;

        if (total > 1.0 || allEdited) {
            const difference = total - 1.0;
            const diff = Math.abs(difference);
            for (let i = 0; i < grid.columnCount; ++i) {
                if (this.checkPercentage(this._columnDefinitions[i])) {
                    const value = columnValues[i];
                    const weighted = diff * (value / total);
                    columnValues[i] = difference > 0 ? value - weighted : value + weighted;
                }
            }
        } else if (total < 1.0) {
            const difference = 1.0 - total;
            for (let i = 0; i < grid.columnCount; ++i) {
                if (this.checkPercentage(this._columnDefinitions[i]) && this._columnEditFlags[i]) {
                    const value = columnValues[i];
                    total -= value;
                }
            }
            for (let i = 0; i < grid.columnCount; ++i) {
                if (this.checkPercentage(this._columnDefinitions[i]) && !this._columnEditFlags[i]) {
                    const value = columnValues[i];
                    const weighted = difference * (value / total);
                    columnValues[i] = value + weighted;
                }
            }
        }

        for (let i = 0; i < this._columnDefinitions.length; ++i) {
            grid.setColumnDefinition(i, columnValues[i], !this.checkPercentage(this._columnDefinitions[i]));
        }

        this.setColumnValues();
    }

    checkValue(value: string, percent: boolean): string {
        let newValue = value.match(/([0-9.,]+)/g)?.[0];
        if (!newValue) {
            newValue = "0";
        }
        newValue += percent ? "%" : "px";
        return newValue;
    }

    checkPercentage(value: string): boolean {
        const toSearch = "px";
        return value.substring(value.length - toSearch.length, value.length) !== toSearch;
    }

    resetValues() {
        const grid = this.props.grids[0];
        this._removingColumn = false;
        this._removingRow = false;
        this._columnChild = false;
        this._rowChild = false;
        this._previousGrid = grid;
        this.setRowValues();
        this.setColumnValues();
        this.resizeColumn();
        this.resizeRow();
    }

    render() {
        const grids = this.props.grids;
        const grid = this.props.grids[0];
        if (grid !== this._previousGrid) {
            this.resetValues();
        }

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent
                    lockObject={this.props.lockObject}
                    controls={grids}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    onFontsParsedObservable={this.props.onFontsParsedObservable}
                    globalState={this.props.globalState}
                />
                <hr className="ge" />
                <TextLineComponent tooltip="" label="GRID" value=" " color="grey"></TextLineComponent>
                {this.renderRows()}
                {this.props.grids.length === 1 && (
                    <>
                        <div className="ge-gridLine">
                            <div className="ge-grid-button-divider">
                                <CommandButtonComponent
                                    altStyle={true}
                                    tooltip="Add Row"
                                    icon={addGridElementDark}
                                    shortcut=""
                                    isActive={false}
                                    onClick={() => {
                                        let total = 0;
                                        let count = 0;
                                        for (let i = 0; i < grid.rowCount; ++i) {
                                            const rd = grid.getRowDefinition(i);
                                            if (rd?.isPercentage) {
                                                total += rd?.getValue(grid.host);
                                                count++;
                                            }
                                        }
                                        grid.addRowDefinition(total / count, false);
                                        this.resetValues();
                                        this.forceUpdate();
                                    }}
                                />{" "}
                                <CommandButtonComponent
                                    altStyle={true}
                                    tooltip="Remove Row"
                                    icon={subtractGridElementDark}
                                    shortcut=""
                                    isActive={this._removingRow}
                                    disabled={grid.rowCount <= 1}
                                    onClick={() => {
                                        let hasChild = false;
                                        for (let i = 0; i < grid.columnCount; ++i) {
                                            const child = grid.cells[grid.rowCount - 1 + ":" + i];
                                            if (child?.children.length) {
                                                hasChild = true;
                                                break;
                                                //(grid.rowCount > 1 && !this._removingRow)
                                            }
                                        }

                                        this.resetValues();
                                        if (hasChild) {
                                            this._rowChild = true;
                                        }
                                        this._removingRow = true;
                                        this.forceUpdate();
                                    }}
                                />
                                {this._editedRow && (
                                    <>
                                        {" "}
                                        <CommandButtonComponent
                                            altStyle={true}
                                            tooltip="Confirm"
                                            icon={confirmGridElementDark}
                                            shortcut=""
                                            isActive={false}
                                            onClick={() => {
                                                this.resizeRow();
                                                this.forceUpdate();
                                            }}
                                        />
                                        <CommandButtonComponent
                                            altStyle={true}
                                            tooltip="Cancel"
                                            icon={cancelGridElementDark}
                                            shortcut=""
                                            isActive={false}
                                            onClick={() => {
                                                this.resetValues();
                                                this.forceUpdate();
                                            }}
                                        />
                                    </>
                                )}
                                {this._removingRow && (
                                    <>
                                        <CommandButtonComponent
                                            altStyle={true}
                                            tooltip="Confirm"
                                            icon={confirmGridElementDark}
                                            shortcut=""
                                            isActive={false}
                                            onClick={() => {
                                                grid.removeRowDefinition(grid.rowCount - 1);
                                                this.setRowValues();
                                                this.resizeRow();
                                                this.forceUpdate();
                                                this._removingRow = false;
                                                this._rowChild = false;
                                                this.props.onUpdateRequiredObservable?.notifyObservers();
                                            }}
                                        />
                                        <CommandButtonComponent
                                            altStyle={true}
                                            tooltip="Cancel"
                                            icon={cancelGridElementDark}
                                            shortcut=""
                                            isActive={false}
                                            onClick={() => {
                                                this._removingRow = false;
                                                this._rowChild = false;
                                                this.forceUpdate();
                                            }}
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                        {this._rowChild && (
                            <>
                                <TextLineComponent
                                    tooltip=""
                                    label="This row is not empty. Removing it will delete all contained controls. Do you want to remove this row and delete all controls within?"
                                    value=" "
                                    color="grey"
                                ></TextLineComponent>
                            </>
                        )}
                        <hr className="ge" />
                        {this.renderColumns()}
                        <div className="ge-grid-button-divider">
                            <CommandButtonComponent
                                altStyle={true}
                                tooltip="Add Column"
                                icon={addGridElementDark}
                                shortcut=""
                                isActive={false}
                                onClick={() => {
                                    let total = 0;
                                    let count = 0;
                                    for (let i = 0; i < grid.columnCount; ++i) {
                                        const cd = grid.getColumnDefinition(i);
                                        if (cd?.isPercentage) {
                                            total += cd?.getValue(grid.host);
                                            count++;
                                        }
                                    }
                                    grid.addColumnDefinition(total / count, false);
                                    this.resetValues();
                                    this.forceUpdate();
                                }}
                            />
                            <CommandButtonComponent
                                altStyle={true}
                                tooltip="Remove Column"
                                icon={subtractGridElementDark}
                                shortcut=""
                                isActive={this._removingColumn}
                                disabled={grid.columnCount <= 1}
                                onClick={() => {
                                    let hasChild = false;
                                    for (let i = 0; i < grid.rowCount; ++i) {
                                        const child = grid.cells[i + ":" + (grid.columnCount - 1)];
                                        if (child?.children.length) {
                                            hasChild = true;
                                            break;
                                        }
                                    }
                                    this.resetValues();
                                    if (hasChild) {
                                        this._columnChild = true;
                                    }
                                    this._removingColumn = true;
                                    this.forceUpdate();
                                }}
                            />
                            {this._editedColumn && (
                                <>
                                    <CommandButtonComponent
                                        altStyle={true}
                                        tooltip="Confirm"
                                        icon={confirmGridElementDark}
                                        shortcut=""
                                        isActive={false}
                                        onClick={() => {
                                            this.resizeColumn();
                                            this.forceUpdate();
                                        }}
                                    />
                                    <CommandButtonComponent
                                        altStyle={true}
                                        tooltip="Cancel"
                                        icon={cancelGridElementDark}
                                        shortcut=""
                                        isActive={false}
                                        onClick={() => {
                                            this.resetValues();
                                            this.forceUpdate();
                                        }}
                                    />
                                </>
                            )}
                            {this._removingColumn && (
                                <>
                                    <CommandButtonComponent
                                        altStyle={true}
                                        tooltip="Confirm"
                                        icon={confirmGridElementDark}
                                        shortcut=""
                                        isActive={false}
                                        onClick={() => {
                                            grid.removeColumnDefinition(grid.columnCount - 1);
                                            this.setColumnValues();
                                            this.resizeColumn();
                                            this.forceUpdate();
                                            this._removingColumn = false;
                                            this._columnChild = false;
                                            this.props.onUpdateRequiredObservable?.notifyObservers();
                                        }}
                                    />
                                    <CommandButtonComponent
                                        altStyle={true}
                                        tooltip="Cancel"
                                        icon={cancelGridElementDark}
                                        shortcut=""
                                        isActive={false}
                                        onClick={() => {
                                            this._removingColumn = false;
                                            this._columnChild = false;
                                            this.forceUpdate();
                                        }}
                                    />
                                </>
                            )}{" "}
                        </div>
                        {this._columnChild && (
                            <>
                                <TextLineComponent
                                    tooltip=""
                                    label="This column is not empty. Removing it will delete all contained controls. Do you want to remove this column and delete all controls within?"
                                    value=" "
                                    color="grey"
                                ></TextLineComponent>
                            </>
                        )}
                    </>
                )}
            </div>
        );
    }
}
