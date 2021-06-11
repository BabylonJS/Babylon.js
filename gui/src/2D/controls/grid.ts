import { Nullable } from "babylonjs/types";

import { Container } from "./container";
import { ValueAndUnit } from "../valueAndUnit";
import { Control } from "./control";
import { Measure } from "../measure";
import { Tools } from 'babylonjs/Misc/tools';
import { _TypeStore } from 'babylonjs/Misc/typeStore';
import { ICanvasRenderingContext } from "babylonjs/Engines/ICanvas";

/**
 * Class used to create a 2D grid container
 */
export class Grid extends Container {
    private _rowDefinitions = new Array<ValueAndUnit>();
    private _columnDefinitions = new Array<ValueAndUnit>();
    private _cells: { [key: string]: Container } = {};
    private _childControls = new Array<Control>();

    /**
     * Gets the number of columns
     */
    public get columnCount(): number {
        return this._columnDefinitions.length;
    }

    /**
     * Gets the number of rows
     */
    public get rowCount(): number {
        return this._rowDefinitions.length;
    }

    /** Gets the list of children */
    public get children(): Control[] {
        return this._childControls;
    }

    /** Gets the list of cells (e.g. the containers) */
    public get cells(): { [key: string]: Container } {
        return this._cells;
    }

    /**
     * Gets the definition of a specific row
     * @param index defines the index of the row
     * @returns the row definition
     */
    public getRowDefinition(index: number): Nullable<ValueAndUnit> {
        if (index < 0 || index >= this._rowDefinitions.length) {
            return null;
        }

        return this._rowDefinitions[index];
    }

    /**
     * Gets the definition of a specific column
     * @param index defines the index of the column
     * @returns the column definition
     */
    public getColumnDefinition(index: number): Nullable<ValueAndUnit> {
        if (index < 0 || index >= this._columnDefinitions.length) {
            return null;
        }

        return this._columnDefinitions[index];
    }

    /**
     * Adds a new row to the grid
     * @param height defines the height of the row (either in pixel or a value between 0 and 1)
     * @param isPixel defines if the height is expressed in pixel (or in percentage)
     * @returns the current grid
     */
    public addRowDefinition(height: number, isPixel = false): Grid {
        this._rowDefinitions.push(new ValueAndUnit(height, isPixel ? ValueAndUnit.UNITMODE_PIXEL : ValueAndUnit.UNITMODE_PERCENTAGE));

        this._markAsDirty();

        return this;
    }

    /**
     * Adds a new column to the grid
     * @param width defines the width of the column (either in pixel or a value between 0 and 1)
     * @param isPixel defines if the width is expressed in pixel (or in percentage)
     * @returns the current grid
     */
    public addColumnDefinition(width: number, isPixel = false): Grid {
        this._columnDefinitions.push(new ValueAndUnit(width, isPixel ? ValueAndUnit.UNITMODE_PIXEL : ValueAndUnit.UNITMODE_PERCENTAGE));

        this._markAsDirty();

        return this;
    }

    /**
     * Update a row definition
     * @param index defines the index of the row to update
     * @param height defines the height of the row (either in pixel or a value between 0 and 1)
     * @param isPixel defines if the weight is expressed in pixel (or in percentage)
     * @returns the current grid
     */
    public setRowDefinition(index: number, height: number, isPixel = false): Grid {
        if (index < 0 || index >= this._rowDefinitions.length) {
            return this;
        }

        let current = this._rowDefinitions[index];
        if (current && current.isPixel === isPixel && current.internalValue === height) {
            return this;
        }

        this._rowDefinitions[index] = new ValueAndUnit(height, isPixel ? ValueAndUnit.UNITMODE_PIXEL : ValueAndUnit.UNITMODE_PERCENTAGE);

        this._markAsDirty();

        return this;
    }

    /**
     * Update a column definition
     * @param index defines the index of the column to update
     * @param width defines the width of the column (either in pixel or a value between 0 and 1)
     * @param isPixel defines if the width is expressed in pixel (or in percentage)
     * @returns the current grid
     */
    public setColumnDefinition(index: number, width: number, isPixel = false): Grid {
        if (index < 0 || index >= this._columnDefinitions.length) {
            return this;
        }

        let current = this._columnDefinitions[index];
        if (current && current.isPixel === isPixel && current.internalValue === width) {
            return this;
        }

        this._columnDefinitions[index] = new ValueAndUnit(width, isPixel ? ValueAndUnit.UNITMODE_PIXEL : ValueAndUnit.UNITMODE_PERCENTAGE);

        this._markAsDirty();

        return this;
    }

    /**
     * Gets the list of children stored in a specific cell
     * @param row defines the row to check
     * @param column defines the column to check
     * @returns the list of controls
     */
    public getChildrenAt(row: number, column: number): Nullable<Array<Control>> {
        const cell = this._cells[`${row}:${column}`];

        if (!cell) {
            return null;
        }

        return cell.children;
    }

    /**
     * Gets a string representing the child cell info (row x column)
     * @param child defines the control to get info from
     * @returns a string containing the child cell info (row x column)
     */
    public getChildCellInfo(child: Control): string {
        return child._tag;
    }

    private _removeCell(cell: Container, key: string) {
        if (!cell) {
            return;
        }

        super.removeControl(cell);

        for (var control of cell.children) {
            let childIndex = this._childControls.indexOf(control);

            if (childIndex !== -1) {
                this._childControls.splice(childIndex, 1);
            }
        }

        delete this._cells[key];
    }

    private _offsetCell(previousKey: string, key: string) {
        if (!this._cells[key]) {
            return;
        }

        this._cells[previousKey] = this._cells[key];

        for (var control of this._cells[previousKey].children) {
            control._tag = previousKey;
        }

        delete this._cells[key];
    }

    /**
     * Remove a column definition at specified index
     * @param index defines the index of the column to remove
     * @returns the current grid
     */
    public removeColumnDefinition(index: number): Grid {
        if (index < 0 || index >= this._columnDefinitions.length) {
            return this;
        }

        for (var x = 0; x < this._rowDefinitions.length; x++) {
            let key = `${x}:${index}`;
            let cell = this._cells[key];

            this._removeCell(cell, key);
        }

        for (var x = 0; x < this._rowDefinitions.length; x++) {
            for (var y = index + 1; y < this._columnDefinitions.length; y++) {
                let previousKey = `${x}:${y - 1}`;
                let key = `${x}:${y}`;

                this._offsetCell(previousKey, key);
            }
        }

        this._columnDefinitions.splice(index, 1);

        this._markAsDirty();

        return this;
    }

    /**
     * Remove a row definition at specified index
     * @param index defines the index of the row to remove
     * @returns the current grid
     */
    public removeRowDefinition(index: number): Grid {
        if (index < 0 || index >= this._rowDefinitions.length) {
            return this;
        }

        for (var y = 0; y < this._columnDefinitions.length; y++) {
            let key = `${index}:${y}`;
            let cell = this._cells[key];

            this._removeCell(cell, key);
        }

        for (var y = 0; y < this._columnDefinitions.length; y++) {
            for (var x = index + 1; x < this._rowDefinitions.length; x++) {
                let previousKey = `${x - 1}:${y}`;
                let key = `${x}:${y}`;

                this._offsetCell(previousKey, key);
            }
        }

        this._rowDefinitions.splice(index, 1);

        this._markAsDirty();

        return this;
    }

    /**
     * Adds a new control to the current grid
     * @param control defines the control to add
     * @param row defines the row where to add the control (0 by default)
     * @param column defines the column where to add the control (0 by default)
     * @returns the current grid
     */
    public addControl(control: Control, row: number = 0, column: number = 0): Grid {
        if (this._rowDefinitions.length === 0) {
            // Add default row definition
            this.addRowDefinition(1, false);
        }

        if (this._columnDefinitions.length === 0) {
            // Add default column definition
            this.addColumnDefinition(1, false);
        }

        if (this._childControls.indexOf(control) !== -1) {
            Tools.Warn(`Control (Name:${control.name}, UniqueId:${control.uniqueId}) is already associated with this grid. You must remove it before reattaching it`);
            return this;
        }

        let x = Math.min(row, this._rowDefinitions.length - 1);
        let y = Math.min(column, this._columnDefinitions.length - 1);
        let key = `${x}:${y}`;
        let goodContainer = this._cells[key];

        if (!goodContainer) {
            goodContainer = new Container(key);
            this._cells[key] = goodContainer;
            goodContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            goodContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            super.addControl(goodContainer);
        }

        goodContainer.addControl(control);
        this._childControls.push(control);
        control._tag = key;
        control.parent = this;

        this._markAsDirty();

        return this;
    }

    /**
     * Removes a control from the current container
     * @param control defines the control to remove
     * @returns the current container
     */
    public removeControl(control: Control): Container {
        var index = this._childControls.indexOf(control);

        if (index !== -1) {
            this._childControls.splice(index, 1);
        }

        let cell = this._cells[control._tag];

        if (cell) {
            cell.removeControl(control);
            control._tag = null;
        }

        this._markAsDirty();
        return this;
    }

    /**
     * Creates a new Grid
     * @param name defines control name
     */
    constructor(public name?: string) {
        super(name);
    }

    protected _getTypeName(): string {
        return "Grid";
    }

    protected _getGridDefinitions(definitionCallback: (lefts: number[], tops: number[], widths: number[], heights: number[]) => void) {
        let widths = [];
        let heights = [];
        let lefts = [];
        let tops = [];

        let availableWidth = this._currentMeasure.width;
        let globalWidthPercentage = 0;
        let availableHeight = this._currentMeasure.height;
        let globalHeightPercentage = 0;

        // Heights
        let index = 0;
        for (var value of this._rowDefinitions) {
            if (value.isPixel) {
                let height = value.getValue(this._host);
                availableHeight -= height;
                heights[index] = height;
            } else {
                globalHeightPercentage += value.internalValue;
            }
            index++;
        }

        let top = 0;
        index = 0;
        for (var value of this._rowDefinitions) {
            tops.push(top);

            if (!value.isPixel) {
                let height = (value.internalValue / globalHeightPercentage) * availableHeight;
                top += height;
                heights[index] = height;
            } else {
                top += value.getValue(this._host);
            }
            index++;
        }

        // Widths
        index = 0;
        for (var value of this._columnDefinitions) {
            if (value.isPixel) {
                let width = value.getValue(this._host);
                availableWidth -= width;
                widths[index] = width;
            } else {
                globalWidthPercentage += value.internalValue;
            }
            index++;
        }

        let left = 0;
        index = 0;
        for (var value of this._columnDefinitions) {
            lefts.push(left);
            if (!value.isPixel) {
                let width = (value.internalValue / globalWidthPercentage) * availableWidth;
                left += width;
                widths[index] = width;
            } else {
                left += value.getValue(this._host);
            }
            index++;
        }

        definitionCallback(lefts, tops, widths, heights);
    }

    protected _additionalProcessing(parentMeasure: Measure, context: ICanvasRenderingContext): void {
        this._getGridDefinitions((lefts: number[], tops: number[], widths: number[], heights: number[]) => {
            // Setting child sizes
            for (var key in this._cells) {
                if (!this._cells.hasOwnProperty(key)) {
                    continue;
                }
                let split = key.split(":");
                let x = parseInt(split[0]);
                let y = parseInt(split[1]);
                let cell = this._cells[key];

                cell.left = lefts[y] + "px";
                cell.top = tops[x] + "px";
                cell.width = widths[y] + "px";
                cell.height = heights[x] + "px";
                cell._left.ignoreAdaptiveScaling = true;
                cell._top.ignoreAdaptiveScaling = true;
                cell._width.ignoreAdaptiveScaling = true;
                cell._height.ignoreAdaptiveScaling = true;
            }
        });

        super._additionalProcessing(parentMeasure, context);
    }

    public _flagDescendantsAsMatrixDirty(): void {
        for (var key in this._cells) {
            if (!this._cells.hasOwnProperty(key)) {
                continue;
            }

            let child = this._cells[key];
            child._markMatrixAsDirty();
        }
    }

    public _renderHighlightSpecific(context: ICanvasRenderingContext): void {
        super._renderHighlightSpecific(context);

        this._getGridDefinitions((lefts: number[], tops: number[], widths: number[], heights: number[]) => {

            // Columns
            for (var index = 0; index < lefts.length; index++) {
                const left = this._currentMeasure.left + lefts[index] + widths[index];
                context.beginPath();
                context.moveTo(left, this._currentMeasure.top);
                context.lineTo(left, this._currentMeasure.top + this._currentMeasure.height);
                context.stroke();
            }

            // Rows
            for (var index = 0; index < tops.length; index++) {
                const top = this._currentMeasure.top + tops[index] + heights[index];
                context.beginPath();
                context.moveTo(this._currentMeasure.left, top);
                context.lineTo(this._currentMeasure.left + this._currentMeasure.width, top);
                context.stroke();
            }
        });

        context.restore();
    }

    /** Releases associated resources */
    public dispose() {
        super.dispose();

        for (var control of this._childControls) {
            control.dispose();
        }

        this._childControls = [];
    }
}
_TypeStore.RegisteredTypes["BABYLON.GUI.Grid"] = Grid;