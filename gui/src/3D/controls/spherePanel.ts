/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    /**
     * Class used to create a conainter panel deployed on the surface of a sphere
     */
    export class SpherePanel extends Container3D {
        private _radius = 5.0;
        private _columns = 10;
        private _rowThenColum = true;

        /**
         * Gets or sets a boolean indicating if the layout must first fill rows then columns or the opposite (true by default)
         */
        public get rowThenColum(): boolean {
            return this._rowThenColum;
        }

        public set rowThenColum(value: boolean) {
            if (this._rowThenColum === value) {
                return;
            }

            this._rowThenColum = value;

            Tools.SetImmediate(() => {
                this._arrangeChildren();               
            });
        }              

        /**
         * Gets or sets a the radius of the sphere where to project controls (5 by default)
         */
        public get radius(): float {
            return this._radius;
        }

        public set radius(value: float) {
            if (this._radius === value) {
                return;
            }

            this._radius = value;

            Tools.SetImmediate(() => {
                this._arrangeChildren();               
            });
        }        

        /**
         * Gets or sets a the number of columns requested (10 by default). 
         * The panel will automatically compute the number of rows based on number of child controls 
         */
        public get columns(): int {
            return this._columns;
        }

        public set columns(value: int) {
            if (this._columns === value) {
                return;
            }

            this._columns = value;

            Tools.SetImmediate(() => {
                this._arrangeChildren();               
            });
        }         

        /**
         * Creates new SpherePanel
         */
        public constructor() {
            super();
        }        

        protected _arrangeChildren() {
            let cellWidth = 0;
            let cellHeight = 0;
            let rows = 0;
            let controlCount = 0;

            let currentInverseWorld = Matrix.Invert(this.node!.computeWorldMatrix(true));

            // Measure
            for (var child of this._children) {
                if (!child.mesh) {
                    continue;
                }

                controlCount++;
                child.mesh.computeWorldMatrix(true);
                child.mesh.getWorldMatrix().multiplyToRef(currentInverseWorld, Tmp.Matrix[0]);

                let boundingBox = child.mesh.getBoundingInfo().boundingBox;
                let extendSize = Vector3.TransformNormal(boundingBox.extendSize, Tmp.Matrix[0]);

                cellWidth = Math.max(cellWidth, extendSize.x * 2);
                cellHeight = Math.max(cellHeight, extendSize.y * 2);
            }

            console.log(cellWidth + "x" + cellHeight)
            // Arrange
            rows = Math.ceil(controlCount / this._columns);

            let startOffsetX = (this._columns * 0.5) * cellWidth;
            let startOffsetY = (rows * 0.5) * cellHeight;
            let nodeGrid = [];
            let cellCounter = 0;

            if (this._rowThenColum) {
                for (var r = 0; r < rows; r++)
                {
                    for (var c = 0; c < this._columns; c++)
                    {
                        nodeGrid.push(new Vector3((c * cellWidth) - startOffsetX + cellWidth / 2, -(r * cellHeight) - startOffsetY - cellHeight / 2, 0));
                        cellCounter++;
                        if (cellCounter > controlCount)
                        {
                            break;
                        }
                    }
                }
            } else {
                for (var c = 0; c < this._columns; c++)
                {
                    for (var r = 0; r < rows; r++)
                    {
                        nodeGrid.push(new Vector3((c * cellWidth) - startOffsetX + cellWidth / 2, -(r * cellHeight) - startOffsetY - cellHeight / 2, 0));
                        cellCounter++;
                        if (cellCounter > controlCount)
                        {
                            break;
                        }
                    }
                }
            }

            cellCounter = 0;
            for (var child of this._children) {
                if (!child.mesh) {
                    continue;
                }                
                let newPos = this._sphericalMapping(nodeGrid[cellCounter]);

                child.position = newPos;

                cellCounter++;
            }
        }

        private _sphericalMapping(source: Vector3)
        {
            let newPos = new Vector3(0, 0, this._radius);

            let xAngle = (source.y / this._radius);
            let yAngle = -(source.x / this._radius);

            Matrix.RotationYawPitchRollToRef(yAngle, xAngle, 0, Tmp.Matrix[0]);

            return Vector3.TransformCoordinates(newPos, Tmp.Matrix[0]);
        }
    }
}