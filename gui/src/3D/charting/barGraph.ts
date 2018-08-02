import { Nullable, Scene, Mesh, StandardMaterial, Animation, Engine, Matrix } from "babylonjs";
import { Chart } from ".";
import { AdvancedDynamicTexture, DisplayGrid } from "../../2D";

/** 
 * Class used to render bar graphs 
 * @see http://doc.babylonjs.com/how_to/chart3d#bargraph
 */
export class BarGraph extends Chart {
    private _margin = 1;
    private _maxBarHeight = 10;
    private _barMeshes: Nullable<Array<Mesh>>;
    private _backgroundMesh: Nullable<Mesh>;
    private _backgroundADT : Nullable<AdvancedDynamicTexture>;
    
    private _displayBackground = true;
    private _backgroundResolution = 512;
    private _backgroundTickCount = 5;

    /** Gets or sets a boolean indicating if the background must be displayed */
    public get displayBackground(): boolean {
        return this._displayBackground;
    }

    public set displayBackground(value: boolean) {
        if (this._displayBackground === value) {
            return;
        }

        this._displayBackground = value;

        this.refresh();
    }     

    /** Gets or sets the margin between bars */
    public get margin(): number {
        return this._margin;
    }

    public set margin(value: number) {
        if (this._margin === value) {
            return;
        }

        this._margin = value;

        this.refresh();
    }

    /** Gets or sets the maximum height of a bar */
    public get maxBarHeight(): number {
        return this._maxBarHeight;
    }

    public set maxBarHeight(value: number) {
        if (this._maxBarHeight === value) {
            return;
        }

        this._maxBarHeight = value;

        this.refresh();
    }

    /**
     * Creates a new BarGraph
     * @param name defines the name of the graph
     * @param scene defines the hosting scene
     */
    constructor(name: string, scene: Nullable<Scene> = Engine.LastCreatedScene) {
        super(name, scene);
    }

    /**
     * Children class can override this function to provide a new mesh (as long as it stays inside a 1x1x1 box)
     * @param name defines the mesh name
     * @param scene defines the hosting scene
     * @returns a new mesh used to represent the current bar
     */
    protected _createBarMesh(name: string, scene: Scene): Mesh {
        var box = Mesh.CreateBox(name, 1, scene);
        box.setPivotMatrix(Matrix.Translation(0, 0.5, 0), false);

        return box;
    }

    /** 
     * Force the graph to redraw itself 
     * @returns the current BarGraph
    */
    public refresh(): BarGraph {
        if (this._blockRefresh) {
            return this;
        }

        if (!this._dataSource) {
            this._clean();
            return this;
        }

        const scene = this._rootNode.getScene();

        // Default material
        if (!this._defaultMaterial) {
            this._defaultMaterial = this._createDefaultMaterial(scene);
        }

        // Scan data
        let min = 0;
        let max = Number.MIN_VALUE;

        const data = this._dataFilters ? this._dataSource.getFilteredData(this._dataFilters) : this._dataSource.data;

        // Check the limit of the entire series
        this._dataSource.data.forEach(entry => {
            if (min > entry.value) {
                min = entry.value;
            }

            if (max < entry.value) {
                max = entry.value;
            }
        });

        let ratio = this._maxBarHeight / (max - min);

        let createMesh = false;
        let left = -(data.length / 2) * (this._elementWidth + this.margin) + 1.5 * this._margin;

        // Do we need to create new graph or animate the current one
        if (!this._barMeshes || this._barMeshes.length !== data.length) {
            this._clean();
            createMesh = true;
            this._barMeshes = [];
        }        

        this._removeLabels();

        if (this._backgroundMesh) {
            this._backgroundMesh.dispose(false, true);
            this._backgroundMesh = null;
        }

        if (this._displayBackground) {
            // Axis
            this._backgroundMesh = BABYLON.Mesh.CreatePlane("background", 1, scene);
            this._backgroundMesh.parent = this._rootNode;            
            this._backgroundMesh.setPivotMatrix(Matrix.Translation(0, 0.5, 0), false);

            this._backgroundADT = AdvancedDynamicTexture.CreateForMesh(this._backgroundMesh, this._backgroundResolution, this._backgroundResolution, false);

            let displayGrid = new DisplayGrid();
            displayGrid.displayMajorLines = false;
            displayGrid.minorLineColor = "White";
            displayGrid.minorLineTickness = 2;
            displayGrid.cellWidth = this._backgroundResolution / data.length;
            displayGrid.cellHeight = this._backgroundResolution / this._backgroundTickCount;

            this._backgroundADT.addControl(displayGrid);

            (<StandardMaterial>this._backgroundMesh.material!).opacityTexture = null;

            this._backgroundMesh.position.z = this._elementWidth;
            this._backgroundMesh.scaling.x = (this._elementWidth + this.margin) * data.length;
            this._backgroundMesh.scaling.y = this._maxBarHeight; 

            for (var tickIndex = 0; tickIndex <= this._backgroundTickCount; tickIndex++) {
                var label = (max / this._backgroundTickCount) * tickIndex + "";
                var ticklabel = this._addLabel(label, this._elementWidth, false);
                ticklabel.position.x = left - this._elementWidth;
                ticklabel.position.y = (this.maxBarHeight * tickIndex) / this._backgroundTickCount;
                ticklabel.position.z = this._elementWidth;
            }
        }

        // We will generate one bar per entry
        let index = 0;
        data.forEach(entry => {

            var barMesh: Mesh;
            if (createMesh) {
                barMesh = this._createBarMesh(this.name + "_box_" + index++, scene);
                barMesh.enablePointerMoveEvents = true;
                this._barMeshes!.push(barMesh);
            } else {
                barMesh = this._barMeshes![index++];
            }

            barMesh.metadata = entry;
            barMesh.parent = this._rootNode;
            barMesh.position.x = left;
            let currentScalingYState = barMesh.scaling.y;
            barMesh.scaling.set(this._elementWidth, 0, this._elementWidth);

            var easing = new BABYLON.CircleEase();
            Animation.CreateAndStartAnimation("entryScale", barMesh, "scaling.y", 30, 30, currentScalingYState, entry.value * ratio, 0, easing);

            barMesh.material = this._defaultMaterial;

            this.onElementCreatedObservable.notifyObservers(barMesh);

            left += this._elementWidth + this.margin;

            // Label
            if (!this.labelDimension || !this.displayLabels) {
                return;
            }

            let label = this._addLabel(entry[this.labelDimension], this._elementWidth);
            label.position = barMesh.position.clone();
            label.position.z -= this._elementWidth;
        });

        this.onRefreshObservable.notifyObservers(this);

        return this;
    }

    protected _clean(): void {
        super._clean();
        this._barMeshes = null;
        this._backgroundMesh = null;

        if (this._backgroundADT) {
            this._backgroundADT.dispose();
            this._backgroundADT = null;
        }
    }
}