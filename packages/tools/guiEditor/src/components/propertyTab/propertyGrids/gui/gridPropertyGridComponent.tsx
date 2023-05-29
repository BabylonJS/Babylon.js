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
import { MathTools } from "gui/2D/math2D";

interface IGridPropertyGridComponentProps {
    grids: Grid[];
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    onFontsParsedObservable?: Observable<void>;
    globalState?: GlobalState;
    onUpdateRequiredObservable?: Observable<void>;
}

interface IGridPropertyComponentState {
    removingColumn: boolean;
    removingRow: boolean;
}

export class GridPropertyGridComponent extends React.Component<IGridPropertyGridComponentProps, IGridPropertyComponentState> {
    constructor(props: IGridPropertyGridComponentProps) {
        super(props);

        this.state = { removingColumn: false, removingRow: false };
    }
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
                <div
                    key={`r${i}`}
                    className={this.state.removingRow && i === this._rowEditFlags.length - 1 ? "ge-grid-remove" : this._rowEditFlags[i] ? "ge-grid-edit" : "ge-grid"}
                >
                    <div className="ge-grid-divider">
                        <TextInputLineComponent
                            lockObject={this.props.lockObject}
                            key={`rText${i}-${this.state.removingRow}`}
                            label=""
                            icon={gridRowIconDark}
                            iconLabel={`Row ${i}`}
                            value={rd}
                            numbersOnly={true}
                            onChange={(newValue) => {
                                if (newValue === this._rowDefinitions[i]) {
                                    return;
                                }
                                this._rowDefinitions[i] = newValue;
                                this._rowEditFlags[i] = true;
                                this._editedRow = true;
                                this._rowChild = false;
                                this.setState({ removingRow: false });
                            }}
                            disabled={this.state.removingRow}
                        />
                        <TextLineComponent tooltip="" label={`[${i}]`} value="" color="grey"></TextLineComponent>
                        {this.state.removingRow && i === this._rowEditFlags.length - 1 && (
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
                    className={this.state.removingColumn && i === this._columnEditFlags.length - 1 ? "ge-grid-remove" : this._columnEditFlags[i] ? "ge-grid-edit" : "ge-grid"}
                >
                    <div className="ge-grid-divider">
                        <TextInputLineComponent
                            lockObject={this.props.lockObject}
                            key={`ctext${i}-${this.state.removingColumn}`}
                            label=""
                            icon={gridColumnIconDark}
                            iconLabel={`Column ${i}`}
                            value={cd}
                            numbersOnly={true}
                            onChange={(newValue) => {
                                if (newValue === this._columnDefinitions[i]) {
                                    return;
                                }
                                this._columnDefinitions[i] = newValue;
                                this._columnEditFlags[i] = true;
                                this._editedColumn = true;
                                this._columnChild = false;
                                this.setState({ removingColumn: false });
                            }}
                            disabled={this.state.removingColumn}
                        />
                        <TextLineComponent tooltip="" label={`[${i}]`} value="" color="grey"></TextLineComponent>
                        {this.state.removingColumn && i === this._columnEditFlags.length - 1 && (
                            <TextLineComponent icon={deleteGridElementDark} label=" " value=" " color="grey"></TextLineComponent>
                        )}
                        {this._columnEditFlags[i] && <TextLineComponent icon={valueChangedGridDark} label=" " value=" " color="grey"></TextLineComponent>}
                    </div>
                </div>
            );
        });
    }

    parsePercentage(value: string) {
        let floatResult;
        if (value.trim().at(-1) === "%") {
            floatResult = parseFloat(value.replace("%", "")) / 100;
        } else {
            floatResult = parseFloat(value);
        }
        return MathTools.Round(floatResult, 10000);
    }

    isCloseTo(value: number, expected: number, epsilon: number = 0.001) {
        return Math.abs(value - expected) < epsilon;
    }

    adjustPercentages(definitions: string[], editFlags: boolean[]): string[] {
        let percentageTotal = 0;
        let modifiedEntriesPercentageTotal = 0;

        const cellValues: string[] = [];

        for (let i = 0; i < definitions.length; ++i) {
            let value = definitions[i];
            const percent = this.checkPercentage(value);
            if (editFlags[i]) {
                value = this.checkValue(value, percent);
            }
            if (percent) {
                percentageTotal += this.parsePercentage(value);
                if (editFlags[i]) {
                    modifiedEntriesPercentageTotal += this.parsePercentage(value);
                }
            }
            cellValues.push(value);
        }

        let modifiedCellValues = [];

        // If the total percentage is not 100% we need to adjust the values based on the remaining percentage that was not modified by the user;
        // If the remaining percentage is 0% we need to resize the modified entries to fit the remaining space
        if (this.isCloseTo(percentageTotal, 1)) {
            modifiedCellValues = cellValues;
        } else {
            const absoluteRemainingPercentage = 1 - modifiedEntriesPercentageTotal;
            const magnitudeRemainingPercentage = Math.abs(absoluteRemainingPercentage);
            const unmodifiedEntriesPercentage = percentageTotal - modifiedEntriesPercentageTotal;

            const resizeModifiedEntries = this.isCloseTo(unmodifiedEntriesPercentage, 0);
            for (let i = 0; i < cellValues.length; ++i) {
                const value = cellValues[i];
                const percent = this.checkPercentage(value);
                if ((percent && !editFlags[i]) || (editFlags[i] && resizeModifiedEntries)) {
                    const parsedValue = this.parsePercentage(value);
                    const entryWeight = parsedValue / (resizeModifiedEntries ? percentageTotal : unmodifiedEntriesPercentage);
                    const newEntryValue = entryWeight * (resizeModifiedEntries ? 1 : magnitudeRemainingPercentage);
                    modifiedCellValues.push(`${newEntryValue * 100}%`);
                } else {
                    modifiedCellValues.push(value);
                }
            }
        }

        return modifiedCellValues;
    }

    resizeRow() {
        const grid = this.props.grids[0];

        const modifiedRowValues = this.adjustPercentages(this._rowDefinitions, this._rowEditFlags);

        for (let i = 0; i < modifiedRowValues.length; ++i) {
            grid.setRowDefinition(i, this.parsePercentage(modifiedRowValues[i]), !this.checkPercentage(modifiedRowValues[i]));
        }

        this.setRowValues();
    }

    resizeColumn() {
        const grid = this.props.grids[0];

        const columnValues = this.adjustPercentages(this._columnDefinitions, this._columnEditFlags);

        for (let i = 0; i < columnValues.length; ++i) {
            grid.setColumnDefinition(i, this.parsePercentage(columnValues[i]), !this.checkPercentage(this._columnDefinitions[i]));
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
        this._columnChild = false;
        this._rowChild = false;
        this._previousGrid = grid;
        this.setRowValues();
        this.setColumnValues();
        this.resizeColumn();
        this.resizeRow();

        this.setState({ removingColumn: false, removingRow: false });
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
                                    disabled={this.state.removingRow || this._editedRow}
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
                                    isActive={false}
                                    disabled={this.state.removingRow || grid.rowCount <= 1 || this._editedRow}
                                    onClick={() => {
                                        let hasChild = false;
                                        for (let i = 0; i < grid.columnCount; ++i) {
                                            const child = grid.cells[grid.rowCount - 1 + ":" + i];
                                            if (child?.children.length) {
                                                hasChild = true;
                                                break;
                                            }
                                        }
                                        this.resetValues();
                                        if (hasChild) {
                                            this._rowChild = true;
                                        }
                                        this.setState({ removingRow: true });
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
                                {this.state.removingRow && (
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
                                                this.setState({ removingRow: false });
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
                                                this.setState({ removingRow: false });
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
                                disabled={this.state.removingColumn || this._editedColumn}
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
                                isActive={false}
                                disabled={this.state.removingColumn || this._editedColumn || grid.columnCount <= 1}
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
                                    this.setState({ removingColumn: true });
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
                            {this.state.removingColumn && (
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
                                            this.setState({ removingColumn: false });
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
                                            this.setState({ removingColumn: false });
                                            this._columnChild = false;
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
