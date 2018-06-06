/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    /**
     * Class used to create a 2D grid container
     */
    export class Grid extends Container {
        private _rowDefinitions = new Array<ValueAndUnit>();
        private _columnDefinitions = new Array<ValueAndUnit>();
        private _cells: {[key: string]:Container} = {};

        /**
         * Adds a new row to the grid
         * @param height defines the height of the row (either in pixel or a value between 0 and 1)
         * @param isPixel defines if the weight is expressed in pixel (or in percentage)
         * @returns the current grid
         */
        public addRowDefinition(height: number, isPixel = false): Grid {
            this._rowDefinitions.push(new ValueAndUnit(height, isPixel ? ValueAndUnit.UNITMODE_PIXEL : ValueAndUnit.UNITMODE_PERCENTAGE));
            return this;
        }

        /**
         * Adds a new column to the grid
         * @param weight defines the weight of the column (either in pixel or a value between 0 and 1)
         * @param isPixel defines if the weight is expressed in pixel (or in percentage)
         * @returns the current grid
         */
        public addColumnDefinition(weight: number, isPixel = false): Grid {
            this._columnDefinitions.push(new ValueAndUnit(weight, isPixel ? ValueAndUnit.UNITMODE_PIXEL : ValueAndUnit.UNITMODE_PERCENTAGE));
            return this;
        }     

        /**
         * Adds a new control to the current grid
         * @param control defines the control to add
         * @param row defines the row where to add the control (0 by default)
         * @param column defines the column where to add the control (0 by default)
         * @returns the current grid
         */
        public addControl(control: Nullable<Control>, row: number = 0, column: number = 0): Grid {
            if (this._rowDefinitions.length === 0) {
                // Add default row definition
                this.addRowDefinition(1, false);
            }

            if (this._columnDefinitions.length === 0) {
                // Add default column definition
                this.addColumnDefinition(1, false);
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

        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
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
                }  else {
                    left += value.getValue(this._host);
                }
                index++;
            }       
            
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
            }

            super._additionalProcessing(parentMeasure, context);
        }
    }
}