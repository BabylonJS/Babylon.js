import { DataSeries } from "./dataSeries";
import { Nullable, TransformNode, Scene, Mesh, Observable, PBRMaterial, CubeTexture } from "babylonjs";

/** Class used to render bar graphs */
export class BarGraph {
    private _dataSource: Nullable<DataSeries>;
    private _rootNode: TransformNode;
    private _margin = 1;
    private _barWidth = 2
    private _maxBarHeight = 10;
    private _defaultMaterial: PBRMaterial;

    public onElementCreated = new Observable<Mesh>();

    /** Gets or sets the data source used by the graph */
    public get dataSource(): Nullable<DataSeries> {
        return this._dataSource;
    }

    public set dataSource(value: Nullable<DataSeries>) {
        if (this._dataSource === value) {
            return;
        }

        this._dataSource = value;

        this.refresh();
    }

    /** Gets the root node associated with this graph */
    public get rootNode(): TransformNode {
        return this._rootNode;
    }

    /** Gets or sets the name of the graph */
    public name: string; 

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

    /** Gets or sets the with of each bar */
    public get barWidth(): number {
        return this._barWidth;
    }

    public set barWidth(value: number) {
        if (this._barWidth === value) {
            return;
        }

        this._barWidth = value;

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

    /** Gets or sets the material used by bar meshes */
    public get defaultMaterial(): PBRMaterial {
        return this._defaultMaterial;
    }

    public set defaultMaterial(value: PBRMaterial) {
        if (this._defaultMaterial === value) {
            return;
        }

        this._defaultMaterial = value;

        this.refresh();
    }

    /**
     * Creates a new BarGraph
     * @param name defines the name of the graph
     */
    constructor(name: string, scene?: Scene) {
        this.name = name;
        this._rootNode = new TransformNode(name, scene);
    }

    /** Force the graph to redraw itself */
    public refresh(): BarGraph {
        // TODO: clean current meshes

        if (!this._dataSource) {
            return this;
        }

        let scene = this._rootNode.getScene();

        // Default material
        if (!this._defaultMaterial) {
            this._defaultMaterial = new BABYLON.PBRMaterial("plastic", scene);
            this._defaultMaterial.microSurface = 0.96;
            this._defaultMaterial.alpha = 0.8;
            this._defaultMaterial.albedoColor = this._dataSource.color;
            this._defaultMaterial.reflectivityColor = new BABYLON.Color3(0.003, 0.003, 0.003);
        }

        // Scan data
        let min = Number.MAX_VALUE;
        let max = Number.MIN_VALUE;
        this._dataSource.data.forEach(entry => {
            if (min > entry.value) {
                min = entry.value;
            }

            if (max < entry.value) {
                max = entry.value;
            }
        });

        let ratio = this.maxBarHeight / (max - min);

        // We will generate one bar per entry
        let left = -(this._dataSource.data.length / 2) * (this.barWidth + this.margin) + 1.5 * this._margin;
        let index = 0;
        this._dataSource.data.forEach(entry => {

            var box = Mesh.CreateBox(this.name + "_box_" + index++, 1, scene);
            box.setPivotPoint(new BABYLON.Vector3(0, -0.5, 0));

            box.parent = this._rootNode;
            box.position.x += left;
            box.scaling.set(this.barWidth, entry.value * ratio, this._barWidth);

            box.material = this._defaultMaterial;

            this.onElementCreated.notifyObservers(box);

            left += this.barWidth + this.margin;
        });


        return this;
    }
}