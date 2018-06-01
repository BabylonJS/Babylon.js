/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    /**
     * Class used to create a conainter panel deployed on the surface of a sphere
     */
    export class SpherePanel extends Container3D {
        private _radius = 5.0;
        private _columns = 10;
        private _rows = 0;
        private _rowThenColum = true;
        
        private _orientation = Container3D.FACEORIGIN_ORIENTATION;

        /**
         * Gets or sets the distance between elements
         */
        public margin = 0;        

        /**
         * Gets or sets the orientation to apply to all controls (BABYLON.Container3D.FaceOriginReversedOrientation by default)
        * | Value | Type                                | Description |
        * | ----- | ----------------------------------- | ----------- |
        * | 0     | UNSET_ORIENTATION                   |  Control rotation will remain unchanged |
        * | 1     | FACEORIGIN_ORIENTATION              |  Control will rotate to make it look at sphere central axis |
        * | 2     | FACEORIGINREVERSED_ORIENTATION      |  Control will rotate to make it look back at sphere central axis |
        * | 3     | FACEFORWARD_ORIENTATION             |  Control will rotate to look at z axis (0, 0, 1) |
        * | 4     | FACEFORWARDREVERSED_ORIENTATION     |  Control will rotate to look at negative z axis (0, 0, -1) |
         */
        public get orientation(): number {
            return this._orientation;
        }

        public set orientation(value: number) {
            if (this._orientation === value) {
                return;
            }

            this._orientation = value;

            Tools.SetImmediate(() => {
                this._arrangeChildren();               
            });
        }   
         
        /**
         * Gets or sets the radius of the sphere where to project controls (5 by default)
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
         * Gets or sets the number of columns requested (10 by default). 
         * The panel will automatically compute the number of rows based on number of child controls. 
         */
        public get columns(): int {
            return this._columns;
        }

        public set columns(value: int) {
            if (this._columns === value) {
                return;
            }

            this._columns = value;
            this._rowThenColum = true;

            Tools.SetImmediate(() => {
                this._arrangeChildren();               
            });
        }     
        
        /**
         * Gets or sets a the number of rows requested. 
         * The panel will automatically compute the number of columns based on number of child controls. 
         */
        public get rows(): int {
            return this._rows;
        }

        public set rows(value: int) {
            if (this._rows === value) {
                return;
            }

            this._rows = value;
            this._rowThenColum = false;

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
            let columns = 0;
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

            cellWidth += this.margin * 2;
            cellHeight += this.margin * 2;

            // Arrange
            if (this._rowThenColum) {
                columns = this._columns;
                rows = Math.ceil(controlCount / this._columns);
            } else {
                rows = this._rows;
                columns = Math.ceil(controlCount / this._rows);
            }

            let startOffsetX = (columns * 0.5) * cellWidth;
            let startOffsetY = (rows * 0.5) * cellHeight;
            let nodeGrid = [];
            let cellCounter = 0;

            if (this._rowThenColum) {
                for (var r = 0; r < rows; r++)
                {
                    for (var c = 0; c < columns; c++)
                    {
                        nodeGrid.push(new Vector3((c * cellWidth) - startOffsetX + cellWidth / 2, (r * cellHeight) - startOffsetY + cellHeight / 2, 0));
                        cellCounter++;
                        if (cellCounter > controlCount)
                        {
                            break;
                        }
                    }
                }
            } else {
                for (var c = 0; c < columns; c++)
                {
                    for (var r = 0; r < rows; r++)
                    {
                        nodeGrid.push(new Vector3((c * cellWidth) - startOffsetX + cellWidth / 2, (r * cellHeight) - startOffsetY + cellHeight / 2, 0));
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

                switch (this._orientation) {
                    case Container3D.FACEORIGIN_ORIENTATION:
                        child.mesh.lookAt(new BABYLON.Vector3(-newPos.x, -newPos.y, -newPos.z));
                        break;
                    case Container3D.FACEORIGINREVERSED_ORIENTATION:
                        child.mesh.lookAt(new BABYLON.Vector3(newPos.x, newPos.y, newPos.z));
                        break;
                    case Container3D.FACEFORWARD_ORIENTATION:
                        child.mesh.lookAt(new BABYLON.Vector3(0, 0, 1));
                        break;
                    case Container3D.FACEFORWARDREVERSED_ORIENTATION:
                        child.mesh.lookAt(new BABYLON.Vector3(0, 0, -1));
                        break;
                }
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

            return Vector3.TransformNormal(newPos, Tmp.Matrix[0]);
        }
    }
}